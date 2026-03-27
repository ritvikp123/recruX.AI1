import { NavLink, Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { R } from "../recrux/theme";

const tabs = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Jobs", to: "/jobs" },
  { label: "Saved", to: "/saved" },
  { label: "Applied", to: "/applied" },
  { label: "Resume", to: "/resume" },
  { label: "Progress", to: "/progress" },
  { label: "Roadmap", to: "/roadmap" },
  { label: "Settings", to: "/settings" },
];

function initials(name: string) {
  if (!name) return "R";
  const p = name.trim().split(/\s+/);
  return (p[0][0] + (p[1]?.[0] || "")).toUpperCase().slice(0, 2);
}

const hairline = `0.5px solid ${R.border}`;

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const display =
    (user?.user_metadata?.full_name as string) ||
    user?.email?.split("@")[0] ||
    "User";

  return (
    <nav
      style={{
        background: R.nav,
        borderBottom: hairline,
        height: 56,
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 12,
        position: "sticky",
        top: 0,
        zIndex: 100,
        flexWrap: "wrap",
        rowGap: 8,
      }}
    >
      <Link
        to="/dashboard"
        className="recrux-heading"
        style={{
          fontSize: 17,
          fontWeight: 600,
          color: R.primary,
          marginRight: 20,
          letterSpacing: "-0.02em",
          flexShrink: 0,
          textDecoration: "none",
          textTransform: "lowercase",
        }}
      >
        rec<span style={{ fontStyle: "italic" }}>r</span>ux
      </Link>

      <div style={{ display: "flex", gap: 4, flex: 1, flexWrap: "wrap", minWidth: 0, alignItems: "center" }}>
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === "/dashboard"}
            style={({ isActive }) => ({
              fontSize: 13,
              padding: "6px 14px",
              borderRadius: 999,
              textDecoration: "none",
              fontWeight: isActive ? 600 : 500,
              background: isActive ? R.primary : "transparent",
              color: isActive ? "#ffffff" : R.primary,
              transition: "color 0.15s, background 0.15s",
            })}
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <div
        className="recrux-nav-search"
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <Search
          size={16}
          color={R.primary}
          strokeWidth={2}
          style={{ position: "absolute", left: 12, pointerEvents: "none" }}
        />
        <input
          placeholder="Search jobs..."
          style={{
            background: R.light,
            border: hairline,
            borderRadius: 20,
            padding: "8px 14px 8px 38px",
            fontSize: 13,
            color: R.darkest,
            width: 220,
            maxWidth: "100%",
            outline: "none",
          }}
          readOnly
          title="Coming soon"
        />
      </div>

      <button
        type="button"
        onClick={async () => {
          await signOut();
          navigate("/");
        }}
        style={{
          fontSize: 12,
          color: R.primary,
          background: "none",
          border: "none",
          cursor: "pointer",
          fontWeight: 500,
        }}
      >
        Sign out
      </button>

      <div style={{ position: "relative", flexShrink: 0 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: R.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            color: "#ffffff",
            fontWeight: 600,
          }}
          title={display}
        >
          {initials(display)}
        </div>
        <span
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            minWidth: 16,
            height: 16,
            padding: "0 3px",
            borderRadius: 999,
            background: "#ef4444",
            color: "#ffffff",
            fontSize: 9,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid #ffffff",
            lineHeight: 1,
          }}
        >
          1
        </span>
      </div>
    </nav>
  );
}
