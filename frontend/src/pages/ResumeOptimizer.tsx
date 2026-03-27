import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { parseResume } from "../lib/api";
import { useJobStore } from "../store/useJobStore";
import { R } from "../recrux/theme";

export function ResumeOptimizer() {
  const { user } = useAuth();
  const setResumeText = useJobStore((s) => s.setResumeText);
  const [tab, setTab] = useState<"optimize" | "why">("optimize");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [optimized, setOptimized] = useState("");
  const [streaming, setStreaming] = useState(false);

  const summary =
    "CS student with internship experience in full-stack web apps. Passionate about clean UI and reliable APIs.";
  const experience =
    "Software Intern — Acme (Summer 2025)\nBuilt React dashboards and Node APIs for internal ops.";
  const skills = "TypeScript, React, Node.js, PostgreSQL, Tailwind CSS";

  const card = {
    background: R.card,
    border: `0.5px solid ${R.border}`,
    borderRadius: 10,
    padding: 16,
  } as const;

  const panelHairline = `0.5px solid ${R.border}`;

  const mockOptimize = () => {
    setStreaming(true);
    setOptimized("");
    const text =
      "• Led development of customer-facing React dashboards, improving task completion time by 18%.\n• Shipped REST APIs in Node.js with PostgreSQL, with 99.9% uptime during internship.";
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setOptimized(text.slice(0, i));
      if (i >= text.length) {
        window.clearInterval(id);
        setStreaming(false);
      }
    }, 18);
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
          text = data?.raw_text || "";
          setResumeText(text);
          await supabase
            .from("profiles")
            .upsert({
              id: user.id,
              resume_text: text || null,
              skills: data?.skills?.length ? data.skills : null,
              updated_at: new Date().toISOString(),
            });
        } catch {
          /* optional backend */
        }
      }
      if (!text) setResumeText("Resume uploaded.");
      alert("Uploaded to Supabase Storage.");
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
          accept=".pdf"
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
          {uploading ? "Uploading…" : "Upload to Supabase"}
        </button>
      </div>

      <div className="recrux-resume-grid">
        <div style={card}>
          <h2 style={{ fontSize: 13, fontWeight: 500, color: R.darkest, marginBottom: 12 }}>
            Parsed sections
          </h2>
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 500, color: R.primary }}>Summary</p>
            <p style={{ fontSize: 11, color: R.deep, marginTop: 4 }}>{summary}</p>
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
              {experience}
            </pre>
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, color: R.primary }}>Skills</p>
            <p style={{ fontSize: 11, color: R.deep, marginTop: 4 }}>{skills}</p>
          </div>
        </div>

        <div style={card}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, borderBottom: `0.5px solid ${R.border}`, paddingBottom: 12 }}>
            <button type="button" style={pill(tab === "optimize")} onClick={() => setTab("optimize")}>
              Optimize for job
            </button>
            <button type="button" style={pill(tab === "why")} onClick={() => setTab("why")}>
              Why you didn&apos;t get it
            </button>
          </div>

          {tab === "optimize" && (
            <>
              <textarea
                placeholder="Paste job description…"
                defaultValue="Looking for a React engineer with TypeScript and API experience."
                style={{
                  width: "100%",
                  minHeight: 100,
                  border: `0.5px solid ${R.border}`,
                  borderRadius: 8,
                  padding: 10,
                  fontSize: 11,
                  marginBottom: 12,
                }}
              />
              <button
                type="button"
                onClick={mockOptimize}
                disabled={streaming}
                style={{
                  background: R.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                {streaming ? "Streaming…" : "Optimize (mock)"}
              </button>
              <p style={{ fontSize: 10, color: R.deep, marginTop: 8 }}>
                Connect OpenAI/Claude for real rewrites.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 500, color: R.deep }}>Original</p>
                  <p style={{ fontSize: 11, color: R.darkest, marginTop: 4 }}>{experience}</p>
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
            <p style={{ fontSize: 12, color: R.deep, lineHeight: 1.5 }}>
              This role emphasizes distributed systems and Kubernetes. Your resume highlights frontend
              and Node — add a project line for containers and cloud deployment.
            </p>
          )}
        </div>
      </div>

      </div>
    </div>
  );
}
