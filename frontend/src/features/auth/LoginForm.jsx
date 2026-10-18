import { motion } from "framer-motion";
import { AlertCircle, Lock, LogIn, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";
import { ROLE_HOME } from "../../utils/constants";

export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(username, password);
      navigate(ROLE_HOME[user.role] || "/");
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Invalid credentials. Accounts are provisioned by your Admin — check with them if you're locked out."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onSubmit={handleSubmit}
      className="glass-card w-full max-w-md p-8"
    >
      <div className="mb-7 text-center">
        <h2 className="text-2xl font-bold text-pulse-white">Welcome back</h2>
        <p className="mt-1.5 text-sm text-white/50">
          Sign in with the credentials your Admin provisioned for you.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/40">
            Username or Email
          </label>
          <div className="relative">
            <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              className="input-field pl-10"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="jane.doctor"
              autoComplete="username"
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/40">
            Password
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              className="input-field pl-10"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-sm text-red-300"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      <Button type="submit" icon={LogIn} loading={loading} className="mt-6 w-full">
        Sign In
      </Button>

      <p className="mt-6 text-center text-xs text-white/30">
        There is no public sign-up — all Doctor and Patient accounts are created by a system Admin.
      </p>
    </motion.form>
  );
}
