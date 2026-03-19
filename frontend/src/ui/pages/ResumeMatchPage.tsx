import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, X, FileText, Loader2, BarChart3 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { api } from "../../api/client";
import { searchJobs } from "../../api/jobs";
import { normalizeJob } from "../../hooks/useJobs";
import type { Job } from "../../types/jobs";

interface MatchResult {
  score: number;
  matched_skills: string[];
  missing_skills: string[];
  matched_keywords: string[];
  missing_keywords: string[];
  experience_match: string;
  recommendation: string;
  tips: string[];
}

function ScoreRingDisplay({ score }: { score: number }) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 90
      ? "var(--accent)"
      : score >= 70
        ? "var(--primary)"
        : score >= 50
          ? "#f59e0b"
          : "#ef4444";
  const label =
    score >= 90
      ? "Strong Match"
      : score >= 70
        ? "Good Match"
        : score >= 50
          ? "Partial Match"
          : "Low Match";

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[140px] w-[140px]">
        <svg width="140" height="140" className="block -rotate-90">
          <circle
            cx="70"
            cy="70"
            r={radius}
            stroke="var(--border)"
            strokeWidth="10"
            fill="none"
          />
          <circle
            cx="70"
            cy="70"
            r={radius}
            stroke={color}
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-text-primary">
          {score}%
        </span>
      </div>
      <span className="mt-2 text-sm font-medium" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

interface ResumeMatchPageProps {
  onGoToUpload?: () => void;
}

