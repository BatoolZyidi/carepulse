"""
Doctor & Patient metadata models (architecture.md §3 — mirrors Supabase
`doctors` / `patients` tables). Both are 1:1 extensions of `authentication.User`
and are ONLY ever instantiated through Admin-provisioning endpoints.
"""
import uuid

from django.db import models

from apps.authentication.models import User


class CareCategory(models.TextChoices):
    POST_OP = "post_op", "Post-Op Recovery"
    CHRONIC = "chronic", "Chronic Disease"


class Doctor(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="doctor_profile")
    full_name = models.CharField(max_length=255)
    specialty = models.CharField(max_length=100)
    license_number = models.CharField(max_length=64, blank=True)
    phone_number = models.CharField(max_length=20)

    class Meta:
        db_table = "doctors"

    def __str__(self):
        return f"Dr. {self.full_name} ({self.specialty})"


class Patient(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="patient_profile")
    doctor = models.ForeignKey(
        Doctor, on_delete=models.SET_NULL, null=True, blank=True, related_name="patients"
    )
    full_name = models.CharField(max_length=255)
    date_of_birth = models.DateField(null=True, blank=True)
    phone_number = models.CharField(max_length=20)  # CALL-E outbound trigger target
    emergency_contact_name = models.CharField(max_length=255, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    care_type = models.CharField(max_length=10, choices=CareCategory.choices)
    primary_diagnosis = models.TextField()
    discharge_date = models.DateField(null=True, blank=True)

    # Discharge Care Plan: Prescription, Diet, Medical Reports & Next Schedule
    prescription = models.JSONField(default=list, blank=True)
    diet_instructions = models.TextField(blank=True, default="")
    medical_reports = models.JSONField(default=list, blank=True)
    next_checkup_date = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "patients"

    def __str__(self):
        return f"{self.full_name} — {self.get_care_type_display()}"

    @property
    def status(self):
        """Derived roster status badge (prd.md §3.2): Stable / Needs Review / Emergency Alert."""
        latest_alert = self.alerts.filter(status__in=["UNREAD", "ACKNOWLEDGED"]).order_by("-created_at").first()
        if latest_alert:
            return "Emergency Alert"
        latest_call = self.call_logs.order_by("-timestamp").first()
        if latest_call and latest_call.risk_level == "MED":
            return "Needs Review"
        return "Stable"


class AssignmentAudit(models.Model):
    """Real-time reassignment audit history (prd.md §3.1)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="assignment_history")
    previous_doctor = models.ForeignKey(
        Doctor, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    new_doctor = models.ForeignKey(Doctor, on_delete=models.SET_NULL, null=True, related_name="+")
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="+")
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "assignment_audit"
        ordering = ["-changed_at"]
