"""
services/calle_voice.py

CALL-E API client using the official heycall-e.com API.
API Reference: https://docs.heycall-e.com
Base URL: https://api.heycall-e.com
Auth: Bearer token (CALLE_API_KEY in .env)

Owns two responsibilities:
  1. Building a dynamic per-patient ODPARA outbound call task description.
  2. Triggering the actual outbound call via POST /v2/calls.
"""
import datetime
import logging
import uuid
from typing import Any, Dict, List, Optional

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

DEFAULT_CALLE_BASE_URL = "https://api.heycall-e.com"


def _get_base_url() -> str:
    if settings.configured:
        url = getattr(settings, "CALLE_API_BASE_URL", DEFAULT_CALLE_BASE_URL)
        if "calle.ai" in url:
            return DEFAULT_CALLE_BASE_URL
        return url.rstrip("/")
    return DEFAULT_CALLE_BASE_URL


def _days_since(date: Optional[datetime.date]) -> Optional[int]:
    if not date:
        return None
    if isinstance(date, str):
        try:
            date = datetime.date.fromisoformat(date)
        except ValueError:
            return None
    return (datetime.date.today() - date).days


def build_dynamic_odpara_prompt(patient: Dict[str, Any], recent_calls: List[Dict[str, Any]]) -> str:
    """
    Builds a unique CALL-E conversation prompt for THIS patient, THIS call.

    `patient` is a plain dict with keys: full_name, care_type,
    primary_diagnosis, discharge_date, doctor_name.
    `recent_calls` is a list of the patient's last few CallLog dicts
    (most-recent first) with keys: risk_level, summary, pain_level, timestamp.

    Prompt philosophy:
      - Opens with a warm, human check-in — not a medical interview.
      - ODPARA deep-dive ONLY triggers if the patient mentions a new/changed symptom.
      - Guardrails for: wrong person, off-topic chat, rude/prank callers, busy patients.
    """
    care_track_label = (
        "post-operative recovery"
        if patient.get("care_type") == "post_op"
        else "chronic disease management"
    )
    days_out = _days_since(patient.get("discharge_date"))
    days_out_clause = (
        f"{days_out} days post-discharge" if days_out is not None else "recently under care"
    )
    doctor_clause = (
        f"on behalf of {patient['doctor_name']}"
        if patient.get("doctor_name")
        else "on behalf of the CarePulse care team"
    )

    trend_clause = "This is their first automated check-in."
    if recent_calls:
        last = recent_calls[0]
        trend_clause = (
            f"On their last check-in ({last.get('timestamp', 'recently')}), their risk level was "
            f"{last.get('risk_level', 'unknown')} with pain reported at {last.get('pain_level', 'unknown')}/10. "
            f"Summary: \"{last.get('summary', 'n/a')}\". "
            f"Pay close attention to whether things have improved or worsened."
        )

    first_name = (
        patient.get("full_name", "").split()[0]
        if patient.get("full_name")
        else "the patient"
    )

    checkup_reminder = ""
    if patient.get("next_checkup_date"):
        try:
            val = patient["next_checkup_date"]
            if isinstance(val, str):
                checkup_dt = datetime.datetime.fromisoformat(val.replace("Z", "+00:00"))
            elif isinstance(val, (datetime.datetime, datetime.date)):
                checkup_dt = val
            else:
                checkup_dt = None
            if checkup_dt:
                formatted_dt = checkup_dt.strftime("%A, %B %d at %I:%M %p")
                checkup_reminder = (
                    f"Before closing, let {first_name} know that their next "
                    f"scheduled follow-up with their doctor is on {formatted_dt}. "
                )
        except Exception:
            checkup_reminder = ""

    prompt = f"""
You are CALL-E, a warm and caring voice health assistant for CarePulse, calling {doctor_clause}.
You are doing a routine well-being check-in with {patient.get('full_name', 'the patient')},
who is {days_out_clause} for {care_track_label} related to: {patient.get('primary_diagnosis', 'medical recovery')}.

Previous check-in context: {trend_clause}

--- YOUR TONE AND STYLE ---
Sound like a genuine, caring human health coordinator -- not a robot reading a form.
Be warm, unhurried, and conversational. Use natural, empathetic language.
Ask only ONE question at a time. Never pile on multiple questions in one turn.
Always acknowledge what the patient says before moving forward.
Good examples: "I'm really glad to hear that." / "Oh I see, I'm sorry to hear that -- let me make a note of that."

--- STEP 1: CONFIRM YOU HAVE THE RIGHT PERSON ---
Start by greeting warmly and confirming identity before saying anything else.
Say: "Hi, may I please speak with {first_name}?"

  > If the person says they are NOT {first_name} or does not know them:
    Say: "Oh I'm so sorry to bother you -- I think I may have the wrong number. Have a wonderful day!"
    Then end the call immediately.

  > If there is no response after a brief pause:
    Say: "Hello? Sorry to disturb -- I'll try again another time. Take care!"
    Then end the call immediately.

--- STEP 2: WARM OPEN CHECK-IN ---
Once identity is confirmed, introduce yourself naturally and ask ONE open-ended question.
Say: "Hi {first_name}! This is CALL-E calling on behalf of your care team.
I'm just checking in to see how you've been feeling since your recent care.
How are you doing today -- overall?"

Then LISTEN. Let {first_name} speak freely. Do not interrupt.

--- STEP 3: RESPOND TO WHAT YOU HEAR ---

CASE A -- {first_name} says they are doing well, fine, or recovering normally:
  Respond warmly: "That's really great to hear, I'm so glad!"
  Then ask gently: "Is there anything at all that's felt a little off lately --
  even something small that you might have brushed aside?"
  > If no concerns at all: skip straight to STEP 5 to close the call.
  > If they mention anything: move to STEP 4.

CASE B -- {first_name} mentions any new symptom, discomfort, or change:
  Do NOT immediately ask a list of questions.
  First acknowledge sincerely: "I hear you -- thank you for sharing that with me.
  Let me ask you just a few things so I can pass the right information to your care team."
  Then move to STEP 4.

--- STEP 4: SYMPTOM DEEP-DIVE (ONLY if a symptom was mentioned) ---
Explore what {first_name} shared through natural, caring conversation.
Ask ONE question at a time. Do NOT use clinical terms or sound like a checklist.
Work through these areas naturally in your own words:

  - When did this start? (Onset)
  - Has it been constant, or does it come and go? (Duration)
  - Would you say it is getting better, worse, or staying about the same? (Progression)
  - Is there anything that seems to make it worse -- moving around, eating, certain times of day? (Aggravating factors)
  - What seems to help -- resting, a certain position, or any medication you've taken? (Relieving factors)
  - "On a scale from 0 to 10 -- 0 being no discomfort and 10 being the worst you can imagine -- how would you rate it right now?" (Pain level)
  - "Have you had any fever or felt unusually warm?" (Fever)
  - "Have you been able to take your prescribed medications today?" (Medication adherence)

  EMERGENCY FLAG -- If {first_name} mentions chest pain, severe shortness of breath,
  uncontrolled bleeding, sudden severe pain, or collapse:
    Respond calmly but with urgency:
    "That sounds like something that needs immediate attention. I'm flagging this to your doctor right now.
     Please call emergency services or go to the nearest emergency room straight away if you feel unsafe.
     I'm noting this as urgent for your care team."
    End the call immediately and mark risk as HIGH.

--- GUARDRAILS: HANDLING DIFFICULT SITUATIONS ---

OFF-TOPIC CONVERSATION:
  If {first_name} starts talking about unrelated things -- personal stories, questions about you,
  news, or anything not health-related -- redirect warmly:
  First time: "I appreciate you sharing that! I just want to quickly finish checking in
  on your health before I let you go -- [return to the last health question]."
  Second time: Same gentle redirect.
  Third time: "I don't want to take up too much of your time. I'll note that things seem okay.
  Take good care of yourself and reach out to your care team if anything comes up!"
  Then end the call.

RUDE, HOSTILE, OR PRANK CALLER:
  Stay completely calm. Say only once:
  "I understand. I'll let the care team know I wasn't able to complete today's check-in. Have a good day."
  Then end the call immediately. Do not argue or re-engage.

PATIENT IS BUSY OR DOES NOT WANT TO TALK:
  Say: "Of course, absolutely no problem at all! I'll note that you were not available today.
  Your care team will be in touch. Take care of yourself!"
  Then end the call.

--- STEP 5: CLOSE THE CALL ---
{checkup_reminder}Close warmly, briefly, and naturally:
"Thank you so much for chatting with me, {first_name}. Your care team is keeping a close eye
on your recovery and they will reach out if anything needs attention. Please rest well,
follow your doctor's advice, and do not hesitate to contact the team if anything comes up.
Take care -- bye for now!"
""".strip()

    return prompt


