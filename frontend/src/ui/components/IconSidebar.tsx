import {
  Search,
  FileText,
  Clock,
  Bookmark,
  CheckCircle,
  Zap,
  MessageCircle,
  BarChart3,
  Map,
  Settings,
  LogOut,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function NavItem({
  to,
  icon: Icon,
  label,
  onClick,
}: {
  to?: string;
  icon: typeof Search;
  label: string;
  onClick?: () => void;
}) {
  const content = (
    <div className="flex h-[30px] items-center gap-2 rounded-[5px] px-2">
      <Icon size={15} className="shrink-0" />
      <span className="text-[13px] font-normal">{label}</span>
    </div>
  );

  if (onClick !== undefined) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="block w-full text-left text-[#3D3D3A] transition hover:bg-[#F4F4F2] hover:text-[#1A1A1A]"
      >
        {content}
      </button>
    );
  }

  if (!to) return null;

  return (
    <NavLink
      to={to}
      end={to === "/dashboard"}
      className={({ isActive }) =>
        `block w-full transition ${
          isActive
            ? "rounded-[5px] bg-[#EEEEFD] text-[#5E5CE6] [&_span]:font-medium"
            : "text-[#3D3D3A] hover:bg-[#F4F4F2] hover:text-[#1A1A1A]"
        }`
      }
    >
      {content}
    </NavLink>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mt-5 mb-1 px-2 text-[10px] font-medium uppercase"
      style={{ color: "#8A8A85", letterSpacing: "0.06em" }}
    >
      {children}
    </div>
  );
}

export function IconSidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const email = user?.email ?? "";
  const initials =
    user?.user_metadata?.full_name
      ?.split(" ")
      .map((p: string) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <aside
      className="fixed inset-y-0 left-0 z-50 hidden w-[220px] min-w-[220px] flex-shrink-0 flex-col border-r bg-white py-0 md:flex"
      style={{ borderColor: "#E8E8E6" }}
    >
      {/* Logo area — 52px tall */}
      <div
        className="flex flex-col justify-end border-b px-4 pb-3"
        style={{ height: 52, borderColor: "#E8E8E6" }}
      >
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-[#5E5CE6]" />
          <span className="text-[14px] font-semibold" style={{ color: "#1A1A1A" }}>
            Recruix
          </span>
        </div>
        {email && (
          <p className="mt-0.5 truncate text-[12px]" style={{ color: "#8A8A85" }}>
            {email}
          </p>
        )}
      </div>

      {/* Group 1 — main actions */}
      <nav className="flex-1 space-y-0.5 px-2 pt-2">
        <NavItem to="/dashboard" icon={Search} label="Job Search" />
        <NavItem to="/dashboard/resume" icon={FileText} label="Resume" />

        <GroupLabel>Activity</GroupLabel>
        <NavItem to="/dashboard/recent" icon={Clock} label="Recent" />
        <NavItem to="/saved" icon={Bookmark} label="Saved" />
        <NavItem to="/applied" icon={CheckCircle} label="Applied" />

        <GroupLabel>Tools</GroupLabel>
        <NavItem to="/dashboard/autoapply" icon={Zap} label="Auto Apply" />
        <NavItem icon={MessageCircle} label="AI Copilot" onClick={() => {}} />
        <NavItem to="/insights" icon={BarChart3} label="Insights" />
        <NavItem to="/dashboard/roadmap" icon={Map} label="Roadmap" />
      </nav>

      {/* Bottom pinned */}
      <div
        className="mt-auto space-y-0.5 border-t px-2 pt-3 pb-3"
        style={{ borderColor: "#E8E8E6" }}
      >
        <NavItem to="/settings" icon={Settings} label="Settings" />
        <button
          type="button"
          onClick={handleSignOut}
          className="block w-full text-left text-[#3D3D3A] transition hover:bg-[#F4F4F2] hover:text-[#1A1A1A]"
        >
          <div className="flex h-[30px] items-center gap-2 rounded-[5px] px-2">
            <LogOut size={15} className="shrink-0" />
            <span className="text-[13px] font-normal">Sign out</span>
          </div>
        </button>
        <div className="mt-3 flex items-center gap-2 px-2">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-medium"
            style={{ background: "#F4F4F2", color: "#3D3D3A", border: "1px solid #E8E8E6" }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-normal" style={{ color: "#1A1A1A" }}>
              {user?.user_metadata?.full_name || "User"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
