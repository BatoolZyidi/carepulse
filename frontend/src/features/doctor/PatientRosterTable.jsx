import { motion } from "framer-motion";
import { ChevronRight, PhoneCall } from "lucide-react";

import StatusBadge from "../../components/common/StatusBadge";
import { formatDate, formatDateTime } from "../../utils/formatDate";

export default function PatientRosterTable({ patients, onSelect, onTriggerCall, triggeringId }) {
  if (patients.length === 0) {
    return <p className="py-8 text-center text-sm text-white/40">No patients assigned to you yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-pulse-line text-xs uppercase tracking-wide text-white/40">
            <th className="pb-3 pr-4 font-medium">Patient</th>
            <th className="pb-3 pr-4 font-medium">Care Track</th>
            <th className="pb-3 pr-4 font-medium">Discharge Date</th>
            <th className="pb-3 pr-4 font-medium">Next Check-Up</th>
            <th className="pb-3 pr-4 font-medium">Status</th>
            <th className="pb-3 pr-4 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((p, i) => (
            <motion.tr
              key={p.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              className="cursor-pointer border-b border-pulse-line/50 transition-colors hover:bg-white/[0.03]"
              onClick={() => onSelect(p)}
            >
              <td className="py-3.5 pr-4">
                <p className="font-medium text-pulse-white">{p.full_name}</p>
                <p className="text-xs text-white/40">{p.primary_diagnosis}</p>
              </td>
              <td className="py-3.5 pr-4 text-white/60">
                {p.care_type === "post_op" ? "Post-Op Recovery" : "Chronic Disease"}
              </td>
              <td className="py-3.5 pr-4 text-white/60">{formatDate(p.discharge_date)}</td>
              <td className="py-3.5 pr-4">
                {p.next_checkup_date ? (
                  <span className="inline-flex items-center gap-1 text-xs text-pulse-green-400 font-medium bg-pulse-green-500/10 px-2 py-0.5 rounded-md border border-pulse-green-500/20">
                    {formatDateTime(p.next_checkup_date)}
                  </span>
                ) : (
                  <span className="text-white/30 text-xs">Not scheduled</span>
                )}
              </td>
              <td className="py-3.5 pr-4"><StatusBadge status={p.status} /></td>
              <td className="py-3.5 pr-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  {/* CALL NOW BUTTON: Visible but unclickable. To resume, remove disabled/pointer-events-none and restore onTriggerCall */}
                  <button
                    disabled
                    onClick={(e) => e.stopPropagation()}
                    title="Calling is temporarily disabled"
                    className="flex items-center gap-1.5 rounded-lg border border-pulse-line px-2.5 py-1.5 text-xs font-medium text-white/40 cursor-not-allowed opacity-50 pointer-events-none"
                    // onClick={(e) => { e.stopPropagation(); onTriggerCall(p); }}
                    // disabled={triggeringId === p.id}
                  >
                    <PhoneCall size={12} />
                    Call Now
                  </button>
                  <ChevronRight size={16} className="text-white/30" />
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
