import type { ReactNode } from "react";
import { R } from "../../recrux/theme";

const hairline = `0.5px solid ${R.border}`;

export function RecruxStatCard({
  label,
  value,
  valueColor,
  icon,
}: {
  label: string;
  value: ReactNode;
  valueColor?: string;
  /** Decorative illustration on the right */
  icon: ReactNode;
}) {
  return (
    <div
      style={{
        background: R.card,
        border: hairline,
        borderRadius: 10,
        padding: 12,
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          className="recrux-heading"
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: valueColor || R.darkest,
            lineHeight: 1.1,
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: 13, color: R.primary, marginTop: 6, fontWeight: 500 }}>{label}</div>
      </div>
      <div style={{ flexShrink: 0 }}>{icon}</div>
    </div>
  );
}
