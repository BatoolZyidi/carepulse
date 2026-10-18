import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";

import { PATIENT_STATUS, RISK_LEVELS } from "../../utils/constants";

const ICONS = {
  Stable: CheckCircle2,
  "Needs Review": Clock3,
  "Emergency Alert": AlertTriangle,
  LOW: CheckCircle2,
  MED: Clock3,
  HIGH: AlertTriangle,
};

export default function StatusBadge({ status, kind = "patient" }) {
  const map = kind === "risk" ? RISK_LEVELS : PATIENT_STATUS;
  const config = map[status] || { color: "text-white/60", bg: "bg-white/5", border: "border-white/10" };
  const Icon = ICONS[status] || CheckCircle2;

  return (
    <span className={`badge border ${config.bg} ${config.color} ${config.border}`}>
      <Icon size={13} strokeWidth={2.5} />
      {kind === "risk" ? config.label || status : status}
    </span>
  );
}
