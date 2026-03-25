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
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
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
  const [profileSkills, setProfileSkills] = useState<string[]>([]);
  const [resumeText, setResumeText] = useState<string>("");

  const jobType = jobTypes.size > 0 ? [...jobTypes][0] : "";
  const workSettingVal = workSetting.size > 0 ? [...workSetting][0] : workSettingPref || "";
  const experienceVal = experience.size > 0 ? [...experience][0] : mapExperienceToFilter(experienceLevel) || "";

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("saved_jobs")
      .select("job_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setSavedIds(new Set(data.map((r) => r.job_id)));
      });
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("applications")
      .select("job_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setAppliedIds(new Set(data.map((r) => r.job_id)));
      });
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("preferred_categories, target_field, preferred_location, experience_level, work_setting, skills, resume_text")
        .eq("id", user.id)
        .single();
      if (data) {
        if (data.preferred_location) setPreferredLocation(data.preferred_location as string);
        if (data.experience_level) setExperienceLevel(data.experience_level as string);
        if (data.work_setting) setWorkSettingPref(data.work_setting as string);
        if (Array.isArray(data?.skills)) setProfileSkills(data.skills as string[]);
        if (typeof data?.resume_text === "string" && data.resume_text.trim()) setResumeText(data.resume_text as string);
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
      skills: profileSkills.length > 0 ? profileSkills : ((user as { user_metadata?: Record<string, unknown> })?.user_metadata?.skills as string[] | undefined),
    },
    resumeText: resumeText || undefined,
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

  const recordApplied = async (job: Job) => {
    if (!user?.id) return;
    const jobData = JSON.parse(JSON.stringify(job));
    const { error } = await supabase.from("applications").insert({
      user_id: user.id,
      job_id: job.id,
      job_data: jobData,
      status: "Submitted",
      auto_applied: false,
    });
    if (error) {
      console.error("Record application error:", error);
      setToast({ message: "Could not save to Applied list", type: "error" });
    } else {
      setAppliedIds((prev) => new Set([...prev, job.id]));
    }
  };

  const removeApplied = async (job: Job) => {
    if (!user?.id) return;
    await supabase.from("applications").delete().eq("user_id", user.id).eq("job_id", job.id);
    setAppliedIds((prev) => {
      const next = new Set(prev);
      next.delete(job.id);
      return next;
    });
  };

  const toggleSaved = async (job: Job) => {
    if (!user?.id) {
      setToast({ message: "Please sign in to save jobs.", type: "error" });
      return;
    }
    const isSaved = savedIds.has(job.id);
    if (isSaved) {
      await supabase.from("saved_jobs").delete().eq("user_id", user.id).eq("job_id", job.id);
      setSavedIds((prev) => {
        const next = new Set(prev);
        next.delete(job.id);
        return next;
      });
    } else {
      const jobData = JSON.parse(JSON.stringify(job));
      const { error } = await supabase.from("saved_jobs").insert({
        user_id: user.id,
        job_id: job.id,
        job_data: jobData,
      });
      if (error) {
        if (error.code === "23505") {
          setSavedIds((prev) => new Set([...prev, job.id]));
        } else {
          console.error("Save job error:", error);
          setToast({
            message: error.message || "Failed to save. Ensure saved_jobs table exists in Supabase (run migrations).",
            type: "error",
          });
        }
      } else {
        setSavedIds((prev) => new Set([...prev, job.id]));
      }
    }
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
        <div className="rounded-card border border-[#E8E8E6] bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold" style={{ color: "#1A1A1A" }}>Job Type</h3>
          {JOB_TYPES.map((t) => (
            <label key={t} className="flex cursor-pointer items-center gap-2 py-1 text-sm text-[#3D3D3A] hover:text-[#1A1A1A]">
              <input type="checkbox" checked={jobTypes.has(t)} onChange={() => toggleFilter(jobTypes, t, setJobTypes)} className="rounded border-[#E8E8E6] bg-white text-[#5E5CE6] focus:ring-[#5E5CE6]" />
              {t}
            </label>
          ))}
        </div>
        <div className="rounded-card border border-[#E8E8E6] bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold" style={{ color: "#1A1A1A" }}>Experience</h3>
          {EXPERIENCE.map((e) => (
            <label key={e} className="flex cursor-pointer items-center gap-2 py-1 text-sm text-[#3D3D3A] hover:text-[#1A1A1A]">
              <input type="checkbox" checked={experience.has(e)} onChange={() => toggleFilter(experience, e, setExperience)} className="rounded border-[#E8E8E6] bg-white text-[#5E5CE6] focus:ring-[#5E5CE6]" />
              {e}
            </label>
          ))}
        </div>
        <div className="rounded-card border border-[#E8E8E6] bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold" style={{ color: "#1A1A1A" }}>Work Setting</h3>
          {WORK_SETTING.map((w) => (
            <label key={w} className="flex cursor-pointer items-center gap-2 py-1 text-sm text-[#3D3D3A] hover:text-[#1A1A1A]">
              <input type="checkbox" checked={workSetting.has(w)} onChange={() => toggleFilter(workSetting, w, setWorkSetting)} className="rounded border-[#E8E8E6] bg-white text-[#5E5CE6] focus:ring-[#5E5CE6]" />
              {w}
            </label>
          ))}
        </div>
        <div className="rounded-card border border-[#E8E8E6] bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold" style={{ color: "#1A1A1A" }}>Salary Range</h3>
          <input type="range" min={0} max={300} value={salaryMin} onChange={(e) => setSalaryMin(Number(e.target.value))} className="w-full accent-[#5E5CE6]" />
          <p className="text-xs text-[#8A8A85]">Min: ${salaryMin}K</p>
        </div>
        <div className="rounded-card border border-[#E8E8E6] bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold" style={{ color: "#1A1A1A" }}>Date Posted</h3>
          <select value={datePosted} onChange={(e) => setDatePosted(e.target.value)} className="h-[34px] w-full rounded-[6px] border border-[#E8E8E6] bg-white px-2 py-1.5 text-sm text-[#1A1A1A] placeholder:text-[#8A8A85] focus:border-[#5E5CE6] focus:outline-none" style={{ fontSize: 14 }}>
            <option value="">Any</option>
            {DATE_POSTED.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="rounded-card border border-[#E8E8E6] bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold" style={{ color: "#1A1A1A" }}>Field</h3>
          <select value={field} onChange={(e) => setField(e.target.value)} className="h-[34px] w-full rounded-[6px] border border-[#E8E8E6] bg-white px-2 py-1.5 text-sm text-[#1A1A1A] focus:border-[#5E5CE6] focus:outline-none" style={{ fontSize: 14 }}>
            <option value="">Any</option>
            {FIELDS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <button type="button" onClick={clearFilters} className="text-sm font-medium text-[#5E5CE6] hover:text-[#4A48CC]">
          Clear all filters
        </button>
      </aside>

      <div className="flex-1 min-w-0 space-y-4">
        {showPrefsPrompt && (
          <div className="rounded-card border border-[#E8E8E6] bg-white p-4">
            <p className="text-sm" style={{ color: "#3D3D3A" }}>Set your job preferences to see personalized results</p>
            <button
              type="button"
              onClick={() => setPrefsModalOpen(true)}
              className="mt-2 inline-flex h-[34px] items-center rounded-[6px] bg-[#5E5CE6] px-[14px] text-[13px] font-medium text-white hover:bg-[#4A48CC]"
            >
              Set preferences
            </button>
          </div>
        )}

        <h1 className="text-xl font-semibold" style={{ color: "#1A1A1A" }}>Jobs</h1>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A85]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search job titles, companies, or skills..."
              className="h-[34px] w-full rounded-[6px] border border-[#E8E8E6] bg-white py-2.5 pl-10 pr-24 text-[14px] text-[#1A1A1A] placeholder:text-[#8A8A85] focus:border-[#5E5CE6] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className="absolute right-2 top-1/2 flex h-[30px] -translate-y-1/2 items-center gap-2 rounded-[6px] bg-[#5E5CE6] px-[14px] text-[13px] font-medium text-white hover:bg-[#4A48CC] disabled:opacity-70"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              Search
            </button>
          </div>
          <button type="button" onClick={saveSearch} className="h-[34px] rounded-[6px] border border-[#E8E8E6] bg-white px-[14px] text-[13px] font-medium text-[#3D3D3A] hover:bg-[#F7F7F5] hover:border-[#C8C8C4]">
            Save Search
          </button>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-[#8A8A85]">
            {loading ? "Searching..." : `Found ${filteredJobs.length} real jobs${searchQuery ? ` for '${searchQuery}'` : ""}`}
          </p>
          <select value={sort} onChange={(e) => setSort(e.target.value as "best" | "recent" | "salary")} className="h-[34px] rounded-[6px] border border-[#E8E8E6] bg-white px-3 py-1.5 text-[14px] text-[#1A1A1A] focus:border-[#5E5CE6] focus:outline-none">
            <option value="best">Best Match</option>
            <option value="recent">Most Recent</option>
            <option value="salary">Salary High-Low</option>
          </select>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-12">
            <Loader2 size={24} className="animate-spin text-[#5E5CE6]" />
            <span className="text-sm text-[#8A8A85]">Loading jobs...</span>
          </div>
        )}

        {error && (
          <div className="rounded-card border p-4 text-sm" style={{ borderColor: "#D97706", background: "#FFFBEB", color: "#D97706" }}>
            {error}
            <button type="button" onClick={() => refetch()} className="mt-2 block text-[#5E5CE6] hover:underline">
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
                applied={appliedIds.has(job.id)}
                onToggleSaved={() => toggleSaved(job)}
                onNotInterested={() => {}}
                onClick={() => (setSelectedJob(job), setDetailOpen(true))}
                onApply={recordApplied}
                onMarkApplied={recordApplied}
                onUnapply={removeApplied}
              />
            ))}
          </div>
        )}

        {!loading && !error && paginatedJobs.length === 0 && (
          <p className="py-12 text-center text-sm text-[#8A8A85]">No jobs found. Try a different search or adjust filters.</p>
        )}

        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-center gap-2 py-4">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="h-[34px] rounded-[6px] border border-[#E8E8E6] bg-white px-[14px] text-[13px] font-medium text-[#3D3D3A] hover:bg-[#F7F7F5] hover:border-[#C8C8C4] disabled:opacity-50">
              Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((n) => (
              <button key={n} type="button" onClick={() => setPage(n)} className={`h-[34px] rounded-[6px] px-[14px] text-[13px] font-medium ${page === n ? "bg-[#5E5CE6] text-white hover:bg-[#4A48CC]" : "border border-[#E8E8E6] bg-white text-[#3D3D3A] hover:bg-[#F7F7F5] hover:border-[#C8C8C4]"}`}>
                {n}
              </button>
            ))}
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-[34px] rounded-[6px] border border-[#E8E8E6] bg-white px-[14px] text-[13px] font-medium text-[#3D3D3A] hover:bg-[#F7F7F5] hover:border-[#C8C8C4] disabled:opacity-50">
              Next
            </button>
          </div>
        )}
      </div>

      <JobDetailPanel
        job={selectedJob}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        applied={selectedJob ? appliedIds.has(selectedJob.id) : false}
        onApply={recordApplied}
        onMarkApplied={recordApplied}
        onUnapply={removeApplied}
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
