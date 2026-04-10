import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { R } from "../recrux/theme";
import { supabase } from "../lib/supabase";
import { fetchAppliedJobs } from "../lib/savedJobsApi";
import type { Job } from "../types/job";
import { isMockJobId } from "../lib/mockJobs";

function startOfWeekMonday(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function formatLongDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function filterJobsForWeekday(jobs: Job[], dayIndex: number): Job[] {
  const monday = startOfWeekMonday(new Date());
  const nextMonday = new Date(monday);
  nextMonday.setDate(nextMonday.getDate() + 7);
  return jobs
    .filter((j) => {
      if (!j.appliedAt) return false;
      const dt = new Date(j.appliedAt);
      if (dt < monday || dt >= nextMonday) return false;
      const ix = (dt.getDay() + 6) % 7;
      return ix === dayIndex;
    })
    .sort((a, b) => new Date(b.appliedAt!).getTime() - new Date(a.appliedAt!).getTime());
}

const hairline = `0.5px solid ${R.border}`;

type LocationState = { dayLabel?: string; jobs?: Job[] } | null;

export function ProgressWeekdayApplications() {
  const { dayIndex: dayParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState) ?? null;

  const dayIndex = Number.parseInt(dayParam ?? "", 10);
  const valid = Number.isFinite(dayIndex) && dayIndex >= 0 && dayIndex <= 6;

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayLabel = state?.dayLabel ?? (valid ? dayLabels[dayIndex] : "—");

  const monday = startOfWeekMonday(new Date());
  const targetDate = useMemo(() => {
    const d = new Date(monday);
    d.setDate(d.getDate() + (valid ? dayIndex : 0));
    return d;
  }, [monday, dayIndex, valid]);

  const navigatedJobs = useMemo(() => {
    if (state && Array.isArray(state.jobs)) {
      return state.jobs.filter((j) => !isMockJobId(j.id));
    }
    return null;
  }, [state]);

  const [applications, setApplications] = useState<Job[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!valid) {
      setApplications([]);
      setLoading(false);
      return;
    }

    if (navigatedJobs !== null) {
      setApplications(navigatedJobs);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!user?.id) {
          setApplications([]);
          return;
        }
        const jobs = await fetchAppliedJobs(user.id);
        if (cancelled) return;
        const real = jobs.filter((j) => !isMockJobId(j.id));
        setApplications(filterJobsForWeekday(real, dayIndex));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [valid, dayIndex, navigatedJobs]);

  if (!valid) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ color: R.darkest }}>Invalid day.</p>
        <Link to="/progress" style={{ color: R.primary }}>
          Back to Progress
        </Link>
      </div>
    );
  }

  const list = applications ?? [];

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "none",
        margin: 0,
        minHeight: "calc(100vh - 56px)",
        boxSizing: "border-box",
        background: R.card,
        border: hairline,
        borderRadius: 16,
        boxShadow: "0 4px 28px rgba(4, 44, 83, 0.1), 0 1px 3px rgba(0, 0, 0, 0.06)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ height: 4, background: `linear-gradient(90deg, ${R.primary}, ${R.mid})` }} />
      <div style={{ padding: 20, flex: 1, minHeight: 0, overflowY: "auto" }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            border: "none",
            background: "transparent",
            color: R.primary,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            padding: 0,
            marginBottom: 12,
          }}
        >
          ← Back to Progress
        </button>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: R.darkest, margin: "0 0 6px" }}>
          Applications · {dayLabel}
        </h1>
        <p style={{ fontSize: 13, color: R.body, margin: "0 0 8px", lineHeight: 1.5 }}>
          {formatLongDate(targetDate)}
        </p>
        <p style={{ fontSize: 12, color: R.deep, margin: "0 0 20px", lineHeight: 1.5 }}>
          {loading
            ? "Loading your applications…"
            : `${list.length} application${list.length === 1 ? "" : "s"} recorded for this day.`}
        </p>

        {loading ? (
          <p style={{ fontSize: 14, color: R.body }}>Loading…</p>
        ) : list.length === 0 ? (
          <p style={{ fontSize: 14, color: R.body }}>No applications for this day.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {list.map((job) => {
              const t = job.appliedAt ? new Date(job.appliedAt) : null;
              const appliedAtLabel = t
                ? t.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
                : "";
              return (
                <li
                  key={job.id}
                  style={{
                    border: hairline,
                    borderRadius: 12,
                    padding: "14px 16px",
                    background: R.light,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: R.darkest }}>{job.title}</p>
                      <p style={{ margin: "4px 0 0", fontSize: 13, color: R.body }}>{job.company}</p>
                      {appliedAtLabel ? (
                        <p style={{ margin: "6px 0 0", fontSize: 12, color: R.muted }}>Applied at {appliedAtLabel}</p>
                      ) : null}
                      {typeof job.matchScore === "number" ? (
                        <p style={{ margin: "6px 0 0", fontSize: 12, color: R.deep }}>
                          Match when applied: {job.matchScore}%
                        </p>
                      ) : null}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "6px 10px",
                        borderRadius: 999,
                        background: "rgba(24, 95, 165, 0.12)",
                        color: R.primary,
                        flexShrink: 0,
                      }}
                    >
                      Applied
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
