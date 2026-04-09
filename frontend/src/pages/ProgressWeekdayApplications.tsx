import { useMemo } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { R } from "../recrux/theme";

export type MockApplicationStatus = "accepted" | "rejected" | "in_progress";

export type MockDayApplication = {
  id: string;
  jobTitle: string;
  company: string;
  status: MockApplicationStatus;
  appliedAtLabel: string;
};

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

const COMPANIES = [
  "Northwind Labs",
  "Aurora Systems",
  "Contoso Analytics",
  "Globex Tech",
  "Initech",
  "Soylent Engineering",
  "Fabrikam Digital",
];

const TITLES = [
  "Software Engineer",
  "Full Stack Developer",
  "Frontend Engineer",
  "Backend Engineer",
  "Data Engineer",
  "DevOps Engineer",
  "Product Engineer",
];

/** Deterministic mock list for the selected weekday (demo-only). */
export function buildMockApplicationsForWeekday(dayIndex: number, count: number): MockDayApplication[] {
  const n = Math.max(0, Math.min(20, count));
  const statuses: MockApplicationStatus[] = ["in_progress", "accepted", "rejected"];
  const monday = startOfWeekMonday(new Date());
  const dayDate = new Date(monday);
  dayDate.setDate(dayDate.getDate() + dayIndex);

  return Array.from({ length: n }, (_, i) => {
    const h = 9 + ((dayIndex * 2 + i * 3) % 8);
    const m = (i * 17) % 60;
    const t = new Date(dayDate);
    t.setHours(h, m, 0, 0);
    return {
      id: `mock-weekday-${dayIndex}-${i}`,
      jobTitle: TITLES[(dayIndex + i) % TITLES.length]!,
      company: COMPANIES[(dayIndex * 2 + i) % COMPANIES.length]!,
      status: statuses[(dayIndex + i * 2) % 3]!,
      appliedAtLabel: t.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
    };
  });
}

function statusStyle(status: MockApplicationStatus): { bg: string; color: string; label: string } {
  switch (status) {
    case "accepted":
      return { bg: "rgba(22, 101, 52, 0.12)", color: "#166534", label: "Accepted" };
    case "rejected":
      return { bg: "rgba(185, 28, 28, 0.12)", color: "#b91c1c", label: "Rejected" };
    default:
      return { bg: "rgba(24, 95, 165, 0.12)", color: R.primary, label: "In progress" };
  }
}

const hairline = `0.5px solid ${R.border}`;

type LocationState = { count?: number; dayLabel?: string } | null;

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

  const fallbackCount = useMemo(() => 3 + ((valid ? dayIndex : 0) % 4), [dayIndex, valid]);
  const count = typeof state?.count === "number" && state.count >= 0 ? state.count : fallbackCount;

  const applications = useMemo(
    () => (valid ? buildMockApplicationsForWeekday(dayIndex, count) : []),
    [dayIndex, count, valid]
  );

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
          Demo data: {applications.length} application{applications.length === 1 ? "" : "s"} for this day. Statuses are
          placeholders until real tracking is connected.
        </p>

        {applications.length === 0 ? (
          <p style={{ fontSize: 14, color: R.body }}>No applications for this day.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {applications.map((app) => {
              const st = statusStyle(app.status);
              return (
                <li
                  key={app.id}
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: R.darkest }}>{app.jobTitle}</p>
                      <p style={{ margin: "4px 0 0", fontSize: 13, color: R.body }}>{app.company}</p>
                      <p style={{ margin: "6px 0 0", fontSize: 12, color: R.muted }}>Applied at {app.appliedAtLabel}</p>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "6px 10px",
                        borderRadius: 999,
                        background: st.bg,
                        color: st.color,
                        flexShrink: 0,
                      }}
                    >
                      {st.label}
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
