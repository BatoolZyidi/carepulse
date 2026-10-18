import api from "./api";

export const authService = {
  async login(username, password) {
    const { data } = await api.post("/auth/login/", { username, password });
    localStorage.setItem("carepulse_access_token", data.access);
    localStorage.setItem("carepulse_refresh_token", data.refresh);
    localStorage.setItem("carepulse_user", JSON.stringify(data.user));
    return data;
  },

  logout() {
    localStorage.removeItem("carepulse_access_token");
    localStorage.removeItem("carepulse_refresh_token");
    localStorage.removeItem("carepulse_user");
  },

  getStoredUser() {
    const raw = localStorage.getItem("carepulse_user");
    return raw ? JSON.parse(raw) : null;
  },

  async me() {
    const { data } = await api.get("/auth/me/");
    return data;
  },
};
