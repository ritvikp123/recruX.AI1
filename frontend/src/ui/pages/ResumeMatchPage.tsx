import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, FileText, Loader2, BarChart3, Lightbulb, Copy } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { scoreJob, chat } from "../../lib/api";
import { computeMatchScore } from "../../lib/matchScore";
import { searchJobs, normalizeJob } from "../../api/jobs";
import type { Job } from "../../types/jobs";

interface ParsedMatch {
  youHave: string[];
  youreMissing: string[];
  quickWins: string[];
}

interface MatchResult {
  score: number;
  matched_skills: string[];
  missing_skills: string[];
  matched_keywords: string[];
  missing_keywords: string[];
  experience_match: string;
  recommendation: string;
  tips: string[];
  parsed?: ParsedMatch;
  isAiRefined?: boolean;
}

/** Parse reasoning from backend into you_have, missing, quick_wins. Falls back to quick score data. */
function parseReasoning(
  reasoning: string | undefined,
  fallbackMatched: string[],
  fallbackMissing: string[]
): ParsedMatch {
  const result: ParsedMatch = { youHave: [], youreMissing: [], quickWins: [] };
  if (!reasoning?.trim()) {
    return { youHave: fallbackMatched, youreMissing: fallbackMissing, quickWins: [] };
  }
  const lines = reasoning.split(/\r?\n/).map((l) => l.trim());
  for (const line of lines) {
    const youHaveMatch = line.match(/^YOU_HAVE:\s*(.+)$/i);
    if (youHaveMatch) {
      const val = youHaveMatch[1].trim();
      result.youHave = val.toLowerCase() === "none" ? [] : val.split(",").map((s) => s.trim()).filter(Boolean);
      continue;
    }
    const missingMatch = line.match(/^MISSING:\s*(.+)$/i);
    if (missingMatch) {
      const val = missingMatch[1].trim();
      result.youreMissing = val.toLowerCase() === "none" ? [] : val.split(",").map((s) => s.trim()).filter(Boolean);
      continue;
    }
    const quickMatch = line.match(/^QUICK_WINS:\s*(.+)$/i);
    if (quickMatch) {
      const val = quickMatch[1].trim();
      result.quickWins = val.split(";").map((s) => s.trim()).filter(Boolean);
    }
  }
  if (result.youHave.length === 0 && result.youreMissing.length === 0) {
    result.youHave = fallbackMatched;
    result.youreMissing = fallbackMissing;
  }
  return result;
}

