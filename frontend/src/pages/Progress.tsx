import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useJobStore } from "../store/useJobStore";
import { R } from "../recrux/theme";
import { supabase } from "../lib/supabase";
import { isMockJobId } from "../lib/mockJobs";
import type { Job } from "../types/job";
import { RecruxEmptyState } from "../components/recrux/RecruxEmptyState";

const WEEKS = 12;
const DAYS = 7;
const BAR_AREA_PX = 96;
const MATCH_CHART_PX = 88;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Monday-start week; returns that Monday at local midnight. */
function startOfWeekMonday(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function localYmd(d: Date): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

type DbApplicationRow = {
  job_id: string;
  applied_at: string;
  job_data: Record<string, unknown> | null;
};

function rowToJob(row: DbApplicationRow): Job {
  const raw = (row.job_data ?? {}) as Partial<Job>;
  return {
    id: raw.id ?? row.job_id,
    title: raw.title ?? "Applied role",
    company: raw.company ?? "",
    location: raw.location ?? "",
    description: raw.description ?? "",
    employerLogo: raw.employerLogo,
    applyUrl: raw.applyUrl,
    salaryMin: raw.salaryMin,
    salaryMax: raw.salaryMax,
    remote: raw.remote,
    skills: raw.skills,
    postedAt: raw.postedAt,
    matchScore: raw.matchScore,
    appliedAt: row.applied_at,
  };
}

/** Intensity 0–3 from application count for one day. */
function countToLevel(c: number): number {
  if (c <= 0) return 0;
  if (c === 1) return 1;
  if (c === 2) return 2;
  return 3;
}

function buildDayCounts(timestamps: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const iso of timestamps) {
    const k = localYmd(new Date(iso));
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

/** 12 columns × 7 rows, column-major (week columns left→right, oldest first). */
function heatmapLevelsFromDates(timestamps: string[]): number[] {
  const counts = buildDayCounts(timestamps);
  const mondayThisWeek = startOfWeekMonday(new Date());
  const levels: number[] = [];
  for (let w = 0; w < WEEKS; w++) {
    for (let d = 0; d < DAYS; d++) {
      const cell = new Date(mondayThisWeek);
      cell.setDate(cell.getDate() - (WEEKS - 1 - w) * 7 + d);
      const k = localYmd(cell);
      levels.push(countToLevel(counts.get(k) ?? 0));
    }
  }
  return levels;
}

/** Mon–Sun counts for the current calendar week (local). */
function applicationsThisWeekByDay(timestamps: string[]): number[] {
  const monday = startOfWeekMonday(new Date());
  const nextMonday = new Date(monday);
  nextMonday.setDate(nextMonday.getDate() + 7);
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const iso of timestamps) {
    const dt = new Date(iso);
    if (dt < monday || dt >= nextMonday) continue;
    const ix = (dt.getDay() + 6) % 7;
    counts[ix]++;
  }
  return counts;
}

function ContributionGridFromLevels({ levels }: { levels: number[] }) {
  const cells = useMemo(() => {
    const out: ReactNode[] = [];
    for (let i = 0; i < levels.length; i++) {
      const level = levels[i] ?? 0;
      const bg =
        level === 0 ? R.muted : level === 1 ? R.border : level === 2 ? R.mid : R.primary;
      out.push(<div key={i} style={{ width: 12, height: 12, borderRadius: 3, background: bg }} />);
    }
    return out;
  }, [levels]);
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
  const pruneMockApplications = useJobStore((s) => s.pruneMockApplications);

  const [dbApps, setDbApps] = useState<DbApplicationRow[] | null>(null);

  useEffect(() => {
    pruneMockApplications();
  }, [pruneMockApplications]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id || cancelled) {
        if (!cancelled) setDbApps([]);
        return;
      }
      const { data, error } = await supabase
        .from("applications")
        .select("job_id, applied_at, job_data")
        .eq("user_id", user.id)
        .order("applied_at", { ascending: false });
      if (cancelled) return;
      if (error) {
        console.warn("Progress: applications fetch", error.message);
        setDbApps([]);
        return;
      }
      const rows = ((data ?? []) as DbApplicationRow[]).filter((r) => !isMockJobId(r.job_id));
      setDbApps(rows);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const mergedTimestamps = useMemo(() => {
    const fromDb = (dbApps ?? []).map((r) => r.applied_at).filter(Boolean);
    const dbIds = new Set((dbApps ?? []).map((r) => r.job_id));
    const fromStore = appliedJobs
      .filter((j) => !isMockJobId(j.id) && j.appliedAt && !dbIds.has(j.id))
      .map((j) => j.appliedAt!);
    return [...fromDb, ...fromStore];
  }, [dbApps, appliedJobs]);

  const mergedJobsForMatch = useMemo(() => {
    const byId = new Map<string, Job>();
    for (const row of dbApps ?? []) {
      if (isMockJobId(row.job_id)) continue;
      const j = rowToJob(row);
      byId.set(j.id, j);
    }
    for (const j of appliedJobs) {
      if (isMockJobId(j.id)) continue;
      if (!byId.has(j.id)) byId.set(j.id, j);
    }
    return [...byId.values()];
  }, [dbApps, appliedJobs]);

  const appliedCount = appliedJobIds.filter((id) => !isMockJobId(id)).length;
  const hasActivity = mergedTimestamps.length > 0;

  const avgMatch = useMemo(() => {
    const list = mergedJobsForMatch.filter((j) => typeof j.matchScore === "number");
    if (list.length) {
      const sum = list.reduce((a, j) => a + (j.matchScore ?? 0), 0);
      return Math.round(sum / list.length);
    }
    const preview = dashboardJobs.filter((j) => typeof j.matchScore === "number");
    if (preview.length) {
      const sum = preview.reduce((a, j) => a + (j.matchScore ?? 0), 0);
      return Math.round(sum / preview.length);
    }
    return null;
  }, [mergedJobsForMatch, dashboardJobs]);

  const seed = useMemo(() => {
    const parts = [
      filters.query ?? "",
      filters.location ?? "",
      filters.employmentType ?? "",
      String(filters.remoteOnly ?? false),
      String(appliedCount),
      String(avgMatch ?? 0),
    ];
    return hashString(parts.join("|"));
  }, [filters.query, filters.location, filters.employmentType, filters.remoteOnly, appliedCount, avgMatch]);

  const heatmapLevels = useMemo(() => {
    if (hasActivity) return heatmapLevelsFromDates(mergedTimestamps);
    const threshold = 0.54;
    const levels: number[] = [];
    for (let w = 0; w < WEEKS; w++) {
      for (let d = 0; d < DAYS; d++) {
        const n = ((w * 17 + d * 31 + seed * 13) % 100) / 100;
        if (n < threshold) levels.push(0);
        else levels.push(((w + d) % 3) + 1);
      }
    }
    return levels;
  }, [hasActivity, mergedTimestamps, seed]);

  const barCounts = useMemo(() => {
    if (hasActivity) return applicationsThisWeekByDay(mergedTimestamps);
    const sample = [2, 5, 3, 6, 4, 7, 5];
    const matchScale = clamp(avgMatch ?? 68, 45, 95) / 95;
    const jitter = Array.from({ length: 7 }, (_, i) => ((seed + i * 19) % 3) - 1);
    return sample.map((v, i) => clamp(Math.round(v * (0.82 + matchScale * 0.35) + jitter[i]!), 1, 7));
  }, [hasActivity, mergedTimestamps, avgMatch, seed]);

  const barMax = useMemo(() => Math.max(1, ...barCounts), [barCounts]);

  const linePercents = useMemo(() => {
    if (!hasActivity) {
      const sample = [62, 68, 71, 69, 74, 78, 80];
      const matchDelta = clamp(avgMatch ?? 68, 45, 95) - 68;
      const jitter = Array.from({ length: 7 }, (_, i) => ((seed + i * 31) % 5) - 2);
      return sample.map((v, i) => clamp(Math.round(v + matchDelta * 0.35 + jitter[i]!), 45, 90));
    }
    const bias = clamp(avgMatch ?? 62, 45, 95) - 60;
    return Array.from({ length: 7 }, (_, i) => {
      const n = (((seed + i * 131) % 2000) / 2000) * 18 - 9;
      const v = 62 + bias * 0.45 + n;
      return clamp(Math.round(v), 45, 90);
    });
  }, [hasActivity, avgMatch, seed]);

  const lineMaxPercent = useMemo(() => Math.max(...linePercents, 1), [linePercents]);

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
      const idxA = seed % skillPool.length;
      const idxB = (seed + 11) % skillPool.length;
      const idxC = (seed + 29) % skillPool.length;
      const picked = new Set<string>([skillPool[idxA]!, skillPool[idxB]!, skillPool[idxC]!]);
      while (picked.size < 3) picked.add(skillPool[(picked.size * 17 + seed) % skillPool.length]!);
      return Array.from(picked);
    }
    const picks = new Set<string>();
    while (picks.size < 3) {
      const idx = (seed + picks.size * 11) % skillPool.length;
      picks.add(skillPool[idx]!);
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

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

        {!hasActivity && (
          <div style={{ marginBottom: 24 }}>
            <RecruxEmptyState
              title="No applications tracked yet"
              description="Your progress chart will fully unlock here automatically once you start applying to roles."
              ctaLabel="Find roles to apply to"
              ctaTo="/jobs"
            />
          </div>
        )}

        <div style={section}>
          <h2 style={{ fontSize: 13, fontWeight: 500, color: R.darkest }}>Application streak</h2>
          <p style={{ fontSize: 11, color: R.deep, marginTop: 4 }}>
            {hasActivity
              ? "Last 12 weeks from your applications (darker = more activity that day)"
              : "Sample grid — apply to roles to see your real activity here"}
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
            <ContributionGridFromLevels levels={heatmapLevels} />
          </div>
        </div>

        <div style={section}>
          <h2 style={{ fontSize: 13, fontWeight: 500, color: R.darkest }}>Applications this week</h2>
          <p style={{ fontSize: 11, color: R.deep, marginTop: 4 }}>
            {hasActivity ? "Count per weekday (this calendar week)" : "Illustrative pattern until you apply"}
          </p>
          <div
            style={{
              display: "flex",
              height: BAR_AREA_PX + 28,
              alignItems: "stretch",
              gap: 8,
              marginTop: 12,
            }}
          >
            {barCounts.map((c, i) => {
              const hPx = Math.round((c / barMax) * BAR_AREA_PX);
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      maxWidth: 40,
                      height: BAR_AREA_PX,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      alignItems: "stretch",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        background: R.mid,
                        borderRadius: "4px 4px 0 0",
                        height: Math.max(hasActivity && c === 0 ? 4 : 0, hPx),
                        minHeight: hasActivity && c === 0 ? 4 : hPx > 0 ? 6 : 0,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 9, color: R.deep, marginTop: 6 }}>{dayLabels[i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={section}>
          <h2 style={{ fontSize: 13, fontWeight: 500, color: R.darkest }}>Avg match score</h2>
          <p style={{ fontSize: 11, color: R.deep, marginTop: 4 }}>
            {avgMatch != null
              ? `Current average from your applications: ${avgMatch}%`
              : "Match scores appear when roles include a match % (try Jobs or Dashboard previews)"}
          </p>
          <div
            style={{
              display: "flex",
              height: MATCH_CHART_PX + 8,
              alignItems: "stretch",
              gap: 6,
              marginTop: 12,
              borderBottom: `0.5px solid ${R.border}`,
            }}
          >
            {linePercents.map((v, i) => {
              const hPx = Math.round((v / lineMaxPercent) * MATCH_CHART_PX);
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      maxWidth: 28,
                      height: hPx,
                      minHeight: v > 0 ? 8 : 4,
                      background: `${R.primary}cc`,
                      borderRadius: "4px 4px 0 0",
                    }}
                  />
                </div>
              );
            })}
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
