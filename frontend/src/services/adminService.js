import api from "./api";

export const adminService = {
  createDoctor: (payload) => api.post("/admin/create-doctor/", payload).then((r) => r.data),
  createPatient: (payload) => api.post("/admin/create-patient/", payload).then((r) => r.data),
  listDoctors: () => api.get("/admin/doctors/").then((r) => r.data),
  listPatients: () => api.get("/admin/patients/").then((r) => r.data),
  assignPatient: (patientId, doctorId) =>
    api.patch(`/admin/patients/${patientId}/assign/`, { doctor_id: doctorId }).then((r) => r.data),
  assignmentAudit: () => api.get("/admin/assignment-audit/").then((r) => r.data),
  triggerAllCheckins: () => api.post("/scheduler/trigger-all/").then((r) => r.data),
  updateDischargePlan: (patientId, payload) =>
    api.patch(`/admin/patients/${patientId}/discharge-plan/`, payload).then((r) => r.data),
};
