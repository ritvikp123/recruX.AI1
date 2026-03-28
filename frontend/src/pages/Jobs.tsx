import { scoreJob } from "../lib/api";
import { useEffect, useMemo, useRef, useState } from "react";
import { Filter, SlidersHorizontal, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useJobStore } from "../store/useJobStore";
import { supabase } from "../lib/supabase";
import { computeMatchScore } from "../lib/matchScore";
import { mapJobToRecruxCard } from "../recrux/mapJobToCard";
import { R } from "../recrux/theme";
import { RecruxJobCard } from "../components/recrux/RecruxJobCard";
import { RecruxMatchBreakdown } from "../components/recrux/RecruxMatchBreakdown";
import { RecruxJobCardSkeletonList } from "../components/recrux/RecruxJobCardSkeleton";
import { RecruxEmptyState } from "../components/recrux/RecruxEmptyState";
import type { Job } from "../types/job";

const hairline = `0.5px solid ${R.border}`;

const EMPLOYMENT_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Any type" },
  { value: "FULLTIME", label: "Full-time" },
  { value: "CONTRACTOR", label: "Contractor" },
  { value: "PARTTIME", label: "Part-time" },
  { value: "INTERN", label: "Intern" },
];

const MATCH_PRESETS = [
  { label: "Any", value: 0 },
  { label: "60%+", value: 60 },
  { label: "70%+", value: 70 },
  { label: "80%+", value: 80 },
];

type SortKey = "match-desc" | "match-asc" | "title" | "company";

type WorkMode = "ANY" | "REMOTE" | "HYBRID" | "INPERSON";

const WORK_MODE_OPTIONS: { value: WorkMode; label: string }[] = [
  { value: "ANY", label: "Any" },
  { value: "REMOTE", label: "Remote" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "INPERSON", label: "In-person" },
];

function buildJobDescriptionForScore(job: Job): string {
  const parts = [
    job.title,
    job.company,
    job.location,
    job.description,
    Array.isArray(job.skills) && job.skills.length ? `Skills: ${job.skills.join(", ")}` : "",
  ].filter(Boolean);
  const s = parts.join("\n").trim();
  if (s.length > 0) return s;
  return [job.title, job.company, job.location].filter(Boolean).join(" · ").trim() || "Job listing";
}

