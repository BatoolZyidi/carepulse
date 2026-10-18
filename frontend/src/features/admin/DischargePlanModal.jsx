import { Calendar, FileText, Pill, Plus, Trash2, Utensils } from "lucide-react";
import { useEffect, useState } from "react";

import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import { adminService } from "../../services/adminService";

export default function DischargePlanModal({ open, onClose, patient, onUpdated }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [dietInstructions, setDietInstructions] = useState("");
  const [medicalReports, setMedicalReports] = useState([]);
  const [nextCheckupDate, setNextCheckupDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (patient) {
      setPrescriptions(Array.isArray(patient.prescription) ? patient.prescription : []);
      setDietInstructions(patient.diet_instructions || "");
      setMedicalReports(Array.isArray(patient.medical_reports) ? patient.medical_reports : []);
      if (patient.next_checkup_date) {
        // Convert to YYYY-MM-DDTHH:MM for datetime-local input
        const d = new Date(patient.next_checkup_date);
        const pad = (n) => String(n).padStart(2, "0");
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setNextCheckupDate(formatted);
      } else {
        setNextCheckupDate("");
      }
    }
  }, [patient]);

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
    if (!patient) return;
    setError("");
    setLoading(true);

    try {
      // Filter out any blank medicine rows where medicine_name is empty
      const validPrescriptions = prescriptions.filter((p) => p.medicine_name && p.medicine_name.trim());
      const validReports = medicalReports.filter((r) => r.title && r.title.trim());

      const payload = {
        prescription: validPrescriptions,
        diet_instructions: dietInstructions,
        medical_reports: validReports,
        next_checkup_date: nextCheckupDate ? new Date(nextCheckupDate).toISOString() : null,
      };

      await adminService.updateDischargePlan(patient.id, payload);
      onUpdated?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data ? JSON.stringify(err.response.data) : "Failed to update discharge plan.");
    } finally {
      setLoading(false);
    }
  };

  if (!patient) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Discharge Care Plan · ${patient.full_name}`}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Next Checkup Date (Optional) */}
        <div className="rounded-xl border border-pulse-line bg-white/[0.02] p-4">
          <div className="mb-2 flex items-center gap-2">
            <Calendar size={18} className="text-pulse-green-400" />
            <h4 className="text-sm font-semibold text-pulse-white">Next Check-Up Schedule (Optional)</h4>
          </div>
          <p className="mb-3 text-xs text-white/50">
            Set an initial check-up date & time. The assigned doctor can review and adjust this schedule anytime from their dashboard.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <input
                type="datetime-local"
                className="input-field"
                value={nextCheckupDate}
                onChange={(e) => setNextCheckupDate(e.target.value)}
              />
            </div>
            {nextCheckupDate && (
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setNextCheckupDate("")}
                  className="text-xs text-red-400 hover:underline"
                >
                  Clear scheduled date
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Prescriptions */}
        <div className="rounded-xl border border-pulse-line bg-white/[0.02] p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pill size={18} className="text-pulse-green-400" />
              <h4 className="text-sm font-semibold text-pulse-white">Prescriptions</h4>
            </div>
            <button
              type="button"
              onClick={addMedication}
              className="flex items-center gap-1 text-xs font-medium text-pulse-green-400 hover:text-pulse-green-300"
            >
              <Plus size={14} /> Add Medicine
            </button>
          </div>
          <p className="mb-3 text-xs text-white/50">
            Medicine name and taking schedule for each prescribed discharge medication.
          </p>

          {prescriptions.length === 0 ? (
            <p className="py-3 text-center text-xs text-white/40 border border-dashed border-pulse-line rounded-lg">
              No medications added yet. Click &quot;Add Medicine&quot; to prescribe discharge medications.
            </p>
          ) : (
            <div className="space-y-3">
              {prescriptions.map((med, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-pulse-line/70 bg-white/[0.03] p-3 space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-pulse-green-400">
                      Medicine #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeMedication(idx)}
                      className="text-white/40 hover:text-red-400 transition-colors"
                      title="Remove medicine"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      className="input-field text-xs"
                      placeholder="Medicine name (e.g., Augmentin 625mg)"
                      value={med.medicine_name || ""}
                      onChange={(e) => updateMedication(idx, "medicine_name", e.target.value)}
                      required
                    />
                    <input
                      type="text"
                      className="input-field text-xs"
                      placeholder="Taking time (e.g., Twice daily after meals)"
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

        {/* General Diet Instructions */}
        <div className="rounded-xl border border-pulse-line bg-white/[0.02] p-4">
          <div className="mb-2 flex items-center gap-2">
            <Utensils size={18} className="text-pulse-green-400" />
            <h4 className="text-sm font-semibold text-pulse-white">General Dietary Guidelines</h4>
          </div>
          <p className="mb-2 text-xs text-white/50">
            Overall nutrition instructions for the patient’s recovery period or chronic care management.
          </p>
          <textarea
            className="input-field min-h-[72px] text-xs resize-y"
            placeholder="e.g., Low sodium, heart-healthy diet. Maintain 2.5L daily hydration. Avoid high-sugar and spicy foods."
            value={dietInstructions}
            onChange={(e) => setDietInstructions(e.target.value)}
          />
        </div>

        {/* Medical Reports (Optional) */}
        <div className="rounded-xl border border-pulse-line bg-white/[0.02] p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-pulse-green-400" />
              <h4 className="text-sm font-semibold text-pulse-white">Medical Reports (Optional)</h4>
            </div>
            <button
              type="button"
              onClick={addReport}
              className="flex items-center gap-1 text-xs font-medium text-pulse-green-400 hover:text-pulse-green-300"
            >
              <Plus size={14} /> Add Report
            </button>
          </div>
          <p className="mb-3 text-xs text-white/50">
            Attach discharge summaries, lab reports, or diagnostic results (optional).
          </p>

          {medicalReports.length === 0 ? (
            <p className="py-3 text-center text-xs text-white/40 border border-dashed border-pulse-line rounded-lg">
              No medical reports attached. Click &quot;Add Report&quot; if reports are available.
            </p>
          ) : (
            <div className="space-y-3">
              {medicalReports.map((rep, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-pulse-line/70 bg-white/[0.03] p-3 space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-pulse-green-400">
                      Report #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeReport(idx)}
                      className="text-white/40 hover:text-red-400 transition-colors"
                      title="Remove report"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      className="input-field text-xs"
                      placeholder="Report title (e.g., Post-Op Chest X-Ray)"
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
                    placeholder="Findings / Clinical summary (e.g., Clear lungs, surgical site healing normally)"
                    value={rep.summary || ""}
                    onChange={(e) => updateReport(idx, "summary", e.target.value)}
                  />
                  <input
                    type="text"
                    className="input-field text-xs"
                    placeholder="Document reference or URL (optional, e.g., /reports/discharge_summary.pdf)"
                    value={rep.file_url || ""}
                    onChange={(e) => updateReport(idx, "file_url", e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Save Discharge Plan
          </Button>
        </div>
      </form>
    </Modal>
  );
}
