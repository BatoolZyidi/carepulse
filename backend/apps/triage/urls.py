from django.urls import path

from . import views

urlpatterns = [
    # --- CALL-E inbound webhook (prd.md §3.4) ---
    path("webhooks/voice-call/", views.VoiceCallWebhookView.as_view(), name="voice-call-webhook"),

    # --- Doctor: Clinical History & Alerts (prd.md §3.2) ---
    path("doctor/patients/<uuid:patient_id>/call-logs/", views.DoctorPatientCallLogListView.as_view(), name="doctor-patient-call-logs"),
    path("doctor/alerts/", views.DoctorAlertListView.as_view(), name="doctor-alerts"),
    path("doctor/alerts/<uuid:alert_id>/", views.DoctorAlertActionView.as_view(), name="doctor-alert-action"),

    # --- Patient: Historical Log (prd.md §3.3) ---
    path("patient/call-logs/", views.PatientCallLogListView.as_view(), name="patient-call-logs"),
]
