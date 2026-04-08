import { create } from "zustand";
import { persist } from "zustand/middleware";
import { searchJSearchJobs } from "../lib/jsearch";
import { applyJob, removeSavedJob, saveJob, fetchSavedJobs, fetchAppliedJobs } from "../lib/savedJobsApi";
import type { Job } from "../types/job";
import { supabase } from "../lib/supabase";
import { isMockJobId } from "../lib/mockJobs";

type MatchFn = (resumeText: string | undefined, job: Job) => number;

function isMissingJSearchKeyError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  return msg.toLowerCase().includes("missing vite_rapidapi_key") || msg.toLowerCase().includes("missing vite_jsearch_api_key");
}

function isDev(): boolean {
  return typeof import.meta !== "undefined" && (import.meta as any).env?.DEV === true;
}

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
  /** Appending next JSearch page on Jobs */
  jobsLoadingMore: boolean;
  /** Last fetched JSearch page index (1-based) */
  jobsPage: number;
  /** Whether another JSearch page may exist */
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
  /** Remove demo applications from persisted state and Supabase (dev JSearch fallback). */
  pruneMockApplications: () => void;
  recordRecentView: (job: Job) => void;

  /** Clear all local user data (call on signout) */
  clearUserData: () => void;
  /** Fetch user data from DB and clear local overlaps (call on signin) */
  hydrateUserJobs: (userId: string) => Promise<void>;
}

