# System Architecture & Technical Specification

**Project Name:** CarePulse
**Tech Stack:** React (Vite) + Tailwind CSS + Framer Motion | Django REST Framework | Supabase (PostgreSQL) | CALL-E API | Gemma-4-31B-IT (AMD Token Factory)

---

## 1. System Topology Overview

```
                             ┌──────────────────────────────────────────────┐
                             │            CarePulse Web Frontend            │
                             │       React (Vite) + Tailwind CSS            │
                             └──────────────────────┬───────────────────────┘
                                                    │ JWT Auth / API Requests
                                                    ▼
                             ┌──────────────────────────────────────────────┐
                             │          Django REST Framework Backend       │
                             │  (Auth, RBAC, Care Plans, Scheduler,        │
                             │   Gemma Integration)                         │
                             └──────┬──────────────────────────────┬────────┘
                                    │                              │
                 Trigger Outbound   │                              │ Read/Write Queries
                       Call         ▼                              ▼
                         ┌──────────────────┐            ┌──────────────────┐
                         │  CALL-E Voice AI │            │   Supabase DB    │
                         │  Outbound Agent  │            │   (PostgreSQL)   │
                         └──────────┬───────┘            └──────────────────┘
                                    │ Webhook Post-Call Data
                                    ▼
                         ┌──────────────────┐
                         │  Gemma-4-31B-IT  │
                         │ (AMD Token Fac.) │
                         │ ODPARA Extractor │
                         └──────────────────┘
```

---

## 2. Data Flow & Event Timeline

1. **Account Provisioning & Discharge Care Plan:** Admin logs into React frontend -> POST to Django API `/api/admin/create-patient/` or `/api/admin/create-doctor/` -> Record inserted into Supabase `users`, `doctors`, or `patients` tables. During patient creation, the Admin also configures the discharge care plan: prescriptions (medicine name + taking schedule), general dietary guidance, optional medical reports, and an optional next check-up / appointment time.
2. **Discharge Care Plan Management:** Admin can update an existing patient's discharge plan (prescriptions, dietary guidance, reports, next check-up) via `/api/admin/patients/{id}/discharge-plan/`. Assigned doctors can edit the next check-up schedule via `/api/doctor/patients/{id}/update-schedule/`.
3. **Call Triggering:** Backend Cron Job checks scheduled call times -> Sends trigger request to CALL-E API with target `phone_number` and prompt context.
4. **Voice Interaction:** CALL-E conducts phone interview with Patient following the ODPARA framework.
5. **Webhook Processing:** CALL-E posts finished audio URL + transcript to Django endpoint `/api/webhooks/voice-call/`.
6. **Gemma Extraction:** Django calls `Gemma-4-31B-IT` via AMD Token Factory to extract structured metrics (`pain_level`, `temp_reading`, `meds_taken`, `risk_level`).
7. **Data Storage & Alerts:** Django writes metrics to `call_logs` table. If `risk_level == 'HIGH'`, inserts record to `alerts` table and pushes real-time WebSocket packet to assigned Doctor's browser.

---

## 3. Supabase Relational Database Schema

```sql
-- User Roles Definition
CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'patient');

-- Unified Authentication & Profiles Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(150) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Doctor Metadata Table
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL
);

-- Patient Metadata Table (includes Discharge Care Plan fields)
CREATE TYPE care_category AS ENUM ('post_op', 'chronic');

CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    care_type care_category NOT NULL,
    primary_diagnosis TEXT NOT NULL,
    discharge_date DATE,
    -- Discharge Care Plan
    prescription JSONB DEFAULT '[]'::jsonb,           -- Array of {medicine_name, taking_time}
    diet_instructions TEXT DEFAULT '',                 -- General dietary guidance & nutrition plan
    medical_reports JSONB DEFAULT '[]'::jsonb,        -- Array of {title, report_date, summary, file_url}
    next_checkup_date TIMESTAMP WITH TIME ZONE,       -- Next check-up / appointment time
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Call Recordings & ODPARA Symptom Extraction Logs
CREATE TYPE risk_score AS ENUM ('LOW', 'MED', 'HIGH');

CREATE TABLE call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    audio_url TEXT,
    transcript TEXT NOT NULL,
    pain_level INT CHECK (pain_level BETWEEN 0 AND 10),
    fever_reported BOOLEAN DEFAULT FALSE,
    temp_reading NUMERIC(4,1),
    meds_taken BOOLEAN DEFAULT TRUE,
    risk_level risk_score DEFAULT 'LOW',
    summary TEXT NOT NULL,
    red_flag_quote TEXT
);

-- Emergency Alerts for Doctors
CREATE TYPE alert_status AS ENUM ('UNREAD', 'ACKNOWLEDGED', 'RESOLVED');

CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_log_id UUID REFERENCES call_logs(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    status alert_status DEFAULT 'UNREAD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 4. API Endpoint Summary

| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| POST | `/api/auth/login/` | All | Unified JWT login |
| POST | `/api/admin/create-doctor/` | Admin | Provision a doctor account |
| POST | `/api/admin/create-patient/` | Admin | Provision a patient with discharge care plan |
| PATCH | `/api/admin/patients/{id}/discharge-plan/` | Admin | Update prescriptions, diet, reports, next checkup |
| GET | `/api/doctor/patients/` | Doctor | Scoped patient roster |
| PATCH | `/api/doctor/patients/{id}/update-schedule/` | Doctor | Edit next check-up / appointment time |
| GET | `/api/patient/profile/` | Patient | Own profile with care plan data |
| POST | `/api/webhooks/voice-call/` | System | CALL-E post-call webhook |

---

## 5. Frontend Component Architecture

| View | Key Components | Data Displayed |
| :--- | :--- | :--- |
| **Admin Dashboard** | `CreatePatientModal`, `DischargePlanModal`, `PatientTable`, `DoctorTable` | Patient roster, doctor roster, provisioning forms with prescription builder, dietary guidance editor, report attachments, checkup scheduler |
| **Doctor Dashboard** | `PatientRosterTable`, `PatientCarePlanCard`, `DoctorEditScheduleModal`, `TranscriptViewer` | Assigned patients, discharge prescriptions, dietary guidelines (dedicated card), medical reports, editable next check-up schedule, call history |
| **Patient Dashboard** | `PatientDashboard` | Personal prescriptions, dietary guidance, medical reports, next check-up time, call logs, emergency contacts |
