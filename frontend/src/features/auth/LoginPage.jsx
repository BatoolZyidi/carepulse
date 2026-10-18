import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { Link } from "react-router-dom";

import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-pulse-black px-4">
      <div className="pointer-events-none absolute inset-0 bg-grid-glow" />
      <motion.div
        className="pointer-events-none absolute -top-32 left-1/3 h-96 w-96 rounded-full bg-pulse-green-500/10 blur-3xl"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 flex flex-col items-center">
        <Link to="/" className="mb-8 flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pulse-green-500/15 border border-pulse-green-500/30">
            <Activity size={20} className="text-pulse-green-400" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-pulse-white">
            Care<span className="text-pulse-green-400">Pulse</span>
          </span>
        </Link>
        <LoginForm />
      </div>
    </div>
  );
}
