import { NavLink } from "react-router-dom";
import { Search, Bookmark, CheckCircle2, BarChart3, Settings } from "lucide-react";

const items = [
  { to: "/dashboard", label: "Search", Icon: Search },
  { to: "/saved", label: "Saved", Icon: Bookmark },
  { to: "/applied", label: "Applied", Icon: CheckCircle2 },
  { to: "/insights", label: "Insights", Icon: BarChart3 },
  { to: "/settings", label: "Settings", Icon: Settings },
];

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t bg-white px-2 py-2 md:hidden"
      style={{ borderColor: "#E8E8E6" }}
      aria-label="Bottom navigation"
    >
      {items.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/dashboard"}
          className={({ isActive }) =>
            `flex w-full flex-col items-center justify-center gap-1 rounded-button px-2 py-1 text-[10px] font-medium transition ${
              isActive ? "text-[#5E5CE6]" : "text-[#8A8A85]"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={18} className={isActive ? "text-[#5E5CE6]" : ""} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
