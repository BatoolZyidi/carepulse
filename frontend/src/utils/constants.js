export const ROLES = {
  ADMIN: "admin",
  DOCTOR: "doctor",
  PATIENT: "patient",
};

export const ROLE_HOME = {
  [ROLES.ADMIN]: "/admin",
  [ROLES.DOCTOR]: "/doctor",
  [ROLES.PATIENT]: "/patient",
};

export const RISK_LEVELS = {
  LOW: { label: "Low", color: "text-pulse-green-400", bg: "bg-pulse-green-500/15", border: "border-pulse-green-500/30" },
  MED: { label: "Needs Review", color: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/30" },
  HIGH: { label: "Emergency", color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/30" },
};

export const PATIENT_STATUS = {
  Stable: { color: "text-pulse-green-400", bg: "bg-pulse-green-500/15", border: "border-pulse-green-500/30" },
  "Needs Review": { color: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/30" },
  "Emergency Alert": { color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/30" },
};

export const CARE_TYPES = [
  { value: "post_op", label: "Post-Op Recovery" },
  { value: "chronic", label: "Chronic Disease" },
];

export const ALERT_STATUS = {
  UNREAD: "Unread",
  ACKNOWLEDGED: "Acknowledged",
  RESOLVED: "Resolved",
};
