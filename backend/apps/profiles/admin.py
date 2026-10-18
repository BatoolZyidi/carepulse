from django.contrib import admin

from .models import AssignmentAudit, Doctor, Patient


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ("full_name", "specialty", "phone_number")
    search_fields = ("full_name", "specialty")


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ("full_name", "care_type", "doctor", "discharge_date")
    list_filter = ("care_type",)
    search_fields = ("full_name",)


@admin.register(AssignmentAudit)
class AssignmentAuditAdmin(admin.ModelAdmin):
    list_display = ("patient", "previous_doctor", "new_doctor", "changed_by", "changed_at")
    readonly_fields = [f.name for f in AssignmentAudit._meta.fields]
