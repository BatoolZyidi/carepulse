import { motion } from "framer-motion";

import Navbar from "./Navbar";

export default function PageShell({ children, homePath, title, subtitle, actions }) {
  return (
    <div className="min-h-screen bg-pulse-black">
      <Navbar homePath={homePath} />
      <main className="mx-auto max-w-7xl px-6 py-10">
        {(title || actions) && (
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              {title && (
                <motion.h1
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl md:text-3xl font-bold text-pulse-white"
                >
                  {title}
                </motion.h1>
              )}
              {subtitle && <p className="mt-1.5 text-sm text-white/50">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
