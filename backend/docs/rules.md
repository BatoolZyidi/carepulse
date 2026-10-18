# Development Rules & Technical Guidelines

**Project Name:** CarePulse
**Enforcement Level:** Strict

---

## 1. Authentication & Security Rules

1. **NO Public Sign-Up:** Public registration endpoints (`/api/register/`) are strictly forbidden. All account creation must go through `/api/admin/create-doctor/` or `/api/admin/create-patient/` and require valid Admin JWT authentication.
2. **Strict Data Isolation (RBAC):**
   * **Doctor Queries:** Django ORM queries for Doctors MUST always filter by `patient__doctor__user=request.user`. A Doctor must NEVER receive patient data belonging to another clinician.
   * **Patient Queries:** Patient endpoints MUST filter by `user=request.user`.
   * **Care Plan Access:** Prescription, dietary guidance, medical reports, and next check-up data inherit the same isolation rules — a patient's care plan is visible only to the patient themselves, their assigned doctor, and admins.
3. **Password Hashing:** Plaintext passwords must never touch the database. Use Django's native `make_password()` or standard bcrypt algorithms.

---

## 2. Voice AI & LLM Processing Rules

1. **ODPARA Prompt Framework:** When sending call transcripts to Gemma (Gemma-4-31B-IT via AMD Token Factory), the prompt MUST mandate structured output adhering to the ODPARA clinical analysis framework (Onset, Duration, Progression, Aggravating, Relieving, Associated symptoms).
2. **Schema Enforcement:** Gemma response parsing must enforce strict JSON format via `response_format: {"type": "json_object"}`. If JSON parsing fails, fall back to a defensive default schema with `risk_level: "HIGH"` to prevent missed emergencies.
3. **Triage Severity Thresholds:**
   * Flag `HIGH` risk immediately if: `pain_level >= 8` OR `temp_reading >= 101.0` OR `meds_taken == False` OR emergency red-flag keywords ("chest pain", "bleeding", "shortness of breath") are detected.

---

## 3. Codebase Style & Architecture Rules

1. **Frontend (React + Tailwind):**
   * Use glassmorphic design conventions (`bg-slate-900/60`, `backdrop-blur-md`, `border border-slate-800`).
   * Animate view transitions using Framer Motion (`AnimatePresence` and `motion.div`).
   * Component files must reside under `src/components/` for shared UI elements and `src/features/` for role-specific views.
   * **Discharge Care Plan UI:** Prescriptions, dietary guidance, medical reports, and next check-up scheduling must each occupy their own visually distinct card/section — dietary guidance must never be mixed into the medication section.
2. **Backend (Django):**
   * Maintain modular structure with `core` app handling models, serializers, and views.
   * Keep external API integrations (CALL-E, Gemma, Supabase) isolated inside dedicated service modules (`services/calle_voice.py`, `services/gemma_odpara.py`).
   * **Care Plan Data:** Prescriptions and medical reports are stored as JSONB arrays on the patient model. Dietary guidance is a text field. Next check-up date is a timezone-aware timestamp. All are editable by Admin; next check-up is also editable by the assigned Doctor.
3. **Environment Variables:**
   * Secret keys (`GEMMA_API_KEY`, `SUPABASE_DB_URL`, `CALLE_API_KEY`, `JWT_SECRET_KEY`) must NEVER be hardcoded. Store exclusively in `.env`.
