import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";
import { JobCard } from "../components/JobCard";
import { JobDetailPanel } from "../components/JobDetailPanel";
import { PreferencesModal } from "../components/PreferencesModal";
import { useJobs } from "../../hooks/useJobs";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { Toast } from "../../components/Toast";
import type { Job } from "../../types/jobs";

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];
const EXPERIENCE = ["Intern/New Grad", "Entry", "Mid", "Senior"];
const WORK_SETTING = ["Remote", "Hybrid", "On-site"];
const DATE_POSTED = ["Last 24h", "Last week", "Last month"];
const FIELDS = ["AI/ML", "Software Eng", "Cybersecurity", "Cloud", "Data", "DevOps", "Full Stack", "Other"];

function mapExperienceToFilter(level?: string): string {
  if (!level) return "";
  const t = level.toLowerCase();
  if (t.includes("intern") || t.includes("new grad")) return "Intern/New Grad";
  if (t.includes("entry")) return "Entry";
  if (t.includes("mid")) return "Mid";
  if (t.includes("senior") || t.includes("lead")) return "Senior";
  return "";
}

export function SearchJobsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const [query, setQuery] = useState(q);
  const [searchQuery, setSearchQuery] = useState(q || "Software Engineer");
  const [jobTypes, setJobTypes] = useState<Set<string>>(new Set());
  const [experience, setExperience] = useState<Set<string>>(new Set());
  const [workSetting, setWorkSetting] = useState<Set<string>>(new Set());
  const [datePosted, setDatePosted] = useState<string>("");
  const [field, setField] = useState<string>("");
  const [salaryMin, setSalaryMin] = useState(0);
  const [sort, setSort] = useState<"best" | "recent" | "salary">("best");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showPrefsPrompt, setShowPrefsPrompt] = useState(false);
  const [prefsModalOpen, setPrefsModalOpen] = useState(false);
  const [targetField, setTargetField] = useState<string>("Software Engineer");
  const [preferredLocation, setPreferredLocation] = useState<string>("United States");
  const [experienceLevel, setExperienceLevel] = useState<string>("Entry Level");
  const [workSettingPref, setWorkSettingPref] = useState<string>("");

  const jobType = jobTypes.size > 0 ? [...jobTypes][0] : "";
  const workSettingVal = workSetting.size > 0 ? [...workSetting][0] : workSettingPref || "";
  const experienceVal = experience.size > 0 ? [...experience][0] : mapExperienceToFilter(experienceLevel) || "";

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("preferred_categories, target_field, preferred_location, experience_level, work_setting")
        .eq("id", user.id)
        .single();
      if (data) {
        if (data.preferred_location) setPreferredLocation(data.preferred_location as string);
        if (data.experience_level) setExperienceLevel(data.experience_level as string);
        if (data.work_setting) setWorkSettingPref(data.work_setting as string);
      }
      let hasField = false;
      let hasExperience = false;
      if (data?.preferred_categories?.length) {
        setTargetField((data.preferred_categories as string[])[0]);
        hasField = true;
      } else if (data?.target_field) {
        setTargetField(data.target_field as string);
        hasField = true;
      } else if ((user as { user_metadata?: { target_field?: string } }).user_metadata?.target_field) {
        const tf = (user as { user_metadata?: { target_field?: string } }).user_metadata!.target_field!;
        setTargetField(tf);
        hasField = true;
      }
      if (data?.experience_level) hasExperience = true;
      setShowPrefsPrompt(!hasField || !hasExperience);
      if (hasField && !q) {
        const defaultQuery = data?.target_field || (data?.preferred_categories as string[])?.[0] || "Software Engineer";
        setSearchQuery(defaultQuery);
        setQuery(defaultQuery);
      }
    };
    load();
  }, [user?.id, q]);

  const { jobs, loading, error, refetch } = useJobs({
    query: searchQuery,
    field: field || targetField || undefined,
    location: preferredLocation || undefined,
    jobType: jobType || undefined,
    workSetting: workSettingVal || undefined,
    datePosted: datePosted || undefined,
    experience: experienceVal || undefined,
    userProfile: {
      target_field: targetField,
      skills: (user as { user_metadata?: Record<string, unknown> })?.user_metadata?.skills as string[] | undefined,
    },
  });

  const toggleFilter = (set: Set<string>, key: string, updater: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    updater(next);
  };

  const handleSearch = () => {
    setSearchQuery(query || "Software Engineer");
    setPage(1);
  };

  const filteredJobs = [...jobs].filter((j) => {
    if (salaryMin > 0) {
      const m = j.salary.match(/\$[\d,]+/);
      const num = m ? parseInt(m[0].replace(/[$,K]/g, ""), 10) * 1000 : 0;
      if (num > 0 && num < salaryMin * 1000) return false;
    }
    return true;
  });

  const sortedJobs =
    sort === "recent"
      ? [...filteredJobs].sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())
      : sort === "salary"
        ? [...filteredJobs].sort((a, b) => b.match - a.match)
        : filteredJobs;

  const PAGE_SIZE = 12;
  const totalPages = Math.ceil(sortedJobs.length / PAGE_SIZE);
  const paginatedJobs = sortedJobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setSearchParams((p) => {
      const next = new URLSearchParams(p);
      if (searchQuery && searchQuery !== "Software Engineer") next.set("q", searchQuery);
      else next.delete("q");
      return next;
    });
  }, [searchQuery, setSearchParams]);

  useEffect(() => {
    setSearchQuery(q || "Software Engineer");
    setQuery(q || "");
  }, [q]);

  const clearFilters = () => {
    setJobTypes(new Set());
    setExperience(new Set());
    setWorkSetting(new Set());
    setDatePosted("");
    setField("");
    setSalaryMin(0);
  };

  const saveSearch = async () => {
    if (!user?.id) return;
    await supabase.from("saved_searches").insert({
      user_id: user.id,
      query: searchQuery,
      filters: { jobTypes: [...jobTypes], experience: [...experience], workSetting: [...workSetting], datePosted, field, salaryMin },
    });
    setToast({ message: "Search saved!", type: "success" });
  };

  const toggleSaved = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex gap-6">
      <PreferencesModal
        open={prefsModalOpen}
        onClose={() => setPrefsModalOpen(false)}
        initialField={targetField}
        initialExperience={experienceLevel}
        initialLocation={preferredLocation}
        initialWorkSetting={workSettingPref}
        onSave={async ({ targetField: tf, experienceLevel: exp, preferredLocation: loc, workSetting: ws }) => {
          if (!user?.id) return;
          setTargetField(tf);
          setExperienceLevel(exp);
          setPreferredLocation(loc);
          setWorkSettingPref(ws);
          setShowPrefsPrompt(false);
          if (!query) {
            setSearchQuery(tf || "Software Engineer");
            setQuery(tf || "Software Engineer");
          }
          await supabase.from("profiles").upsert({
            id: user.id,
            target_field: tf,
            preferred_categories: [tf],
            preferred_location: loc || null,
            experience_level: exp || null,
            work_setting: ws || null,
            updated_at: new Date().toISOString(),
          });
          refetch();
        }}
      />

      <aside className="hidden w-[240px] shrink-0 space-y-4 lg:block">
        <div className="rounded-card border bg-bg-card p-4" style={{ borderColor: "var(--border)" }}>
          <h3 className="mb-3 text-sm font-semibold text-text-primary">Job Type</h3>
          {JOB_TYPES.map((t) => (
            <label key={t} className="flex items-center gap-2 py-1 text-sm">
              <input type="checkbox" checked={jobTypes.has(t)} onChange={() => toggleFilter(jobTypes, t, setJobTypes)} className="rounded" />
              {t}
            </label>
          ))}
        </div>
        <div className="rounded-card border bg-bg-card p-4" style={{ borderColor: "var(--border)" }}>
          <h3 className="mb-3 text-sm font-semibold text-text-primary">Experience</h3>
          {EXPERIENCE.map((e) => (
            <label key={e} className="flex items-center gap-2 py-1 text-sm">
              <input type="checkbox" checked={experience.has(e)} onChange={() => toggleFilter(experience, e, setExperience)} className="rounded" />
              {e}
            </label>
          ))}
        </div>
        <div className="rounded-card border bg-bg-card p-4" style={{ borderColor: "var(--border)" }}>
          <h3 className="mb-3 text-sm font-semibold text-text-primary">Work Setting</h3>
          {WORK_SETTING.map((w) => (
            <label key={w} className="flex items-center gap-2 py-1 text-sm">
              <input type="checkbox" checked={workSetting.has(w)} onChange={() => toggleFilter(workSetting, w, setWorkSetting)} className="rounded" />
              {w}
            </label>
          ))}
        </div>
        <div className="rounded-card border bg-bg-card p-4" style={{ borderColor: "var(--border)" }}>
          <h3 className="mb-2 text-sm font-semibold text-text-primary">Salary Range</h3>
          <input type="range" min={0} max={300} value={salaryMin} onChange={(e) => setSalaryMin(Number(e.target.value))} className="w-full" />
          <p className="text-xs text-text-muted">Min: ${salaryMin}K</p>
        </div>
        <div className="rounded-card border bg-bg-card p-4" style={{ borderColor: "var(--border)" }}>
          <h3 className="mb-2 text-sm font-semibold text-text-primary">Date Posted</h3>
          <select value={datePosted} onChange={(e) => setDatePosted(e.target.value)} className="w-full rounded-button border border-border bg-bg-card px-2 py-1 text-sm">
            <option value="">Any</option>
            {DATE_POSTED.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="rounded-card border bg-bg-card p-4" style={{ borderColor: "var(--border)" }}>
          <h3 className="mb-2 text-sm font-semibold text-text-primary">Field</h3>
          <select value={field} onChange={(e) => setField(e.target.value)} className="w-full rounded-button border border-border bg-bg-card px-2 py-1 text-sm">
            <option value="">Any</option>
            {FIELDS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <button type="button" onClick={clearFilters} className="text-sm font-medium" style={{ color: "var(--accent)" }}>
          Clear all filters
        </button>
      </aside>

      <div className="flex-1 min-w-0 space-y-4">
        {showPrefsPrompt && (
          <div
            className="rounded-card border p-4"
            style={{ borderColor: "var(--border)", background: "var(--bg-hero)" }}
          >
            <p className="text-sm text-text-primary">Set your job preferences to see personalized results</p>
            <button
              type="button"
              onClick={() => setPrefsModalOpen(true)}
              className="mt-2 inline-block rounded-button bg-accent px-4 py-2 text-sm font-semibold text-white"
            >
              Set preferences
            </button>
          </div>
        )}

        <h1 className="font-heading text-xl font-semibold text-text-primary">Jobs</h1>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search job titles, companies, or skills..."
              className="w-full rounded-button border-2 border-border bg-bg-card py-2.5 pl-10 pr-24 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-2 rounded-button bg-accent px-3 py-1.5 text-sm font-medium text-white disabled:opacity-70"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              Search
            </button>
          </div>
          <button type="button" onClick={saveSearch} className="rounded-button border-2 border-accent px-4 py-2 text-sm font-medium" style={{ color: "var(--accent)" }}>
            Save Search
          </button>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            {loading ? "Searching..." : `Found ${filteredJobs.length} real jobs${searchQuery ? ` for '${searchQuery}'` : ""}`}
          </p>
          <select value={sort} onChange={(e) => setSort(e.target.value as "best" | "recent" | "salary")} className="rounded-button border border-border bg-bg-card px-3 py-1.5 text-sm">
            <option value="best">Best Match</option>
            <option value="recent">Most Recent</option>
            <option value="salary">Salary High-Low</option>
          </select>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-12">
            <Loader2 size={24} className="animate-spin text-primary" />
            <span className="text-sm text-text-muted">Loading jobs...</span>
          </div>
        )}

        {error && (
          <div className="rounded-card border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {error}
            <button type="button" onClick={() => refetch()} className="mt-2 block text-accent underline">
              Try again
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-3">
            {paginatedJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                saved={savedIds.has(job.id)}
                onToggleSaved={() => toggleSaved(job.id)}
                onNotInterested={() => {}}
                onClick={() => (setSelectedJob(job), setDetailOpen(true))}
              />
            ))}
          </div>
        )}

        {!loading && !error && paginatedJobs.length === 0 && (
          <p className="py-12 text-center text-sm text-text-muted">No jobs found. Try a different search or adjust filters.</p>
        )}

        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-center gap-2 py-4">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-button border border-border px-3 py-1 text-sm disabled:opacity-50">
              Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((n) => (
              <button key={n} type="button" onClick={() => setPage(n)} className={`rounded-button px-3 py-1 text-sm ${page === n ? "bg-primary text-white" : "border border-border"}`}>
                {n}
              </button>
            ))}
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-button border border-border px-3 py-1 text-sm disabled:opacity-50">
              Next
            </button>
          </div>
        )}
      </div>

      <JobDetailPanel job={selectedJob} open={detailOpen} onClose={() => setDetailOpen(false)} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
