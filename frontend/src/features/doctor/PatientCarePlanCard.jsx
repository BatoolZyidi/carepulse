import { Calendar, CalendarPlus, Clock, ExternalLink, FileText, Pill, Utensils } from "lucide-react";
import Button from "../../components/common/Button";
import GlassCard from "../../components/common/GlassCard";
import { formatDate, formatDateTime } from "../../utils/formatDate";

export default function PatientCarePlanCard({ patient, onEditSchedule }) {
  if (!patient) return null;

  const prescriptions = Array.isArray(patient.prescription) ? patient.prescription : [];
  const reports = Array.isArray(patient.medical_reports) ? patient.medical_reports : [];

  return (
    <div className="space-y-6">
      {/* Top Banner: Next Scheduled Check-up & Edit Button */}
      <GlassCard className="border-pulse-green-500/20 bg-gradient-to-r from-pulse-green-500/10 via-transparent to-transparent">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pulse-green-500/20 text-pulse-green-400">
              <Calendar size={22} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-white/50">Next Scheduled Check-Up</p>
              {patient.next_checkup_date ? (
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-lg font-bold text-pulse-white">
                    {formatDateTime(patient.next_checkup_date)}
                  </span>
                  <span className="rounded-full bg-pulse-green-500/15 px-2.5 py-0.5 text-xs font-medium text-pulse-green-400">
                    Confirmed
                  </span>
                </div>
              ) : (
                <p className="mt-1 text-sm font-medium text-white/40">
                  No follow-up check-up scheduled yet.
                </p>
              )}
              <p className="mt-0.5 text-xs text-white/40">
                Discharged on {formatDate(patient.discharge_date)} · Assigned to Dr. {patient.doctor_name || "You"}
              </p>
            </div>
          </div>

          <Button icon={CalendarPlus} variant="secondary" onClick={onEditSchedule}>
            {patient.next_checkup_date ? "Edit Check-Up Schedule" : "Schedule Check-Up"}
          </Button>
        </div>
      </GlassCard>

      {/* Grid: Prescriptions & Dietary Guidelines */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Prescriptions (2 Cols) */}
        <div className="lg:col-span-2">
          <GlassCard className="h-full">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill size={18} className="text-pulse-green-400" />
                <h3 className="font-semibold text-pulse-white">Discharge Prescriptions</h3>
              </div>
              <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-medium text-white/60">
                {prescriptions.length} medication{prescriptions.length === 1 ? "" : "s"}
              </span>
            </div>

            {prescriptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Pill size={24} className="mb-2 text-white/20" />
                <p className="text-sm text-white/40">No discharge medications recorded.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {prescriptions.map((med, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-pulse-line bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-pulse-green-500/15 text-xs font-bold text-pulse-green-400">
                          {idx + 1}
                        </span>
                        <h4 className="font-semibold text-pulse-white text-sm">
                          {med.medicine_name}
                        </h4>
                      </div>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs text-white/70">
                      <div className="flex items-center gap-1.5 text-pulse-green-300">
                        <Clock size={13} />
                        <span>{med.taking_time || "As directed"}</span>
                      </div>


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
                <p className="text-[11px] text-white/40">Nutrition & recovery diet plan</p>
              </div>
            </div>

            {patient.diet_instructions ? (
              <div className="mt-4 rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-4">
                <p className="text-sm leading-relaxed text-white/85 whitespace-pre-wrap">
                  {patient.diet_instructions}
                </p>
              </div>
            ) : (
              <div className="mt-4 flex flex-col items-center justify-center py-8 text-center">
                <Utensils size={24} className="mb-2 text-white/15" />
                <p className="text-sm text-white/40">Standard post-discharge diet.</p>
                <p className="mt-1 text-xs text-white/30">No specific dietary guidance documented.</p>
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Medical Reports */}
      <GlassCard>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-pulse-green-400" />
            <h3 className="font-semibold text-pulse-white">Medical Reports & Diagnostics</h3>
          </div>
          <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-medium text-white/60">
            {reports.length} report{reports.length === 1 ? "" : "s"}
          </span>
        </div>

        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText size={24} className="mb-2 text-white/20" />
            <p className="text-sm text-white/40">No medical reports filed at discharge.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {reports.map((rep, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-pulse-line bg-white/[0.02] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-pulse-white text-sm">{rep.title}</h4>
                    <p className="text-xs text-white/40 mt-0.5">{formatDate(rep.report_date)}</p>
                  </div>
                  {rep.file_url && (
                    <a
                      href={rep.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-md border border-pulse-line px-2 py-1 text-xs text-pulse-green-400 hover:border-pulse-green-500"
                    >
                      <span>View</span>
                      <ExternalLink size={11} />
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
    </div>
  );
}
