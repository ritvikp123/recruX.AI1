import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useJobStore } from "../store/useJobStore";
import { R } from "../recrux/theme";

type ChatMsg = { role: "user" | "assistant"; content: string };

function buildMockAssistantReply(input: string, resumeText: string | undefined) {
  const t = input.trim().toLowerCase();
  const hasResume = (resumeText || "").trim().length > 60;

  if (!t) return "Ask me about your matches, resume, or next steps.";

  if (t.includes("apply") || t.includes("next") || t.includes("today")) {
    return hasResume
      ? "Mock: Based on your resume, your strongest path is to apply to roles that overlap your recent work. Focus on titles that mention React/TypeScript and include 1 new story that demonstrates impact."
      : "Mock: Pick a role you can tailor your resume for, then update your top project bullets to match the job keywords.";
  }

  if (t.includes("missing") || t.includes("gap") || t.includes("skills")) {
    return "Mock: You likely have the baseline, but the key gaps are usually (1) deeper system design examples and (2) stronger quantified results. If you share the job title, I’ll suggest 3 improvements to your resume bullets.";
  }

  if (t.includes("resume") || t.includes("rewrite") || t.includes("bullet")) {
    return "Mock: Try this structure: Action verb → What you built → Specific tech → Measurable outcome. Update 3 bullets on your most relevant project and align keywords with the job description.";
  }

  if (t.includes("interview") || t.includes("story") || t.includes("behavioral")) {
    return "Mock: Build 4 STAR stories from your projects. Each story should include tradeoffs and what you would do differently next time.";
  }

  return hasResume
    ? "Mock: I can help you refine your approach. Tell me the role you’re targeting and what part of the process you want to improve (search, resume bullets, or interview prep)."
    : "Mock: Start by telling me what role you want. Then I’ll guide you through the steps to tailor your search + resume.";
}

const PANEL_BORDER = "0.5px solid #85b7eb";

export function DashboardAIBottomChat() {
  const resumeText = useJobStore((s) => s.resumeText);

  const suggested = useMemo(
    () => [
      "What should I apply to next?",
      "What skills am I missing?",
      "How do I improve my resume for React roles?",
    ],
    []
  );

  const [expanded, setExpanded] = useState(true);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content: "Hi — tell me what role you’re targeting and I’ll help you plan your next steps.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!expanded) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, expanded]);

  const send = async (text?: string) => {
    const t = (text ?? input).trim();
    if (!t || busy) return;

    setBusy(true);
    setInput("");
    setMessages((m) => [...m, { role: "user", content: t }]);

    // Simple “typing” delay to make the UI feel alive.
    await new Promise((r) => window.setTimeout(r, 500));
    const reply = buildMockAssistantReply(t, resumeText);
    setMessages((m) => [...m, { role: "assistant", content: reply }]);
    setBusy(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        width: 320,
        maxWidth: "calc(100vw - 48px)",
        zIndex: 200,
      }}
    >
      <div
        style={{
          background: "#ffffff",
          border: PANEL_BORDER,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            padding: "10px 12px",
            background: "#ffffff",
            borderBottom: expanded ? PANEL_BORDER : "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <span aria-hidden style={{ color: R.primary, display: "inline-flex", alignItems: "center" }}>
              ✦
            </span>
            <span className="recrux-heading" style={{ fontSize: 14, fontWeight: 800, color: R.darkest }}>
              AI Copilot
            </span>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? "Minimize chatbot" : "Expand chatbot"}
            style={{
              border: "none",
              background: R.light,
              borderRadius: 8,
              padding: 8,
              cursor: "pointer",
              color: R.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {expanded ? <ChevronDown size={18} strokeWidth={2} /> : <ChevronUp size={18} strokeWidth={2} />}
          </button>
        </div>

        {expanded && (
          <div style={{ display: "flex", flexDirection: "column", maxHeight: "70vh" }}>
            <div style={{ padding: "10px 12px 0" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {suggested.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={busy}
                    onClick={() => void send(s)}
                    style={{
                      fontSize: 11,
                      background: R.card,
                      border: PANEL_BORDER,
                      color: R.darkest,
                      padding: "6px 10px",
                      borderRadius: 999,
                      cursor: busy ? "default" : "pointer",
                      fontFamily: "inherit",
                      fontWeight: 700,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: 12,
                margin: "10px 10px 0",
                background: R.light,
                border: PANEL_BORDER,
                borderRadius: 10,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {messages.map((msg, idx) => (
                  <div key={`${msg.role}-${idx}`} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                    <div
                      style={{
                        maxWidth: "85%",
                        borderRadius: 14,
                        padding: "10px 12px",
                        fontSize: 12,
                        lineHeight: 1.45,
                        background: msg.role === "user" ? R.primary : "#ffffff",
                        color: msg.role === "user" ? "#ffffff" : R.darkest,
                        border: msg.role === "assistant" ? "0.5px solid rgba(133,183,235,0.8)" : "none",
                        fontWeight: 600,
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {busy && (
                  <div style={{ fontSize: 11, color: R.deep, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                    <Sparkles size={14} strokeWidth={2.5} aria-hidden />
                    Thinking…
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, padding: 12 }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void send()}
                placeholder="Ask anything…"
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: PANEL_BORDER,
                  borderRadius: 20,
                  padding: "10px 12px",
                  fontSize: 12,
                  background: R.card,
                  color: R.darkest,
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => void send()}
                style={{
                  background: R.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: 20,
                  padding: "10px 14px",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: busy ? "default" : "pointer",
                  opacity: busy ? 0.7 : 1,
                  fontFamily: "inherit",
                }}
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

