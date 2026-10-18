import { motion } from "framer-motion";
import { Activity, LogOut } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

export default function Navbar({ homePath = "/" }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-pulse-line/60 bg-pulse-black/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to={homePath} className="flex items-center gap-2.5">
          <motion.div
            initial={{ rotate: -8 }}
            animate={{ rotate: 0 }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-pulse-green-500/15 border border-pulse-green-500/30"
          >
            <Activity size={18} className="text-pulse-green-400" strokeWidth={2.5} />
          </motion.div>
          <span className="font-display text-lg font-bold tracking-tight text-pulse-white">
            Care<span className="text-pulse-green-400">Pulse</span>
          </span>
        </Link>

        {user && (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-sm font-medium text-pulse-white">{user.username}</span>
              <span className="text-xs uppercase tracking-wide text-pulse-green-400">{user.role}</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg border border-pulse-line px-3 py-2 text-sm text-white/70 transition-colors hover:border-red-500/40 hover:text-red-400"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
