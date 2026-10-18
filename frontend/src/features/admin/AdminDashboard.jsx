import { motion } from "framer-motion";
import { ClipboardList, PhoneCall, Plus, ShieldCheck, Stethoscope, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";

import Button from "../../components/common/Button";
import GlassCard from "../../components/common/GlassCard";
import PageShell from "../../components/layout/PageShell";
import { adminService } from "../../services/adminService";
import { formatDate, formatDateTime } from "../../utils/formatDate";
import AssignDoctorModal from "./AssignDoctorModal";
import CreateDoctorModal from "./CreateDoctorModal";
import CreatePatientModal from "./CreatePatientModal";
import DischargePlanModal from "./DischargePlanModal";

function StatCard({ icon: Icon, label, value, accent = "text-pulse-green-400" }) {
  return (
    <GlassCard className="flex items-center gap-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 ${accent}`}>
        <Icon size={22} strokeWidth={2.25} />
      </div>
      <div>
        <p className="text-2xl font-bold text-pulse-white">{value}</p>
        <p className="text-xs uppercase tracking-wide text-white/40">{label}</p>
      </div>
    </GlassCard>
  );
}

export default function AdminDashboard() {
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDoctor, setShowCreateDoctor] = useState(false);
  const [showCreatePatient, setShowCreatePatient] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [carePlanTarget, setCarePlanTarget] = useState(null);
  const [triggering, setTriggering] = useState(false);
  const [toast, setToast] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [doctorsData, patientsData] = await Promise.all([
        adminService.listDoctors(),
        adminService.listPatients(),
      ]);
      setDoctors(doctorsData);
      setPatients(patientsData);
    } catch {
      // Endpoints unreachable until backend + .env credentials are wired up — dashboard still renders.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTriggerAll = async () => {
    setTriggering(true);
    try {
      await adminService.triggerAllCheckins();
      setToast("Daily check-in batch triggered — CALL-E is now dialing every assigned patient.");
    } catch (err) {
      const msg = err.response?.data?.detail || "Couldn't trigger the batch. Check your CALL-E API credentials in .env.";
      setToast(msg);
    } finally {
      setTriggering(false);
      setTimeout(() => setToast(""), 5000);
    }
  };

  const unassignedCount = patients.filter((p) => !p.doctor).length;

  return (
    <PageShell
      homePath="/admin"
      title="Admin Console"
      subtitle="System governance, provisioning, and doctor-patient mapping."
      actions={
        <>
          <Button variant="secondary" icon={UserPlus} onClick={() => setShowCreateDoctor(true)}>
            New Doctor
          </Button>
          <Button icon={Plus} onClick={() => setShowCreatePatient(true)}>
            New Patient
          </Button>
        </>
      }
    >
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-pulse-green-500/30 bg-pulse-green-500/10 px-4 py-3 text-sm text-pulse-green-300"
        >
          {toast}
        </motion.div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Stethoscope} label="Doctors" value={doctors.length} />
        <StatCard icon={Users} label="Patients" value={patients.length} />
        <StatCard
          icon={ShieldCheck}
          label="Unassigned Patients"
          value={unassignedCount}
          accent={unassignedCount > 0 ? "text-amber-400" : "text-pulse-green-400"}
        />
      </div>

      <GlassCard className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-pulse-white">Trigger daily CALL-E check-ins now</h3>
          <p className="mt-1 text-sm text-white/50">
            Fires the same batch job Celery beat runs automatically — handy for demos.
          </p>
        </div>
        <Button icon={PhoneCall} onClick={handleTriggerAll} loading={triggering} variant="secondary">
          Trigger All Check-Ins
        </Button>
      </GlassCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Doctors */}
        <GlassCard>
          <h3 className="mb-4 font-semibold text-pulse-white">Doctors</h3>
          <div className="space-y-3">
            {loading && <p className="text-sm text-white/40">Loading roster…</p>}
            {!loading && doctors.length === 0 && (
              <p className="text-sm text-white/40">No doctors provisioned yet.</p>
            )}
            {doctors.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-xl border border-pulse-line bg-white/[0.03] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-pulse-white">{doc.full_name}</p>
                  <p className="text-xs text-white/40">{doc.specialty}</p>
                </div>
                <span className="rounded-full bg-pulse-green-500/10 px-2.5 py-1 text-xs font-medium text-pulse-green-400">
                  {doc.patient_count} patient{doc.patient_count === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Patients */}
        <GlassCard>
          <h3 className="mb-4 font-semibold text-pulse-white">Patients</h3>
          <div className="space-y-3">
            {loading && <p className="text-sm text-white/40">Loading roster…</p>}
            {!loading && patients.length === 0 && (
              <p className="text-sm text-white/40">No patients provisioned yet.</p>
            )}
            {patients.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-pulse-line bg-white/[0.03] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-pulse-white">{p.full_name}</p>
                  <p className="text-xs text-white/40">
                    {p.doctor_name ? `Dr. ${p.doctor_name}` : "Unassigned"} · Discharged {formatDate(p.discharge_date)}
                    {p.next_checkup_date ? (
                      <span className="ml-1 text-pulse-green-400">· Next: {formatDateTime(p.next_checkup_date)}</span>
                    ) : null}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCarePlanTarget(p)}
                    className="flex items-center gap-1 rounded-lg border border-pulse-line px-2.5 py-1.5 text-xs font-medium text-white/70 hover:border-pulse-green-500/50 hover:text-pulse-green-400"
                    title="Discharge care plan, prescriptions, and reports"
                  >
                    <ClipboardList size={13} />
                    Care Plan
                  </button>
                  <button
                    onClick={() => setAssignTarget(p)}
                    className="rounded-lg border border-pulse-line px-3 py-1.5 text-xs font-medium text-white/70 hover:border-pulse-green-500/50 hover:text-pulse-green-400"
                  >
                    {p.doctor ? "Reassign" : "Assign"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <CreateDoctorModal
        open={showCreateDoctor}
        onClose={() => setShowCreateDoctor(false)}
        onCreated={() => {
          setShowCreateDoctor(false);
          loadData();
        }}
      />
      <CreatePatientModal
        open={showCreatePatient}
        onClose={() => setShowCreatePatient(false)}
        doctors={doctors}
        onCreated={() => {
          setShowCreatePatient(false);
          loadData();
        }}
      />
      <AssignDoctorModal
        open={!!assignTarget}
        patient={assignTarget}
        doctors={doctors}
        onClose={() => setAssignTarget(null)}
        onAssigned={() => {
          setAssignTarget(null);
          loadData();
        }}
      />
      <DischargePlanModal
        open={!!carePlanTarget}
        patient={carePlanTarget}
        onClose={() => setCarePlanTarget(null)}
        onUpdated={() => {
          loadData();
          setToast("Discharge care plan updated successfully.");
          setTimeout(() => setToast(""), 4000);
        }}
      />
    </PageShell>
  );
}
