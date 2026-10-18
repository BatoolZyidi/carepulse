from django.urls import path

from . import views

urlpatterns = [
    path("trigger/<uuid:patient_id>/", views.ManualTriggerPatientCallView.as_view(), name="scheduler-trigger-patient"),
    path("trigger-all/", views.ManualTriggerAllView.as_view(), name="scheduler-trigger-all"),
]
