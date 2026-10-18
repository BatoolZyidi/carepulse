import api from "./api";

export const doctorService = {
  me: () => api.get("/doctor/me/").then((r) => r.data),
  roster: () => api.get("/doctor/patients/").then((r) => r.data),
  patientDetail: (patientId) => api.get(`/doctor/patients/${patientId}/`).then((r) => r.data),
  callLogs: (patientId) => api.get(`/doctor/patients/${patientId}/call-logs/`).then((r) => r.data),
  alerts: () => api.get("/doctor/alerts/").then((r) => r.data),
  setAlertStatus: (alertId, status) =>
    api.patch(`/doctor/alerts/${alertId}/`, { status }).then((r) => r.data),
  triggerCheckin: (patientId) => api.post(`/scheduler/trigger/${patientId}/`).then((r) => r.data),
  updateCheckupSchedule: (patientId, data) =>
    api.patch(`/doctor/patients/${patientId}/checkup/`, data).then((r) => r.data),
};
