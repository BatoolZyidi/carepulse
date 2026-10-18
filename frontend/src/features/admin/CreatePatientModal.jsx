import { Calendar, FileText, Pill, Plus, Trash2, Utensils } from "lucide-react";
import { useState } from "react";

import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import { adminService } from "../../services/adminService";
import { CARE_TYPES } from "../../utils/constants";

const initial = {
  full_name: "", date_of_birth: "", phone_number: "",
  emergency_contact_name: "", emergency_contact_phone: "",
  primary_diagnosis: "", care_type: "post_op", discharge_date: "",
  doctor_id: "", email: "", username: "", initial_password: "",
  diet_instructions: "", next_checkup_date: "",
};

export default function CreatePatientModal({ open, onClose, onCreated, doctors = [] }) {
  const [form, setForm] = useState(initial);
  const [prescriptions, setPrescriptions] = useState([]);
  const [medicalReports, setMedicalReports] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const addMedication = () => {
    setPrescriptions((prev) => [
      ...prev,
      { medicine_name: "", taking_time: "" },
    ]);
  };

  const updateMedication = (index, field, value) => {
    setPrescriptions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeMedication = (index) => {
    setPrescriptions((prev) => prev.filter((_, i) => i !== index));
  };

  const addReport = () => {
    setMedicalReports((prev) => [
      ...prev,
      {
        title: "",
        report_date: new Date().toISOString().split("T")[0],
        summary: "",
        file_url: "",
      },
    ]);
  };

  const updateReport = (index, field, value) => {
    setMedicalReports((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeReport = (index) => {
    setMedicalReports((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const validPrescriptions = prescriptions.filter((p) => p.medicine_name && p.medicine_name.trim());
      const validReports = medicalReports.filter((r) => r.title && r.title.trim());

      const payload = {
        ...form,
        doctor_id: form.doctor_id || null,
        prescription: validPrescriptions,
        diet_instructions: form.diet_instructions || "",
        medical_reports: validReports,
        next_checkup_date: form.next_checkup_date ? new Date(form.next_checkup_date).toISOString() : null,
      };

      await adminService.createPatient(payload);
      setForm(initial);
      setPrescriptions([]);
      setMedicalReports([]);
      onCreated?.();
    } catch (err) {
      setError(err?.response?.data ? JSON.stringify(err.response.data) : "Failed to create patient.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Provision a Patient Account" maxWidth="max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Full Name" value={form.full_name} onChange={update("full_name")} required />
          <Field label="Date of Birth" type="date" value={form.date_of_birth} onChange={update("date_of_birth")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone Number (CALL-E target)" value={form.phone_number} onChange={update("phone_number")} required />
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/40">Care Track</span>
            <select className="input-field" value={form.care_type} onChange={update("care_type")}>
              {CARE_TYPES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Emergency Contact Name" value={form.emergency_contact_name} onChange={update("emergency_contact_name")} />
          <Field label="Emergency Contact Phone" value={form.emergency_contact_phone} onChange={update("emergency_contact_phone")} />
        </div>
        <Field label="Primary Diagnosis" value={form.primary_diagnosis} onChange={update("primary_diagnosis")} required />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Discharge Date" type="date" value={form.discharge_date} onChange={update("discharge_date")} />
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/40">Assign Doctor</span>
            <select className="input-field" value={form.doctor_id} onChange={update("doctor_id")}>
              <option value="">Unassigned</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
            </select>
          </label>
        </div>
        <Field label="Contact Email" type="email" value={form.email} onChange={update("email")} required />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Username" value={form.username} onChange={update("username")} required />
          <Field label="Initial Password" type="password" value={form.initial_password} onChange={update("initial_password")} required minLength={8} />
        </div>

        {/* Discharge Care Plan Divider */}
        <div className="border-t border-pulse-line pt-4">
          <h4 className="text-sm font-semibold text-pulse-white mb-1">Discharge Care Plan</h4>
          <p className="text-xs text-white/40 mb-3">Add prescribed medications, dedicated dietary guidance, medical reports, and optional checkup or appointment time.</p>

          {/* Next Checkup or Appointment Time */}
          <div className="rounded-xl border border-pulse-line bg-white/[0.02] p-3 mb-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Calendar size={16} className="text-pulse-green-400" />
              <span className="text-xs font-medium text-white/80">Next Check-Up / Appointment Time (Optional)</span>
            </div>
            <p className="text-[11px] text-white/40 mb-2">Can be scheduled now or assigned doctor can set/edit it later.</p>
            <input
              type="datetime-local"
              className="input-field text-xs"
              value={form.next_checkup_date}
              onChange={update("next_checkup_date")}
            />
          </div>

          {/* Prescriptions */}
          <div className="rounded-xl border border-pulse-line bg-white/[0.02] p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Pill size={16} className="text-pulse-green-400" />
                <span className="text-xs font-medium text-white/80">Prescriptions</span>
              </div>
              <button
                type="button"
                onClick={addMedication}
                className="flex items-center gap-1 text-xs font-medium text-pulse-green-400 hover:text-pulse-green-300"
              >
                <Plus size={14} /> Add Medicine
              </button>
            </div>

            {prescriptions.length === 0 ? (
              <p className="py-2 text-center text-xs text-white/30 border border-dashed border-pulse-line rounded-lg">
                No medications added yet. Click &quot;Add Medicine&quot; if prescribing discharge medicines.
              </p>
            ) : (
              <div className="space-y-2">
                {prescriptions.map((med, idx) => (
                  <div key={idx} className="rounded-lg border border-pulse-line/70 bg-white/[0.03] p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-pulse-green-400">Medicine #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeMedication(idx)}
                        className="text-white/40 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        className="input-field text-xs"
                        placeholder="Medicine name (e.g. Amoxicillin 500mg)"
                        value={med.medicine_name || ""}
                        onChange={(e) => updateMedication(idx, "medicine_name", e.target.value)}
                        required
                      />
                      <input
                        type="text"
                        className="input-field text-xs"
                        placeholder="Taking time (e.g. Twice daily after meals)"
                        value={med.taking_time || ""}
                        onChange={(e) => updateMedication(idx, "taking_time", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dietary Guidance (Own Dedicated Section) */}
          <div className="rounded-xl border border-pulse-line bg-white/[0.02] p-3 mb-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Utensils size={16} className="text-pulse-green-400" />
              <span className="text-xs font-medium text-white/80">Dietary Guidance &amp; Nutrition Plan</span>
            </div>
            <p className="text-[11px] text-white/40 mb-2">Nutritional advice, foods to avoid, meal timing, and hydration instructions.</p>
            <textarea
              className="input-field min-h-[70px] text-xs resize-y"
              placeholder="e.g. Low sodium, heart-healthy diet. Hydrate with 2.5L water daily. Avoid oily and spicy foods."
              value={form.diet_instructions}
              onChange={update("diet_instructions")}
            />
          </div>

          {/* Medical Reports (Optional) */}
          <div className="rounded-xl border border-pulse-line bg-white/[0.02] p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-pulse-green-400" />
                <span className="text-xs font-medium text-white/80">Medical Reports (Optional)</span>
              </div>
              <button
                type="button"
                onClick={addReport}
                className="flex items-center gap-1 text-xs font-medium text-pulse-green-400 hover:text-pulse-green-300"
              >
                <Plus size={14} /> Add Report
              </button>
            </div>

            {medicalReports.length === 0 ? (
              <p className="py-2 text-center text-xs text-white/30 border border-dashed border-pulse-line rounded-lg">
                No reports attached. Reports are optional and can be added later.
              </p>
            ) : (
              <div className="space-y-2">
                {medicalReports.map((rep, idx) => (
                  <div key={idx} className="rounded-lg border border-pulse-line/70 bg-white/[0.03] p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-pulse-green-400">Report #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeReport(idx)}
                        className="text-white/40 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        className="input-field text-xs"
                        placeholder="Report title (e.g. Chest X-Ray)"
                        value={rep.title || ""}
                        onChange={(e) => updateReport(idx, "title", e.target.value)}
                        required
                      />
                      <input
                        type="date"
                        className="input-field text-xs"
                        value={rep.report_date || ""}
                        onChange={(e) => updateReport(idx, "report_date", e.target.value)}
                      />
                    </div>
                    <input
                      type="text"
                      className="input-field text-xs"
                      placeholder="Summary findings (e.g. Normal healing, no congestion)"
                      value={rep.summary || ""}
                      onChange={(e) => updateReport(idx, "summary", e.target.value)}
                    />
                    <input
                      type="text"
                      className="input-field text-xs"
                      placeholder="Document reference or URL (optional)"
                      value={rep.file_url || ""}
                      onChange={(e) => updateReport(idx, "file_url", e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Create Patient</Button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/40">{label}</span>
      <input className="input-field" {...props} />
    </label>
  );
}
