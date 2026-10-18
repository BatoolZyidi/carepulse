import os
import requests
import decouple

os.environ['DJANGO_SETTINGS_MODULE'] = 'carepulse.settings.local'
import django
django.setup()

from apps.profiles.models import Patient
from apps.triage.models import CallLog, Alert, AlertStatus, RiskLevel

def sync_single_call(call_id='call_6867c9860a904d5298b50697d6e945a5'):
    key = decouple.config('CALLE_API_KEY', default='')
    if not key:
        print("CALLE_API_KEY not configured.")
        return

    headers = {'Authorization': f'Bearer {key}'}
    r = requests.get(f'https://api.heycall-e.com/v2/calls/{call_id}', headers=headers)
    if r.status_code != 200:
        print(f"Call API returned {r.status_code}: {r.text}")
        return

    data = r.json()
    patient = Patient.objects.first()
    if not patient:
        print("No patients found in database to associate call with.")
        return

    res = data.get('result') or {}
    transcript_items = data.get('transcript') or []
    transcript = "\n".join(f"{t.get('speaker', '').capitalize()}: {t.get('text', '')}" for t in transcript_items)

    risk_raw = str(res.get('risk_level', 'LOW')).upper()
    if 'HIGH' in risk_raw:
        risk = RiskLevel.HIGH
    elif 'MED' in risk_raw:
        risk = RiskLevel.MED
    else:
        risk = RiskLevel.LOW

    log = CallLog.objects.create(
        patient=patient,
        transcript=transcript,
        audio_url='',
        onset=res.get('onset', ''),
        duration=res.get('duration', ''),
        progression=res.get('progression', ''),
        aggravating_factors=res.get('aggravating_factors', ''),
        relieving_factors=res.get('relieving_factors', ''),
        associated_symptoms=res.get('associated_symptoms', ''),
        pain_level=res.get('pain_level'),
        fever_reported=bool(res.get('fever_reported', False)),
        temp_reading=None,
        meds_taken=bool(res.get('meds_taken', True)),
        risk_level=risk,
        summary=res.get('summary', 'Patient check-in completed via CALL-E.'),
        red_flag_quote=res.get('red_flag_quote', ''),
    )

    if risk == RiskLevel.HIGH and patient.doctor:
        Alert.objects.create(
            call_log=log,
            patient=patient,
            doctor=patient.doctor,
            status=AlertStatus.UNREAD
        )

    print(f"SUCCESS! Created CallLog {log.id} for {patient.full_name}")


if __name__ == '__main__':
    sync_single_call()
