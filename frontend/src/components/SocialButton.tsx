import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface Props {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
}

export function SocialButton({ icon, label, onClick }: Props) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-js-brand-border bg-js-brand-card px-4 py-2.5 text-sm font-medium text-js-brand-darkest transition hover:bg-js-brand-bg"
    >
      <span className="h-4 w-4 text-js-brand-primary">{icon}</span>
      <span>{label}</span>
    </motion.button>
  );
}
