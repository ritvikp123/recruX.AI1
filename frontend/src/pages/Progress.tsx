import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useJobStore } from "../store/useJobStore";
import { R } from "../recrux/theme";
import { supabase } from "../lib/supabase";
import { isMockJobId } from "../lib/mockJobs";
import type { Job } from "../types/job";
import { Link, useNavigate } from "react-router-dom";

const WEEKS = 12;
const DAYS = 7;
const BAR_AREA_PX = 96;
const MATCH_CHART_PX = 88;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function learningLinkForSkill(skill: string): string {
  const s = skill.toLowerCase();
  if (s.includes("kubernetes")) return "https://kubernetes.io/docs/tutorials/kubernetes-basics/";
  if (s.includes("system design")) return "https://github.com/donnemartin/system-design-primer";
  if (s.includes("ci/cd")) return "https://www.atlassian.com/continuous-delivery/ci-vs-ci-vs-cd";
  if (s.includes("graphql")) return "https://graphql.org/learn/";
  if (s.includes("docker")) return "https://docs.docker.com/get-started/";
  if (s.includes("performance")) return "https://web.dev/learn/performance";
  if (s.includes("security")) return "https://owasp.org/www-project-top-ten/";
  if (s.includes("database")) return "https://www.prisma.io/dataguide/datamodeling";
  return "https://roadmap.sh";
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
    skills: Array.isArray(raw.skills) ? (raw.skills as string[]) : raw.skills,
    postedAt: raw.postedAt,
    matchScore: typeof raw.matchScore === "number" ? raw.matchScore : undefined,
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

/** Jobs applied this calendar week (Mon–Sun), one bucket per weekday index 0=Mon. */
function jobsByWeekdayThisWeek(jobs: Job[]): Job[][] {
  const monday = startOfWeekMonday(new Date());
  const nextMonday = new Date(monday);
  nextMonday.setDate(nextMonday.getDate() + 7);
  const buckets: Job[][] = Array.from({ length: 7 }, () => []);
  for (const j of jobs) {
    if (!j.appliedAt) continue;
    const dt = new Date(j.appliedAt);
    if (dt < monday || dt >= nextMonday) continue;
    const ix = (dt.getDay() + 6) % 7;
    buckets[ix]!.push(j);
  }
  for (const b of buckets) {
    b.sort((a, c) => new Date(c.appliedAt!).getTime() - new Date(a.appliedAt!).getTime());
  }
  return buckets;
}

/** Average match % per weekday this week (0 if no scored applications that day). */
function matchPercentsByWeekday(jobs: Job[]): number[] {
  const monday = startOfWeekMonday(new Date());
  const nextMonday = new Date(monday);
  nextMonday.setDate(nextMonday.getDate() + 7);
  const buckets: { sum: number; n: number }[] = Array.from({ length: 7 }, () => ({ sum: 0, n: 0 }));
  for (const j of jobs) {
    if (!j.appliedAt || typeof j.matchScore !== "number") continue;
    const dt = new Date(j.appliedAt);
    if (dt < monday || dt >= nextMonday) continue;
    const ix = (dt.getDay() + 6) % 7;
    buckets[ix]!.sum += j.matchScore;
    buckets[ix]!.n += 1;
  }
  return buckets.map((b) => (b.n > 0 ? Math.round(b.sum / b.n) : 0));
}

/** Most common skills from roles the user applied to (for focus-area list). */
function topSkillsFromAppliedJobs(jobs: Job[], limit: number): string[] {
  const counts = new Map<string, { label: string; n: number }>();
  for (const j of jobs) {
    for (const s of j.skills ?? []) {
      const trimmed = String(s).trim();
      if (!trimmed) continue;
      const k = trimmed.toLowerCase();
      const prev = counts.get(k);
      if (prev) prev.n += 1;
      else counts.set(k, { label: trimmed, n: 1 });
    }
  }
  return [...counts.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, limit)
    .map((x) => x.label);
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
  const navigate = useNavigate();
  const weeks = ["M", "T", "W", "T", "F", "S", "S"];

  const appliedJobs = useJobStore((s) => s.appliedJobs);
  const dashboardJobs = useJobStore((s) => s.dashboardJobs);
  const pruneMockApplications = useJobStore((s) => s.pruneMockApplications);

  const [dbApps, setDbApps] = useState<DbApplicationRow[] | null>(null);
  const [dbReady, setDbReady] = useState(false);
  const [persistReady, setPersistReady] = useState(true);

  useEffect(() => {
    pruneMockApplications();
  }, [pruneMockApplications]);

  useEffect(() => {
    // Isolated data logic
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!user?.id) {
          setDbApps([]);
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
      } finally {
        if (!cancelled) setDbReady(true);
      }
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

  /** Avoid showing placeholder numbers before zustand persist + Supabase applications load. */
  const dataReady = persistReady && dbReady;
  const hasRealApplications = dataReady && mergedTimestamps.length > 0;

  const jobsThisWeekByDay = useMemo(
    () => jobsByWeekdayThisWeek(mergedJobsForMatch),
    [mergedJobsForMatch]
  );

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

  const heatmapLevels = useMemo(
    () => heatmapLevelsFromDates(hasRealApplications ? mergedTimestamps : []),
    [hasRealApplications, mergedTimestamps]
  );

  const barCounts = useMemo(
    () =>
      hasRealApplications ? applicationsThisWeekByDay(mergedTimestamps) : [0, 0, 0, 0, 0, 0, 0],
    [hasRealApplications, mergedTimestamps]
  );

  const barMax = useMemo(() => Math.max(1, ...barCounts), [barCounts]);

  const linePercents = useMemo(() => {
    if (!hasRealApplications) return [0, 0, 0, 0, 0, 0, 0];
    const byDay = matchPercentsByWeekday(mergedJobsForMatch);
    const hasAny = byDay.some((v) => v > 0);
    if (hasAny) return byDay.map((v) => clamp(v, 0, 100));
    if (avgMatch != null) return Array.from({ length: 7 }, () => clamp(avgMatch, 0, 100));
    return [0, 0, 0, 0, 0, 0, 0];
  }, [hasRealApplications, mergedJobsForMatch, avgMatch]);

  const lineMaxPercent = useMemo(() => Math.max(...linePercents, 1), [linePercents]);

  const skillFocusList = useMemo(
    () => topSkillsFromAppliedJobs(mergedJobsForMatch, 8),
    [mergedJobsForMatch]
  );

  const streakDays = useMemo(() => {
    if (!hasRealApplications) return 0;
    const counts = buildDayCounts(mergedTimestamps);
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 120; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const k = localYmd(d);
      if ((counts.get(k) ?? 0) > 0) streak += 1;
      else break;
    }
    return streak;
  }, [hasRealApplications, mergedTimestamps]);

  const weekApplicationTotal = useMemo(
    () => (hasRealApplications ? barCounts.reduce((a, b) => a + b, 0) : 0),
    [hasRealApplications, barCounts]
  );

  const bestMatchAmongApplied = useMemo(() => {
    const scores = mergedJobsForMatch
      .map((j) => j.matchScore)
      .filter((n): n is number => typeof n === "number");
    if (!scores.length) return null;
    return Math.max(...scores);
  }, [mergedJobsForMatch]);

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

        {dataReady && !hasRealApplications && (
          <div
            style={{
              marginBottom: 20,
              padding: 14,
              borderRadius: 12,
              border: panelHairline,
              background: R.light,
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 600, color: R.darkest, margin: "0 0 6px" }}>
              No applications tracked yet
            </p>
            <p style={{ fontSize: 12, color: R.body, margin: "0 0 12px", lineHeight: 1.5 }}>
              Mark roles as applied from Jobs or Saved — they sync here and fill your streak, weekly counts, and match
              trends from your real data.
            </p>
            <Link
              to="/jobs"
              style={{ fontSize: 13, fontWeight: 600, color: R.primary, textDecoration: "none" }}
            >
              Find roles to apply to →
            </Link>
          </div>
        )}

        {hasRealApplications && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Total applications", value: String(mergedJobsForMatch.length) },
              { label: "This week", value: String(weekApplicationTotal) },
              { label: "Current streak (days)", value: String(streakDays) },
              {
                label: "Best match",
                value: bestMatchAmongApplied != null ? `${bestMatchAmongApplied}%` : "—",
              },
            ].map((chip) => (
              <div
                key={chip.label}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  background: R.light,
                  border: panelHairline,
                  minWidth: 120,
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 600, color: R.muted, textTransform: "uppercase" }}>
                  {chip.label}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: R.primary, marginTop: 2 }}>{chip.value}</div>
              </div>
            ))}
          </div>
        )}

        <div style={section}>
          <h2 style={{ fontSize: 13, fontWeight: 500, color: R.darkest }}>Application streak</h2>
          <p style={{ fontSize: 11, color: R.deep, marginTop: 4 }}>
            {hasRealApplications
              ? "Last 12 weeks from your applications (darker = more activity that day)"
              : dataReady
                ? "Your application dates will appear here once you mark roles as applied."
                : "Loading your application history…"}
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
            {hasRealApplications
              ? "Count per weekday (this calendar week). Tap a day for details."
              : dataReady
                ? "Counts update from roles you mark as applied this week."
                : "Loading…"}
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
                <button
                  key={i}
                  type="button"
                  title={`View applications for ${dayLabels[i]}`}
                  onClick={() =>
                    navigate(`/progress/weekday/${i}`, {
                      state: {
                        dayLabel: dayLabels[i],
                        jobs: jobsThisWeekByDay[i] ?? [],
                      },
                    })
                  }
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    minWidth: 0,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    padding: "4px 2px 0",
                    fontFamily: "inherit",
                    borderRadius: 8,
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
                        height: Math.max(hasRealApplications && c === 0 ? 4 : 0, hPx),
                        minHeight: hasRealApplications && c === 0 ? 4 : hPx > 0 ? 6 : 0,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 9, color: R.deep, marginTop: 6 }}>{dayLabels[i]}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={section}>
          <h2 style={{ fontSize: 13, fontWeight: 500, color: R.darkest }}>Avg match score</h2>
          <p style={{ fontSize: 11, color: R.deep, marginTop: 4 }}>
            {!hasRealApplications
              ? "Average match appears after you apply to roles that have a match score (e.g. from Jobs or Dashboard)."
              : avgMatch != null
                ? `Average match across applications you applied to: ${avgMatch}%`
                : "Open Jobs with your resume loaded so roles get match scores, then apply — those scores show here by day."}
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
          <h2 style={{ fontSize: 13, fontWeight: 500, color: R.darkest }}>Skills from your applications</h2>
          <p style={{ fontSize: 11, color: R.deep, marginTop: 4 }}>
            {hasRealApplications
              ? "Skills listed on roles you applied to (most common first). Use links to go deeper on each topic."
              : "When job postings include skill tags, they will show here after you apply."}
          </p>
          {!hasRealApplications || skillFocusList.length === 0 ? (
            <p style={{ fontSize: 13, color: R.body, marginTop: 12 }}>
              {hasRealApplications
                ? "No skill tags were stored on those roles yet."
                : "Nothing to show until you have applications with skill metadata."}
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0" }}>
              {skillFocusList.map((skill) => (
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
                  <a
                    href={learningLinkForSkill(skill)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: R.primary,
                      textDecoration: "none",
                    }}
                  >
                    Start learning
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
