import json
import os
import requests
from decouple import config

API_KEY = config("GEMMA_API_KEY", default=config("AMD_API_KEY", default=os.getenv("GEMMA_API_KEY", "")))
BASE_URL = config("GEMMA_API_BASE_URL", default="https://developer.amd.com.cn/radeon/api/v1")
MODEL_ID = config("GEMMA_MODEL", default="Gemma-4-31B-IT")

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

_SYSTEM_PROMPT = f"""You are CarePulse's clinical triage extraction engine.

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

{json.dumps(ODPARA_JSON_SCHEMA, indent=2)}

Rules for risk_level:
  - HIGH if pain_level >= 7, OR temp_reading >= 101.0,
    OR meds_taken is false, OR the patient mentions anything resembling chest pain, shortness of breath, heavy bleeding.
  - MED if symptoms are worsening or ambiguous but no red flag is present.
  - LOW if the patient is stable, recovering as expected, and adherent.

If information for a field is not discussed in the transcript, use your
best clinical judgement to infer a safe, conservative value rather than
leaving it blank. Always populate red_flag_quote with the single most
concerning verbatim quote from the transcript, or an empty string if none.
"""

def test_triage_extraction():
    print(f"\n=== Testing Clinical Triage ODPARA with {MODEL_ID} ===")
    sample_transcript = (
        "Agent: Hello Sarah, this is CarePulse following up after your knee replacement. How are you feeling today?\n"
        "Patient: Hi, I've had some throbbing pain around the incision since yesterday afternoon. It's about a 6 out of 10.\n"
        "Agent: Have you checked your temperature, and did you take your prescribed antibiotics?\n"
        "Patient: Yes, my temperature was 98.6 and I took all my medications with breakfast.\n"
        "Agent: Does anything make the pain worse or better?\n"
        "Patient: Walking makes it worse, but elevating my leg with an ice pack helps. No shortness of breath or dizziness."
    )

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": MODEL_ID,
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": f"Call transcript:\n{sample_transcript}"}
        ],
        "temperature": 0.1,
        "max_tokens": 500,
        "response_format": {"type": "json_object"}
    }

    resp = requests.post(f"{BASE_URL}/chat/completions", headers=headers, json=payload, timeout=60)
    print(f"Status Code: {resp.status_code}")
    if resp.status_code == 200:
        raw_content = resp.json()["choices"][0]["message"]["content"]
        print(f"Raw Output:\n{raw_content}")
        parsed = json.loads(raw_content)
        print("\nSuccessfully parsed JSON:")
        print(json.dumps(parsed, indent=2))
        assert "risk_level" in parsed
        assert "pain_level" in parsed
        print("\nAll clinical schema assertions PASSED!")
    else:
        print(f"Failed: {resp.text}")

if __name__ == "__main__":
    test_triage_extraction()
