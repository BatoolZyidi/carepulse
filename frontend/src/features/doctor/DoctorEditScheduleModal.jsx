import { Calendar, Utensils } from "lucide-react";
import { useEffect, useState } from "react";

import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import { doctorService } from "../../services/doctorService";

export default function DoctorEditScheduleModal({ open, onClose, patient, onUpdated }) {
  const [nextCheckupDate, setNextCheckupDate] = useState("");
  const [dietInstructions, setDietInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (patient) {
      if (patient.next_checkup_date) {
        const d = new Date(patient.next_checkup_date);
        const pad = (n) => String(n).padStart(2, "0");
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setNextCheckupDate(formatted);
      } else {
        setNextCheckupDate("");
      }
      setDietInstructions(patient.diet_instructions || "");
      setError("");
    }
  }, [patient]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patient) return;
    setError("");
    setLoading(true);

    try {
      const payload = {
        next_checkup_date: nextCheckupDate ? new Date(nextCheckupDate).toISOString() : null,
        diet_instructions: dietInstructions,
      };

      const updated = await doctorService.updateCheckupSchedule(patient.id, payload);
      onUpdated?.(updated);
      onClose();
    } catch (err) {
      setError(
        err?.response?.data
          ? JSON.stringify(err.response.data)
          : "Failed to update check-up schedule. Please check backend."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!patient) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Update Follow-Up Schedule · ${patient.full_name}`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-pulse-line bg-white/[0.02] p-4">
          <div className="mb-2 flex items-center gap-2">
            <Calendar size={18} className="text-pulse-green-400" />
            <h4 className="text-sm font-semibold text-pulse-white">Next Check-Up Date & Time</h4>
          </div>
          <p className="mb-3 text-xs text-white/50">
            Set the patient&apos;s next scheduled in-clinic or telemedicine evaluation. CALL-E AI will also announce this exact scheduled time during patient recovery check-in calls.
          </p>
          <div className="space-y-2">
            <input
              type="datetime-local"
              className="input-field text-sm"
              value={nextCheckupDate}
              onChange={(e) => setNextCheckupDate(e.target.value)}
            />
            {nextCheckupDate && (
              <button
                type="button"
                onClick={() => setNextCheckupDate("")}
                className="text-xs text-red-400 hover:underline block"
              >
                Clear check-up schedule
              </button>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-pulse-line bg-white/[0.02] p-4">
          <div className="mb-2 flex items-center gap-2">
            <Utensils size={18} className="text-pulse-green-400" />
            <h4 className="text-sm font-semibold text-pulse-white">Dietary & Clinical Instructions</h4>
          </div>
          <p className="mb-2 text-xs text-white/50">
            Update or augment nutritional precautions and dietary instructions for this patient.
          </p>
          <textarea
            className="input-field min-h-[80px] text-xs resize-y"
            placeholder="e.g. Continue low sodium diet. Increase oral fluids to 2.5L daily. Avoid NSAIDs without food."
            value={dietInstructions}
            onChange={(e) => setDietInstructions(e.target.value)}
          />
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
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
