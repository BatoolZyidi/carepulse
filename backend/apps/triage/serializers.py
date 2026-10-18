from rest_framework import serializers

from .models import Alert, CallLog


class CallLogSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)

    class Meta:
        model = CallLog
        fields = [
            "id", "patient", "patient_name", "timestamp", "audio_url", "transcript",
            "onset", "duration", "progression", "aggravating_factors",
            "relieving_factors", "associated_symptoms",
            "pain_level", "fever_reported", "temp_reading", "meds_taken",
            "risk_level", "summary", "red_flag_quote",
        ]
        read_only_fields = fields


class AlertSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    call_summary = serializers.CharField(source="call_log.summary", read_only=True)
    red_flag_quote = serializers.CharField(source="call_log.red_flag_quote", read_only=True)
    audio_url = serializers.CharField(source="call_log.audio_url", read_only=True)

    class Meta:
        model = Alert
        fields = [
            "id", "call_log", "patient", "patient_name", "doctor", "status",
            "call_summary", "red_flag_quote", "audio_url", "created_at",
        ]
        read_only_fields = ["id", "call_log", "patient", "doctor", "created_at"]


class VoiceCallWebhookSerializer(serializers.Serializer):
    """
    Payload contract for POST /api/webhooks/voice-call/ (prd.md §3.4).
    CALL-E is expected to post the patient identifier, the raw transcript,
    and a link to the recorded audio once a check-in call completes.
    """
    patient_id = serializers.UUIDField()
    call_id = serializers.CharField(required=False, allow_blank=True)
    audio_url = serializers.URLField(required=False, allow_blank=True)
    transcript = serializers.CharField()
