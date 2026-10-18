import { motion } from "framer-motion";
import { MessageSquare, PhoneCall } from "lucide-react";

import StatusBadge from "../../components/common/StatusBadge";
import { formatDateTime } from "../../utils/formatDate";

export default function CallHistoryList({ callLogs, loading }) {
  if (loading) return <p className="py-8 text-center text-sm text-white/40">Loading your check-in history…</p>;

  if (!callLogs || callLogs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <PhoneCall size={28} className="text-white/20" />
        <p className="text-sm text-white/40">No check-in calls yet. CALL-E will reach out soon.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {callLogs.map((call, i) => (
        <motion.div
          key={call.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="flex items-center justify-between rounded-xl border border-pulse-line bg-white/[0.03] px-4 py-3.5"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pulse-green-500/10 text-pulse-green-400">
              <MessageSquare size={15} />
            </div>
            <div>
              <p className="text-sm font-medium text-pulse-white">{formatDateTime(call.timestamp)}</p>
              <p className="text-xs text-white/40">{call.summary}</p>
            </div>
          </div>
          <StatusBadge status={call.risk_level} kind="risk" />
        </motion.div>
      ))}
    </div>
  );
}
