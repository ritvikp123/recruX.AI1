import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { R } from "../recrux/theme";

const hairline = `0.5px solid ${R.border}`;

export type SiteFooterSurface = "recrux" | "auth";

export function SiteFooter({
  surface = "recrux",
  showAuthLinks = false,
  showWordmark = false,
  extraRow,
  style,
}: {
  surface?: SiteFooterSurface;
  showAuthLinks?: boolean;
  showWordmark?: boolean;
  extraRow?: ReactNode;
  style?: CSSProperties;
}) {
  const isAuth = surface === "auth";
  const bg = isAuth ? "rgba(15, 23, 42, 0.92)" : "rgba(255, 255, 255, 0.65)";
  const border = isAuth ? "0.5px solid rgba(255,255,255,0.12)" : hairline;
  const linkColor = isAuth ? "rgba(255,255,255,0.85)" : R.body;
  const muted = isAuth ? "rgba(255,255,255,0.55)" : R.body;

  return (
    <footer
      role="contentinfo"
      style={{
        borderTop: border,
        padding: "20px 20px 28px",
        background: bg,
        ...style,
      }}
    >
      <div
        style={{
          maxWidth: 1040,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          textAlign: "center",
        }}
      >
        {showWordmark && (
          <span className="recrux-heading" style={{ fontSize: 15, fontWeight: 600, color: isAuth ? "#fff" : R.primary }}>
            rec<span style={{ fontStyle: "italic" }}>r</span>ux
          </span>
        )}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "10px 18px",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <Link to="/privacy" style={{ color: linkColor, textDecoration: "none" }}>
            Privacy Policy
          </Link>
          <Link to="/terms" style={{ color: linkColor, textDecoration: "none" }}>
            Terms of Service
          </Link>
          <Link to="/pricing" style={{ color: linkColor, textDecoration: "none" }}>
            Pricing
          </Link>
          <Link to="/contact" style={{ color: linkColor, textDecoration: "none" }}>
            Contact
          </Link>
          {showAuthLinks && (
            <>
              <Link to="/signin" style={{ color: linkColor, textDecoration: "none" }}>
                Sign in
              </Link>
              <Link to="/signup" style={{ color: linkColor, textDecoration: "none" }}>
                Sign up
              </Link>
            </>
          )}
        </div>
        {extraRow}
        <p style={{ margin: 0, fontSize: 12, color: muted, lineHeight: 1.45 }}>
          © {new Date().getFullYear()} Recrux.ai. Built for focused job seekers.
        </p>
      </div>
    </footer>
  );
}
