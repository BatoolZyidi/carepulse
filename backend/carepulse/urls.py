"""
CarePulse root URL configuration.

/api/auth/...           -> apps.authentication  (unified login, token refresh)
/api/admin/...           -> apps.profiles         (Admin-only provisioning)
/api/doctor/...          -> apps.profiles         (scoped doctor roster)
/api/patient/...         -> apps.profiles         (scoped patient view)
/api/triage/...          -> apps.triage           (call logs, alerts)
/api/webhooks/voice-call/-> apps.triage           (CALL-E webhook receiver)
/api/scheduler/...       -> apps.scheduler         (manual trigger / status)
"""
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/django/", admin.site.urls),  # Django's own admin, kept separate from /api/admin/
    path("api/auth/", include("apps.authentication.urls")),
    path("api/", include("apps.profiles.urls")),
    path("api/", include("apps.triage.urls")),
    path("api/scheduler/", include("apps.scheduler.urls")),
]
