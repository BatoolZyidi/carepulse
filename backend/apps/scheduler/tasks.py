"""
prd.md §3.4 — Scheduler Service: "Daily automated triggers (e.g., Celery/Cron)
hit the CALL-E API with patient phone numbers and care track parameters."

Every patient gets their OWN dynamically-built prompt (services/calle_voice.py),
incorporating their diagnosis, care track, days since discharge, and the
trend from their most recent call — never a generic script.
"""
import logging

from celery import shared_task
from django.urls import reverse

from apps.profiles.models import Patient
from apps.triage.models import CallLog
from services.calle_voice import trigger_outbound_call

logger = logging.getLogger(__name__)


def _build_patient_context(patient: Patient) -> dict:
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


def _recent_call_history(patient: Patient, limit: int = 3) -> list:
    calls = CallLog.objects.filter(patient=patient).order_by("-timestamp")[:limit]
    return [
        {
            "timestamp": call.timestamp.isoformat(),
            "risk_level": call.risk_level,
            "pain_level": call.pain_level,
            "summary": call.summary,
        }
        for call in calls
    ]


@shared_task(name="scheduler.trigger_checkin_call")
def trigger_checkin_call(patient_id: str):
    """Triggers a single dynamically-prompted CALL-E check-in for one patient."""
    try:
        patient = Patient.objects.select_related("doctor").get(id=patient_id)
    except Patient.DoesNotExist:
        logger.error("trigger_checkin_call: no patient with id=%s", patient_id)
        return {"status": "error", "reason": "patient not found"}

    context = _build_patient_context(patient)
    recent_calls = _recent_call_history(patient)
    result = trigger_outbound_call(context, recent_calls)
    logger.info("CALL-E outbound triggered for patient=%s result=%s", patient.full_name, result)
    return result


@shared_task(name="scheduler.run_daily_checkins")
def run_daily_checkins():
    """
    Fans out one `trigger_checkin_call` task per active, doctor-assigned
    patient. Runs daily via Celery beat (see carepulse/celery.py).
    """
    patient_ids = list(
        Patient.objects.filter(doctor__isnull=False).values_list("id", flat=True)
    )
    logger.info("run_daily_checkins: scheduling %d outbound check-ins", len(patient_ids))
    for patient_id in patient_ids:
        trigger_checkin_call.delay(str(patient_id))
    return {"scheduled": len(patient_ids)}
