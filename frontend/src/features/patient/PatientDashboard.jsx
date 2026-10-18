import {
  CalendarCheck,
  CalendarClock,
  Clock,
  ExternalLink,
  FileText,
  HeartPulse,
  PhoneCall,
  Pill,
  ShieldAlert,
  Stethoscope,
  Utensils,
} from "lucide-react";
import { useEffect, useState } from "react";

import GlassCard from "../../components/common/GlassCard";
import PageShell from "../../components/layout/PageShell";
import { patientService } from "../../services/patientService";
import { formatDate, formatDateTime } from "../../utils/formatDate";
import CallHistoryList from "./CallHistoryList";

export default function PatientDashboard() {
  const [profile, setProfile] = useState(null);
  const [callLogs, setCallLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [me, logs] = await Promise.all([patientService.me(), patientService.callLogs()]);
        setProfile(me);
        setCallLogs(logs);
      } catch {
        // renders empty state until backend is connected
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const prescriptions = Array.isArray(profile?.prescription) ? profile.prescription : [];
  const reports = Array.isArray(profile?.medical_reports) ? profile.medical_reports : [];

  return (
    <PageShell
      homePath="/patient"
      title={`Welcome${profile ? `, ${profile.full_name.split(" ")[0]}` : ""}`}
      subtitle="Your recovery check-ins, prescriptions, and follow-up care schedule in one place."
    >
      {/* Metrics & Highlights Grid */}
      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Care Track */}
        <GlassCard className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-pulse-green-500/15 text-pulse-green-400">
            <HeartPulse size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-pulse-white truncate">
              {profile?.care_type === "chronic" ? "Chronic Disease Care" : "Post-Op Recovery"}
            </p>
            <p className="text-xs text-white/40 truncate">{profile?.primary_diagnosis || "—"}</p>
          </div>
        </GlassCard>

        {/* Next Scheduled Check-up */}
        <GlassCard className={`flex items-center gap-4 ${profile?.next_checkup_date ? "border-pulse-green-500/40 bg-pulse-green-500/[0.04]" : ""}`}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-pulse-green-500/20 text-pulse-green-400">
            <CalendarCheck size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-pulse-green-400 font-medium">Next Check-Up</p>
            <p className="text-sm font-semibold text-pulse-white">
              {profile?.next_checkup_date ? formatDateTime(profile.next_checkup_date) : "Pending Schedule"}
            </p>
            <p className="text-[11px] text-white/40 truncate">
              {profile?.doctor_name ? `Dr. ${profile.doctor_name}` : "To be assigned"}
            </p>
          </div>
        </GlassCard>

        {/* Discharge Date */}
        <GlassCard className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 text-pulse-green-400">
            <CalendarClock size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-pulse-white">Discharged</p>
            <p className="text-xs text-white/40">{formatDate(profile?.discharge_date)}</p>
          </div>
        </GlassCard>

        {/* Emergency Contact */}
        <GlassCard className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 text-pulse-green-400">
            <ShieldAlert size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-pulse-white truncate">Emergency Contact</p>
            <p className="text-xs text-white/40 truncate">
              {profile?.emergency_contact_name || "—"} {profile?.emergency_contact_phone ? `· ${profile.emergency_contact_phone}` : ""}
            </p>
          </div>
        </GlassCard>
      </div>

      {/* Assigned Doctor Banner */}
      <GlassCard className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-pulse-green-500/15 text-pulse-green-400">
            <Stethoscope size={22} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-white/40">Your Assigned Doctor</p>
            <p className="mt-0.5 text-sm font-semibold text-pulse-white">
              {profile?.doctor_name ? `Dr. ${profile.doctor_name}` : "Not yet assigned — contact your hospital admin."}
            </p>
          </div>
        </div>

        {profile?.next_checkup_date && (
          <div className="hidden sm:flex items-center gap-2 rounded-lg border border-pulse-line bg-white/[0.02] px-3 py-2 text-xs text-white/70">
            <CalendarCheck size={14} className="text-pulse-green-400" />
            <span>Follow-up scheduled on <strong className="text-pulse-white">{formatDateTime(profile.next_checkup_date)}</strong></span>
          </div>
        )}
      </GlassCard>

      {/* Discharge Care Plan: Prescriptions & Diet */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Prescribed Medications (2 Cols) */}
        <div className="lg:col-span-2">
          <GlassCard className="h-full">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill size={18} className="text-pulse-green-400" />
                <h3 className="font-semibold text-pulse-white">Prescribed Medications</h3>
              </div>
              <span className="rounded-full bg-pulse-green-500/10 px-2.5 py-0.5 text-xs font-medium text-pulse-green-400">
                {prescriptions.length} medication{prescriptions.length === 1 ? "" : "s"}
              </span>
            </div>

            {prescriptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Pill size={26} className="mb-2 text-white/20" />
                <p className="text-sm text-white/40">No discharge medications recorded.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {prescriptions.map((med, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-pulse-line bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-pulse-green-500/15 text-xs font-bold text-pulse-green-400">
                        {idx + 1}
                      </span>
                      <h4 className="font-semibold text-pulse-white text-sm">
                        {med.medicine_name}
                      </h4>
                    </div>
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs text-pulse-green-300">
                      <Clock size={13} />
                      <span><strong>Timing:</strong> {med.taking_time || "As directed"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Dietary Guidance & Nutrition Plan (1 Col) */}
        <div>
          <GlassCard className="h-full border-amber-400/10 bg-gradient-to-b from-amber-500/[0.03] to-transparent">
            <div className="mb-1 flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/15 text-amber-400">
                <Utensils size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-pulse-white">Dietary Guidance</h3>
                <p className="text-[11px] text-white/40">Nutrition & recovery diet plan from your care team</p>
              </div>
            </div>

            {profile?.diet_instructions ? (
              <div className="mt-4 rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-4">
                <p className="text-sm leading-relaxed text-white/85 whitespace-pre-wrap">
                  {profile.diet_instructions}
                </p>
              </div>
            ) : (
              <div className="mt-4 flex flex-col items-center justify-center py-8 text-center">
                <Utensils size={26} className="mb-2 text-white/15" />
                <p className="text-sm text-white/40">Standard post-discharge diet.</p>
                <p className="mt-1 text-xs text-white/30">Follow general healthy meal guidelines.</p>
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Medical Reports & Diagnostics */}
      <GlassCard className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-pulse-green-400" />
            <h3 className="font-semibold text-pulse-white">Your Medical Reports &amp; Lab Results</h3>
          </div>
          <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-medium text-white/60">
            {reports.length} report{reports.length === 1 ? "" : "s"}
          </span>
        </div>

        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText size={26} className="mb-2 text-white/20" />
            <p className="text-sm text-white/40">No medical reports filed at discharge.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {reports.map((rep, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-pulse-line bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-pulse-white text-sm">{rep.title}</h4>
                    <p className="text-xs text-white/40 mt-0.5">Date: {formatDate(rep.report_date)}</p>
                  </div>
                  {rep.file_url && (
                    <a
                      href={rep.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-md border border-pulse-line px-2.5 py-1 text-xs text-pulse-green-400 hover:border-pulse-green-500"
                    >
                      <span>View</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                {rep.summary && (
                  <p className="mt-2 text-xs leading-relaxed text-white/70 border-t border-pulse-line/50 pt-2">
                    {rep.summary}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* CALL-E Check-In History */}
      <GlassCard>
        <div className="mb-4 flex items-center gap-2">
          <PhoneCall size={16} className="text-pulse-green-400" />
          <h3 className="font-semibold text-pulse-white">Your Recovery Check-In History</h3>
        </div>
        <CallHistoryList callLogs={callLogs} loading={loading} />
      </GlassCard>
    </PageShell>
  );
}
