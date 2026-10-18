from django.contrib import admin

from .models import Alert, CallLog


@admin.register(CallLog)
class CallLogAdmin(admin.ModelAdmin):
    list_display = ("patient", "timestamp", "risk_level", "pain_level", "temp_reading", "meds_taken")
    list_filter = ("risk_level",)
    search_fields = ("patient__full_name",)


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ("patient", "doctor", "status", "created_at")
    list_filter = ("status",)
