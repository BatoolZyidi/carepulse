"""
prd.md §3.4 — Webhook & Gemma Parsing Pipeline:
  1. CALL-E posts raw audio URL + transcript here.
  2. We route the transcript to Gemma (Gemma-4-31B-IT via AMD Token Factory; services/gemma_odpara.py)
     with strict ODPARA JSON-schema output enforcement.
  3. Gemma returns structured metrics + risk_level.
  4. We persist a CallLog; if risk_level == HIGH we create an Alert, which
     fires the real-time WebSocket push via apps.triage.signals.
"""
import hmac
import hashlib

from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.profiles.models import Patient
from apps.profiles.permissions import IsDoctor, IsPatient

from .models import Alert, AlertStatus, CallLog, RiskLevel
from .serializers import AlertSerializer, CallLogSerializer, VoiceCallWebhookSerializer

from services.gemma_odpara import extract_odpara_metrics


class VoiceCallWebhookView(APIView):
    """
    POST /api/webhooks/voice-call/

    Public-facing (no user JWT — CALL-E is a server-to-server caller), but
    authenticated via an HMAC signature over the raw body using
    CALLE_WEBHOOK_SECRET, so this endpoint cannot be spoofed by outsiders.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        if not self._verify_signature(request):
            return Response({"detail": "Invalid webhook signature."}, status=status.HTTP_401_UNAUTHORIZED)

        raw = request.data or {}
        if "data" in raw and isinstance(raw["data"], dict):
            nested = raw["data"]
            call_id = nested.get("call_id") or nested.get("id") or ""
            meta = nested.get("metadata") or {}
            patient_id = meta.get("patient_id") or raw.get("patient_id")
            transcript_raw = nested.get("transcript")
            if isinstance(transcript_raw, list):
                transcript = "\n".join(
                    f"{item.get('speaker', 'Speaker')}: {item.get('text', '')}"
                    for item in transcript_raw
                    if isinstance(item, dict)
                )
            else:
                transcript = str(transcript_raw or "")
            audio_url = nested.get("audio_url") or nested.get("recording_url") or ""
            payload = {
                "patient_id": patient_id,
                "call_id": call_id,
                "audio_url": audio_url,
                "transcript": transcript,
            }
        else:
            payload = raw

        serializer = VoiceCallWebhookSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        patient = get_object_or_404(Patient, id=data["patient_id"])

        # --- Gemma (AMD Token Factory) ODPARA extraction (rules.md §2) ---
        metrics = extract_odpara_metrics(
            transcript=data["transcript"],
            patient_context={
                "full_name": patient.full_name,
                "care_type": patient.care_type,
                "primary_diagnosis": patient.primary_diagnosis,
            },
        )

        # Fallback to CALL-E's structured result if AMD Gemma failed or returned default
        nested_res = (nested.get("result") or {}) if "nested" in locals() and isinstance(nested, dict) else (raw.get("result") or {})
        if metrics.get("summary", "").startswith("Automated parsing failed") and nested_res:
            for field in ["onset", "duration", "progression", "aggravating_factors", "relieving_factors", "associated_symptoms", "summary", "red_flag_quote"]:
                if nested_res.get(field):
                    metrics[field] = nested_res[field]
            if nested_res.get("pain_level") is not None:
                metrics["pain_level"] = nested_res["pain_level"]
            if nested_res.get("fever_reported") is not None:
                metrics["fever_reported"] = bool(nested_res["fever_reported"])
            if nested_res.get("temp_reading") is not None:
                metrics["temp_reading"] = nested_res["temp_reading"]
            if nested_res.get("meds_taken") is not None:
                metrics["meds_taken"] = bool(nested_res["meds_taken"])
            if nested_res.get("risk_level"):
                raw_risk = str(nested_res["risk_level"]).upper()
                metrics["risk_level"] = "HIGH" if "HIGH" in raw_risk else ("MED" if "MED" in raw_risk else "LOW")


        call_log = CallLog.objects.create(
            patient=patient,
            audio_url=data.get("audio_url", ""),
            transcript=data["transcript"],
            onset=metrics["onset"],
            duration=metrics["duration"],
            progression=metrics["progression"],
            aggravating_factors=metrics["aggravating_factors"],
            relieving_factors=metrics["relieving_factors"],
            associated_symptoms=metrics["associated_symptoms"],
            pain_level=metrics["pain_level"],
            fever_reported=metrics["fever_reported"],
            temp_reading=metrics["temp_reading"],
            meds_taken=metrics["meds_taken"],
            risk_level=metrics["risk_level"],
            summary=metrics["summary"],
            red_flag_quote=metrics.get("red_flag_quote", ""),
        )

        if call_log.risk_level == RiskLevel.HIGH and patient.doctor_id:
            Alert.objects.create(
                call_log=call_log,
                patient=patient,
                doctor_id=patient.doctor_id,
                status=AlertStatus.UNREAD,
            )

        return Response(CallLogSerializer(call_log).data, status=status.HTTP_201_CREATED)

    def _verify_signature(self, request):
        secret = settings.CALLE_WEBHOOK_SECRET
        if not secret:
            # No secret configured (local dev) — allow through but this MUST
            # be set before going live on real CALL-E traffic.
            return True

        signature = request.headers.get("X-CallE-Signature", "")
        expected = hmac.new(secret.encode(), request.body, hashlib.sha256).hexdigest()
        return hmac.compare_digest(signature, expected)


# ------------------------------------------------------------------
# DOCTOR — Clinical History & Voice Transcript View (prd.md §3.2)
# ------------------------------------------------------------------
class DoctorPatientCallLogListView(generics.ListAPIView):
    """GET /api/doctor/patients/<patient_id>/call-logs/ — strictly scoped."""
    permission_classes = [IsDoctor]
    serializer_class = CallLogSerializer

    def get_queryset(self):
        return CallLog.objects.filter(
            patient__id=self.kwargs["patient_id"],
            patient__doctor__user=self.request.user,
        ).order_by("-timestamp")


class DoctorAlertListView(generics.ListAPIView):
    """GET /api/doctor/alerts/ — real-time banner feed, scoped to this doctor only."""
    permission_classes = [IsDoctor]
    serializer_class = AlertSerializer

    def get_queryset(self):
        return Alert.objects.filter(doctor__user=self.request.user).order_by("-created_at")


class DoctorAlertActionView(APIView):
    """
    PATCH /api/doctor/alerts/<alert_id>/
    {"status": "ACKNOWLEDGED" | "RESOLVED"}
    1-click acknowledge/resolve button (prd.md §3.2).
    """
    permission_classes = [IsDoctor]

    def patch(self, request, alert_id):
        alert = get_object_or_404(Alert, id=alert_id, doctor__user=request.user)
        new_status = request.data.get("status")
        if new_status not in dict(AlertStatus.choices):
            return Response({"detail": "Invalid status."}, status=status.HTTP_400_BAD_REQUEST)
        alert.status = new_status
        alert.save(update_fields=["status"])
        return Response(AlertSerializer(alert).data)


# ------------------------------------------------------------------
# PATIENT — Historical log of completed check-ins (prd.md §3.3)
# ------------------------------------------------------------------
class PatientCallLogListView(generics.ListAPIView):
    """GET /api/patient/call-logs/ — strictly `user=request.user` scoped."""
    permission_classes = [IsPatient]
    serializer_class = CallLogSerializer

    def get_queryset(self):
        return CallLog.objects.filter(patient__user=self.request.user).order_by("-timestamp")
