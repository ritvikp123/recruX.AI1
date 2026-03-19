import { useState, useCallback, useEffect } from "react";
import { FileText, Download, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { api } from "../../api/client";
import { Toast } from "../../components/Toast";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPT = ".pdf,.docx,.doc";

interface ResumeUploadPageProps {
  hideTitle?: boolean;
}

export function ResumeUploadPage({ hideTitle }: ResumeUploadPageProps = {}) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [uploadedAt, setUploadedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [drag, setDrag] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase.from("profiles").select("resume_filename, resume_url, resume_uploaded_at").eq("id", user.id).single();
    if (data?.resume_filename) {
      setFilename(data.resume_filename);
      setUploadedAt(data.resume_uploaded_at || null);
      setResumeUrl(data.resume_url || null);
    }
  }, [user?.id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDrag(false);
      const f = e.dataTransfer.files[0];
      if (!f) return;
      if (f.size > MAX_SIZE) {
        setToast({ message: "File must be under 5MB.", type: "error" });
        return;
      }
      const ext = f.name.split(".").pop()?.toLowerCase();
      if (!["pdf", "docx", "doc"].includes(ext || "")) {
        setToast({ message: "Only PDF, DOCX, DOC supported.", type: "error" });
        return;
      }
      uploadFile(f);
    },
    [user?.id]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_SIZE) {
      setToast({ message: "File must be under 5MB.", type: "error" });
      return;
    }
    uploadFile(f);
    e.target.value = "";
  };

  const uploadFile = async (f: File) => {
    if (!user?.id) return;
    setLoading(true);
    setProgress(10);
    try {
      const path = `${user.id}/resume.${f.name.split(".").pop()}`;
      setProgress(30);
      const { error } = await supabase.storage.from("resumes").upload(path, f, { upsert: true });
      setProgress(50);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(path);
      const url = urlData.publicUrl;
      let resumeText = "";
      let skills: string[] = [];
      const ext = f.name.split(".").pop()?.toLowerCase();
      if (["pdf", "docx"].includes(ext || "")) {
        try {
          const form = new FormData();
          form.append("file", f);
          const { data } = await api.post<{ text: string; skills?: string[] }>("/resume/extract", form, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          resumeText = data?.text || "";
          skills = data?.skills || [];
        } catch {
          /* ignore extract failure */
        }
      }
      setProgress(70);
      await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          resume_url: url,
          resume_filename: f.name,
          resume_uploaded_at: new Date().toISOString(),
          resume_text: resumeText || null,
          skills: skills.length ? skills : null,
          updated_at: new Date().toISOString(),
        });
      setProgress(100);
      setFilename(f.name);
      setUploadedAt(new Date().toISOString());
      setResumeUrl(url);
      setToast({ message: "Resume uploaded successfully!", type: "success" });
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Upload failed. Please try again.";
      const isStorage = /bucket|storage|policy|row-level/i.test(msg);
      setToast({
        message: isStorage
          ? "Storage error: set up the 'resumes' bucket in Supabase (see migrations/004_storage_resumes.sql)."
          : msg.length > 80 ? "Upload failed. Check console for details." : msg,
        type: "error",
      });
      console.error("Resume upload error:", err);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleReplace = () => document.getElementById("resume-input")?.click();

  const handleDelete = async () => {
    if (!user?.id || !filename) return;
    try {
      await supabase.storage.from("resumes").remove([`${user.id}/resume.pdf`, `${user.id}/resume.docx`, `${user.id}/resume.doc`]);
      await supabase.from("profiles").update({
        resume_url: null,
        resume_filename: null,
        resume_uploaded_at: null,
        resume_text: null,
        skills: null,
      }).eq("id", user.id);
      setFilename(null);
      setUploadedAt(null);
      setResumeUrl(null);
      setToast({ message: "Resume deleted.", type: "success" });
    } catch {
      setToast({ message: "Delete failed.", type: "error" });
    }
  };

  const handleDownload = () => {
    if (!resumeUrl || !filename) return;
    const a = document.createElement("a");
    a.href = resumeUrl;
    a.download = filename;
    a.target = "_blank";
    a.click();
  };

  return (
    <div className="space-y-6">
      {!hideTitle && <h1 className="font-heading text-xl font-semibold text-text-primary">My Resume</h1>}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT – Upload area */}
        <div className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            className={`flex min-h-[200px] flex-col items-center justify-center rounded-card border-2 border-dashed p-6 transition ${
              drag ? "border-primary bg-bg-hero" : "border-border bg-bg-badge/50"
            }`}
          >
            <FileText size={40} className="mb-2 text-primary" />
            <p className="text-center font-medium text-text-primary">Drag and drop your resume here</p>
            <p className="mt-1 text-center text-sm text-text-muted">Supports PDF, DOCX, DOC — Max 5MB</p>
            <input id="resume-input" type="file" accept={ACCEPT} className="hidden" onChange={handleFileInput} />
            <button
              type="button"
              onClick={() => document.getElementById("resume-input")?.click()}
              className="mt-4 rounded-button bg-accent px-4 py-2 text-sm font-semibold text-white"
            >
              Browse files
            </button>
            {loading && (
              <div className="mt-4 w-full max-w-xs">
                <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </div>

          {filename && (
            <div className="rounded-card border bg-bg-card p-4" style={{ borderColor: "var(--border)" }}>
              <p className="text-sm font-medium text-text-primary">Currently uploaded:</p>
              <p className="mt-1 text-sm text-text-secondary">{filename}</p>
              {uploadedAt && <p className="mt-1 text-xs text-text-muted">{new Date(uploadedAt).toLocaleDateString()}</p>}
              <button type="button" onClick={handleReplace} className="mt-3 rounded-button border-2 border-primary px-3 py-1.5 text-sm font-medium text-primary">
                Replace
              </button>
            </div>
          )}
        </div>

        {/* RIGHT – Preview */}
        <div className="rounded-card border bg-bg-card p-4" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between">
            <p className="font-medium text-text-primary">Preview</p>
            {filename && (
              <div className="flex gap-2">
                <button type="button" onClick={handleDownload} className="rounded-button border-2 border-primary px-3 py-1.5 text-sm font-medium text-primary">
                  <Download size={14} className="inline mr-1" /> Download
                </button>
                <button type="button" onClick={handleDelete} className="text-sm font-medium text-red-600 hover:underline">
                  Delete resume
                </button>
              </div>
            )}
          </div>
          {filename && resumeUrl ? (
            <iframe
              src={filename.toLowerCase().endsWith(".pdf") ? resumeUrl : `https://docs.google.com/viewer?url=${encodeURIComponent(resumeUrl)}&embedded=true`}
              title="Resume preview"
              className="mt-4 h-[400px] w-full rounded-lg border"
              style={{ borderColor: "var(--border)" }}
            />
          ) : filename ? (
            <div className="mt-8 flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16" style={{ borderColor: "var(--border)" }}>
              <FileText size={48} className="text-text-muted" />
              <p className="mt-4 text-center text-sm text-text-muted">Preview not available for this format. Download to view.</p>
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16" style={{ borderColor: "var(--border)" }}>
              <FileText size={48} className="text-text-muted" />
              <p className="mt-4 text-center text-sm text-text-muted">Upload your resume to see a preview</p>
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
