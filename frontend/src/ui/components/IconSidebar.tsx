import {
  Search,
  FileText,
  Target,
  Clock,
  Zap,
  Bot,
  Gift,
  Bell,
  HelpCircle,
  Settings,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

function IconButton({
  to,
  icon: Icon,
  label,
  badge,
}: {
  to?: string;
  icon: typeof Search;
  label: string;
  badge?: string;
}) {
  const content = (
    <div className="relative flex h-10 w-10 items-center justify-center rounded-lg text-white/50 transition hover:scale-105 hover:text-white/80">
      <Icon size={18} />
      {badge && (
        <span className="absolute -right-1 -top-1 rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-semibold text-white">
          {badge}
        </span>
      )}
    </div>
  );

  if (!to) {
    return (
      <button type="button" className="group relative">
        {content}
        <span className="pointer-events-none absolute left-12 top-1/2 -translate-y-1/2 rounded-button bg-bg-card px-2 py-1 text-[10px] text-text-primary opacity-0 shadow-md group-hover:opacity-100" style={{ border: "1px solid var(--border)" }}>
          {label}
        </span>
      </button>
    );
  }

  return (
    <NavLink to={to} end className="group relative flex items-center justify-center">
      {({ isActive }) => (
        <>
          <motion.div
            className={`relative flex h-10 w-10 items-center justify-center rounded-full transition hover:scale-105 ${
              isActive ? "bg-accent text-white" : "text-white/50 hover:text-white/80"
            }`}
          >
            <Icon size={18} />
            {badge && (
              <span className="absolute -right-1 -top-1 rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-semibold text-white">
                {badge}
              </span>
            )}
          </motion.div>
          <span className="pointer-events-none absolute left-12 top-1/2 -translate-y-1/2 rounded-button bg-bg-card px-2 py-1 text-[10px] text-text-primary opacity-0 shadow-md group-hover:opacity-100" style={{ border: "1px solid var(--border)" }}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}

export function IconSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-[70px] min-w-[70px] flex-shrink-0 flex-col items-center bg-primary py-4 md:flex">
      <div
        className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold text-white"
        style={{ background: "var(--secondary)" }}
      >
        R
      </div>
      <div className="flex flex-1 flex-col items-center gap-3">
        <IconButton to="/dashboard" icon={Search} label="Search" />
        <IconButton to="/dashboard/resume" icon={FileText} label="Resume" />
        <IconButton to="/dashboard/recent" icon={Clock} label="Recent" />
        <IconButton to="/dashboard/autoapply" icon={Zap} label="Auto Apply" />
        <div className="my-3 h-px w-8 bg-white/20" />
        <IconButton to="/agent" icon={Bot} label="Agent" badge="Beta" />
        <IconButton to="/coaching" icon={Target} label="Coaching" badge="New" />
        <IconButton icon={Gift} label="Rewards" />
        <IconButton icon={Bell} label="Notifications" />
        <IconButton icon={HelpCircle} label="Help" />
      </div>
      <div className="mt-auto">
        <IconButton to="/dashboard/settings" icon={Settings} label="Settings" />
      </div>
    </aside>
  );
}
