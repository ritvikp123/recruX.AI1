import { useMemo, type ReactNode } from "react";
import { useJobStore } from "../store/useJobStore";
import { R } from "../recrux/theme";

const WEEKS = 12;
const DAYS = 7;

/** Deterministic pseudo-random grid (stable across re-renders). */
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function cellLevel(week: number, day: number, seed: number, threshold: number): number {
  const n = ((week * 17 + day * 31 + seed * 13) % 100) / 100;
  if (n < threshold) return 0;
  return ((week + day) % 3) + 1;
}

function ContributionGrid({ seed, threshold }: { seed: number; threshold: number }) {
  const cells = useMemo(() => {
    const out: ReactNode[] = [];
    for (let w = 0; w < WEEKS; w++) {
      for (let d = 0; d < DAYS; d++) {
        const level = cellLevel(w, d, seed, threshold);
        const bg =
          level === 0
            ? R.muted
            : level === 1
              ? R.border
              : level === 2
                ? R.mid
                : R.primary;
        out.push(<div key={`${w}-${d}`} style={{ width: 12, height: 12, borderRadius: 3, background: bg }} />);
      }
    }
    return out;
  }, [seed, threshold]);
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: `repeat(${DAYS}, 12px)`,
        gridAutoFlow: "column",
        gap: 4,
        width: "max-content",
      }}
    >
      {cells}
    </div>
  );
}

