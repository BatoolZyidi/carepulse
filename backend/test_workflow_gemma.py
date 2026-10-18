import os
import sys

# Set up Django environment and venv site-packages
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
site_pkgs = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".venv", "Lib", "site-packages")
if os.path.exists(site_pkgs):
    sys.path.insert(0, site_pkgs)

import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "carepulse.settings.local")
django.setup()

from services.gemma_odpara import extract_odpara_metrics

def run_project_workflow_test():
    print("=== Testing CarePulse Workflow Integration with AMD Gemma ===")
    
    transcript = (
        "Agent: Hello Robert, this is CarePulse checking in following your cardiac stent placement. How are you feeling today?\n"
        "Patient: Good morning. I've had some mild chest tightness since this morning, maybe 3 out of 10, but it gets better when I rest.\n"
        "Agent: Have you had any fever, and did you take your blood thinners today?\n"
        "Patient: No fever, temperature was 98.4. Yes, I took my Plavix and Aspirin right after breakfast.\n"
        "Agent: Are you having any shortness of breath, dizziness, or sweating?\n"
        "Patient: No shortness of breath, just that slight tightness when I exert myself."
    )
    
    patient_context = {
        "full_name": "Robert Miller",
        "care_type": "post_op",
        "primary_diagnosis": "Coronary Stent Placement",
    }
    
    print("Invoking extract_odpara_metrics via services.gemma_odpara...")
    result = extract_odpara_metrics(transcript, patient_context)
    
    print("\nResult Extracted:")
    import json
    print(json.dumps({k: str(v) if hasattr(v, 'as_tuple') else v for k, v in result.items()}, indent=2))
    
    # Assertions
    assert "risk_level" in result
    assert result["pain_level"] == 3
    assert result["meds_taken"] is True
    print("\nProject workflow integration test PASSED successfully!")

if __name__ == "__main__":
    run_project_workflow_test()
