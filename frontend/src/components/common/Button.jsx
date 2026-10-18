import { motion } from "framer-motion";

export default function Button({
  children,
  variant = "primary",
  className = "",
  icon: Icon,
  loading = false,
  ...props
}) {
  const base = variant === "primary" ? "btn-primary" : variant === "secondary" ? "btn-secondary" : "";
  const ghost =
    variant === "ghost"
      ? "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:text-pulse-green-400 hover:bg-white/5"
      : "";
  const danger =
    variant === "danger"
      ? "inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 font-semibold text-red-400 transition-all hover:bg-red-500/20"
      : "";

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={`${base} ${ghost} ${danger} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        Icon && <Icon size={16} strokeWidth={2.25} />
      )}
      {children}
    </motion.button>
  );
}
