import api from "./api";

export const patientService = {
  me: () => api.get("/patient/me/").then((r) => r.data),
  callLogs: () => api.get("/patient/call-logs/").then((r) => r.data),
};