export function ResumeMatchPage({ onGoToUpload }: ResumeMatchPageProps = {}) {
  const { user } = useAuth();
  const [jobDescription, setJobDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Job[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [resumeFilename, setResumeFilename] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState<string>("");
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [history, setHistory] = useState<{ id: string; score: number; job_description: string; analyzed_at: string }[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("resume_filename, resume_text, skills")
        .eq("id", user.id)
        .single();
      if (data) {
        setResumeFilename(data.resume_filename || null);
        setResumeText(data.resume_text || "");
        setSkills((data.skills as string[]) || []);
      }
    };
    load();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const loadHistory = async () => {
      const { data } = await supabase
        .from("match_analyses")
        .select("id, score, job_description, analyzed_at")
        .eq("user_id", user.id)
        .order("analyzed_at", { ascending: false })
        .limit(10);
      if (data) {
        setHistory(
          data.map((r) => ({
            id: r.id,
            score: r.score || 0,
            job_description: (r.job_description || "").slice(0, 80) + "...",
            analyzed_at: r.analyzed_at,
          }))
        );
      }
    };
    loadHistory();
  }, [user?.id, result]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchJobs({ query: searchQuery });
        const normalized: Job[] = results.slice(0, 5).map((j) => normalizeJob(j));
        setSearchResults(normalized);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const selectJobFromSearch = (job: Job) => {
    setSelectedJob(job);
    setJobDescription(
      `${job.title} at ${job.company}\n\n${job.description}\n\nResponsibilities:\n${job.responsibilities?.join("\n") || ""}\n\nRequirements:\n${job.requirements?.join("\n") || ""}`
    );
    setSearchQuery("");
    setSearchResults([]);
  };

  const analyze = async () => {
    const text = jobDescription.trim();
    if (!text) return;
    if (!resumeText.trim()) {
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post<MatchResult>("/analyze-match", {
        job_description: text,
        resume_text: resumeText,
      });
      setResult(data);
      if (user?.id && data) {
        await supabase.from("match_analyses").insert({
          user_id: user.id,
          job_description: text.slice(0, 10000),
          score: data.score,
          results: data,
        });
      }
    } catch {
      setResult({
        score: 0,
        matched_skills: [],
        missing_skills: [],
        matched_keywords: [],
        missing_keywords: [],
        experience_match: "Unable to analyze.",
        recommendation: "Analysis failed. Please try again.",
        tips: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const hasResume = !!resumeText.trim();

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-secondary">
        See how well your resume matches any job
      </p>

      {!hasResume && (
        <div
          className="rounded-card border-2 border-dashed p-6 text-center"
          style={{ borderColor: "var(--border)" }}
        >
          <FileText size={48} className="mx-auto text-text-muted" />
          <p className="mt-4 font-medium text-text-primary">
            Upload your resume first
          </p>
          <p className="mt-1 text-sm text-text-muted">
            Upload your resume in the My Resume tab before analyzing matches.
          </p>
          {onGoToUpload ? (
            <button
              type="button"
              onClick={onGoToUpload}
              className="mt-4 inline-block rounded-button bg-accent px-4 py-2 text-sm font-semibold text-white"
            >
              Upload Resume
            </button>
          ) : (
            <Link
              to="/dashboard/resume"
              className="mt-4 inline-block rounded-button bg-accent px-4 py-2 text-sm font-semibold text-white"
            >
              Upload Resume
            </Link>
          )}
        </div>
      )}

      {hasResume && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* LEFT – Job input */}
            <div className="space-y-4">
              <div
                className="rounded-card border bg-bg-card p-4"
                style={{ borderColor: "var(--border)" }}
              >
                <label className="block text-sm font-medium text-text-primary">
                  Job description
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste a job description here..."
                  className="mt-2 min-h-[200px] w-full resize-y rounded-button border px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
              <div
                className="rounded-card border bg-bg-card p-4"
                style={{ borderColor: "var(--border)" }}
              >
                <label className="block text-sm font-medium text-text-primary">
                  Or search for a job from our listings
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for a job..."
                  className="mt-2 w-full rounded-button border px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  style={{ borderColor: "var(--border)" }}
                />
                {searchResults.length > 0 && (
                  <ul className="mt-2 max-h-40 overflow-y-auto rounded-button border" style={{ borderColor: "var(--border)" }}>
                    {searchResults.map((j) => (
                      <li key={j.id}>
                        <button
                          type="button"
                          onClick={() => selectJobFromSearch(j)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-bg-hero"
                        >
                          {j.title} at {j.company}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                type="button"
                onClick={analyze}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-button bg-accent px-4 py-3 text-sm font-bold text-white disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <BarChart3 size={18} />
                    Analyze Match
                  </>
                )}
              </button>
            </div>

            {/* RIGHT – Your resume */}
            <div
              className="rounded-card border bg-bg-card p-4"
              style={{ borderColor: "var(--border)" }}
            >
              <p className="text-sm font-medium text-text-primary">
                Your resume
              </p>
              {resumeFilename && (
                <p className="mt-1 text-sm text-text-secondary">
                  {resumeFilename}
                </p>
              )}
              {skills.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-full px-3 py-1 text-xs font-medium text-white"
                      style={{ background: "var(--accent)" }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
              {onGoToUpload ? (
                <button
                  type="button"
                  onClick={onGoToUpload}
                  className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
                >
                  Update resume
                </button>
              ) : (
                <Link
                  to="/dashboard/resume"
                  className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
                >
                  Update resume
                </Link>
              )}
            </div>
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-card bg-bg-badge"
                />
              ))}
            </div>
          )}

          {/* Match results */}
          {result && !loading && (
            <div className="space-y-6">
              <div
                className="flex flex-col items-center rounded-card border bg-bg-card p-8"
                style={{ borderColor: "var(--border)" }}
              >
                <ScoreRingDisplay score={result.score} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div
                  className="rounded-card border bg-bg-card p-4"
                  style={{ borderColor: "var(--border)" }}
                >
                  <h3 className="font-medium text-text-primary">Skills Match</h3>
                  <div className="mt-2 space-y-1">
                    {result.matched_skills.slice(0, 3).map((s) => (
                      <div key={s} className="flex items-center gap-2 text-sm text-green-700">
                        <Check size={14} />
                        {s}
                      </div>
                    ))}
                    {result.missing_skills.slice(0, 3).map((s) => (
                      <div key={s} className="flex items-center gap-2 text-sm text-red-600">
                        <X size={14} />
                        {s}
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-text-muted">
                    {result.matched_skills.length}/
                    {result.matched_skills.length + result.missing_skills.length}{" "}
                    skills matched
                  </p>
                </div>

                <div
                  className="rounded-card border bg-bg-card p-4"
                  style={{ borderColor: "var(--border)" }}
                >
                  <h3 className="font-medium text-text-primary">
                    Experience Match
                  </h3>
                  <p className="mt-2 text-sm text-text-secondary">
                    {result.experience_match || "—"}
                  </p>
                </div>

                <div
                  className="rounded-card border bg-bg-card p-4"
                  style={{ borderColor: "var(--border)" }}
                >
                  <h3 className="font-medium text-text-primary">
                    Keywords Match
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {result.matched_keywords.slice(0, 5).map((kw) => (
                      <span
                        key={kw}
                        className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800"
                      >
                        {kw}
                      </span>
                    ))}
                    {result.missing_keywords.slice(0, 3).map((kw) => (
                      <span
                        key={kw}
                        className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div
                  className="rounded-card border bg-bg-card p-4"
                  style={{ borderColor: "var(--border)" }}
                >
                  <h3 className="font-medium text-text-primary">
                    Overall Recommendation
                  </h3>
                  <p className="mt-2 text-sm text-text-secondary">
                    {result.recommendation}
                  </p>
                  {result.tips.length > 0 && (
                    <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-text-muted">
                      {result.tips.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div
              className="rounded-card border bg-bg-card p-4"
              style={{ borderColor: "var(--border)" }}
            >
              <h3 className="font-medium text-text-primary">Past analyses</h3>
              <ul className="mt-2 space-y-2">
                {history.map((h) => (
                  <li
                    key={h.id}
                    className="flex items-center justify-between rounded-button border py-2 px-3 text-sm"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <span className="truncate text-text-secondary">
                      {h.job_description}
                    </span>
                    <span className="ml-2 font-medium text-primary">
                      {h.score}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
