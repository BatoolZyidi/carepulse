import { Droplets, Pill, Thermometer } from "lucide-react";

import StatusBadge from "../../components/common/StatusBadge";

function Metric({ icon: Icon, label, value, warn }) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${warn ? "border-red-500/30 bg-red-500/5" : "border-pulse-line bg-white/[0.03]"}`}>
      <div className="flex items-center gap-2 text-xs text-white/40">
        <Icon size={13} />
        {label}
      </div>
      <p className={`mt-1 text-lg font-semibold ${warn ? "text-red-400" : "text-pulse-white"}`}>{value}</p>
    </div>
  );
}

export default function OdparaMetricsCard({ call }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-white/40">Risk Assessment</span>
        <StatusBadge status={call.risk_level} kind="risk" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Metric icon={Droplets} label="Pain Level" value={call.pain_level != null ? `${call.pain_level}/10` : "—"} warn={call.pain_level >= 8} />
        <Metric icon={Thermometer} label="Temp Reading" value={call.temp_reading ? `${call.temp_reading}°F` : "—"} warn={call.temp_reading >= 101} />
        <Metric icon={Pill} label="Meds Taken" value={call.meds_taken ? "Yes" : "No"} warn={!call.meds_taken} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        {[
          ["Onset", call.onset], ["Duration", call.duration], ["Progression", call.progression],
          ["Aggravating", call.aggravating_factors], ["Relieving", call.relieving_factors],
          ["Associated Symptoms", call.associated_symptoms],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-pulse-line bg-white/[0.02] px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-white/35">{label}</p>
            <p className="mt-0.5 text-white/75">{value || "—"}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-pulse-line bg-white/[0.02] px-3 py-2.5">
        <p className="text-[10px] uppercase tracking-wide text-white/35">Clinical Summary</p>
        <p className="mt-1 text-sm text-white/75">{call.summary}</p>
      </div>

      {call.red_flag_quote && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-red-400/70">Flagged Quote</p>
          <p className="mt-1 text-sm italic text-red-300">"{call.red_flag_quote}"</p>
        </div>
      )}
    </div>
  );
}