# Alias for backwards compatibility
build_call_task = build_dynamic_odpara_prompt


def trigger_outbound_call(
    patient: Dict[str, Any],
    recent_calls: Optional[List[Dict[str, Any]]] = None,
    webhook_url: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Fires a CALL-E outbound call for a single patient using the official /v2/calls endpoint.
    Returns CALL-E's response payload (call id, status, etc).

    `patient` must include: id, full_name, phone_number, care_type,
    primary_diagnosis, discharge_date, doctor_name.
    """
    api_key = getattr(settings, "CALLE_API_KEY", "")
    if not api_key or "your-calle" in api_key:
        logger.warning(
            "CALLE_API_KEY not set — skipping outbound call for %s (dry run).",
            patient.get("full_name"),
        )
        return {"status": "skipped", "reason": "CALLE_API_KEY not configured"}

    task_prompt = build_dynamic_odpara_prompt(patient, recent_calls or [])
    idempotency_key = f"carepulse-{patient.get('id', 'anon')}-{uuid.uuid4().hex[:12]}"

    phone = str(patient.get("phone_number", "")).strip()
    locale = "en-PK" if phone.startswith("+92") else "en-US"

    payload: Dict[str, Any] = {
        "task": task_prompt,
        "phone": phone,
        "locale": locale,
        "result_schema": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "onset": {"type": "string"},
                "duration": {"type": "string"},
                "progression": {"type": "string"},
                "aggravating_factors": {"type": "string"},
                "relieving_factors": {"type": "string"},
                "associated_symptoms": {"type": "string"},
                "pain_level": {"type": "integer"},
                "fever_reported": {"type": "boolean"},
                "temp_reading": {"type": "number"},
                "meds_taken": {"type": "boolean"},
                "risk_level": {"type": "string"},
                "summary": {"type": "string"},
                "red_flag_quote": {"type": "string"},
            },
            "required": ["summary", "risk_level"],
        },
        "metadata": {
            "patient_id": str(patient.get("id", "")),
            "care_type": str(patient.get("care_type", "")),
            "full_name": str(patient.get("full_name", "")),
        },
    }

    if webhook_url:
        payload["webhook_url"] = webhook_url

    base_url = _get_base_url()
    try:
        response = requests.post(
            f"{base_url}/v2/calls",
            json=payload,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "Idempotency-Key": idempotency_key,
            },
            timeout=25,
        )
        response.raise_for_status()
        data = response.json()
        logger.info(
            "CALL-E outbound call initiated successfully: id=%s call_id=%s status=%s for patient=%s",
            data.get("id"),
            data.get("call_id"),
            data.get("status"),
            patient.get("full_name"),
        )
        return data
    except requests.HTTPError as exc:
        err_msg = exc.response.text if exc.response is not None else str(exc)
        logger.error(
            "CALL-E HTTP error for patient %s: %s -- %s",
            patient.get("id"),
            exc,
            err_msg,
        )
        return {
            "status": "error",
            "reason": f"CALL-E HTTP {exc.response.status_code if exc.response is not None else ''}: {err_msg}",
        }
    except requests.RequestException as exc:
        logger.exception("CALL-E request failed for patient %s: %s", patient.get("id"), exc)
        return {"status": "error", "reason": str(exc)}
