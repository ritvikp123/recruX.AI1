import { create } from "zustand";
import { searchJSearchJobs } from "../lib/jsearch";
import { searchJobs } from "../lib/api";
import { mapJobListingToJob } from "../lib/jobListingMap";
import { applyJob, removeSavedJob, saveJob, fetchSavedJobs, fetchAppliedJobs } from "../lib/savedJobsApi";
import type { Job } from "../types/job";
import { supabase } from "../lib/supabase";
import { isMockJobId } from "../lib/mockJobs";

type MatchFn = (resumeText: string | undefined, job: Job) => number;

interface JobFilters {
  query: string;
  remoteOnly: boolean;
  employmentType: string;
  location: string;
}

interface JobState {
  jobs: Job[];
  dashboardJobs: Job[];
  selectedJob: Job | null;
  /** Jobs page search / list */
  jobsLoading: boolean;
  jobsLoadingMore: boolean;
  jobsPage: number;
  jobsHasMore: boolean;
  /** Dashboard “Top matches” preview */
  dashboardLoading: boolean;
  error: string | null;
  filters: JobFilters;
  resumeText: string;
  resumeSkills: string[];

  savedJobs: Job[];
  appliedJobIds: string[];
  /** Snapshots for /applied (order matches first application) */
  appliedJobs: Job[];
  /** Most recent first, capped */
  recentlyViewedJobs: Job[];

  setFilters: (patch: Partial<JobFilters>) => void;
  setSelectedJob: (job: Job | null) => void;
  setResumeText: (text: string) => void;
  setResumeSkills: (skills: string[]) => void;

  loadResumeFromSupabase: (userId: string) => Promise<void>;

  fetchJobs: (computeMatch: MatchFn, opts?: { append?: boolean }) => Promise<Job[]>;
  fetchDashboardPreview: (computeMatch: MatchFn) => Promise<void>;

  toggleSaveJob: (job: Job) => void;
  recordApplication: (job: Job) => void;
  pruneMockApplications: () => void;
  recordRecentView: (job: Job) => void;

  /** Clear all local user data (call on signout) */
  clearUserData: () => void;
  /** Fetch user data from DB and clear local overlaps (call on signin) */
  hydrateUserJobs: (userId: string) => Promise<void>;
}

