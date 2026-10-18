import React, { createContext, useContext, useEffect, useState } from "react";

import { useAuth } from "./AuthContext";
import { ROLES } from "../utils/constants";

const AlertContext = createContext(null);

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8000/ws";

export function AlertProvider({ children }) {
  const { user } = useAuth();
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user || user.role !== ROLES.DOCTOR) return undefined;

    const token = localStorage.getItem("carepulse_access_token");
    const socket = new WebSocket(`${WS_BASE_URL}/alerts/?token=${token}`);

    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);
    socket.onerror = () => setConnected(false);

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        setLiveAlerts((prev) => [payload, ...prev].slice(0, 20));
      } catch {
        // ignore malformed frames
      }
    };

    return () => socket.close();
  }, [user]);

  const dismissAlert = (id) => {
    setLiveAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <AlertContext.Provider value={{ liveAlerts, connected, dismissAlert, setLiveAlerts }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlerts() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlerts must be used within an AlertProvider");
  return ctx;
}