export function Progress() {
  const weeks = ["M", "T", "W", "T", "F", "S", "S"];

  const filters = useJobStore((s) => s.filters);
  const appliedJobIds = useJobStore((s) => s.appliedJobIds);
  const appliedJobs = useJobStore((s) => s.appliedJobs);
  const dashboardJobs = useJobStore((s) => s.dashboardJobs);

  const appliedCount = appliedJobIds.length;
  const hasActivity = appliedCount > 0;

  const avgMatch = useMemo(() => {
    const list = appliedJobs.filter((j) => typeof j.matchScore === "number");
    if (list.length) {
      const sum = list.reduce((a, j) => a + (j.matchScore ?? 0), 0);
      return sum / list.length;
    }
    const preview = dashboardJobs.filter((j) => typeof j.matchScore === "number");
    if (preview.length) {
      const sum = preview.reduce((a, j) => a + (j.matchScore ?? 0), 0);
      return sum / preview.length;
    }
    return 68;
  }, [appliedJobs, dashboardJobs]);

  // Seed ties the visuals to the user's current context (filters + any applied activity).
  const seed = useMemo(() => {
    const parts = [
      filters.query ?? "",
      filters.location ?? "",
      filters.employmentType ?? "",
      String(filters.remoteOnly ?? false),
      String(appliedCount),
      String(Math.round(avgMatch)),
    ];
    return hashString(parts.join("|"));
  }, [filters.query, filters.location, filters.employmentType, filters.remoteOnly, appliedCount, avgMatch]);

  const barData = useMemo(() => {
    // When the user has no applied jobs yet, show a clear sample pattern (but still deterministic).
    if (!hasActivity) {
      const sample = [2, 5, 3, 6, 4, 7, 5]; // 1..7 scale
      const matchScale = clamp(avgMatch, 45, 95) / 95; // ~0.47..1
      const jitter = Array.from({ length: 7 }, (_, i) => ((seed + i * 19) % 3) - 1); // -1..1
      return sample.map((v, i) => clamp(Math.round(v * (0.82 + matchScale * 0.35) + jitter[i]!), 1, 7));
    }

    const baseFromMatch = clamp(avgMatch, 40, 95) / 95; // ~0.4..1
    return Array.from({ length: 7 }, (_, i) => {
      const n = ((seed + i * 97) % 1000) / 1000; // 0..1 deterministic
      const raw = 1 + n * 6 * (0.35 + baseFromMatch * 0.65);
      return clamp(Math.round(raw), 1, 7);
    });
  }, [hasActivity, avgMatch, seed]);

  const linePoints = useMemo(() => {
    // Percent heights (container is 100px) so these map directly into the chart.
    if (!hasActivity) {
      const sample = [62, 68, 71, 69, 74, 78, 80];
      const matchDelta = clamp(avgMatch, 45, 95) - 68; // center around sample
      const jitter = Array.from({ length: 7 }, (_, i) => ((seed + i * 31) % 5) - 2); // -2..2
      return sample.map((v, i) => clamp(Math.round(v + matchDelta * 0.35 + jitter[i]!), 45, 90));
    }

    const bias = clamp(avgMatch, 45, 95) - 60; // -15..35
    return Array.from({ length: 7 }, (_, i) => {
      const n = (((seed + i * 131) % 2000) / 2000) * 18 - 9; // -9..9
      const v = 62 + bias * 0.45 + n;
      return clamp(Math.round(v), 45, 90);
    });
  }, [hasActivity, avgMatch, seed]);

  const skillPool = [
    "Kubernetes",
    "System design",
    "CI/CD",
    "GraphQL",
    "Docker",
    "Performance tuning",
    "Security basics",
    "Database modeling",
  ];

  const skillGaps = useMemo(() => {
    if (appliedCount <= 0) {
      // Use filters-driven seed so the suggested gaps still feel personalized.
      const idxA = seed % skillPool.length;
      const idxB = (seed + 11) % skillPool.length;
      const idxC = (seed + 29) % skillPool.length;
      const picked = new Set<string>([skillPool[idxA], skillPool[idxB], skillPool[idxC]]);
      while (picked.size < 3) picked.add(skillPool[(picked.size * 17 + seed) % skillPool.length]);
      return Array.from(picked);
    }
    const picks = new Set<string>();
    while (picks.size < 3) {
      const idx = (seed + picks.size * 11) % skillPool.length;
      picks.add(skillPool[idx] as string);
    }
    return Array.from(picks);
  }, [appliedCount, seed]);

  const section = {
    background: R.card,
    border: `0.5px solid ${R.border}`,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  } as const;

  const panelHairline = `0.5px solid ${R.border}`;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "none",
        margin: 0,
        minHeight: "calc(100vh - 56px)",
        boxSizing: "border-box",
        background: R.card,
        border: panelHairline,
        borderRadius: 16,
        boxShadow: "0 4px 28px rgba(4, 44, 83, 0.1), 0 1px 3px rgba(0, 0, 0, 0.06)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ height: 4, background: `linear-gradient(90deg, ${R.primary}, ${R.mid})` }} />
      <div style={{ padding: 20, flex: 1, minHeight: 0, overflowY: "auto" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: R.darkest, marginBottom: 16 }}>Progress</h1>

      <div style={section}>
        <h2 style={{ fontSize: 13, fontWeight: 500, color: R.darkest }}>Application streak</h2>
          <p style={{ fontSize: 11, color: R.deep, marginTop: 4 }}>
            Sample activity grid (tied to your applied roles)
          </p>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              fontSize: 9,
              color: R.muted,
              paddingTop: 2,
              paddingBottom: 2,
            }}
          >
            {weeks.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
            <ContributionGrid seed={seed} threshold={hasActivity ? 0.65 : 0.54} />
        </div>
      </div>

      <div style={section}>
        <h2 style={{ fontSize: 13, fontWeight: 500, color: R.darkest }}>Applications this week</h2>
        <div style={{ display: "flex", height: 120, alignItems: "flex-end", gap: 8, marginTop: 16 }}>
          {barData.map((h, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: "100%",
                  background: R.mid,
                  borderRadius: "4px 4px 0 0",
                  height: `${(h / 7) * 100}%`,
                  minHeight: 8,
                }}
              />
              <span style={{ fontSize: 9, color: R.deep }}>D{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={section}>
        <h2 style={{ fontSize: 13, fontWeight: 500, color: R.darkest }}>Avg match score</h2>
        <div
          style={{
            display: "flex",
            height: 100,
            alignItems: "flex-end",
            gap: 6,
            marginTop: 16,
            borderBottom: `0.5px solid ${R.border}`,
            paddingBottom: 0,
          }}
        >
          {linePoints.map((v, i) => (
            <div key={i} style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <div
                style={{
                  width: "100%",
                  maxWidth: 28,
                  background: `${R.primary}cc`,
                  borderRadius: "4px 4px 0 0",
                  height: `${v}%`,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div style={section}>
        <h2 style={{ fontSize: 13, fontWeight: 500, color: R.darkest }}>Skill gap tracker</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0" }}>
          {skillGaps.map((skill) => (
            <li
              key={skill}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 12px",
                background: R.light,
                borderRadius: 8,
                marginBottom: 8,
                fontSize: 12,
                color: R.deep,
              }}
            >
              <span>{skill}</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: R.primary }}>Start learning</span>
            </li>
          ))}
        </ul>
      </div>
      </div>
    </div>
  );
}
