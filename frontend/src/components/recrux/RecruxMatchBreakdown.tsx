import { R } from "../../recrux/theme";

const DEFAULT_BARS = [
  { label: "Skills", pct: 94 },
  { label: "Experience", pct: 88 },
  { label: "Keywords", pct: 79 },
  { label: "Education", pct: 100 },
];

export function RecruxMatchBreakdown({
  breakdown = DEFAULT_BARS,
}: {
  breakdown?: { label: string; pct: number }[];
}) {
  return (
    <div>
      <div
        className="recrux-heading"
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: R.darkest,
          marginBottom: 14,
        }}
      >
        Match breakdown
      </div>
      {breakdown.map((item) => (
        <div key={item.label} style={{ marginBottom: 12 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              fontWeight: 500,
              color: R.primary,
              marginBottom: 6,
            }}
          >
            <span>{item.label}</span>
            <span style={{ color: R.darkest }}>{item.pct}%</span>
          </div>
          <div
            style={{
              height: 3,
              background: R.muted,
              borderRadius: 2,
              overflow: "hidden",
              width: "100%",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${item.pct}%`,
                background: R.primary,
                borderRadius: 2,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
