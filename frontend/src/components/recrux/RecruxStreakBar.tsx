import { R } from "../../recrux/theme";

export function RecruxStreakBar({ days = 7, filled = 7 }: { days?: number; filled?: number }) {
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {Array.from({ length: days }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 13,
            height: 13,
            borderRadius: 3,
            background: i < filled ? R.primary : R.muted,
          }}
        />
      ))}
    </div>
  );
}
