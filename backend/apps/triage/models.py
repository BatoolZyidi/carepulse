"""
architecture.md §3 — mirrors Supabase `call_logs` / `alerts` tables.
Populated by the Gemma ODPARA extraction pipeline (services/gemma_odpara.py)
after every CALL-E webhook (apps.triage.views.VoiceCallWebhookView).
"""
import uuid

from django.db import models

from apps.profiles.models import Doctor, Patient


class RiskLevel(models.TextChoices):
    LOW = "LOW", "Low"
    MED = "MED", "Medium"
    HIGH = "HIGH", "High"


class CallLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="call_logs")
    timestamp = models.DateTimeField(auto_now_add=True)

    audio_url = models.TextField(blank=True)
    transcript = models.TextField()

    # --- ODPARA-derived structured metrics (Gemma output) ---
    onset = models.TextField(blank=True)
    duration = models.TextField(blank=True)
    progression = models.TextField(blank=True)
    aggravating_factors = models.TextField(blank=True)
    relieving_factors = models.TextField(blank=True)
    associated_symptoms = models.TextField(blank=True)

    pain_level = models.IntegerField(null=True, blank=True)
    fever_reported = models.BooleanField(default=False)
    temp_reading = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    meds_taken = models.BooleanField(default=True)

    risk_level = models.CharField(max_length=4, choices=RiskLevel.choices, default=RiskLevel.LOW)
    summary = models.TextField()
    red_flag_quote = models.TextField(blank=True)

    class Meta:
        db_table = "call_logs"
        ordering = ["-timestamp"]

    def __str__(self):
        return f"CallLog({self.patient.full_name}, {self.risk_level}, {self.timestamp:%Y-%m-%d})"


class AlertStatus(models.TextChoices):
    UNREAD = "UNREAD", "Unread"
    ACKNOWLEDGED = "ACKNOWLEDGED", "Acknowledged"
    RESOLVED = "RESOLVED", "Resolved"


class Alert(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    call_log = models.ForeignKey(CallLog, on_delete=models.CASCADE, related_name="alerts")
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="alerts")
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name="alerts")
    status = models.CharField(max_length=12, choices=AlertStatus.choices, default=AlertStatus.UNREAD)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "alerts"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Alert({self.patient.full_name} -> Dr. {self.doctor.full_name}, {self.status})"
