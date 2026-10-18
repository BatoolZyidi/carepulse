import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Calendar, FileText, PhoneCall, Users } from "lucide-react";
import { useEffect, useState } from "react";

import EmergencyBanner from "../../components/alerts/EmergencyBanner";
import Button from "../../components/common/Button";
import GlassCard from "../../components/common/GlassCard";
import PageShell from "../../components/layout/PageShell";
import { useAlerts } from "../../context/AlertContext";
import { doctorService } from "../../services/doctorService";
import DoctorEditScheduleModal from "./DoctorEditScheduleModal";
import PatientCarePlanCard from "./PatientCarePlanCard";
import PatientRosterTable from "./PatientRosterTable";
import TranscriptViewer from "./TranscriptViewer";

export default function DoctorDashboard() {
  const { liveAlerts, dismissAlert } = useAlerts();
  const [patients, setPatients] = useState([]);
  const [persistedAlerts, setPersistedAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [callLogs, setCallLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [triggeringId, setTriggeringId] = useState(null);
  const [callToast, setCallToast] = useState("");
  const [activeTab, setActiveTab] = useState("care_plan");
  const [showEditSchedule, setShowEditSchedule] = useState(false);

  const loadRoster = async () => {
    setLoading(true);
    try {
      const [roster, alerts] = await Promise.all([doctorService.roster(), doctorService.alerts()]);
      setPatients(roster);
      setPersistedAlerts(alerts.filter((a) => a.status !== "RESOLVED"));
    } catch {
      // Renders empty state until backend + Supabase are connected.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoster();
  }, []);

  const openPatient = async (patient) => {
    setSelected(patient);
    setActiveTab("care_plan");
    setLogsLoading(true);
    try {
      const logs = await doctorService.callLogs(patient.id);
      setCallLogs(logs);
    } catch {
      setCallLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleTriggerCall = async (patient) => {
    setTriggeringId(patient.id);
    try {
      const result = await doctorService.triggerCheckin(patient.id);
      setCallToast(result.detail || `Call initiated for ${patient.full_name}.`);
      setTimeout(() => setCallToast(""), 6000);
    } catch (err) {
      const msg = err.response?.data?.detail || `Could not initiate call for ${patient.full_name}. Check backend.`;
      setCallToast(msg);
      setTimeout(() => setCallToast(""), 6000);
    } finally {
      setTimeout(() => setTriggeringId(null), 1500);
    }
  };

  const handleAcknowledge = async (alert) => {
    try {
      await doctorService.setAlertStatus(alert.id, "ACKNOWLEDGED");
    } finally {
      loadRoster();
    }
  };

  const handleResolve = async (alert) => {
    try {
      await doctorService.setAlertStatus(alert.id, "RESOLVED");
    } finally {
      dismissAlert?.(alert.id);
      loadRoster();
    }
  };

  const combinedAlerts = [...liveAlerts, ...persistedAlerts.filter((p) => !liveAlerts.some((l) => l.id === p.id))];

  return (
    <PageShell
      homePath="/doctor"
      title={selected ? selected.full_name : "Doctor Dashboard"}
      subtitle={
        selected
          ? `${selected.primary_diagnosis} · ${selected.care_type === "post_op" ? "Post-Op Recovery" : "Chronic Disease"}`
          : "Your assigned patients, clinical history, and live triage alerts."
      }
      actions={
        selected ? (
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={ArrowLeft} onClick={() => setSelected(null)}>
              Back to Roster
            </Button>
            {/* CALL NOW BUTTON: Visible but unclickable. To resume, remove disabled/pointer-events-none and uncomment onClick/loading */}
            <Button
              icon={PhoneCall}
              disabled
              title="Calling is temporarily disabled"
              className="opacity-50 cursor-not-allowed pointer-events-none"
              // onClick={() => handleTriggerCall(selected)}
              // loading={triggeringId === selected.id}
            >
              Call Now
            </Button>
          </div>
        ) : (
          <Button variant="secondary" icon={PhoneCall} onClick={() => {}}>
            {patients.length} Assigned
          </Button>
        )
      }
    >
      {callToast && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-pulse-green-500/30 bg-pulse-green-500/10 px-4 py-3 text-sm text-pulse-green-300"
        >
          📞 {callToast}
        </motion.div>
      )}
      {!selected && combinedAlerts.length > 0 && (
        <EmergencyBanner
          alerts={combinedAlerts}
          onAcknowledge={handleAcknowledge}
          onResolve={handleResolve}
          onDismiss={dismissAlert}
        />
      )}

      <AnimatePresence mode="wait">
        {selected ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className="space-y-6"
          >
            {/* View Switcher Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-pulse-line pb-3">
              <button
                type="button"
                onClick={() => setActiveTab("care_plan")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === "care_plan"
                    ? "bg-pulse-green-500/15 text-pulse-green-400 border border-pulse-green-500/30"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <FileText size={16} />
                Discharge Care Plan &amp; Schedule
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("transcripts")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === "transcripts"
                    ? "bg-pulse-green-500/15 text-pulse-green-400 border border-pulse-green-500/30"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <PhoneCall size={16} />
                CALL-E Check-In History ({callLogs.length})
              </button>
            </div>

            {activeTab === "care_plan" ? (
              <PatientCarePlanCard
                patient={selected}
                onEditSchedule={() => setShowEditSchedule(true)}
              />
            ) : (
              <TranscriptViewer callLogs={callLogs} loading={logsLoading} />
            )}
          </motion.div>
        ) : (
          <motion.div key="roster" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GlassCard>
              <div className="mb-4 flex items-center gap-2">
                <Users size={16} className="text-pulse-green-400" />
                <h3 className="font-semibold text-pulse-white">Your Patient Roster</h3>
              </div>
              {loading ? (
                <p className="py-8 text-center text-sm text-white/40">Loading roster…</p>
              ) : (
                <PatientRosterTable
                  patients={patients}
                  onSelect={openPatient}
                  onTriggerCall={handleTriggerCall}
                  triggeringId={triggeringId}
                />
              )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <DoctorEditScheduleModal
        open={showEditSchedule}
        patient={selected}
        onClose={() => setShowEditSchedule(false)}
        onUpdated={(updatedPatient) => {
          setSelected(updatedPatient);
          loadRoster();
          setCallToast(`Check-up schedule updated for ${updatedPatient.full_name}.`);
          setTimeout(() => setCallToast(""), 5000);
        }}
      />
    </PageShell>
  );
}
