import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Quote, X } from "lucide-react";

export default function EmergencyBanner({ alerts, onAcknowledge, onResolve, onDismiss }) {
  return (
    <div className="mb-6 space-y-3">
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.25 }}
            className="relative overflow-hidden rounded-2xl border border-red-500/40 bg-red-950/40 p-5 shadow-[0_0_40px_-10px_rgba(239,68,68,0.45)]"
          >
            <div className="absolute inset-0 animate-pulse-slow bg-red-500/5" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-400">
                  <AlertTriangle size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="font-semibold text-red-300">
                    Emergency Alert — {alert.patient_name || "Patient"}
                  </p>
                  <p className="mt-1 text-sm text-white/70">{alert.call_summary}</p>
                  {alert.red_flag_quote && (
                    <p className="mt-2 flex items-start gap-1.5 text-sm italic text-red-200/90">
                      <Quote size={13} className="mt-0.5 shrink-0" />
                      "{alert.red_flag_quote}"
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => onDismiss?.(alert.id)}
                className="shrink-0 rounded-lg p-1 text-white/40 hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <div className="relative mt-4 flex gap-2">
              <button
                onClick={() => onAcknowledge?.(alert)}
                className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
              >
                Acknowledge
              </button>
              <button
                onClick={() => onResolve?.(alert)}
                className="flex items-center gap-1 rounded-lg border border-pulse-green-500/30 bg-pulse-green-500/10 px-3 py-1.5 text-xs font-semibold text-pulse-green-400 hover:bg-pulse-green-500/20"
              >
                <CheckCircle2 size={13} />
                Resolve
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
