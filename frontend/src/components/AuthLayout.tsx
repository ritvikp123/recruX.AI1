import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface Props {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: Props) {
  return (
    <div className="flex min-h-screen items-stretch bg-js-brand-bg">
      <div className="relative hidden w-[60%] flex-col overflow-hidden md:flex bg-js-brand-primary">
        <div className="relative flex-1 px-10 py-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg font-semibold text-white">
              <span className="italic text-js-brand-light">r</span>
              ecrux
            </span>
          </Link>

          <div className="mt-14 max-w-xl space-y-4">
            <h1 className="text-3xl font-semibold leading-tight text-white md:text-4xl">
              Next-gen career intelligence
            </h1>
            <p className="text-sm text-white/90">
              Autonomous. Relentless. Hired. AI-powered job search and resume optimization.
            </p>
            <ul className="space-y-2 text-sm text-white/90">
              <li className="flex items-center gap-2">
                <span className="text-js-brand-light">✓</span> Live job listings & match scores
              </li>
              <li className="flex items-center gap-2">
                <span className="text-js-brand-light">✓</span> Resume optimizer & skill gaps
              </li>
              <li className="flex items-center gap-2">
                <span className="text-js-brand-light">✓</span> Saved jobs & application tracking
              </li>
            </ul>
          </div>

          <div className="pointer-events-none absolute inset-0 opacity-30">
            <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute -right-20 bottom-10 h-64 w-64 rounded-full bg-js-brand-light/30 blur-3xl" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="pointer-events-none absolute bottom-10 right-12 w-64 rounded-xl border border-white/20 bg-white/10 p-3 text-xs text-white backdrop-blur"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-js-brand-light">
              96% match
            </p>
            <p className="mt-1 text-sm font-semibold">AI Engineer · Example Co</p>
            <p className="mt-1 text-[11px] opacity-90">
              Strong match on Python, systems, and ML deployment.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center px-4 py-8 md:w-[40%] md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md rounded-xl border border-hairline border-js-brand-border bg-js-brand-card p-6 shadow-lg"
          style={{ borderWidth: "0.5px" }}
        >
          <div className="mb-5 space-y-1">
            <h2 className="text-xl font-semibold text-js-brand-darkest">{title}</h2>
            <p className="text-sm text-js-brand-deep">{subtitle}</p>
          </div>
          {children}
        </motion.div>
      </div>
    </div>
  );
}
