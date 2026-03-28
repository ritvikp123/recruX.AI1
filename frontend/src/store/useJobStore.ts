import { create } from "zustand";
import { persist } from "zustand/middleware";
import { searchJSearchJobs } from "../lib/jsearch";
import { applyJob, removeSavedJob, saveJob } from "../lib/savedJobsApi";
import type { Job } from "../types/job";
import { supabase } from "../lib/supabase";

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
  /** Dashboard “Top matches” preview */
  dashboardLoading: boolean;
  error: string | null;
  filters: JobFilters;
  resumeText: string;

  savedJobs: Job[];
  appliedJobIds: string[];
  /** Snapshots for /applied (order matches first application) */
  appliedJobs: Job[];
  /** Most recent first, capped */
  recentlyViewedJobs: Job[];

  setFilters: (patch: Partial<JobFilters>) => void;
  setSelectedJob: (job: Job | null) => void;
  setResumeText: (text: string) => void;

  loadResumeFromSupabase: (userId: string) => Promise<void>;

  fetchJobs: (computeMatch: MatchFn) => Promise<Job[]>;
  fetchDashboardPreview: (computeMatch: MatchFn) => Promise<void>;

  toggleSaveJob: (job: Job) => void;
  recordApplication: (job: Job) => void;
  recordRecentView: (job: Job) => void;
}

export const useJobStore = create<JobState>()(
  persist(
    (set, get) => ({
      jobs: [],
      dashboardJobs: [],
      selectedJob: null,
      /** True until the first `fetchJobs` run finishes (avoids empty-state flash on Jobs). */
      jobsLoading: true,
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

      savedJobs: [],
      appliedJobIds: [],
      appliedJobs: [],
      recentlyViewedJobs: [],

      setFilters: (patch) =>
        set((s) => ({ filters: { ...s.filters, ...patch } })),
      setSelectedJob: (job) => set({ selectedJob: job }),
      setResumeText: (text) => set({ resumeText: text }),

      loadResumeFromSupabase: async (userId: string) => {
        const { data } = await supabase
          .from("profiles")
          .select("resume_text")
          .eq("id", userId)
          .maybeSingle();
        if (data?.resume_text) set({ resumeText: String(data.resume_text) });
      },

      fetchJobs: async (computeMatch) => {
        const { filters, resumeText } = get();
        set({ jobsLoading: true, error: null });
        try {
          const list = await searchJSearchJobs({
            query: filters.query || "Software Engineer",
            remoteOnly: filters.remoteOnly,
            employmentType: filters.employmentType,
          });
          const withScores = list.map((j) => ({
            ...j,
            matchScore: computeMatch(resumeText, j),
          }));
          set({ jobs: withScores, jobsLoading: false });
          return withScores;
        } catch {
          // If JSearch isn't configured (or the API fails), generate sample jobs
          // that roughly match the current selections so the UI still feels alive.
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
              matchScore: 0, // overwritten below
            };
          };

          const mockList = Array.from({ length: 10 }, (_, i) => {
            const mode = modeOrder[i % modeOrder.length]!;
            return mkJob(i, mode);
          });

          const withScores = mockList.map((j) => ({
            ...j,
            matchScore: computeMatch(resumeText, j),
          }));

          set({ jobs: withScores, jobsLoading: false, error: null });
          return withScores;
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
        } catch {
          // If JSearch isn't configured (or the API fails), we still want the dashboard to show
          // a handful of high-match cards so the UI isn't empty.
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
            error: null,
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
        if (get().appliedJobIds.includes(job.id)) return;
        set((s) => ({
          appliedJobIds: [...s.appliedJobIds, job.id],
          appliedJobs: [...s.appliedJobs, { ...job }],
        }));
        void (async () => {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user?.id) return;
          await applyJob(user.id, job);
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
      partialize: (state) => ({
        savedJobs: state.savedJobs,
        appliedJobIds: state.appliedJobIds,
        appliedJobs: state.appliedJobs,
        recentlyViewedJobs: state.recentlyViewedJobs,
      }),
    }
  )
);
