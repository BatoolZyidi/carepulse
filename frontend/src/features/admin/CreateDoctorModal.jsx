import { useState } from "react";

import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import { adminService } from "../../services/adminService";

const initial = {
  full_name: "", specialty: "", license_number: "", email: "",
  phone_number: "", username: "", initial_password: "",
};

export default function CreateDoctorModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await adminService.createDoctor(form);
      setForm(initial);
      onCreated?.();
    } catch (err) {
      setError(err?.response?.data ? JSON.stringify(err.response.data) : "Failed to create doctor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Provision a Doctor Account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Full Name" value={form.full_name} onChange={update("full_name")} required />
          <Field label="Specialty" value={form.specialty} onChange={update("specialty")} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="License / NPI No." value={form.license_number} onChange={update("license_number")} />
          <Field label="Phone Number" value={form.phone_number} onChange={update("phone_number")} required />
        </div>
        <Field label="Contact Email" type="email" value={form.email} onChange={update("email")} required />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Username" value={form.username} onChange={update("username")} required />
          <Field label="Initial Password" type="password" value={form.initial_password} onChange={update("initial_password")} required minLength={8} />
        </div>

        {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Create Doctor</Button>
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
