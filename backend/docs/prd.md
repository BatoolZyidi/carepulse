# Product Requirement Document (PRD)

**Project Name:** CarePulse (Autonomous Post-Op & Chronic Disease Patient Monitoring System)
**Target Platform:** Web Application (Responsive Dashboard & Voice Agent Engine)
**Document Version:** 2.0.0 (Final Architecture Spec)
**Date:** September 13, 2026

---

## 1. Executive Summary & Core Objective

CarePulse is an enterprise healthcare monitoring platform designed to automate post-discharge triage and chronic disease management.

By executing autonomous outbound phone check-ins via **CALL-E Voice Agents**, CarePulse converts unstructured patient voice conversations into structured clinical data (pain, fever, medication adherence, red-flag symptoms) evaluated through Gemma's **ODPARA** clinical framework (Gemma-4-31B-IT hosted on AMD Token Factory).

Beyond voice triage, CarePulse provides a comprehensive **Discharge Care Plan** system — enabling clinicians to prescribe medications, define dietary guidance and nutrition plans, attach medical reports and diagnostics, and schedule follow-up check-up appointments — all managed through role-based dashboards.

### Architectural Constraint: Controlled Account Creation
To prevent unauthorized access and maintain strict medical data governance, **there is NO public self-registration/sign-up page**. All accounts (Doctors and Patients) are strictly provisioned by the **Admin**. Users interact with the web system exclusively via a unified **Login Portal**.

---

## 2. Authentication & Access Matrix

All users authenticate via `/login`. The system inspects their JWT payload role upon successful authentication and routes them to their isolated dashboard view.

| Role | Provisioning Method | Auth Identifier | Accessible System Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | Environment Seed / Superuser | Username/Email + Password | Full System Governance, Doctor Account Creation, Patient Account Creation (including Discharge Care Plan: prescriptions, dietary guidance, medical reports, next check-up scheduling), Global Doctor-Patient Mapping, System Audit Logs. |
| **Doctor** | Created strictly by Admin | Username/Email + Password | Isolated Doctor Dashboard. **Access strictly restricted to assigned patients only.** View discharge prescriptions, dietary guidelines, medical reports. Edit next check-up / appointment schedule. Real-time emergency triage banners, call transcripts, audio playback. |
| **Patient** | Created strictly by Admin | Username/Email + Password | Isolated Patient View. View prescribed medications and taking schedule, personal dietary guidance, medical reports, next scheduled check-up / appointment time. Upcoming call schedule, call logs, past self-reported symptom history. |

---

## 3. Detailed Functional Modules

### 3.1 Admin Module (System Governance & Provisioning)
* **Doctor Account Creation:**
  * Form fields: Full Name, Specialty, License/NPI Number, Contact Email, Phone Number, Initial Password.
  * System auto-assigns role `DOCTOR` upon user instantiation.
* **Patient Account Creation & Discharge Care Plan:**
  * Form fields: Full Name, DOB, Phone Number (for CALL-E outbound trigger), Emergency Contact Info, Primary Diagnosis, Care Track (`Post-Op Recovery` or `Chronic Disease`), Discharge Date.
  * System auto-assigns role `PATIENT` upon user instantiation.
  * **Discharge Care Plan** (configured at provisioning time):
    * **Prescriptions:** One or more medications, each with medicine name and taking schedule (e.g., "Twice daily after meals").
    * **Dietary Guidance & Nutrition Plan:** A dedicated section for general dietary instructions — foods to avoid, meal timing, hydration recommendations, and recovery nutrition advice. Separated from per-medication notes for clarity.
    * **Medical Reports (Optional):** Attach discharge summaries, lab results, or diagnostic reports — each with title, date, clinical summary, and optional document reference URL.
    * **Next Check-Up / Appointment Time (Optional):** Schedule the patient's first follow-up visit. Can be set during provisioning or deferred for the assigned doctor to configure later.
* **Patient-to-Doctor Assignment Engine:**
  * Interface to assign or transfer unassigned patients to specific Doctors.
  * Real-time reassignment audit history.
* **Discharge Care Plan Management:**
  * Admin can update prescriptions, dietary guidance, medical reports, and next check-up dates for existing patients through a dedicated discharge plan modal.

### 3.2 Doctor Module (Clinical Triage & Monitoring)
* **Scoped Patient Roster:**
  * Displays **only** patients where `patient.doctor_id == current_doctor.id`.
  * Status badges: `Stable` (Green), `Needs Review` (Yellow), `Emergency Alert` (Red).
* **Discharge Care Plan View:**
  * **Prescriptions Card:** Lists all discharge medications with medicine name and taking schedule.
  * **Dietary Guidelines Card:** Displays the patient's dedicated dietary guidance and nutrition plan in its own section — clearly separated from medication data.
  * **Medical Reports & Diagnostics:** View attached reports with titles, dates, summaries, and document links.
  * **Next Check-Up Schedule:** Prominent banner displaying the scheduled follow-up date/time, with an "Edit Check-Up Schedule" button allowing the doctor to adjust the appointment.
* **Clinical History & Voice Transcript View:**
  * Complete timeline of automated CALL-E check-ins per patient.
  * Embedded audio player for call recording playback.
  * Gemma-extracted ODPARA symptom table (Pain level, Temp reading, Meds adherence).
* **Real-Time Emergency Alert Banner:**
  * WebSockets/Server-Sent Events (SSE) push immediate alerts when `risk_level == 'HIGH'`.
  * Visual banner highlights flagged audio quotes, clinical summary, and a 1-click button to acknowledge/resolve alerts.

### 3.3 Patient Module (View-Only Portal)
* **Login & Auth:** Access limited strictly to credentials provided by the healthcare provider during setup.
* **Personal Care Dashboard:**
  * **My Prescriptions:** View all prescribed medications with medicine names and taking schedules.
  * **Dietary Guidance:** Dedicated section displaying personalized nutrition and diet instructions from their care team.
  * **Medical Reports:** Access any attached discharge summaries, lab results, or diagnostic reports.
  * **Next Check-Up / Appointment:** View the scheduled follow-up date and time set by the admin or assigned doctor.
  * Next scheduled automated call timestamp display.
  * Historical log of completed check-ins and emergency contact details on file.

### 3.4 Outbound Voice Call & AI Triage Engine
* **Scheduler Service:** Daily automated triggers (e.g., Celery/Cron) hit the CALL-E API with patient phone numbers and care track parameters.
* **CALL-E Outbound Execution:** Autonomous agent conducts a multi-turn phone interview using the ODPARA clinical probing technique (Onset, Duration, Progression, Aggravating, Relieving, Associated symptoms).
* **Webhook & Gemma Parsing Pipeline:**
  1. CALL-E posts raw audio URL and transcript to Django webhook `POST /api/webhooks/voice-call/`.
  2. Django routes transcript to **Gemma-4-31B-IT** (AMD Token Factory) with strict JSON Schema output enforcement.
  3. Gemma outputs structured metrics and classifies risk (`LOW`, `MED`, `HIGH`).
  4. Database updates; if `HIGH`, an immediate WebSocket notification fires to the assigned Doctor's dashboard.
