import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Brain,
  Mic,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { Link } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};



const STEPS = [
  {
    n: "01",
    title: "Admin provisions accounts",
    body: "A hospital Admin creates Doctor and Patient profiles, assigning each patient to their clinician.",
  },
  {
    n: "02",
    title: "CALL-E calls the patient",
    body: "On a daily schedule, CALL-E places an outbound call built from a prompt unique to that patient's diagnosis and recovery trend.",
  },
  {
    n: "03",
    title: "Gemma extracts ODPARA data",
    body: "The transcript is parsed into structured clinical metrics and a calibrated risk score, with a defensive HIGH-risk fallback if parsing ever fails.",
  },
  {
    n: "04",
    title: "Doctors see it instantly",
    body: "Stable patients stay quiet on the roster. Anything concerning fires a live alert straight to the assigned doctor's screen.",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-pulse-black text-pulse-white">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 bg-grid-glow" />
      <motion.div
        className="pointer-events-none absolute -top-40 left-1/4 h-[32rem] w-[32rem] rounded-full bg-pulse-green-500/10 blur-3xl"
        animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute top-1/3 -right-40 h-[28rem] w-[28rem] rounded-full bg-pulse-green-700/10 blur-3xl"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Nav */}
      <header className="relative z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pulse-green-500/15 border border-pulse-green-500/30">
              <Activity size={18} className="text-pulse-green-400" strokeWidth={2.5} />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">
              Care<span className="text-pulse-green-400">Pulse</span>
            </span>
          </div>
          <Link
            to="/login"
            className="rounded-xl border border-pulse-line bg-white/5 px-5 py-2.5 text-sm font-semibold text-pulse-white transition-all hover:border-pulse-green-500/50 hover:bg-white/10"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pt-16 pb-24 text-center">
        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="flex flex-col items-center"
        >
          <motion.span
            variants={fadeUp}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-pulse-green-500/30 bg-pulse-green-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-pulse-green-400"
          >
            <Sparkles size={13} />
            Built on the CALL-E Voice Platform
          </motion.span>

          <motion.h1
            variants={fadeUp}
            className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl"
          >
            Post-discharge care that
            <br />
            <span className="bg-gradient-to-r from-pulse-green-300 via-pulse-green-400 to-pulse-green-glow bg-clip-text text-transparent">
              never misses a red flag.
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-2xl text-lg text-white/60">
            CarePulse calls every discharged patient, listens with a real clinical framework,
            and wakes up the right doctor the moment something's wrong — autonomously,
            every single day.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/login"
              className="btn-primary px-7 py-3.5 text-base"
            >
              Sign In to Dashboard
              <ArrowRight size={18} />
            </Link>
            <a
              href="#how-it-works"
              className="btn-secondary px-7 py-3.5 text-base"
            >
              See How It Works
            </a>
          </motion.div>
        </motion.div>

        {/* Floating call & AI visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="relative mx-auto mt-20 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2"
        >
          {/* CALL-E Card */}
          <div className="glass-panel relative flex items-center justify-between gap-4 p-5 shadow-glow">
            <div className="flex items-center gap-3.5">
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pulse-green-500/20 text-pulse-green-400"
              >
                <Mic size={19} />
              </motion.div>
              <div className="text-left">
                <p className="text-sm font-semibold text-pulse-white">CALL-E — Live check-in</p>
                <p className="text-xs text-white/40">"How's your pain today, on a scale of 0 to 10?"</p>
              </div>
            </div>
            <div className="hidden items-end gap-1 sm:flex">
              {[6, 14, 22, 12, 26, 10, 18].map((h, i) => (
                <motion.span
                  key={i}
                  className="w-1.5 rounded-full bg-pulse-green-400/70"
                  animate={{ height: [h, h * 0.4, h] }}
                  transition={{ duration: 1 + i * 0.1, repeat: Infinity, ease: "easeInOut" }}
                  style={{ height: h }}
                />
              ))}
            </div>
          </div>

          {/* Gemma (Hosted on AMD) Card */}
          <div className="glass-panel relative flex items-center justify-between gap-4 p-5 shadow-glow">
            <div className="flex items-center gap-3.5">
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, delay: 0.3 }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-400 border border-red-500/30"
              >
                <Brain size={19} />
              </motion.div>
              <div className="text-left">
                <p className="text-sm font-semibold text-pulse-white">Gemma — Hosted on AMD</p>
                <p className="text-xs text-white/40">"Pain: 6/10 • Afebrile • Risk: LOW"</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-pulse-green-500/30 bg-pulse-green-500/10 px-3 py-1.5 text-xs font-semibold text-pulse-green-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pulse-green-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-pulse-green-500"></span>
              </span>
              <span>Risk: LOW</span>
            </div>
          </div>
        </motion.div>
      </section>


      {/* How it works */}
      <section id="how-it-works" className="relative z-10 mx-auto max-w-6xl px-6 pb-28">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          className="mb-14 text-center"
        >
          <span className="section-label">How It Works</span>
          <h2 className="mt-3 text-3xl font-bold text-pulse-white sm:text-4xl">
            From dial tone to clinical decision
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          {STEPS.map((step) => (
            <motion.div key={step.n} variants={fadeUp} className="relative">
              <div className="glass-card h-full p-6">
                <span className="font-display text-3xl font-bold text-pulse-green-500/40">{step.n}</span>
                <h3 className="mt-3 font-semibold text-pulse-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{step.body}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Role isolation callout */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-28">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          className="glass-panel flex flex-col items-center gap-6 p-10 text-center sm:flex-row sm:text-left"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-pulse-green-500/15 border border-pulse-green-500/30 text-pulse-green-400">
            <Stethoscope size={26} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-pulse-white">
              No self-signup. No data leakage between clinicians.
            </h3>
            <p className="mt-2 text-sm text-white/50">
              Every account is provisioned by a verified Admin. Doctors only ever see the patients
              explicitly assigned to them — enforced at the database query level, not just the UI.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-pulse-line/60 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-white/30 sm:flex-row">
          <span>© {new Date().getFullYear()} CarePulse. Built for the CALL-E Devpost Hackathon.</span>
          <span className="flex items-center gap-1.5">
            <Activity size={14} className="text-pulse-green-500" />
            Powered by CALL-E &amp; Gemma 4 31B
          </span>
        </div>
      </footer>
    </div>
  );
}