export const useJobStore = create<JobState>((set, get) => ({
  jobs: [],
  dashboardJobs: [],
  selectedJob: null,
  /** True until the first `fetchJobs` run finishes (avoids empty-state flash on Jobs). */
  jobsLoading: true,
  jobsLoadingMore: false,
  jobsPage: 1,
  jobsHasMore: false,
  /** True until the first `fetchDashboardPreview` run finishes. */
  dashboardLoading: true,
  error: null,
  filters: {
    query: "Software Engineer",
    remoteOnly: false,
    employmentType: "",
    location: "",
  },
  resumeText: "",
  resumeSkills: [],

  savedJobs: [],
  appliedJobIds: [],
  appliedJobs: [],
  recentlyViewedJobs: [],

  setFilters: (patch) =>
    set((s) => ({ filters: { ...s.filters, ...patch } })),
  setSelectedJob: (job) => set({ selectedJob: job }),
  setResumeText: (text) => set({ resumeText: text }),
  setResumeSkills: (skills) => set({ resumeSkills: Array.isArray(skills) ? skills : [] }),

  clearUserData: () => set({
    savedJobs: [],
    appliedJobIds: [],
    appliedJobs: [],
    recentlyViewedJobs: [],
    resumeText: "",
    resumeSkills: [],
  }),

  hydrateUserJobs: async (userId: string) => {
    const [saved, applied] = await Promise.all([
      fetchSavedJobs(userId),
      fetchAppliedJobs(userId),
    ]);
    set({
      savedJobs: saved,
      appliedJobs: applied,
      appliedJobIds: applied.map((j) => j.id),
    });
  },

  loadResumeFromSupabase: async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("resume_text, skills")
      .eq("id", userId)
      .maybeSingle();
    if (data?.resume_text) set({ resumeText: String(data.resume_text) });
    if (Array.isArray((data as any)?.skills)) set({ resumeSkills: (data as any).skills });
  },

  fetchJobs: async (computeMatch, opts) => {
    const append = opts?.append ?? false;
    const { filters, resumeText } = get();

    if (append) {
      const s = get();
      if (!s.jobsHasMore || s.jobsLoadingMore || s.jobsLoading) {
        return s.jobs;
      }
      set({ jobsLoadingMore: true, error: null });
    } else {
      set({ jobsLoading: true, jobsLoadingMore: false, error: null });
    }

    const nextPage = append ? get().jobsPage + 1 : 1;

    const applyList = (list: Job[]) => {
      const withScores = list.map((j) => ({
        ...j,
        matchScore: computeMatch(resumeText, j),
      }));
      // Single page only — extra pages cost another API call; jsearch client caps rows per request.
      const hasMore = false;
      if (append) {
        const prev = get().jobs;
        const seen = new Set(prev.map((j) => j.id));
        const added = withScores.filter((j) => !seen.has(j.id));
        const merged = [...prev, ...added];
        set({
          jobs: merged,
          jobsPage: nextPage,
          jobsHasMore: hasMore,
          jobsLoading: false,
          jobsLoadingMore: false,
        });
        return merged;
      }
      set({
        jobs: withScores,
        jobsPage: nextPage,
        jobsHasMore: hasMore,
        jobsLoading: false,
        jobsLoadingMore: false,
      });
      return withScores;
    };

    try {
      const { resumeSkills } = get();
      const list = await searchJSearchJobs({
        query: filters.query || "Software Engineer",
        remoteOnly: filters.remoteOnly,
        employmentType: filters.employmentType,
        page: nextPage
      });
      return applyList(list);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Could not load jobs from the server.";
      const hint =
        " Ensure the backend is running (`VITE_API_URL`, default http://localhost:8001), PostgreSQL + pgvector has indexed jobs (`POST /api/jobs/ingest` or backfill script), and embeddings match your query.";
      if (!append) {
        set({
          jobs: [],
          jobsLoading: false,
          jobsLoadingMore: false,
          jobsHasMore: false,
          jobsPage: 1,
          error: `${msg}${hint}`,
        });
        return [];
      }
      set({ jobsLoading: false, jobsLoadingMore: false, error: `${msg}${hint}` });
      return get().jobs;
    }
  },

  fetchDashboardPreview: async (computeMatch) => {
    const { resumeText, filters, resumeSkills } = get();
    set({ dashboardLoading: true, error: null });
    try {
      const { jobs: listings } = await searchJobs({
        query: filters.query || "Software Engineer",
        filters: {
          skills: resumeSkills.length ? resumeSkills : undefined,
        },
      });
      const list = (listings || []).map(mapJobListingToJob);
      if (list.length === 0) {
        set({
          dashboardJobs: [],
          dashboardLoading: false,
          error:
            "No indexed jobs yet. Ingest roles via the backend (e.g. POST /api/jobs/ingest) or run the backfill script, then open Jobs and run search.",
        });
        return;
      }
      const withScores = list.slice(0, 5).map((j) => ({
        ...j,
        matchScore: computeMatch(resumeText, j),
      }));
      set({ dashboardJobs: withScores, dashboardLoading: false, error: null });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Dashboard job preview failed.";
      set({
        dashboardJobs: [],
        dashboardLoading: false,
        error: `${msg} Check VITE_API_URL and that the backend RAG index is available.`,
      });
    }
  },

  toggleSaveJob: (job: Job) => {
    const wasSaved = get().savedJobs.some((j) => j.id === job.id);
    set((s) => {
      const exists = s.savedJobs.some((j) => j.id === job.id);
      if (exists) {
        return { savedJobs: s.savedJobs.filter((j) => j.id !== job.id) };
      }
      return { savedJobs: [...s.savedJobs, { ...job }] };
    });
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) return;
      if (wasSaved) {
        await removeSavedJob(user.id, job.id);
      } else {
        await saveJob(user.id, job);
      }
    })();
  },

  recordApplication: (job: Job) => {
    if (isMockJobId(job.id)) return;
    if (get().appliedJobIds.includes(job.id)) return;
    set((s) => ({
      appliedJobIds: [...s.appliedJobIds, job.id],
      appliedJobs: [...s.appliedJobs, { ...job, appliedAt: new Date().toISOString() }],
    }));
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) return;
      await applyJob(user.id, job);
    })();
  },

  pruneMockApplications: () => {
    const s = get();
    const nextIds = s.appliedJobIds.filter((id) => !isMockJobId(id));
    const nextJobs = s.appliedJobs.filter((j) => !isMockJobId(j.id));
    const mockIds = s.appliedJobIds.filter(isMockJobId);
    if (nextIds.length === s.appliedJobIds.length && nextJobs.length === s.appliedJobs.length) {
      return;
    }
    set({ appliedJobIds: nextIds, appliedJobs: nextJobs });
    if (mockIds.length === 0) return;
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) return;
      for (const jobId of mockIds) {
        await supabase.from("applications").delete().eq("user_id", user.id).eq("job_id", jobId);
      }
    })();
  },

  recordRecentView: (job: Job) =>
    set((s) => {
      const rest = s.recentlyViewedJobs.filter((j) => j.id !== job.id);
      return { recentlyViewedJobs: [job, ...rest].slice(0, 24) };
    }),
}));
