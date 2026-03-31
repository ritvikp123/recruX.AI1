import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { extractResumeFast, parseResume, resumeGapWhy, resumeOptimizeForJob } from "../lib/api";
import { sanitizeResumeText } from "../lib/resumeSanitize";
import { useJobStore } from "../store/useJobStore";
import { R } from "../recrux/theme";

export function ResumeOptimizer() {
  const { user } = useAuth();
  const setResumeText = useJobStore((s) => s.setResumeText);
  const setResumeSkills = useJobStore((s) => s.setResumeSkills);
  const resumeText = useJobStore((s) => s.resumeText);
  const loadResumeFromSupabase = useJobStore((s) => s.loadResumeFromSupabase);
  const [tab, setTab] = useState<"optimize" | "why">("optimize");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [optimized, setOptimized] = useState("");
  const [whyText, setWhyText] = useState("");
  const [busyOptimize, setBusyOptimize] = useState(false);
  const [busyWhy, setBusyWhy] = useState(false);
  const [tailorError, setTailorError] = useState<string | null>(null);
  const [parsedSummary, setParsedSummary] = useState("");
  const [parsedExperience, setParsedExperience] = useState("");
  const [parsedSkills, setParsedSkills] = useState("");

  const card = {
    background: R.card,
    border: `0.5px solid ${R.border}`,
    borderRadius: 10,
    padding: 16,
  } as const;

  const panelHairline = `0.5px solid ${R.border}`;

  useEffect(() => {
    if (user?.id) void loadResumeFromSupabase(user.id);
  }, [user?.id, loadResumeFromSupabase]);

  useEffect(() => {
    // If we have resume text (persisted / loaded) but no parsed sections, show a stable preview.
    if (!resumeText?.trim()) return;
    if (parsedSummary || parsedExperience || parsedSkills) return;
    setParsedSummary("Resume text loaded. Re-upload to re-run full parsing for structured sections.");
    setParsedSkills("—");
    setParsedExperience(sanitizeResumeText(resumeText).slice(0, 1200));
  }, [resumeText, parsedSummary, parsedExperience, parsedSkills]);

  const resumeForApi = () => sanitizeResumeText((resumeText || "").trim());

  const runOptimize = async () => {
    const rt = resumeForApi();
    const jd = jobDescription.trim();
    if (!rt) {
      setTailorError("Upload and parse a resume first (or ensure profile has resume text).");
      return;
    }
    if (!jd) {
      setTailorError("Paste a job description.");
      return;
    }
    setTailorError(null);
    setBusyOptimize(true);
    setOptimized("");
    try {
      const { text } = await resumeOptimizeForJob(rt, jd);
      setOptimized(text);
    } catch (e: unknown) {
      setTailorError(e instanceof Error ? e.message : "Optimize failed.");
    } finally {
      setBusyOptimize(false);
    }
  };

  const runWhy = async () => {
    const rt = resumeForApi();
    const jd = jobDescription.trim();
    if (!rt) {
      setTailorError("Upload and parse a resume first (or ensure profile has resume text).");
      return;
    }
    if (!jd) {
      setTailorError("Paste a job description.");
      return;
    }
    setTailorError(null);
    setBusyWhy(true);
    setWhyText("");
    try {
      const { text } = await resumeGapWhy(rt, jd);
      setWhyText(text);
    } catch (e: unknown) {
      setTailorError(e instanceof Error ? e.message : "Analysis failed.");
    } finally {
      setBusyWhy(false);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) {
      alert("Sign in and pick a PDF first.");
      return;
    }
    setUploading(true);
    try {
      const path = `${user.id}/resume.pdf`;
      const { error } = await supabase.storage.from("resumes").upload(path, file, {
        upsert: true,
      });
      if (error) throw error;
      let text = "";
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "pdf" || ext === "docx") {
        try {
          const data = await parseResume(file);
          const parseLooksBroken =
            (data?.professional_summary || "").trim() === "Error parsing resume content." ||
            // When Ollama is down, backend returns minimal fallback with empty skills.
            (!data?.skills || data.skills.length === 0);
          if (parseLooksBroken) {
            throw new Error("AI parsing unavailable (check Ollama). Falling back to fast extract.");
          }

          text = sanitizeResumeText(data?.raw_text || "");
          setResumeText(text);

          setParsedSummary((data?.professional_summary || "").trim() || "No summary found.");

          const exp = Array.isArray(data?.experience)
            ? data.experience
                .map((e: unknown) => {
                  const row = e as Record<string, unknown>;
                  const head = [row?.role, row?.company].filter(Boolean).join(" — ");
                  const duration = row?.duration ? ` (${row.duration})` : "";
                  const desc = String(row?.description || "").trim();
                  return `${head}${duration}${desc ? `\n${desc}` : ""}`.trim();
                })
                .filter(Boolean)
                .join("\n\n")
            : "";
          setParsedExperience(exp || "No experience extracted.");
          setParsedSkills(
            Array.isArray(data?.skills) && data.skills.length
              ? data.skills.join(", ")
              : "No skills extracted."
          );

          // Option B: merge LLM skills with deterministic keyword extract so we don't miss items.
          let extractedSkills: string[] = [];
          try {
            const extracted = await extractResumeFast(file);
            extractedSkills = Array.isArray(extracted?.skills) ? extracted.skills : [];
          } catch {
            // ignore extract failure; keep parse skills
          }

          const parseSkills = Array.isArray(data?.skills) ? data.skills : [];
          const mergedSkills = Array.from(
            new Map(
              [...parseSkills, ...extractedSkills]
                .map((s) => String(s).trim())
                .filter(Boolean)
                .map((s) => [s.toLowerCase(), s] as const)
            ).values()
          );

          setParsedSkills(mergedSkills.length ? mergedSkills.join(", ") : "No skills extracted.");
          setResumeSkills(mergedSkills);

          await supabase.from("profiles").upsert({
            id: user.id,
            resume_text: text || null,
            skills: mergedSkills.length ? mergedSkills : null,
            updated_at: new Date().toISOString(),
          });
        } catch (err: unknown) {
          // Fallback: extract raw text + keyword skills without requiring Ollama.
          try {
            const extracted = await extractResumeFast(file);
            text = sanitizeResumeText(extracted?.raw_text || "");
            setResumeText(text);
            setParsedSummary("AI parsing unavailable; using fast extract (raw text + keyword skills).");
            setParsedExperience(text ? text.slice(0, 1200) : "No text extracted.");
            setParsedSkills(
              Array.isArray(extracted?.skills) && extracted.skills.length ? extracted.skills.join(", ") : "No skills extracted."
            );
            setResumeSkills(Array.isArray(extracted?.skills) ? extracted.skills : []);
            await supabase.from("profiles").upsert({
              id: user.id,
              resume_text: text || null,
              skills: extracted?.skills?.length ? extracted.skills : null,
              updated_at: new Date().toISOString(),
            });
            alert("Resume uploaded. Used fast extract because AI parse was unavailable.");
          } catch (fallbackErr: unknown) {
            const msg = fallbackErr instanceof Error ? fallbackErr.message : "Parse failed.";
            alert(`Resume parse failed: ${msg}`);
          }
        }
      }
      if (!text) setResumeText("Resume uploaded.");
      alert("Resume uploaded successfully.");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const pill = (active: boolean) => ({
    fontSize: 11,
    padding: "6px 12px",
    borderRadius: 20,
    border: "none",
    cursor: "pointer",
    background: active ? R.primary : "transparent",
    color: active ? "#fff" : R.primary,
    fontWeight: 500,
  });

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "none",
        margin: 0,
        minHeight: "calc(100vh - 56px)",
        boxSizing: "border-box",
        background: R.card,
        border: panelHairline,
        borderRadius: 16,
        boxShadow: "0 4px 28px rgba(4, 44, 83, 0.1), 0 1px 3px rgba(0, 0, 0, 0.06)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: 20, flex: 1, minHeight: 0, overflowY: "auto" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: R.darkest, marginBottom: 16 }}>
          Resume optimizer
        </h1>

        <div style={{ ...card, marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: R.darkest }}>Upload resume (PDF)</p>
          <input
            type="file"
            accept=".pdf,.docx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ marginTop: 8, fontSize: 12 }}
          />
          <button
            type="button"
            onClick={() => void handleUpload()}
            disabled={uploading}
            style={{
              marginTop: 12,
              background: R.primary,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              opacity: uploading ? 0.6 : 1,
            }}
          >
            {uploading ? "Uploading…" : "Upload Resume"}
          </button>
        </div>

        <div className="recrux-resume-grid">
          <div style={card}>
            <h2 style={{ fontSize: 13, fontWeight: 500, color: R.darkest, marginBottom: 12 }}>
              Parsed sections
            </h2>
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: R.primary }}>Summary</p>
              <p style={{ fontSize: 11, color: R.deep, marginTop: 4 }}>{parsedSummary}</p>
            </div>
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: R.primary }}>Experience</p>
              <pre
                style={{
                  fontSize: 11,
                  color: R.deep,
                  marginTop: 4,
                  whiteSpace: "pre-wrap",
                  fontFamily: "inherit",
                }}
              >
                {parsedExperience}
              </pre>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 500, color: R.primary }}>Skills</p>
              <p style={{ fontSize: 11, color: R.deep, marginTop: 4 }}>{parsedSkills}</p>
            </div>
          </div>

          <div style={card}>
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 16,
                borderBottom: `0.5px solid ${R.border}`,
                paddingBottom: 12,
              }}
            >
              <button type="button" style={pill(tab === "optimize")} onClick={() => setTab("optimize")}>
                Optimize for job
              </button>
              <button type="button" style={pill(tab === "why")} onClick={() => setTab("why")}>
                Why you didn&apos;t get it
              </button>
            </div>

            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here…"
              style={{
                width: "100%",
                minHeight: 100,
                border: `0.5px solid ${R.border}`,
                borderRadius: 8,
                padding: 10,
                fontSize: 11,
                marginBottom: 12,
                boxSizing: "border-box",
              }}
            />

            {tailorError && (
              <p style={{ fontSize: 11, color: R.warnText, marginBottom: 8 }}>{tailorError}</p>
            )}

            {tab === "optimize" && (
              <>
                <button
                  type="button"
                  onClick={() => void runOptimize()}
                  disabled={busyOptimize}
                  style={{
                    background: R.primary,
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontSize: 12,
                    cursor: busyOptimize ? "default" : "pointer",
                    opacity: busyOptimize ? 0.7 : 1,
                  }}
                >
                  {busyOptimize ? "Optimizing…" : "Optimize for this job"}
                </button>
                <p style={{ fontSize: 10, color: R.deep, marginTop: 8 }}>
                  Uses your stored resume text and the job description above (local Ollama via API).
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 500, color: R.deep }}>Original (experience)</p>
                    <p style={{ fontSize: 11, color: R.darkest, marginTop: 4 }}>{parsedExperience}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 500, color: R.deep }}>Optimized</p>
                    <p style={{ fontSize: 11, color: R.darkest, marginTop: 4, whiteSpace: "pre-wrap" }}>
                      {optimized}
                    </p>
                  </div>
                </div>
              </>
            )}

            {tab === "why" && (
              <>
                <button
                  type="button"
                  onClick={() => void runWhy()}
                  disabled={busyWhy}
                  style={{
                    background: R.primary,
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontSize: 12,
                    cursor: busyWhy ? "default" : "pointer",
                    opacity: busyWhy ? 0.7 : 1,
                    marginBottom: 12,
                  }}
                >
                  {busyWhy ? "Analyzing…" : "Analyze gaps"}
                </button>
                <p style={{ fontSize: 12, color: R.deep, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                  {whyText ||
                    "Paste a job description and click Analyze gaps. Results use your resume text from the last successful parse."}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
