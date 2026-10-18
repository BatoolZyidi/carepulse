import { motion } from "framer-motion";

export default function GlassCard({ children, className = "", hover = false, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      whileHover={hover ? { y: -3, transition: { duration: 0.2 } } : undefined}
      className={`glass-card p-6 ${hover ? "hover:border-pulse-green-700/60 hover:shadow-glow" : ""} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