export const useJobStore = create<JobState>()(
  persist(
    (set, get) => ({
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
          const list = await searchJSearchJobs({
            query: filters.query || "Software Engineer",
            page: nextPage,
            remoteOnly: filters.remoteOnly,
            employmentType: filters.employmentType,
          });
          return applyList(list);
        } catch (err: unknown) {
          const missingKey = isMissingJSearchKeyError(err);
          const allowMock = isDev() && missingKey;
          if (!allowMock) {
            const msg =
              missingKey
                ? "Jobs search is not configured. Add `VITE_RAPIDAPI_KEY` (or `VITE_JSEARCH_API_KEY`) to `frontend/.env`, then restart `npm run dev`."
                : `Jobs search failed. ${err instanceof Error ? err.message : "Check your network / RapidAPI quota."}`;
            if (!append) {
              set({
                jobs: [],
                jobsLoading: false,
                jobsLoadingMore: false,
                jobsHasMore: false,
                jobsPage: 1,
                error: msg,
              });
              return [];
            }
            set({ jobsLoading: false, jobsLoadingMore: false, error: msg });
            return get().jobs;
          }

          if (nextPage > 5) {
            return applyList([]);
          }

          // Dev-only fallback: if the API key is missing, generate sample jobs
          // so the UI stays usable during local development.
          const query = (filters.query || "Software Engineer").trim();
          const loc = (filters.location || "").trim();
          const employmentType = (filters.employmentType || "").trim();
          const remoteOnly = !!filters.remoteOnly;

          const roleSlug = query
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 3)
            .join(" ");

          const typeLabel =
            employmentType === "FULLTIME"
              ? "Full-time"
              : employmentType === "CONTRACTOR"
                ? "Contract"
                : employmentType === "PARTTIME"
                  ? "Part-time"
                  : employmentType === "INTERN"
                    ? "Intern"
                    : "";

          const companies = [
            "Northwind Labs",
            "Aurora Systems",
            "Contoso Analytics",
            "Globex Tech",
            "Initech",
            "Soylent Engineering",
          ];

          const modeOrder = remoteOnly ? (["REMOTE"] as const) : (["REMOTE", "HYBRID", "INPERSON"] as const);

          const mkJob = (i: number, mode: (typeof modeOrder)[number]) => {
            const company = companies[i % companies.length]!;
            const modeSuffix =
              mode === "REMOTE" ? "Remote" : mode === "HYBRID" ? "Hybrid" : "On-site";
            const titleBase = typeLabel ? `${roleSlug} (${typeLabel})` : `${roleSlug}`;
            const title = `${titleBase} - ${modeSuffix}`;

            const location =
              mode === "REMOTE"
                ? "Remote"
                : loc
                  ? mode === "HYBRID"
                    ? `${loc} · Hybrid`
                    : `${loc}`
                  : mode === "HYBRID"
                    ? "United States · Hybrid"
                    : "United States";

            const description =
              mode === "HYBRID"
                ? `Mock listing: This is a hybrid role where you'll collaborate across teams and ship features with measurable impact.`
                : `Mock listing: You'll build and improve production features, write maintainable code, and iterate based on feedback and outcomes.`;

            const salaryBase = 110000 + ((i % 5) * 15000);
            const salaryMax = salaryBase + 45000;
            const salaryMin = salaryBase;

            return {
              id: `mock-job-${i}-${mode}`,
              title,
              company,
              location,
              description,
              applyUrl: undefined,
              salaryMin,
              salaryMax,
              remote: mode === "REMOTE",
              skills: ["React", "TypeScript", "APIs", "Testing", "System Design"],
              postedAt: undefined,
              employerLogo: undefined,
              matchScore: 0,
            };
          };

          const base = (nextPage - 1) * 10;
          const mockList = Array.from({ length: 10 }, (_, i) => {
            const idx = base + i;
            const mode = modeOrder[idx % modeOrder.length]!;
            return mkJob(idx, mode);
          });

          set({
            error:
              "Using demo jobs because `VITE_RAPIDAPI_KEY` (or `VITE_JSEARCH_API_KEY`) is missing. Add it to `frontend/.env` and restart to fetch real listings.",
          });
          return applyList(mockList);
        }
      },

      fetchDashboardPreview: async (computeMatch) => {
        const { resumeText, filters } = get();
        set({ dashboardLoading: true, error: null });
        try {
          const list = await searchJSearchJobs({
            query: filters.query || "Software Engineer",
            page: 1,
            remoteOnly: filters.remoteOnly,
            employmentType: filters.employmentType,
          });
          const withScores = list.slice(0, 5).map((j) => ({
            ...j,
            matchScore: computeMatch(resumeText, j),
          }));
          set({ dashboardJobs: withScores, dashboardLoading: false, error: null });
        } catch (err: unknown) {
          const missingKey = isMissingJSearchKeyError(err);
          const allowMock = isDev() && missingKey;
          if (!allowMock) {
            const msg =
              missingKey
                ? "Dashboard jobs preview is not configured. Add `VITE_RAPIDAPI_KEY` (or `VITE_JSEARCH_API_KEY`) to `frontend/.env`, then restart `npm run dev`."
                : `Dashboard jobs preview failed. ${err instanceof Error ? err.message : "Check your network / RapidAPI quota."}`;
            set({ dashboardJobs: [], dashboardLoading: false, error: msg });
            return;
          }

          // Dev-only fallback: if JSearch isn't configured, keep the dashboard populated
          // with a handful of high-match demo cards so it isn't empty.
          const mock = (start: number) => {
            const baseTitle = filters.query || "Software Engineer";
            const mk = (i: number) => ({
              id: `mock-dashboard-${start + i}`,
              title: [
                baseTitle,
                `${baseTitle} (Frontend)`,
                `${baseTitle} (Full Stack)`,
                `${baseTitle} (Backend)`,
                `${baseTitle} (Platform)`,
              ][i]!,
              company: [
                "Northwind Labs",
                "Aurora Systems",
                "Contoso Analytics",
                "Globex Tech",
                "Initech",
              ][i]!,
              location: filters.remoteOnly
                ? "Remote"
                : ["Remote", "Hybrid", "San Francisco, CA", "Austin, TX", "New York, NY"][i]!,
              description:
                "Mock listing: align your resume with this role, focus on impact, and prepare an interview narrative from your project evidence.",
              applyUrl: undefined,
              salaryMin: undefined,
              salaryMax: undefined,
              remote: filters.remoteOnly ? true : [true, false, false, false, false][i]!,
              skills: ["React", "TypeScript", "APIs", "Testing", "System Design"],
              postedAt: undefined,
              matchScore: [96, 92, 88, 85, 82][i]!,
            });
            return Array.from({ length: 5 }, (_, i) => mk(i));
          };

          set({
            dashboardJobs: mock(Date.now() % 1000),
            dashboardLoading: false,
            error:
              "Using demo jobs because `VITE_RAPIDAPI_KEY` (or `VITE_JSEARCH_API_KEY`) is missing. Add it to `frontend/.env` and restart to fetch real listings.",
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
    }),
    {
      name: "recrux-activity-v1",
      version: 2,
      migrate: (persisted: any, version: number) => {
        // Drop resume content from persisted storage (privacy + avoids cross-account leakage).
        if (persisted && typeof persisted === "object") {
          delete (persisted as any).resumeText;
          delete (persisted as any).resumeSkills;
        }
        return persisted as any;
      },
      partialize: (state) => ({
        savedJobs: state.savedJobs,
        appliedJobIds: state.appliedJobIds,
        appliedJobs: state.appliedJobs,
        recentlyViewedJobs: state.recentlyViewedJobs,
      }),
    }
  )
);
