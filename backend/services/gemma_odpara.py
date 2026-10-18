"""
services/gemma_odpara.py

Isolated AMD Token Factory — Gemma (Gemma-4-31B-IT) integration (rules.md §3.2 —
external API calls must live in dedicated service modules, never inline in views).

Responsibilities (rules.md §2):
  1. Prompt Gemma with the ODPARA clinical framework (Onset, Duration,
     Progression, Aggravating, Relieving, Associated symptoms).
  2. Enforce a strict JSON schema on the response via response_format: {"type": "json_object"}.
  3. If parsing fails for ANY reason, fail DEFENSIVELY: return risk_level
     "HIGH" so a possible emergency is never silently dropped.
  4. Apply the triage severity thresholds from settings to double-check
     Gemma's own risk classification (belt-and-suspenders).
"""
import json
import logging
from decimal import Decimal, InvalidOperation
from typing import Any, Dict

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

ODPARA_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "onset": {"type": "string"},
        "duration": {"type": "string"},
        "progression": {"type": "string"},
        "aggravating_factors": {"type": "string"},
        "relieving_factors": {"type": "string"},
        "associated_symptoms": {"type": "string"},
        "pain_level": {"type": "integer", "minimum": 0, "maximum": 10},
        "fever_reported": {"type": "boolean"},
        "temp_reading": {"type": "number"},
        "meds_taken": {"type": "boolean"},
        "risk_level": {"type": "string", "enum": ["LOW", "MED", "HIGH"]},
        "summary": {"type": "string"},
        "red_flag_quote": {"type": "string"},
    },
    "required": [
        "onset", "duration", "progression", "aggravating_factors",
        "relieving_factors", "associated_symptoms", "pain_level",
        "fever_reported", "temp_reading", "meds_taken", "risk_level",
        "summary", "red_flag_quote",
    ],
}

_SYSTEM_PROMPT = """You are CarePulse's clinical triage extraction engine.

You will be given the transcript of an autonomous phone check-in call
conducted with a post-operative or chronic-disease patient by the CALL-E
voice agent. The call followed the ODPARA clinical probing framework:

  O - Onset: when did the symptom start?
  D - Duration: how long has it lasted / does it come and go?
  P - Progression: is it getting better, worse, or the same?
  A - Aggravating factors: what makes it worse?
  R - Relieving factors: what makes it better?
  A - Associated symptoms: what else is happening alongside it?

Read the transcript and return ONLY a single JSON object (no markdown
fences, no prose, no commentary) matching exactly this schema:

{schema}

Rules for risk_level:
  - HIGH if pain_level >= {pain_threshold}, OR temp_reading >= {temp_threshold},
    OR meds_taken is false, OR the patient mentions anything resembling:
    {red_flags}.
  - MED if symptoms are worsening or ambiguous but no red flag is present.
  - LOW if the patient is stable, recovering as expected, and adherent.

If information for a field is not discussed in the transcript, use your
best clinical judgement to infer a safe, conservative value rather than
leaving it blank. Always populate red_flag_quote with the single most
concerning verbatim quote from the transcript, or an empty string if none.
"""


def _build_system_prompt() -> str:
    return _SYSTEM_PROMPT.format(
        schema=json.dumps(ODPARA_JSON_SCHEMA, indent=2),
        pain_threshold=getattr(settings, "TRIAGE_HIGH_RISK_PAIN_LEVEL", 7),
        temp_threshold=getattr(settings, "TRIAGE_HIGH_RISK_TEMP_F", 101.0),
        red_flags=", ".join(f'"{kw}"' for kw in getattr(settings, "TRIAGE_RED_FLAG_KEYWORDS", ["chest pain", "shortness of breath", "fainting"])),
    )


def _defensive_fallback(reason: str) -> Dict[str, Any]:
    """rules.md §2.2 — if JSON parsing fails, default to risk_level HIGH
    so a possibly-missed emergency always reaches a human clinician."""
    logger.error("Gemma ODPARA extraction failed, defaulting to HIGH risk: %s", reason)
    return {
        "onset": "", "duration": "", "progression": "",
        "aggravating_factors": "", "relieving_factors": "", "associated_symptoms": "",
        "pain_level": None, "fever_reported": False, "temp_reading": None,
        "meds_taken": True, "risk_level": "HIGH",
        "summary": "Automated parsing failed — flagged HIGH for manual clinician review.",
        "red_flag_quote": "",
    }


def _apply_threshold_safety_net(metrics: Dict[str, Any], transcript: str) -> Dict[str, Any]:
    """Belt-and-suspenders: even if Gemma under-calls the risk, re-check
    against the hard thresholds defined in rules.md §2.3."""
    pain = metrics.get("pain_level")
    temp = metrics.get("temp_reading")
    meds_taken = metrics.get("meds_taken", True)
    lowered_transcript = transcript.lower()

    pain_threshold = getattr(settings, "TRIAGE_HIGH_RISK_PAIN_LEVEL", 7)
    temp_threshold = getattr(settings, "TRIAGE_HIGH_RISK_TEMP_F", 101.0)
    red_flag_keywords = getattr(settings, "TRIAGE_RED_FLAG_KEYWORDS", ["chest pain", "shortness of breath", "fainting"])

    hard_trigger = (
        (pain is not None and pain >= pain_threshold)
        or (temp is not None and float(temp) >= temp_threshold)
        or (meds_taken is False)
        or any(kw in lowered_transcript for kw in red_flag_keywords)
    )
    if hard_trigger:
        metrics["risk_level"] = "HIGH"
    return metrics


def extract_odpara_metrics(transcript: str, patient_context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sends a call transcript to AMD-hosted Gemma (Gemma-4-31B-IT) and returns a dict matching
    ODPARA_JSON_SCHEMA, ready to populate a `CallLog` row.

    Caller (apps.triage.views.VoiceCallWebhookView) is responsible for
    persisting the result — this function has no DB dependency.
    """
    api_key = getattr(settings, "GEMMA_API_KEY", "") or getattr(settings, "GEMINI_API_KEY", "")
    if not api_key:
        return _defensive_fallback("GEMMA_API_KEY is not configured")

    base_url = getattr(settings, "GEMMA_API_BASE_URL", "https://developer.amd.com.cn/radeon/api/v1").rstrip("/")
    model = getattr(settings, "GEMMA_MODEL", "Gemma-4-31B-IT")

    try:
        user_prompt = (
            f"Patient context: {json.dumps(patient_context)}\n\n"
            f"Call transcript:\n{transcript}"
        )

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": _build_system_prompt()},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.1,
            "max_tokens": 1024,
            "response_format": {"type": "json_object"},
        }

        resp = requests.post(
            f"{base_url}/chat/completions",
            headers=headers,
            json=payload,
            timeout=60,
        )

        if resp.status_code != 200:
            return _defensive_fallback(f"AMD Token Factory returned status {resp.status_code}: {resp.text}")

        res_json = resp.json()
        raw_text = res_json["choices"][0]["message"]["content"]
        metrics = json.loads(raw_text)

    except Exception as exc:  # noqa: BLE001 — any failure must hit the safe fallback
        return _defensive_fallback(str(exc))

    # Normalize temp_reading to Decimal-safe value
    try:
        if metrics.get("temp_reading") is not None:
            metrics["temp_reading"] = Decimal(str(metrics["temp_reading"]))
    except (InvalidOperation, TypeError):
        metrics["temp_reading"] = None

    metrics = _apply_threshold_safety_net(metrics, transcript)
    return metrics
