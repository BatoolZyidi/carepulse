# CarePulse

Autonomous post-op & chronic disease patient monitoring, powered by **CALL-E** voice
agents and **Gemma 4 31B** ODPARA clinical triage (hosted on AMD Radeon Cloud Token Factory) — with integrated discharge
care planning, prescription management, dietary guidance, and follow-up scheduling.

Built for the CALL-E Devpost Hackathon.

---

## Stack

- **Frontend:** React (Vite) + Tailwind CSS + Framer Motion
- **Backend:** Django REST Framework + Django Channels (WebSockets) + Celery
- **Database:** Supabase (PostgreSQL)
- **Voice:** CALL-E outbound voice agent API
- **Clinical NLP:** Gemma 4 31B via AMD Token Factory (strict JSON / ODPARA schema)

See `prd.md`, `architecture.md`, and `rules.md` for the full spec this project was built against.

---

## 1. Prerequisites

- Python 3.12+
- Node.js 20+
- A Supabase project (Postgres connection string)
- Redis (for Celery + Channels) — `docker run -p 6379:6379 redis:7-alpine` works fine locally
- API keys: CALL-E, AMD Radeon Cloud (Gemma)

## 2. Environment Variables

```bash
cp .env.example .env
```

Fill in every value in `.env` — **none are hardcoded anywhere in the codebase**
(rules.md §3.3). At minimum for a local demo you need:

- `SUPABASE_DB_URL` / `SUPABASE_DB_HOST` / etc — your Supabase Postgres connection
- `CALLE_API_KEY`, `CALLE_AGENT_ID`, `CALLE_WEBHOOK_SECRET`
- `GEMMA_API_KEY` (or `AMD_API_KEY`)
- `JWT_SECRET_KEY`, `DJANGO_SECRET_KEY`
- `ADMIN_SEED_PASSWORD` — sets the password for the one bootstrap Admin account

## 3. Database Setup

Run the schema against your Supabase project:

```bash
psql "$SUPABASE_DB_URL" -f supabase/schema.sql
```

*(Django's own migrations also define these tables and will create them if you
skip this step and run `migrate` instead — either path works. The raw SQL file
is provided because it's often faster to paste directly into the Supabase SQL editor.)*

## 4. Backend Setup

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

python manage.py migrate
python manage.py seed_admin          # creates the one Admin account from .env
python manage.py runserver           # http://localhost:8000

# In separate terminals, for the full real-time + scheduling experience:
celery -A carepulse worker -l info
celery -A carepulse beat -l info
```

> For WebSocket support (real-time doctor alerts) in production, run via Daphne:
> `daphne -b 0.0.0.0 -p 8000 carepulse.asgi:application`

## 5. Frontend Setup

```bash
cd frontend
npm install
npm run dev                          # http://localhost:5173
```

## 6. Or Just Use Docker Compose

```bash
docker compose up --build
```

This brings up backend, Celery worker + beat, Redis, and frontend together.

---

## 7. CALL-E Webhook

Point your CALL-E agent's post-call webhook at:

```
POST https://your-backend-host/api/webhooks/voice-call/
X-CallE-Signature: <hmac-sha256 of raw body using CALLE_WEBHOOK_SECRET>

{
  "patient_id": "<uuid>",
  "call_id": "call_abc123",
  "audio_url": "https://...",
  "transcript": "..."
}
```

The backend runs the transcript through Gemma's ODPARA extractor
(`backend/services/gemma_odpara.py`), stores a `CallLog`, and — if
risk is classified `HIGH` — creates an `Alert` and pushes it live over
WebSocket to the assigned doctor's dashboard.

## 8. Demo Tips

- Log in as Admin (seeded account) → create a Doctor → create a Patient → assign them.
- During patient provisioning, fill out the **Discharge Care Plan** section:
  - Add **prescriptions** (medicine name + taking schedule).
  - Write **dietary guidance** (nutrition plan, foods to avoid, hydration instructions).
  - Attach optional **medical reports** (lab results, discharge summaries, diagnostics).
  - Set an optional **Next Check-Up / Appointment Time** for the patient's follow-up.
- Use **"Trigger All Check-Ins"** on the Admin dashboard, or **"Call Now"** on a single
  patient row in the Doctor dashboard, to fire a CALL-E call on demand instead of
  waiting for the daily Celery beat schedule.
- Doctors can **view and edit** the next check-up schedule for their assigned patients
  directly from the Discharge Care Plan tab on their dashboard.
- Every patient's CALL-E prompt is generated dynamically
  (`backend/services/calle_voice.py::build_dynamic_odpara_prompt`) from their name,
  diagnosis, care track, days since discharge, and their most recent call's trend —
  no two patients get the same script.

---

## Project Structure

```
carepulse/
├── prd.md / architecture.md / rules.md   # Source specification
├── docker-compose.yml
├── backend/                               # Django REST Framework
│   ├── carepulse/                         # settings, urls, asgi/wsgi, celery
│   ├── apps/
│   │   ├── authentication/                # Custom User model, unified JWT login
│   │   ├── profiles/                      # Doctor/Patient models, RBAC, provisioning,
│   │   │                                  # prescriptions, dietary guidance, reports,
│   │   │                                  # next checkup scheduling
│   │   ├── triage/                        # CallLog/Alert models, webhook, WebSocket
│   │   └── scheduler/                     # Celery daily check-in tasks
│   └── services/                          # calle_voice.py, gemma_odpara.py, supabase_client.py
├── frontend/                              # React + Vite + Tailwind + Framer Motion
│   └── src/
│       ├── features/{auth,admin,doctor,patient,landing}/
│       ├── components/{common,layout,alerts}/
│       ├── context/  ├── services/  └── utils/
└── supabase/schema.sql
```

## Security Notes

- There is **no public registration endpoint** — every account is created by an
  Admin via `/api/admin/create-doctor/` or `/api/admin/create-patient/`.
- Doctor and Patient API views filter querysets by `request.user` at the ORM
  level, not just by permission class — a Doctor physically cannot query
  another clinician's patients.
- The Gemma extraction pipeline defaults to `risk_level: "HIGH"` on any
  parsing failure, so a malformed AI response never silently hides a
  possible emergency.
- Prescription data, dietary instructions, and medical reports are stored as
  structured JSON fields within the patient profile, accessible only to
  authorized roles (admin, assigned doctor, and the patient themselves).

## Test Credentials

**Admin**
- **Username:** `admin`
- **Password:** `12345`

**Doctors** (Password for all doctors: `Doctor@123`)
- **Dr. Ahmed Khan (Urology):** `dr.ahmed`
- **Dr. Sara Malik (Cardiology):** `dr.sara`

**Patients** (Password for all patients: `Patient@123`)
- **Pakeeza (Kidney Stone Post-Op):** `pakeeza`
- **Batool (Chronic Heart Disease):** `batool`
- **Zainab Hussain:** `zainab.patient`
- **Ali Raza:** `ali.patient`

> All patients and doctors are seeded with the filler phone number `+923000000000` for testing purposes.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

