import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { R } from "../recrux/theme";
import { SiteFooter } from "./SiteFooter";

const hairline = `0.5px solid ${R.border}`;

export function PublicLegalLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: R.bg, fontFamily: "var(--font-body)" }}>
      <header
        style={{
          display: "flex",
          height: 56,
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 clamp(12px, 4vw, 22px)",
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(10px)",
          borderBottom: hairline,
          flexShrink: 0,
        }}
      >
        <Link
          to="/"
          className="recrux-heading"
          style={{ fontSize: 17, fontWeight: 600, color: R.primary, textDecoration: "none", textTransform: "lowercase" }}
        >
          rec<span style={{ fontStyle: "italic" }}>r</span>ux
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <Link
            to="/signin"
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: R.primary,
              textDecoration: "none",
              padding: "8px 12px",
              whiteSpace: "nowrap",
            }}
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              background: R.primary,
              padding: "8px 16px",
              borderRadius: 999,
              textDecoration: "none",
              boxShadow: "0 2px 8px rgba(24, 95, 165, 0.25)",
              whiteSpace: "nowrap",
            }}
          >
            Get started
          </Link>
        </div>
      </header>

      <main style={{ flex: 1, width: "100%", minWidth: 0 }}>{children}</main>

      <SiteFooter />
    </div>
  );
}
