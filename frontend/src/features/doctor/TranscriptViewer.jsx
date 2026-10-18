import { motion } from "framer-motion";
import { FileAudio, MessageSquare } from "lucide-react";

import StatusBadge from "../../components/common/StatusBadge";
import { formatDateTime } from "../../utils/formatDate";
import OdparaMetricsCard from "./OdparaMetricsCard";

export default function TranscriptViewer({ callLogs, loading }) {
  if (loading) {
    return <p className="py-8 text-center text-sm text-white/40">Loading call history…</p>;
  }

  if (!callLogs || callLogs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <MessageSquare size={28} className="text-white/20" />
        <p className="text-sm text-white/40">No CALL-E check-ins recorded yet for this patient.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {callLogs.map((call, i) => (
        <motion.div
          key={call.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="glass-card p-5"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium text-white/70">{formatDateTime(call.timestamp)}</span>
            <StatusBadge status={call.risk_level} kind="risk" />
          </div>

          <OdparaMetricsCard call={call} />

          {call.audio_url && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-pulse-line bg-white/[0.02] px-4 py-3">
              <FileAudio size={16} className="shrink-0 text-pulse-green-400" />
              <audio controls className="h-9 w-full">
                <source src={call.audio_url} />
                Your browser does not support audio playback.
              </audio>
            </div>
          )}

          <details className="mt-4">
            <summary className="cursor-pointer text-xs font-medium text-white/40 hover:text-pulse-green-400">
              View full transcript
            </summary>
            <p className="mt-2 whitespace-pre-wrap rounded-lg border border-pulse-line bg-white/[0.02] p-3 text-sm text-white/60">
              {call.transcript}
            </p>
          </details>
        </motion.div>
      ))}
    </div>
  );
}
