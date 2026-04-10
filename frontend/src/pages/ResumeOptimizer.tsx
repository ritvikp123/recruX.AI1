import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { extractResumeFast, parseResume, resumeGapWhy, resumeOptimizeForJob } from "../lib/api";
import { sanitizeResumeText } from "../lib/resumeSanitize";
import { useJobStore } from "../store/useJobStore";
import { R } from "../recrux/theme";

type StoredResume = {
  id: string;
  fileName: string;
  uploadedAt: string;
  storagePath: string;
  rawText: string;
  skills: string[];
  summary: string;
  experience: string;
  skillsText: string;
  isPrimary?: boolean;
};

const RESUME_LIBRARY_KEY = "recrux-resume-library-v1";
const MAX_STORED_RESUMES = 5;

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function ResumeOptimizer() {
  const { user } = useAuth();
  const setResumeText = useJobStore((s) => s.setResumeText);
  const setResumeSkills = useJobStore((s) => s.setResumeSkills);
  const resumeText = useJobStore((s) => s.resumeText);
  const [tab, setTab] = useState<"optimize" | "why">("optimize");
  const [lastSelectedFileName, setLastSelectedFileName] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
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
  const [parsedRawText, setParsedRawText] = useState("");
  const [previewFileUrl, setPreviewFileUrl] = useState("");
  const [previewFileName, setPreviewFileName] = useState("");
  const [showResumePreview, setShowResumePreview] = useState(false);
  const [resumeLibrary, setResumeLibrary] = useState<StoredResume[]>([]);

  const card = {
    background: R.card,
    border: `0.5px solid ${R.border}`,
    borderRadius: 10,
    padding: 16,
  } as const;

  const panelHairline = `0.5px solid ${R.border}`;

  useEffect(() => {
    // Privacy: don't auto-render resume contents on page load.
    // User must upload a file or explicitly choose to preview the stored resume.
    setShowResumePreview(false);
    setParsedSummary("");
    setParsedExperience("");
    setParsedSkills("");
    setParsedRawText("");
    setPreviewFileUrl("");
    setPreviewFileName("");
    setOptimized("");
    setWhyText("");
    setTailorError(null);
    setJobDescription("");
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setResumeLibrary([]);
      return;
    }
    try {
      const raw = localStorage.getItem(RESUME_LIBRARY_KEY);
      const all = raw ? (JSON.parse(raw) as Record<string, StoredResume[]>) : {};
      const list = Array.isArray(all[user.id]) ? all[user.id] : [];
      setResumeLibrary(list);

      const primary = list.find((r) => r.isPrimary) ?? list[0];
      if (primary) {
        setResumeText(primary.rawText || "");
        setResumeSkills(Array.isArray(primary.skills) ? primary.skills : []);
      }
    } catch {
      setResumeLibrary([]);
    }
  }, [user?.id, setResumeText, setResumeSkills]);

  const saveLibrary = (next: StoredResume[]) => {
    if (!user?.id) return;
    setResumeLibrary(next);
    try {
      const raw = localStorage.getItem(RESUME_LIBRARY_KEY);
      const all = raw ? (JSON.parse(raw) as Record<string, StoredResume[]>) : {};
      all[user.id] = next;
      localStorage.setItem(RESUME_LIBRARY_KEY, JSON.stringify(all));
    } catch {
      // ignore storage write failures
    }
  };

  const applyResumeToSession = async (entry: StoredResume, opts?: { preview?: boolean }) => {
    setResumeText(entry.rawText || "");
    setResumeSkills(Array.isArray(entry.skills) ? entry.skills : []);
    if (opts?.preview) {
      setParsedSummary(entry.summary || "No summary found.");
      setParsedExperience(entry.experience || "No experience extracted.");
      setParsedSkills(entry.skillsText || "No skills extracted.");
      setShowResumePreview(true);
    }
    if (user?.id) {
      await supabase.from("profiles").upsert({
        id: user.id,
        resume_text: entry.rawText || null,
        skills: entry.skills?.length ? entry.skills : null,
        updated_at: new Date().toISOString(),
      });
    }
  };

  const openResumePreview = async (entry: StoredResume) => {
    const fallbackText = sanitizeResumeText(entry.rawText || "").slice(0, 1200);
    const summary = (entry.summary || "").trim() || "No summary found.";
    const experience = (entry.experience || "").trim() || fallbackText || "No experience extracted.";
    const skillsText =
      (entry.skillsText || "").trim() ||
      (Array.isArray(entry.skills) && entry.skills.length ? entry.skills.join(", ") : "No skills extracted.");
    const rawText = sanitizeResumeText(entry.rawText || "").trim();

    setParsedSummary(summary);
    setParsedExperience(experience);
    setParsedSkills(skillsText);
    setParsedRawText(rawText || experience);
    setPreviewFileName(entry.fileName || "");
    setPreviewFileUrl("");
    if (entry.storagePath) {
      try {
        const { data } = await supabase.storage.from("resumes").createSignedUrl(entry.storagePath, 60 * 60);
        setPreviewFileUrl(data?.signedUrl || "");
      } catch {
        setPreviewFileUrl("");
      }
    }
    setShowResumePreview(true);
    void applyResumeToSession(entry);
  };

  const setPrimaryResume = async (resumeId: string) => {
    const entry = resumeLibrary.find((r) => r.id === resumeId);
    if (!entry) return;
    const next = resumeLibrary.map((r) => ({ ...r, isPrimary: r.id === resumeId }));
    saveLibrary(next);
    await applyResumeToSession({ ...entry, isPrimary: true }, { preview: true });
  };

  const removeResume = async (resumeId: string) => {
    const target = resumeLibrary.find((r) => r.id === resumeId);
    if (!target) return;
    const next = resumeLibrary.filter((r) => r.id !== resumeId);
    if (target.storagePath) {
      await supabase.storage.from("resumes").remove([target.storagePath]);
    }
    if (next.length > 0 && !next.some((r) => r.isPrimary)) {
      next[0] = { ...next[0], isPrimary: true };
      await applyResumeToSession(next[0], { preview: true });
    } else if (next.length === 0) {
      setResumeText("");
      setResumeSkills([]);
      setShowResumePreview(false);
      setParsedSummary("");
      setParsedExperience("");
      setParsedSkills("");
      setParsedRawText("");
      setPreviewFileUrl("");
      setPreviewFileName("");
      if (user?.id) {
        await supabase.from("profiles").upsert({
          id: user.id,
          resume_text: null,
          skills: null,
          updated_at: new Date().toISOString(),
        });
      }
    }
    saveLibrary(next);
  };

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

  const handleUpload = async (selectedFile: File | null) => {
    if (!selectedFile || !user) {
      alert("Sign in and choose a PDF or Word file first.");
      return;
    }
    const maxBytes = 10 * 1024 * 1024;
    if (selectedFile.size > maxBytes) {
      alert("File must be 10MB or smaller.");
      return;
    }
    if (resumeLibrary.length >= MAX_STORED_RESUMES) {
      alert(`You can store up to ${MAX_STORED_RESUMES} resumes. Delete one to upload a new file.`);
      return;
    }
    setUploading(true);
    try {
      const path = `${user.id}/${Date.now()}-${sanitizeFileName(selectedFile.name)}`;
      const { error } = await supabase.storage.from("resumes").upload(path, selectedFile, {
        upsert: false,
      });
      if (error) throw error;
      let text = "";
      let summary = "";
      let experience = "";
      let skillsText = "";
      let mergedSkills: string[] = [];
      const ext = selectedFile.name.split(".").pop()?.toLowerCase();
      if (ext === "pdf" || ext === "docx") {
        try {
          const data = await parseResume(selectedFile);
          const parseLooksBroken =
            (data?.professional_summary || "").trim() === "Error parsing resume content." ||
            // When Ollama is down, backend returns minimal fallback with empty skills.
            (!data?.skills || data.skills.length === 0);
          if (parseLooksBroken) {
            throw new Error("AI parsing unavailable (check Ollama). Falling back to fast extract.");
          }

          text = sanitizeResumeText(data?.raw_text || "");
          setResumeText(text);

          summary = (data?.professional_summary || "").trim() || "No summary found.";
          setParsedSummary(summary);

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
          experience = exp || "No experience extracted.";
          setParsedExperience(experience);
          setParsedRawText(text || experience);

          // Option B: merge LLM skills with deterministic keyword extract so we don't miss items.
          let extractedSkills: string[] = [];
          try {
            const extracted = await extractResumeFast(selectedFile);
            extractedSkills = Array.isArray(extracted?.skills) ? extracted.skills : [];
          } catch {
            // ignore extract failure; keep parse skills
          }

          const parseSkills = Array.isArray(data?.skills) ? data.skills : [];
          mergedSkills = Array.from(
            new Map(
              [...parseSkills, ...extractedSkills]
                .map((s) => String(s).trim())
                .filter(Boolean)
                .map((s) => [s.toLowerCase(), s] as const)
            ).values()
          );

          skillsText = mergedSkills.length ? mergedSkills.join(", ") : "No skills extracted.";
          setParsedSkills(skillsText);
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
            const extracted = await extractResumeFast(selectedFile);
            text = sanitizeResumeText(extracted?.raw_text || "");
            setResumeText(text);
            summary = "AI parsing unavailable; using fast extract (raw text + keyword skills).";
            experience = text ? text.slice(0, 1200) : "No text extracted.";
            mergedSkills = Array.isArray(extracted?.skills) ? extracted.skills : [];
            skillsText = mergedSkills.length ? mergedSkills.join(", ") : "No skills extracted.";
            setParsedSummary(summary);
            setParsedExperience(experience);
            setParsedSkills(skillsText);
            setParsedRawText(text || experience);
            setResumeSkills(mergedSkills);
            await supabase.from("profiles").upsert({
              id: user.id,
              resume_text: text || null,
              skills: mergedSkills.length ? mergedSkills : null,
              updated_at: new Date().toISOString(),
            });
          } catch (fallbackErr: unknown) {
            const msg = fallbackErr instanceof Error ? fallbackErr.message : "Parse failed.";
            alert(`Resume parse failed: ${msg}`);
          }
        }
      }
      if (!text) setResumeText("Resume uploaded.");
      const entry: StoredResume = {
        id: `resume-${Date.now()}`,
        fileName: selectedFile.name,
        uploadedAt: new Date().toISOString(),
        storagePath: path,
        rawText: text,
        skills: mergedSkills,
        summary: summary || "No summary found.",
        experience: experience || (text ? text.slice(0, 1200) : "No experience extracted."),
        skillsText: skillsText || (mergedSkills.length ? mergedSkills.join(", ") : "No skills extracted."),
        isPrimary: true,
      };
      const next = [entry, ...resumeLibrary.map((r) => ({ ...r, isPrimary: false }))].slice(0, MAX_STORED_RESUMES);
      saveLibrary(next);
      setLastSelectedFileName(selectedFile.name);
      setShowUploadModal(false);
      setPendingFile(null);
      alert("Resume uploaded successfully.");
      setShowResumePreview(true);
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
        position: "relative",
      }}
    >
      <div style={{ padding: 20, flex: 1, minHeight: 0, overflowY: "auto" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: R.darkest, margin: "0 0 16px" }}>
          Resume optimizer
        </h1>
        <div style={{ position: "absolute", top: 20, right: 20, zIndex: 20 }}>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            style={{
              background: R.primary,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Add Resume
          </button>
        </div>
        <input
          id="resume-upload-input"
          type="file"
          accept=".pdf,.docx"
          style={{ display: "none" }}
          onChange={(e) => {
            const selected = e.target.files?.[0] || null;
            setPendingFile(selected);
            e.currentTarget.value = "";
          }}
        />

        {showUploadModal && (
          <div
            onClick={() => {
              setShowUploadModal(false);
              setPendingFile(null);
            }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(2, 6, 23, 0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 16,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: 420,
                background: R.card,
                border: panelHairline,
                borderRadius: 16,
                padding: 20,
                position: "relative",
                boxShadow: "0 4px 28px rgba(4, 44, 83, 0.1), 0 1px 3px rgba(0, 0, 0, 0.06)",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setPendingFile(null);
                }}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: panelHairline,
                  background: R.card,
                  color: R.deep,
                  fontSize: 20,
                  fontWeight: 500,
                  cursor: "pointer",
                  lineHeight: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-label="Close upload modal"
              >
                ×
              </button>

              <h2
                style={{
                  margin: "0 36px 14px 0",
                  fontSize: 20,
                  lineHeight: 1.25,
                  fontWeight: 700,
                  color: R.darkest,
                }}
              >
                Add Your Resume
              </h2>

              <label
                htmlFor="resume-upload-input"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const f = e.dataTransfer.files?.[0];
                  if (!f) return;
                  const ext = f.name.split(".").pop()?.toLowerCase();
                  if (ext === "pdf" || ext === "docx") setPendingFile(f);
                }}
                style={{
                  display: "block",
                  borderRadius: 8,
                  border: `0.5px dashed ${R.border}`,
                  background: R.light,
                  padding: "12px 14px",
                  minHeight: 64,
                  boxSizing: "border-box",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22, lineHeight: 1, opacity: 0.85 }} aria-hidden>
                    📄
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: R.darkest }}>
                      Choose or drop a file
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: 11, color: R.deep }}>
                      PDF or Word · Max 10MB
                    </p>
                  </div>
                </div>
              </label>

              {pendingFile && (
                <p
                  style={{
                    margin: "10px 0 0",
                    fontSize: 11,
                    color: R.deep,
                    wordBreak: "break-word",
                  }}
                >
                  Selected: <span style={{ color: R.darkest, fontWeight: 600 }}>{pendingFile.name}</span>
                </p>
              )}
              <div style={{ marginTop: 16 }}>
                <button
                  type="button"
                  disabled={!pendingFile || uploading}
                  onClick={() => void handleUpload(pendingFile)}
                  style={{
                    width: "100%",
                    border: "none",
                    borderRadius: 8,
                    background: R.primary,
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 500,
                    padding: "8px 16px",
                    cursor: !pendingFile || uploading ? "not-allowed" : "pointer",
                    opacity: !pendingFile || uploading ? 0.6 : 1,
                  }}
                >
                  {uploading ? "Uploading…" : "Upload"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ ...card, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: R.darkest, margin: 0 }}>Resume library</p>
            <p style={{ fontSize: 11, color: R.deep, margin: 0 }}>
              {resumeLibrary.length}/{MAX_STORED_RESUMES} saved
            </p>
          </div>
          {resumeLibrary.length === 0 ? (
            <p style={{ fontSize: 11, color: R.deep, marginTop: 8 }}>No saved resumes yet. Upload your first file.</p>
          ) : (
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              {resumeLibrary.map((r) => (
                <div
                  key={r.id}
                  onClick={() => void openResumePreview(r)}
                  style={{
                    border: `0.5px solid ${R.border}`,
                    borderRadius: 8,
                    padding: "8px 10px",
                    background: r.isPrimary ? `${R.light}` : R.card,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, color: R.darkest, fontWeight: 600 }}>{r.fileName}</p>
                      <p style={{ margin: "3px 0 0", fontSize: 10, color: R.deep }}>
                        {new Date(r.uploadedAt).toLocaleString()}
                        {r.isPrimary ? " • Main resume" : ""}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {!r.isPrimary && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void setPrimaryResume(r.id);
                          }}
                          style={{
                            border: `0.5px solid ${R.primary}`,
                            background: "transparent",
                            color: R.primary,
                            borderRadius: 6,
                            padding: "4px 8px",
                            fontSize: 10,
                            cursor: "pointer",
                          }}
                        >
                          Set main
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void openResumePreview(r);
                        }}
                        style={{
                          border: `0.5px solid ${R.border}`,
                          background: "transparent",
                          color: R.darkest,
                          borderRadius: 6,
                          padding: "4px 8px",
                          fontSize: 10,
                          cursor: "pointer",
                        }}
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void removeResume(r.id);
                        }}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "#b91c1c",
                          borderRadius: 6,
                          padding: "4px 6px",
                          fontSize: 10,
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="recrux-resume-grid">
          <div style={card}>
            <h2 style={{ fontSize: 13, fontWeight: 500, color: R.darkest, marginBottom: 12 }}>
              Parsed sections
            </h2>
            {!showResumePreview ? (
              <p style={{ fontSize: 11, color: R.deep, lineHeight: 1.5 }}>
                Add a resume (or click “Preview saved resume”) to show parsed sections here.
              </p>
            ) : (
              <>
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
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 500, color: R.primary }}>Resume text preview</p>
                  <pre
                    style={{
                      fontSize: 11,
                      color: R.deep,
                      marginTop: 4,
                      whiteSpace: "pre-wrap",
                      fontFamily: "inherit",
                      maxHeight: 220,
                      overflowY: "auto",
                    }}
                  >
                    {parsedRawText || "No resume text available."}
                  </pre>
                </div>
                {previewFileUrl && (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ fontSize: 11, fontWeight: 500, color: R.primary }}>Uploaded file preview</p>
                    {previewFileName.toLowerCase().endsWith(".pdf") ? (
                      <iframe
                        title="Resume file preview"
                        src={previewFileUrl}
                        style={{
                          width: "100%",
                          minHeight: 320,
                          border: `0.5px solid ${R.border}`,
                          borderRadius: 8,
                          marginTop: 4,
                          background: "#fff",
                        }}
                      />
                    ) : (
                      <a
                        href={previewFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-block",
                          marginTop: 4,
                          fontSize: 11,
                          color: R.primary,
                          textDecoration: "underline",
                        }}
                      >
                        Open uploaded file
                      </a>
                    )}
                  </div>
                )}
              </>
            )}
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
