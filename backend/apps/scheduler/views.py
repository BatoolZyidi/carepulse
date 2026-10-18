"""
Manual trigger endpoints - invaluable for a live demo where you
don't want to wait for the daily Celery beat schedule to fire.

DEMO MODE: Calls run synchronously (no Celery/Redis required) so they fire
immediately when the doctor clicks "Call Now". The real Celery .delay()
path is preserved in tasks.py for production scheduled calls.
"""
import logging

from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.profiles.models import Patient
from apps.profiles.permissions import IsAdmin, IsAdminOrDoctor
from services.calle_voice import trigger_outbound_call

logger = logging.getLogger(__name__)


def _build_patient_context(patient):
    return {
        "id": patient.id,
        "full_name": patient.full_name,
        "phone_number": patient.phone_number,
        "care_type": patient.care_type,
        "primary_diagnosis": patient.primary_diagnosis,
        "discharge_date": patient.discharge_date,
        "next_checkup_date": patient.next_checkup_date.isoformat() if getattr(patient, "next_checkup_date", None) else None,
        "doctor_name": patient.doctor.full_name if patient.doctor else None,
    }


def _webhook_url():
    """Returns the absolute URL CALL-E should POST the completed transcript to.
    Requires BACKEND_BASE_URL in .env (set to your ngrok/tunnel URL for local dev)."""
    base = getattr(settings, "BACKEND_BASE_URL", "").rstrip("/")
    if not base:
        logger.warning(
            "BACKEND_BASE_URL is not set in .env. "
            "CALL-E will not be able to deliver the webhook to this local server. "
            "Set it to your ngrok URL, e.g. https://your-id.ngrok-free.app"
        )
        return None
    return f"{base}/api/webhooks/voice-call/"


class ManualTriggerPatientCallView(APIView):
    """
    POST /api/scheduler/trigger/<patient_id>/
    Fires a REAL CALL-E outbound call immediately (synchronous, no Celery).
    Used by doctors clicking "Call Now" for an on-demand check-in.
    """
    permission_classes = [IsAdminOrDoctor]

    def post(self, request, patient_id):
        patient = get_object_or_404(Patient, id=patient_id)
        if request.user.role == "doctor" and (
            not patient.doctor or str(patient.doctor.user_id) != str(request.user.id)
        ):
            return Response({"detail": "Not your patient."}, status=403)

        context = _build_patient_context(patient)

        # Synchronous call - no Celery needed - fires immediately
        result = trigger_outbound_call(context, recent_calls=[], webhook_url=_webhook_url())

        if result.get("status") == "error":
            return Response(
                {"detail": f"CALL-E error: {result.get('reason', 'unknown error')}"},
                status=502,
            )
        if result.get("status") == "skipped":
            return Response(
                {"detail": "CALL-E API key not configured. Add CALLE_API_KEY to backend/.env."},
                status=503,
            )

        logger.info("Outbound call triggered for patient=%s result=%s", patient.full_name, result)
        return Response({
            "detail": f"Call initiated for {patient.full_name} at {patient.phone_number}. CALL-E will connect within 3-5 minutes.",
            "calle_response": result,
        })


class ManualTriggerAllView(APIView):
    """POST /api/scheduler/trigger-all/ - Admin-only, fire the full daily batch immediately."""
    permission_classes = [IsAdmin]

    def post(self, request):
        patients = Patient.objects.filter(doctor__isnull=False).select_related("doctor")
        results = []
        for patient in patients:
            context = _build_patient_context(patient)
            result = trigger_outbound_call(context, recent_calls=[], webhook_url=_webhook_url())
            results.append({"patient": patient.full_name, "result": result})
            logger.info("Batch call triggered for patient=%s result=%s", patient.full_name, result)

        return Response({
            "detail": f"Batch triggered - {len(results)} patients called via CALL-E.",
            "results": results,
        })

        # ----- PRODUCTION with Celery: Uncomment when Celery worker is running -----
        # from .tasks import run_daily_checkins
        # result = run_daily_checkins.delay()
        # return Response({"detail": "Daily check-in batch triggered.", "task_id": result.id})
