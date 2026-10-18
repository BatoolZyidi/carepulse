-- ============================================================
-- CarePulse — Supabase (PostgreSQL) Schema
-- Run this in the Supabase SQL editor, or via `psql $SUPABASE_DB_URL -f schema.sql`
-- Mirrors architecture.md §3 exactly, plus the assignment-audit table
-- used by the Admin's Patient-to-Doctor Assignment Engine (prd.md §3.1).
-- ============================================================

create extension if not exists "pgcrypto";

-- User Roles Definition
create type user_role as enum ('admin', 'doctor', 'patient');

-- Unified Authentication & Profiles Table
create table users (
    id uuid primary key default gen_random_uuid(),
    username varchar(150) unique not null,
    email varchar(255) unique not null,
    password_hash varchar(255) not null,
    role user_role not null,
    created_at timestamp with time zone default now()
);

-- Doctor Metadata Table
create table doctors (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(id) on delete cascade,
    full_name varchar(255) not null,
    specialty varchar(100) not null,
    license_number varchar(64),
    phone_number varchar(20) not null
);

-- Patient Metadata Table
create type care_category as enum ('post_op', 'chronic');

create table patients (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(id) on delete cascade,
    doctor_id uuid references doctors(id) on delete set null,
    full_name varchar(255) not null,
    date_of_birth date,
    phone_number varchar(20) not null,
    emergency_contact_name varchar(255),
    emergency_contact_phone varchar(20),
    care_type care_category not null,
    primary_diagnosis text not null,
    discharge_date date,
    prescription jsonb default '[]'::jsonb,
    diet_instructions text default '',
    medical_reports jsonb default '[]'::jsonb,
    next_checkup_date timestamp with time zone,
    created_at timestamp with time zone default now()
);

-- Call Recordings & ODPARA Symptom Extraction Logs
create type risk_score as enum ('LOW', 'MED', 'HIGH');

create table call_logs (
    id uuid primary key default gen_random_uuid(),
    patient_id uuid references patients(id) on delete cascade,
    "timestamp" timestamp with time zone default now(),
    audio_url text,
    transcript text not null,
    onset text,
    duration text,
    progression text,
    aggravating_factors text,
    relieving_factors text,
    associated_symptoms text,
    pain_level int check (pain_level between 0 and 10),
    fever_reported boolean default false,
    temp_reading numeric(4,1),
    meds_taken boolean default true,
    risk_level risk_score default 'LOW',
    summary text not null,
    red_flag_quote text
);

-- Emergency Alerts for Doctors
create type alert_status as enum ('UNREAD', 'ACKNOWLEDGED', 'RESOLVED');

create table alerts (
    id uuid primary key default gen_random_uuid(),
    call_log_id uuid references call_logs(id) on delete cascade,
    patient_id uuid references patients(id) on delete cascade,
    doctor_id uuid references doctors(id) on delete cascade,
    status alert_status default 'UNREAD',
    created_at timestamp with time zone default now()
);

-- Patient-to-Doctor Assignment Audit Trail (prd.md §3.1)
create table assignment_audit (
    id uuid primary key default gen_random_uuid(),
    patient_id uuid references patients(id) on delete cascade,
    previous_doctor_id uuid references doctors(id) on delete set null,
    new_doctor_id uuid references doctors(id) on delete set null,
    changed_by uuid references users(id) on delete set null,
    changed_at timestamp with time zone default now()
);

-- ------------------------------------------------------------------
-- Helpful indexes
-- ------------------------------------------------------------------
create index idx_patients_doctor_id on patients(doctor_id);
create index idx_call_logs_patient_id on call_logs(patient_id);
create index idx_call_logs_risk_level on call_logs(risk_level);
create index idx_alerts_doctor_id on alerts(doctor_id);
create index idx_alerts_status on alerts(status);

-- ------------------------------------------------------------------
-- Row Level Security (recommended if you query Supabase directly
-- from the frontend/service-role in addition to the Django backend)
-- ------------------------------------------------------------------
alter table users enable row level security;
alter table doctors enable row level security;
alter table patients enable row level security;
alter table call_logs enable row level security;
alter table alerts enable row level security;
alter table assignment_audit enable row level security;

-- NOTE: Django connects using the Supabase service-role/DB connection
-- string (SUPABASE_DB_URL) and enforces RBAC at the application layer
-- (rules.md §1.2), which is why no permissive RLS policies are defined
-- here by default. If you also expose Supabase directly to the browser
-- (e.g. via supabase-js) you MUST add matching RLS policies before doing so.
