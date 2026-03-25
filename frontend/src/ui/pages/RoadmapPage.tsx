import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import type { CareerRoadmapResponse } from "../../lib/api";

function clampPercent(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function normalizeRoadmapData(data: CareerRoadmapResponse): CareerRoadmapResponse {
  const phases = Array.isArray(data?.phases) ? data.phases : [];
  return {
    goal: data?.goal ?? "",
    readiness_percent: clampPercent(Number(data?.readiness_percent ?? 0)),
    skills_matched: Number(data?.skills_matched ?? 0),
    skills_total: Number(data?.skills_total ?? 0),
    estimated_months: Number(data?.estimated_months ?? 0),
    phases: phases.map((phase, idx) => ({
      number: Number(phase?.number ?? idx + 1),
      title: phase?.title ?? `Phase ${idx + 1}`,
      status:
        phase?.status === "complete" || phase?.status === "active" || phase?.status === "upcoming"
          ? phase.status
          : "upcoming",
      duration_weeks: Number(phase?.duration_weeks ?? 4),
      description: phase?.description ?? "No description provided.",
      skills: Array.isArray(phase?.skills) ? phase.skills : [],
      resources: Array.isArray(phase?.resources) ? phase.resources : [],
    })),
  };
}

export function RoadmapPage() {
  const { user } = useAuth();
  const [goal, setGoal] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [loadingResume, setLoadingResume] = useState(true);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [error, setError] = useState("");
  const [roadmap, setRoadmap] = useState<CareerRoadmapResponse | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoadingResume(false);
      return;
    }
    const loadProfile = async () => {
      setLoadingResume(true);
      try {
        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("resume_text")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          setError(profileError.message || "Could not load your profile.");
          setResumeText("");
          return;
        }

        setResumeText(typeof data?.resume_text === "string" ? data.resume_text : "");
      } catch {
        setError("Could not load your profile.");
        setResumeText("");
      } finally {
        setLoadingResume(false);
      }
    };
    loadProfile();
  }, [user?.id]);

  const hasResume = !!resumeText.trim();

  const handleGenerate = async () => {
    if (!goal.trim()) {
      setError("Please enter your career goal first.");
      return;
    }

    setError("");
    setRoadmap(null);
    setLoadingRoadmap(true);
    try {
      const payload = {
        goal: goal.trim(),
        resume_text: resumeText,
      };

      const token = localStorage.getItem("access_token");
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const res = await fetch(`${baseUrl}/api/roadmap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const rawText = await res.text();

      if (!res.ok) {
        throw new Error(rawText || `Request failed with ${res.status}`);
      }

      const data = JSON.parse(rawText) as CareerRoadmapResponse;
      const normalized = normalizeRoadmapData(data);
      if (!normalized.phases.length) {
        setError("Roadmap had no phases. Try again with a more specific goal.");
      }
      setRoadmap(normalized);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate roadmap.");
    } finally {
      setLoadingRoadmap(false);
    }
  };

  const readiness = useMemo(() => clampPercent(roadmap?.readiness_percent ?? 0), [roadmap]);
  const skillsProgress = useMemo(() => {
    if (!roadmap || !roadmap.skills_total) return 0;
    return clampPercent((roadmap.skills_matched / roadmap.skills_total) * 100);
  }, [roadmap]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold text-[#1A1A1A]">Career Roadmap</h1>
        <p className="mt-1 text-[14px] text-[#8A8A85]">
          Enter your target role for a goal-first roadmap. Add a resume anytime to reflect skills you
          already have.
        </p>
      </div>

      <section className="rounded-card border border-[#E8E8E6] bg-white p-5">
        <label className="mb-2 block text-[12px] uppercase tracking-[0.06em] text-[#8A8A85]">
          What&apos;s your career goal?
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. become a software engineer"
            className="h-[34px] flex-1 rounded-[6px] border border-[#E8E8E6] bg-white px-3 text-[14px] text-[#1A1A1A] placeholder:text-[#8A8A85] focus:border-[#5E5CE6] focus:outline-none"
          />
          <button
            type="button"
            disabled={loadingRoadmap}
            onClick={handleGenerate}
            className="inline-flex h-[34px] items-center justify-center gap-2 rounded-[6px] bg-[#5E5CE6] px-[14px] text-[13px] font-medium text-white hover:bg-[#4A48CC] disabled:opacity-70"
          >
            {loadingRoadmap ? <Loader2 size={14} className="animate-spin" /> : null}
            Generate roadmap
          </button>
        </div>
        {error && <p className="mt-2 text-[13px] text-[#DC2626]">{error}</p>}
        {loadingRoadmap && (
          <p className="mt-2 text-[13px] text-[#8A8A85]">
            Generating roadmap… The first run can take several minutes while the model loads. Keep this
            tab open.
          </p>
        )}
      </section>

      {user?.id && loadingResume && (
        <p className="text-[12px] text-[#8A8A85]">Loading saved resume for optional personalization…</p>
      )}

      {!loadingResume && !hasResume && (
        <section className="rounded-card border border-dashed border-[#E8E8E6] bg-white p-5">
          <p className="text-[14px] text-[#3D3D3A]">
            Optional: upload your resume on the Resume page to mark which skills you already have and
            tune readiness.
          </p>
          <Link
            to="/dashboard/resume"
            className="mt-3 inline-flex h-[34px] items-center rounded-[6px] border border-[#E8E8E6] bg-white px-[14px] text-[13px] font-medium text-[#1A1A1A] hover:bg-[#F4F4F2]"
          >
            Go to Resume
          </Link>
        </section>
      )}

      {loadingRoadmap && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[120px] animate-pulse rounded-card border border-[#E8E8E6] bg-white" />
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[180px] animate-pulse rounded-card border border-[#E8E8E6] bg-white" />
            ))}
          </div>
        </>
      )}

      {roadmap && !loadingRoadmap && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-card border border-[#E8E8E6] bg-white p-4">
              <p className="text-[12px] text-[#8A8A85]">Overall readiness</p>
              <p className="mt-1 text-[24px] font-semibold text-[#1A1A1A]">{readiness}%</p>
              <div className="mt-2 h-2 rounded bg-[#F4F4F2]">
                <div className="h-2 rounded bg-[#5E5CE6]" style={{ width: `${readiness}%` }} />
              </div>
            </article>

            <article className="rounded-card border border-[#E8E8E6] bg-white p-4">
              <p className="text-[12px] text-[#8A8A85]">Skills matched</p>
              <p className="mt-1 text-[24px] font-semibold text-[#1A1A1A]">
                {roadmap.skills_matched} / {roadmap.skills_total}
              </p>
              <div className="mt-2 h-2 rounded bg-[#F4F4F2]">
                <div className="h-2 rounded bg-[#16A34A]" style={{ width: `${skillsProgress}%` }} />
              </div>
            </article>

            <article className="rounded-card border border-[#E8E8E6] bg-white p-4">
              <p className="text-[12px] text-[#8A8A85]">Estimated time to job-ready</p>
              <p className="mt-1 text-[24px] font-semibold text-[#1A1A1A]">~{roadmap.estimated_months} months</p>
              <p className="mt-1 text-[12px] text-[#8A8A85]">at 10 hrs/week</p>
            </article>
          </div>

          <div className="space-y-4">
            {roadmap.phases.map((phase) => {
              const isComplete = phase.status === "complete";
              const isActive = phase.status === "active";
              const statusStyles = isComplete
                ? { bg: "#F0FDF4", text: "#16A34A", label: "Complete" }
                : isActive
                  ? { bg: "#EEEEFD", text: "#5E5CE6", label: "In progress" }
                  : { bg: "#F4F4F2", text: "#8A8A85", label: "Upcoming" };

              return (
                <article key={phase.number} className="rounded-card border border-[#E8E8E6] bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-medium"
                        style={{
                          background: isComplete ? "#16A34A" : isActive ? "#5E5CE6" : "#E8E8E6",
                          color: isComplete || isActive ? "#FFFFFF" : "#3D3D3A",
                        }}
                      >
                        {isComplete ? <Check size={14} /> : phase.number}
                      </div>
                      <div>
                        <h3 className="text-[16px] font-medium text-[#1A1A1A]">{phase.title}</h3>
                        <p className="mt-1 text-[14px] leading-6 text-[#3D3D3A]">{phase.description}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className="inline-block rounded px-2 py-0.5 text-[12px] font-medium"
                        style={{ background: statusStyles.bg, color: statusStyles.text, borderRadius: 4 }}
                      >
                        {statusStyles.label}
                      </span>
                      <p className="mt-1 text-[12px] text-[#8A8A85]">~{phase.duration_weeks} weeks</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {phase.skills.map((skill) => (
                      <span
                        key={`${phase.number}-${skill.name}`}
                        className="rounded px-2 py-1 text-[12px]"
                        style={{
                          borderRadius: 4,
                          background: skill.user_has ? "#F0FDF4" : "#EEEEFD",
                          color: skill.user_has ? "#16A34A" : "#5E5CE6",
                          border: `1px solid ${skill.user_has ? "#BBF7D0" : "#DCDCFB"}`,
                        }}
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>

                  {isActive && Array.isArray(phase.resources) && phase.resources.length > 0 && (
                    <div className="mt-4 border-t border-[#E8E8E6] pt-3">
                      <p className="text-[12px] uppercase tracking-[0.06em] text-[#8A8A85]">Free resources</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {phase.resources.map((resource) => (
                          <a
                            key={`${phase.number}-${resource.url}`}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-[6px] border border-[#E8E8E6] bg-white px-2.5 py-1.5 text-[12px] text-[#3D3D3A] hover:bg-[#F7F7F5] hover:border-[#C8C8C4]"
                          >
                            {resource.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