export function Jobs() {
  const [salaryMin, setSalaryMin] = useState("");
  const [minMatch, setMinMatch] = useState(0);
  const [companyFilter, setCompanyFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("match-desc");
  const [hideApplied, setHideApplied] = useState(false);
  const [workMode, setWorkMode] = useState<WorkMode>("ANY");
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [apiMatchScore, setApiMatchScore] = useState<number | null>(null);
  const [apiMatchReasoning, setApiMatchReasoning] = useState<string | null>(null);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const queryInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const jobs = useJobStore((s) => s.jobs);
  const jobsLoading = useJobStore((s) => s.jobsLoading);
  const error = useJobStore((s) => s.error);
  const filters = useJobStore((s) => s.filters);
  const setFilters = useJobStore((s) => s.setFilters);
  const fetchJobs = useJobStore((s) => s.fetchJobs);
  const selectedJob = useJobStore((s) => s.selectedJob);
  const setSelectedJob = useJobStore((s) => s.setSelectedJob);
  const loadResumeFromSupabase = useJobStore((s) => s.loadResumeFromSupabase);
  const resumeText = useJobStore((s) => s.resumeText);
  const savedJobs = useJobStore((s) => s.savedJobs);
  const appliedJobIds = useJobStore((s) => s.appliedJobIds);
  const toggleSaveJob = useJobStore((s) => s.toggleSaveJob);
  const recordApplication = useJobStore((s) => s.recordApplication);

  useEffect(() => {
    if (user?.id) void loadResumeFromSupabase(user.id);
  }, [user?.id, loadResumeFromSupabase]);

  useEffect(() => {
    if (!user?.id) return;
    setPrefsLoaded(false);
    void (async () => {
      try {
        const { data: prefs } = await supabase
          .from("user_preferences")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!prefs) return;

        const roles = Array.isArray(prefs.roles) ? (prefs.roles as string[]) : [];
        const industries = Array.isArray(prefs.industries) ? (prefs.industries as string[]) : [];
        const employmentTypes = Array.isArray(prefs.employment_types) ? (prefs.employment_types as string[]) : [];
        const workLocation = Array.isArray(prefs.work_location) ? (prefs.work_location as string[]) : [];

        const query = roles[0] || industries[0] || "Software Engineer";

        const employmentType = (() => {
          if (employmentTypes.some((t) => t.includes("Full-Time"))) return "FULLTIME";
          if (employmentTypes.some((t) => t.includes("Part-Time"))) return "PARTTIME";
          if (employmentTypes.some((t) => t.includes("Intern") || t.includes("Co-op"))) return "INTERN";
          if (employmentTypes.some((t) => t.includes("Contract") || t.includes("Temporary"))) return "CONTRACTOR";
          return "";
        })();

        const remoteOnly =
          workLocation.some((w) => w.includes("Fully Remote")) &&
          !workLocation.some((w) => w.includes("Hybrid") || w.includes("On-Site"));

        // Pre-seed client-side work-mode dropdown for better UX.
        const derivedWorkMode: WorkMode =
          workLocation.some((w) => w.includes("Fully Remote")) &&
          !workLocation.some((w) => w.includes("Hybrid") || w.includes("On-Site"))
            ? "REMOTE"
            : workLocation.some((w) => w.includes("Hybrid"))
              ? "HYBRID"
              : workLocation.some((w) => w.includes("On-Site"))
                ? "INPERSON"
                : "ANY";

        setWorkMode(derivedWorkMode);
        setFilters({
          query,
          remoteOnly,
          employmentType,
          location: "",
        });
      } catch {
        // If prefs aren't available yet, fall back to existing defaults.
      } finally {
        setPrefsLoaded(true);
      }
    })();
  }, [user?.id, setFilters]);

  useEffect(() => {
    if (!prefsLoaded) return;
    void fetchJobs(computeMatchScore);
  }, [fetchJobs, resumeText, prefsLoaded]);

  useEffect(() => {
    if (!selectedJob) {
      setApiMatchScore(null);
      setApiMatchReasoning(null);
      setScoreError(null);
      setScoreLoading(false);
      return;
    }

    const resume = resumeText?.trim() ?? "";
    const jd = buildJobDescriptionForScore(selectedJob);

    if (!resume) {
      setApiMatchScore(null);
      setApiMatchReasoning(null);
      setScoreError("Add a resume (Resume page) to get an AI match score.");
      setScoreLoading(false);
      return;
    }

    if (!jd) {
      setApiMatchScore(null);
      setApiMatchReasoning(null);
      setScoreError("This listing has no description to score against.");
      setScoreLoading(false);
      return;
    }

    let cancelled = false;
    setScoreLoading(true);
    setScoreError(null);

    void scoreJob(resume, jd)
      .then((data) => {
        if (cancelled) return;
        const first = data.scores[0];
        if (!first) {
          setApiMatchScore(null);
          setApiMatchReasoning(null);
          setScoreError("No score returned.");
          return;
        }
        setApiMatchScore(first.match_score);
        setApiMatchReasoning(first.reasoning ?? null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        setApiMatchScore(null);
        setApiMatchReasoning(null);
        setScoreError(msg);
      })
      .finally(() => {
        if (!cancelled) setScoreLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedJob, resumeText]);
  const savedIds = new Set(savedJobs.map((j) => j.id));
  const appliedSet = useMemo(() => new Set(appliedJobIds), [appliedJobIds]);

  const filtered = useMemo(() => {
    const qCompany = companyFilter.trim().toLowerCase();
    let list = jobs.filter((j) => {
      if (filters.location && !j.location?.toLowerCase().includes(filters.location.toLowerCase())) return false;
      if (salaryMin && j.salaryMax && j.salaryMax < Number(salaryMin) * 1000) return false;
      if (filters.remoteOnly && j.remote !== true) return false;
      if (workMode !== "ANY") {
        const text = `${j.title} ${j.description} ${j.location}`.toLowerCase();
        const derived: WorkMode = j.remote === true ? "REMOTE" : text.includes("hybrid") ? "HYBRID" : "INPERSON";
        if (derived !== workMode) return false;
      }
      if (qCompany && !j.company?.toLowerCase().includes(qCompany)) return false;
      if (minMatch > 0 && (j.matchScore ?? 0) < minMatch) return false;
      if (hideApplied && appliedSet.has(j.id)) return false;
      return true;
    });

    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sortBy) {
        case "match-desc":
          return (b.matchScore ?? 0) - (a.matchScore ?? 0);
        case "match-asc":
          return (a.matchScore ?? 0) - (b.matchScore ?? 0);
        case "title":
          return a.title.localeCompare(b.title);
        case "company":
          return a.company.localeCompare(b.company);
        default:
          return 0;
      }
    });
    return sorted;
  }, [
    jobs,
    filters.location,
    filters.remoteOnly,
    salaryMin,
    companyFilter,
    minMatch,
    hideApplied,
    appliedSet,
    sortBy,
  ]);

  const gapSkills = ["System design", "Kubernetes", "GraphQL"];

    const breakdownForJob = (j: Job) => {
    const m = apiMatchScore ?? j.matchScore ?? 70;
    return [
      { label: "Skills", pct: Math.min(99, m + 5) },
      { label: "Experience", pct: m },
      { label: "Keywords", pct: Math.max(0, m - 8) },
      { label: "Education", pct: 85 },
    ];
  };

  const inputStyle = {
    border: hairline,
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 13,
    color: R.darkest,
    width: "100%",
    boxSizing: "border-box" as const,
    background: R.card,
    fontFamily: "inherit",
  };

  const labelStyle = { display: "block", fontSize: 11, fontWeight: 600, color: R.deep, marginBottom: 6 } as const;

  const focusSearch = () => {
    queryInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => queryInputRef.current?.focus(), 300);
  };

  const clearAllFilters = () => {
    setSalaryMin("");
    setCompanyFilter("");
    setMinMatch(0);
    setSortBy("match-desc");
    setHideApplied(false);
    setWorkMode("ANY");
    setFilters({ query: filters.query, location: "", remoteOnly: false, employmentType: "" });
  };

  const hasRefinements =
    minMatch > 0 ||
    !!companyFilter.trim() ||
    sortBy !== "match-desc" ||
    hideApplied ||
    workMode !== "ANY" ||
    !!filters.location ||
    !!salaryMin ||
    !!filters.employmentType;

  return (
    <div className={`recrux-jobs-grid${selectedJob ? " has-detail" : ""}`}>
      <div style={{ padding: 20, overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
          <div>
            <h1 className="recrux-heading" style={{ fontSize: 26, fontWeight: 700, color: R.darkest, margin: 0, letterSpacing: "-0.02em" }}>
              Jobs
            </h1>
            <p style={{ fontSize: 14, color: R.body, margin: "8px 0 0", maxWidth: 520, lineHeight: 1.5 }}>
              Search live listings, then refine by match, company, and more — without leaving the list.
            </p>
          </div>
          {jobs.length > 0 && (
            <div
              style={{
                padding: "10px 16px",
                borderRadius: 12,
                background: R.light,
                border: hairline,
                fontSize: 13,
                fontWeight: 600,
                color: R.darkest,
              }}
            >
              Showing{" "}
              <span style={{ color: R.primary }}>{filtered.length}</span> of {jobs.length}
            </div>
          )}
        </div>

        {/* Search + API filters */}
        <div
          style={{
            background: R.card,
            border: hairline,
            borderRadius: 14,
            overflow: "hidden",
            marginBottom: 14,
            boxShadow: "0 2px 12px rgba(4, 44, 83, 0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              borderBottom: hairline,
              background: `linear-gradient(90deg, ${R.light}, ${R.card})`,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: R.card,
                border: hairline,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: R.primary,
              }}
            >
              <Filter size={18} strokeWidth={2} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: R.deep }}>
                Search
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: R.body }}>Hits the job API — use Refine below for instant list updates.</p>
            </div>
          </div>
          <div style={{ padding: 16, display: "flex", flexWrap: "wrap", gap: 14, alignItems: "flex-end" }}>
            <div style={{ flex: "1 1 200px", minWidth: 0 }}>
              <label style={labelStyle}>Role / keywords</label>
              <input
                ref={queryInputRef}
                value={filters.query}
                onChange={(e) => setFilters({ query: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: "1 1 160px", minWidth: 0 }}>
              <label style={labelStyle}>Location</label>
              <input
                value={filters.location}
                onChange={(e) => setFilters({ location: e.target.value })}
                placeholder="City or remote"
                style={inputStyle}
              />
            </div>
            <div style={{ flex: "1 1 140px", minWidth: 0 }}>
              <label style={labelStyle}>Employment</label>
              <select
                value={filters.employmentType}
                onChange={(e) => setFilters({ employmentType: e.target.value })}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {EMPLOYMENT_OPTIONS.map((o) => (
                  <option key={o.value || "any"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: "0 0 120px" }}>
              <label style={labelStyle}>Min salary (K)</label>
              <input
                type="number"
                min={0}
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                style={inputStyle}
              />
            </div>
              <div style={{ flex: "1 1 170px", minWidth: 0 }}>
                <label style={labelStyle}>Work mode</label>
                <select
                  value={workMode}
                  onChange={(e) => {
                    const v = e.target.value as WorkMode;
                    setWorkMode(v);
                    setFilters({ remoteOnly: v === "REMOTE" });
                  }}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  {WORK_MODE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            <button
              type="button"
              onClick={() => void fetchJobs(computeMatchScore)}
              style={{
                background: R.primary,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "12px 22px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Run search
            </button>
          </div>
        </div>

        {/* Client-side refine */}
        <div
          style={{
            background: R.card,
            border: hairline,
            borderRadius: 14,
            overflow: "hidden",
            marginBottom: 20,
            boxShadow: "0 2px 12px rgba(4, 44, 83, 0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              borderBottom: hairline,
              background: `linear-gradient(90deg, rgba(24,95,165,0.06), ${R.card})`,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: R.light,
                border: hairline,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: R.primary,
              }}
            >
              <SlidersHorizontal size={18} strokeWidth={2} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: R.deep }}>
                Refine results
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: R.body }}>Instant filters on the current result set — no extra API call.</p>
            </div>
            {hasRefinements && (
              <button
                type="button"
                onClick={clearAllFilters}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  color: R.primary,
                  background: "transparent",
                  border: hairline,
                  borderRadius: 10,
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  flexShrink: 0,
                }}
              >
                <X size={14} strokeWidth={2.5} />
                Clear filters
              </button>
            )}
          </div>
          <div style={{ padding: 16 }}>
            <p style={{ ...labelStyle, marginBottom: 8 }}>Minimum match</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {MATCH_PRESETS.map((p) => {
                const active = minMatch === p.value;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setMinMatch(p.value)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: "inherit",
                      cursor: "pointer",
                      border: active ? `2px solid ${R.primary}` : hairline,
                      background: active ? R.light : R.card,
                      color: active ? R.primary : R.darkest,
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "flex-end" }}>
              <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                <label style={labelStyle}>Company contains</label>
                <input
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  placeholder="e.g. Stripe"
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                <label style={labelStyle}>Sort by</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)} style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="match-desc">Match (high → low)</option>
                  <option value="match-asc">Match (low → high)</option>
                  <option value="title">Job title (A–Z)</option>
                  <option value="company">Company (A–Z)</option>
                </select>
              </div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  color: R.darkest,
                  cursor: "pointer",
                  paddingBottom: 10,
                }}
              >
                <input type="checkbox" checked={hideApplied} onChange={(e) => setHideApplied(e.target.checked)} />
                Hide already applied
              </label>
            </div>
          </div>
        </div>

        {error && <p style={{ fontSize: 13, color: R.warnText, marginBottom: 12 }}>{error}</p>}

        {jobsLoading ? (
          <RecruxJobCardSkeletonList count={5} />
        ) : jobs.length === 0 ? (
          <RecruxEmptyState
            variant="search"
            title="No jobs loaded yet"
            description="Try a search with different keywords, or check your connection and API key if results stay empty."
            ctaLabel="Search your first job"
            onCtaClick={focusSearch}
          />
        ) : filtered.length === 0 ? (
          <RecruxEmptyState
            variant="search"
            title="No roles match your filters"
            description="Relax match threshold, company text, or hide-applied — or clear filters and run search again."
            ctaLabel="Clear filters"
            onCtaClick={() => {
              clearAllFilters();
              void fetchJobs(computeMatchScore);
            }}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((job) => (
              <div
                key={job.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedJob(job)}
                onKeyDown={(e) => e.key === "Enter" && setSelectedJob(job)}
                style={{
                  outline: selectedJob?.id === job.id ? `2px solid ${R.primary}` : undefined,
                  borderRadius: 10,
                }}
              >
                <RecruxJobCard
                  job={mapJobToRecruxCard(job)}
                  saved={savedIds.has(job.id)}
                  onToggleSave={() => toggleSaveJob(job)}
                  onApply={(url) => {
                    recordApplication(job);
                    if (url) window.open(url, "_blank", "noopener");
                  }}
                  onOptimize={() => {}}
                  onWhy={() => setSelectedJob(job)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedJob && (
        <div
          style={{
            borderLeft: hairline,
            background: R.card,
            padding: 18,
            overflowY: "auto",
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedJob(null)}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: R.primary,
              background: "none",
              border: "none",
              cursor: "pointer",
              marginBottom: 12,
              fontFamily: "inherit",
            }}
          >
            Close
          </button>
          <h2 style={{ fontSize: 16, fontWeight: 500, color: R.darkest }}>{selectedJob.title}</h2>
          <p style={{ fontSize: 12, color: R.deep }}>
            {selectedJob.company} · {selectedJob.location}
          </p>
          <p
            style={{
              fontSize: 11,
              color: R.deep,
              lineHeight: 1.5,
              marginTop: 12,
              maxHeight: 200,
              overflowY: "auto",
            }}
          >
            {selectedJob.description || "No description."}
          </p>
          {scoreLoading && (
            <p style={{ fontSize: 11, color: R.deep, marginTop: 12 }}>Scoring match…</p>
          )}
          {scoreError && !scoreLoading && (
            <p style={{ fontSize: 11, color: R.warnText, marginTop: 12 }}>{scoreError}</p>
          )}
          {apiMatchReasoning && !scoreLoading && (
            <p style={{ fontSize: 11, color: R.deep, lineHeight: 1.5, marginTop: 12 }}>
              {apiMatchReasoning}
            </p>
          )}
          <div style={{ marginTop: 16 }}>
            <RecruxMatchBreakdown breakdown={breakdownForJob(selectedJob)} />
          </div>
          <p style={{ fontSize: 11, fontWeight: 500, color: R.darkest, marginTop: 12 }}>Skill gaps</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
            {gapSkills.map((s) => (
              <span
                key={s}
                style={{
                  fontSize: 10,
                  padding: "3px 8px",
                  borderRadius: 10,
                  background: R.gapBg,
                  color: R.gapText,
                }}
              >
                {s}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => {
                recordApplication(selectedJob);
                window.open(selectedJob.applyUrl || "#", "_blank");
              }}
              style={{
                fontSize: 11,
                background: R.primary,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 14px",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Apply
            </button>
            <button
              type="button"
              style={{
                fontSize: 11,
                background: "transparent",
                color: R.deep,
                border: hairline,
                borderRadius: 8,
                padding: "8px 14px",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Optimize
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