/** Instant skill-based score (no API call). Uses same logic as Search Jobs for consistency. */
function computeQuickScore(resumeText: string, skills: string[], jobDescription: string) {
  return computeMatchScore(resumeText, skills, jobDescription, []);
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
  const [aiRefining, setAiRefining] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [history, setHistory] = useState<{ id: string; score: number; job_description: string; analyzed_at: string }[]>([]);
  const [tailorModalOpen, setTailorModalOpen] = useState(false);
  const [tailorLoading, setTailorLoading] = useState(false);
  const [tailoredContent, setTailoredContent] = useState("");
  const [tailorError, setTailorError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
    if (!resumeText.trim()) return;
    setLoading(true);
    setResult(null);
    setAiRefining(false);

    // 1. Show instant quick score (no API call)
    const quick = computeQuickScore(resumeText, skills, text);
    const quickResult: MatchResult = {
      score: quick.score,
      matched_skills: quick.matched,
      missing_skills: quick.missing,
      matched_keywords: quick.matched,
      missing_keywords: quick.missing,
      experience_match: "Quick estimate based on skills.",
      recommendation: "Refining with AI analysis…",
      tips: [],
      parsed: { youHave: quick.matched, youreMissing: quick.missing, quickWins: [] },
      isAiRefined: false,
    };
    setResult(quickResult);
    setLoading(false);
    setAiRefining(true);

    // 2. Fetch AI score in background, update when ready
    try {
      const { scores } = await scoreJob(resumeText, text);
      const s = scores[0];
      const parsed = parseReasoning(s?.reasoning, quick.matched, quick.missing);
      const aiResult: MatchResult = {
        score: s?.match_score ?? quick.score,
        matched_skills: quick.matched,
        missing_skills: quick.missing,
        matched_keywords: quick.matched,
        missing_keywords: quick.missing,
        experience_match: s?.reasoning ?? "",
        recommendation: s?.reasoning ?? "Unable to analyze.",
        tips: parsed.quickWins,
        parsed,
        isAiRefined: true,
      };
      setResult(aiResult);
      if (user?.id && aiResult) {
        await supabase.from("match_analyses").insert({
          user_id: user.id,
          job_description: text.slice(0, 10000),
          score: aiResult.score,
          results: aiResult,
        });
      }
    } catch {
      setResult((prev) =>
        prev
          ? { ...prev, recommendation: "AI analysis failed. Showing skill-based estimate.", isAiRefined: false }
          : quickResult
      );
    } finally {
      setAiRefining(false);
    }
  };

  const hasResume = !!resumeText.trim();

  const handleTailorResume = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) return;
    setTailorModalOpen(true);
    setTailorLoading(true);
    setTailoredContent("");
    setTailorError(null);
    try {
      const userContext = `Resume:\n${resumeText}\n\nJob Description:\n${jobDescription}`;
      const { response } = await chat(
        "Rewrite these resume bullet points to better match this job description",
        userContext
      );
      setTailoredContent(response);
    } catch (e) {
      setTailorError(e instanceof Error ? e.message : "Failed to tailor resume.");
    } finally {
      setTailorLoading(false);
    }
  };

  const handleCopyTailored = async () => {
    if (!tailoredContent) return;
    try {
      await navigator.clipboard.writeText(tailoredContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setTailorError("Could not copy to clipboard.");
    }
  };

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

          {/* Match results — You have, You're missing, Quick wins */}
          {result && !loading && (
            <div className="space-y-6">
              {aiRefining && (
                <p className="flex items-center gap-2 text-sm text-text-muted">
                  <Loader2 size={16} className="animate-spin" />
                  Refining with AI analysis…
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                {/* 1. You have */}
                <div
                  className="rounded-card border bg-bg-card p-4"
                  style={{ borderColor: "var(--border)" }}
                >
                  <h3 className="font-semibold text-text-primary">You have</h3>
                  <p className="mt-0.5 text-xs text-text-muted">Skills from the job that match your resume</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(result.parsed?.youHave ?? result.matched_skills).length > 0 ? (
                      (result.parsed?.youHave ?? result.matched_skills).map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-sm text-green-800"
                        >
                          <Check size={12} />
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-text-muted">None identified</span>
                    )}
                  </div>
                </div>

                {/* 2. You're missing */}
                <div
                  className="rounded-card border bg-bg-card p-4"
                  style={{ borderColor: "var(--border)" }}
                >
                  <h3 className="font-semibold text-text-primary">You&apos;re missing</h3>
                  <p className="mt-0.5 text-xs text-text-muted">Skills the job needs that aren&apos;t in your resume</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(result.parsed?.youreMissing ?? result.missing_skills).length > 0 ? (
                      (result.parsed?.youreMissing ?? result.missing_skills).map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-sm text-red-700"
                        >
                          <X size={12} />
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-text-muted">None — great fit!</span>
                    )}
                  </div>
                </div>

                {/* 3. Quick wins */}
                <div
                  className="rounded-card border bg-bg-card p-4"
                  style={{ borderColor: "var(--border)" }}
                >
                  <h3 className="font-semibold text-text-primary">Quick wins</h3>
                  <p className="mt-0.5 text-xs text-text-muted">2–3 suggestions to close the gap</p>
                  <div className="mt-3 space-y-2">
                    {(result.parsed?.quickWins ?? result.tips).length > 0 ? (
                      (result.parsed?.quickWins ?? result.tips).map((t, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 rounded-button border-l-2 border-primary pl-3 py-1 text-sm text-text-secondary"
                          style={{ borderLeftColor: "var(--accent)" }}
                        >
                          <Lightbulb size={14} className="mt-0.5 shrink-0 text-amber-500" />
                          <span>{t}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-text-muted">Complete the analysis for AI suggestions</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTailorResume}
                className="rounded-button border-2 px-4 py-2 text-sm font-semibold transition hover:bg-bg-hero"
                style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
              >
                Tailor My Resume
              </button>
            </div>
          )}

          {/* Tailor Resume Modal */}
          <AnimatePresence>
            {tailorModalOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/50"
                  onClick={() => !tailorLoading && setTailorModalOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={(e) => e.stopPropagation()}
                  className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-card border bg-bg-card p-4 shadow-xl"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-text-primary">Tailored Resume Bullets</h3>
                    <button
                      type="button"
                      onClick={() => !tailorLoading && setTailorModalOpen(false)}
                      className="rounded-button p-1 text-text-muted hover:bg-bg-hero hover:text-text-primary"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="mt-4 max-h-[60vh] overflow-y-auto">
                    {tailorLoading ? (
                      <div className="flex items-center gap-2 py-8 text-text-muted">
                        <Loader2 size={20} className="animate-spin" />
                        Rewriting your resume bullets…
                      </div>
                    ) : tailorError ? (
                      <p className="py-4 text-sm text-red-600">{tailorError}</p>
                    ) : tailoredContent ? (
                      <pre className="whitespace-pre-wrap rounded-button border bg-bg-page p-3 text-sm text-text-primary" style={{ borderColor: "var(--border)" }}>
                        {tailoredContent}
                      </pre>
                    ) : null}
                  </div>
                  {tailoredContent && (
                    <button
                      type="button"
                      onClick={handleCopyTailored}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-button bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      {copied ? (
                        <>
                          <Check size={16} />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          Copy
                        </>
                      )}
                    </button>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>

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
