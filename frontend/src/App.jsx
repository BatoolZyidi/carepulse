import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import { AlertProvider } from "./context/AlertContext";
import AdminDashboard from "./features/admin/AdminDashboard";
import LoginPage from "./features/auth/LoginPage";
import DoctorDashboard from "./features/doctor/DoctorDashboard";
import LandingPage from "./features/landing/LandingPage";
import PatientDashboard from "./features/patient/PatientDashboard";
import { ROLE_HOME, ROLES } from "./utils/constants";

function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pulse-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-pulse-green-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={ROLE_HOME[user.role] || "/login"} replace />;

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute role={ROLES.ADMIN}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor"
        element={
          <ProtectedRoute role={ROLES.DOCTOR}>
            <AlertProvider>
              <DoctorDashboard />
            </AlertProvider>
          </ProtectedRoute>
        }
      />

      <Route
        path="/patient"
        element={
          <ProtectedRoute role={ROLES.PATIENT}>
            <PatientDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
