import { useEffect, useState } from "react";

import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import { adminService } from "../../services/adminService";

export default function AssignDoctorModal({ open, patient, doctors, onClose, onAssigned }) {
  const [doctorId, setDoctorId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDoctorId(patient?.doctor || "");
  }, [patient]);

  if (!patient) return null;

  const handleAssign = async () => {
    setLoading(true);
    try {
      await adminService.assignPatient(patient.id, doctorId || null);
      onAssigned?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Assign — ${patient.full_name}`}>
      <div className="space-y-4">
        <p className="text-sm text-white/50">
          Reassigning creates an audit entry recording who moved this patient and when.
        </p>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/40">Doctor</span>
          <select className="input-field" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
            <option value="">Unassigned</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>{d.full_name} — {d.specialty}</option>
            ))}
          </select>
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAssign} loading={loading}>Save Assignment</Button>
        </div>
      </div>
    </Modal>
  );
}
