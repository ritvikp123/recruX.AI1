import { useState } from "react";
import { FileText, BarChart3 } from "lucide-react";
import { ResumeUploadPage } from "./ResumeUploadPage";
import { ResumeMatchPage } from "./ResumeMatchPage";

type Tab = "upload" | "match";

export function ResumePage() {
  const [tab, setTab] = useState<Tab>("upload");

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-xl font-semibold text-text-primary">Resume</h1>

      <div className="flex gap-1 border-b" style={{ borderColor: "var(--border)" }}>
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition ${
            tab === "upload" ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          <FileText size={16} />
          My Resume
        </button>
        <button
          type="button"
          onClick={() => setTab("match")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition ${
            tab === "match" ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          <BarChart3 size={16} />
          Resume Match
        </button>
      </div>

      {tab === "upload" ? <ResumeUploadPage hideTitle /> : <ResumeMatchPage onGoToUpload={() => setTab("upload")} />}
    </div>
  );
}
