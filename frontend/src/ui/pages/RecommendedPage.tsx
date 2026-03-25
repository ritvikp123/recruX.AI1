import { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { HeroMatchBanner } from "../components/HeroMatchBanner";
import { JobCard } from "../components/JobCard";
import { JobDetailPanel } from "../components/JobDetailPanel";
import { AICopilotPanel } from "../components/AICopilotPanel";
import { PreferencesModal } from "../components/PreferencesModal";
import { useJobs } from "../../hooks/useJobs";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import type { Job } from "../../types/jobs";

export function RecommendedPage() {
  const { user } = useAuth();
  const [preferredCategories, setPreferredCategories] = useState<Set<string> | null>(null);
  const [targetField, setTargetField] = useState<string>("Software Engineer");
  const [experienceLevel, setExperienceLevel] = useState<string>("Entry Level");
  const [preferredLocation, setPreferredLocation] = useState<string>("United States");
  const [workSetting, setWorkSetting] = useState<string>("");
  const [showPrefsPrompt, setShowPrefsPrompt] = useState(false);
  const [prefsModalOpen, setPrefsModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

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
        if (data.work_setting) setWorkSetting(data.work_setting as string);
      }
      let hasField = false;
      let hasExperience = false;
      if (data?.preferred_categories?.length) {
        setPreferredCategories(new Set(data.preferred_categories as string[]));
        setTargetField((data.preferred_categories as string[])[0]);
        hasField = true;
      } else if (data?.target_field) {
        setPreferredCategories(new Set([data.target_field as string]));
        setTargetField(data.target_field as string);
        hasField = true;
      } else if ((user as { user_metadata?: { target_field?: string } }).user_metadata?.target_field) {
        const tf = (user as { user_metadata?: { target_field?: string } }).user_metadata!.target_field!;
        setPreferredCategories(new Set([tf]));
        setTargetField(tf);
        hasField = true;
      } else {
        setPreferredCategories(new Set());
      }
      if (data?.experience_level) hasExperience = true;
      setShowPrefsPrompt(!hasField || !hasExperience);
    };
    load();
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

  const { jobs, loading, error, refetch } = useJobs({
    query: query || undefined,
    field: targetField,
    location: preferredLocation || undefined,
    jobType: "Full-time",
    workSetting: workSetting || undefined,
    experience: experienceLevel || undefined,
    userProfile: {
      target_field: targetField,
      skills: (user as { user_metadata?: Record<string, unknown> })?.user_metadata?.skills as string[] | undefined,
    },
  });

  const visibleJobs = useMemo(() => {
    return jobs
      .filter((j) => !hiddenIds.has(j.id))
      .filter((j) => {
        if (!query) return true;
        const q = query.toLowerCase();
        return (
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          (j.tags || []).some((t) => t.toLowerCase().includes(q))
        );
      });
  }, [jobs, hiddenIds, query]);

  const recentJobs = visibleJobs.slice(0, 4);
  const likedCount = savedIds.size;

  const toggleSaved = (id: string) => {
    setSavedIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  const markHidden = (id: string) => {
    setHiddenIds((prev) => new Set(prev).add(id));
  };

  const openDetail = (job: Job) => {
    setSelectedJob(job);
    setDetailOpen(true);
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
    if (!error) setAppliedIds((prev) => new Set([...prev, job.id]));
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

  const filterChipClass =
    "inline-flex items-center gap-1 rounded-button border-2 px-3 py-1.5 text-xs font-medium transition";
  const filterChipInactive = "border-border bg-bg-card text-primary hover:bg-bg-hero";

  return (
    <div className="flex">
      <div className="flex-1 min-w-0 md:pr-4">
        <div className="mb-4 border-b pb-4" style={{ borderColor: "var(--border)" }}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-text-muted">JOBS &gt;</p>
              <div className="flex flex-wrap items-center gap-1 text-xs">
                <NavLink
                  to="/dashboard"
                  end
                  className={({ isActive }) =>
                    `rounded-full px-3 py-1.5 font-semibold transition ${
                      isActive ? "bg-primary text-white" : "border-2 border-border bg-bg-card text-text-secondary hover:bg-bg-hero"
                    }`
                  }
                >
                  Recommended
                </NavLink>
                <NavLink
                  to="/saved"
                  className={({ isActive }) =>
                    `rounded-full px-3 py-1.5 font-semibold transition ${
                      isActive ? "bg-primary text-white" : "border-2 border-border bg-bg-card text-text-secondary hover:bg-bg-hero"
                    }`
                  }
                >
                  Liked {likedCount}
                </NavLink>
                <NavLink
                  to="/applied"
                  className={({ isActive }) =>
                    `rounded-full px-3 py-1.5 font-semibold transition ${
                      isActive ? "bg-primary text-white" : "border-2 border-border bg-bg-card text-text-secondary hover:bg-bg-hero"
                    }`
                  }
                >
                  Applied
                </NavLink>
              </div>
            </div>
            <div className="flex flex-1 justify-end">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title or company..."
                className="w-full max-w-xs rounded-button border-2 bg-bg-card px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                style={{ borderColor: "var(--border)" }}
              />
            </div>
          </div>
        </div>

        {showPrefsPrompt && (
          <div
            className="mb-4 rounded-card border p-4"
            style={{ borderColor: "var(--border)", background: "var(--bg-hero)" }}
          >
            <p className="text-sm text-text-primary">
              Set your job preferences to see personalized results
            </p>
            <button
              type="button"
              onClick={() => setPrefsModalOpen(true)}
              className="mt-2 inline-block rounded-button bg-accent px-4 py-2 text-sm font-semibold text-white"
            >
              Set preferences
            </button>
          </div>
        )}

        <PreferencesModal
          open={prefsModalOpen}
          onClose={() => setPrefsModalOpen(false)}
          initialField={targetField}
          initialExperience={experienceLevel}
          initialLocation={preferredLocation}
          initialWorkSetting={workSetting}
          onSave={async ({ targetField: tf, experienceLevel: exp, preferredLocation: loc, workSetting: ws }) => {
            if (!user?.id) return;
            setTargetField(tf);
            setExperienceLevel(exp);
            setPreferredLocation(loc);
            setWorkSetting(ws);
            setShowPrefsPrompt(false);
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

        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
          <button type="button" className={filterChipClass + " " + filterChipInactive} style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
            <span>Field/Role</span>
            <span>▼</span>
          </button>
          <button type="button" className={filterChipClass + " " + filterChipInactive} style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
            <span>Experience Level</span>
            <span>▼</span>
          </button>
          <button type="button" className={filterChipClass + " " + filterChipInactive} style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
            <span>Job Type</span>
            <span>▼</span>
          </button>
        </div>

        <HeroMatchBanner />

        <div className="flex gap-5">
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span className="font-medium text-text-primary">Recommended for your profile</span>
              {!loading && <span>{visibleJobs.length} real jobs</span>}
            </div>

            {loading && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-40 animate-pulse rounded-card bg-bg-badge" />
                ))}
              </div>
            )}

            {error && (
              <div
                className="flex flex-col items-center gap-3 rounded-card border p-6"
                style={{ borderColor: "var(--border)" }}
              >
                <AlertTriangle size={32} className="text-amber-500" />
                <p className="text-sm text-text-secondary">{error}</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="rounded-button bg-accent px-4 py-2 text-sm font-semibold text-white"
                >
                  Try again
                </button>
              </div>
            )}

            {!loading && !error && (
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {visibleJobs.map((job, i) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.08 * Math.min(i, 5) }}
                    >
                      <JobCard
                        job={job}
                        saved={savedIds.has(job.id)}
                        applied={appliedIds.has(job.id)}
                        onToggleSaved={() => toggleSaved(job.id)}
                        onNotInterested={() => markHidden(job.id)}
                        onClick={() => openDetail(job)}
                        onApply={recordApplied}
                        onMarkApplied={recordApplied}
                        onUnapply={removeApplied}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {visibleJobs.length === 0 && (
                  <p className="py-8 text-center text-sm text-text-muted">
                    No jobs found. Try a different search or adjust filters.
                  </p>
                )}
              </div>
            )}
          </div>

          <aside
            className="hidden w-[260px] shrink-0 space-y-2 rounded-card border p-3 text-xs lg:block"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-text-primary">Recently posted</span>
            </div>
            <div className="mt-2 space-y-2">
              {recentJobs.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => openDetail(job)}
                  className="w-full rounded-button border border-transparent bg-bg-page px-2.5 py-2 text-left transition hover:bg-bg-hero"
                >
                  <p className="text-xs font-medium text-text-primary">{job.title}</p>
                  <p className="text-[10px] text-text-secondary">
                    {job.company} · {job.location}
                  </p>
                </button>
              ))}
              {recentJobs.length === 0 && !loading && (
                <p className="text-xs text-text-muted">Recent roles will show up here.</p>
              )}
            </div>
          </aside>
        </div>
      </div>
      <div className="hidden h-full w-[300px] min-w-[300px] flex-shrink-0 xl:block">
        <div className="sticky top-0 h-screen overflow-y-auto border-l" style={{ borderColor: "var(--border)" }}>
          <AICopilotPanel activeJob={selectedJob} />
        </div>
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
    </div>
  );
}
