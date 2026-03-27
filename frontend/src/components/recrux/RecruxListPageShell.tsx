import type { ReactNode } from "react";
import { R } from "../../recrux/theme";

const hairline = `0.5px solid ${R.border}`;

const panelBase = {
  background: R.card,
  border: hairline,
  borderRadius: 16,
  boxShadow: "0 4px 28px rgba(4, 44, 83, 0.1), 0 1px 3px rgba(0, 0, 0, 0.06)",
  overflow: "hidden" as const,
};

export function RecruxListPageShell({
  title,
  subtitle,
  icon,
  statLabel,
  statValue,
  accent = "primary",
  asideNote,
  children,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  statLabel: string;
  statValue: string | number;
  accent?: "primary" | "emerald";
  asideNote: string;
  children: ReactNode;
}) {
  const barGradient =
    accent === "emerald"
      ? `linear-gradient(90deg, #059669, ${R.mid})`
      : `linear-gradient(90deg, ${R.primary}, ${R.mid})`;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "none",
        margin: 0,
        padding: "28px 22px 52px",
        boxSizing: "border-box",
        minHeight: "calc(100vh - 56px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header style={{ marginBottom: 22 }}>
        <h1 className="recrux-heading" style={{ fontSize: 28, fontWeight: 700, color: R.darkest, margin: 0, letterSpacing: "-0.02em" }}>
          {title}
        </h1>
        <p style={{ fontSize: 15, color: R.body, margin: "10px 0 0", lineHeight: 1.55 }}>
          {subtitle}
        </p>
      </header>

      <div
        style={{
          ...panelBase,
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div aria-hidden style={{ height: 4, background: barGradient }} />
        <div
          style={{
            padding: "28px 26px 32px",
            background: `linear-gradient(165deg, ${R.light} 0%, rgba(255,255,255,0.97) 22%, ${R.card} 55%)`,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 18,
              marginBottom: 26,
              paddingBottom: 22,
              borderBottom: hairline,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: `linear-gradient(145deg, ${R.light}, #ffffff)`,
                border: hairline,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: R.primary,
                boxShadow: "0 2px 12px rgba(24, 95, 165, 0.12)",
                flexShrink: 0,
              }}
            >
              {icon}
            </div>
            <div style={{ flex: "1 1 200px", minWidth: 0 }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  color: R.deep,
                  margin: 0,
                }}
              >
                {statLabel}
              </p>
              <p
                className="recrux-heading"
                style={{
                  fontSize: 40,
                  fontWeight: 700,
                  color: R.darkest,
                  margin: "4px 0 0",
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                }}
              >
                {statValue}
              </p>
            </div>
            <div
              style={{
                flex: "1 1 220px",
                minWidth: 0,
                padding: "12px 16px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.75)",
                border: hairline,
                fontSize: 13,
                color: R.body,
                lineHeight: 1.5,
              }}
            >
              {asideNote}
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
        </div>
      </div>
    </div>
  );
}
