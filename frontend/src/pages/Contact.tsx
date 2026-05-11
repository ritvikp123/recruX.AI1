import { useEffect, useState } from "react";
import { PublicLegalLayout } from "../components/PublicLegalLayout";
import { applyPageSeo, resetDocumentSeoToHome } from "../lib/pageSeo";
import { R } from "../recrux/theme";
import { Mail, MessageSquare, User } from "lucide-react";

const hairline = `0.5px solid ${R.border}`;

export function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    applyPageSeo({
      title: "Contact | Recrux.ai",
      description:
        "Get in touch with Recrux.ai for feedback, partnerships, or product questions. We read every message and respond when we can.",
      path: "/contact",
    });
    return () => resetDocumentSeoToHome();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <PublicLegalLayout>
      <div
        style={{
          maxWidth: 560,
          margin: "0 auto",
          padding: "clamp(24px, 5vw, 40px) 20px 48px",
          color: R.deep,
        }}
      >
        <h1 className="recrux-heading" style={{ fontSize: "clamp(26px, 5vw, 32px)", fontWeight: 700, color: R.darkest, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
          Get in Touch
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 28px" }}>
          We&apos;d love to hear feedback, partnership opportunities, or questions about Recrux.ai.
        </p>

        <div
          style={{
            background: R.card,
            border: hairline,
            borderRadius: 14,
            padding: "22px 20px 24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          {submitted ? (
            <p style={{ fontSize: 15, lineHeight: 1.55, margin: 0, color: R.deep }}>
              Thanks for reaching out. This demo form doesn&apos;t send email yet—please write to{" "}
              <a href="mailto:hello@recrux.ai" style={{ color: R.primary, fontWeight: 600 }}>
                hello@recrux.ai
              </a>{" "}
              and we&apos;ll get back to you.
            </p>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: R.darkest }}>Name</span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    border: hairline,
                    borderRadius: 10,
                    padding: "10px 12px",
                    background: "#fff",
                  }}
                >
                  <User size={18} strokeWidth={2} color={R.primary} aria-hidden />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    style={{
                      border: "none",
                      outline: "none",
                      flex: 1,
                      fontSize: 14,
                      fontFamily: "var(--font-body)",
                      minWidth: 0,
                    }}
                  />
                </div>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: R.darkest }}>Email</span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    border: hairline,
                    borderRadius: 10,
                    padding: "10px 12px",
                    background: "#fff",
                  }}
                >
                  <Mail size={18} strokeWidth={2} color={R.primary} aria-hidden />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={{
                      border: "none",
                      outline: "none",
                      flex: 1,
                      fontSize: 14,
                      fontFamily: "var(--font-body)",
                      minWidth: 0,
                    }}
                  />
                </div>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: R.darkest }}>Message</span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    border: hairline,
                    borderRadius: 10,
                    padding: "10px 12px",
                    background: "#fff",
                  }}
                >
                  <MessageSquare size={18} strokeWidth={2} color={R.primary} style={{ marginTop: 2 }} aria-hidden />
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what is on your mind..."
                    rows={5}
                    style={{
                      border: "none",
                      outline: "none",
                      flex: 1,
                      fontSize: 14,
                      fontFamily: "var(--font-body)",
                      resize: "vertical",
                      minWidth: 0,
                      minHeight: 100,
                    }}
                  />
                </div>
              </label>
              <button
                type="submit"
                style={{
                  marginTop: 4,
                  border: "none",
                  borderRadius: 999,
                  padding: "14px 20px",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#fff",
                  background: R.primary,
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(24, 95, 165, 0.35)",
                  width: "100%",
                  fontFamily: "inherit",
                }}
              >
                Send message
              </button>
              <p style={{ fontSize: 12, color: R.body, margin: 0, lineHeight: 1.45 }}>
                Prefer email?{" "}
                <a href="mailto:hello@recrux.ai" style={{ color: R.primary, fontWeight: 600 }}>
                  hello@recrux.ai
                </a>{" "}
                (placeholder—replace with your real support address).
              </p>
            </form>
          )}
        </div>

        <section style={{ marginTop: 32 }}>
          <h2 className="recrux-heading" style={{ fontSize: 16, fontWeight: 700, color: R.darkest, margin: "0 0 12px" }}>
            Social
          </h2>
          <p style={{ fontSize: 14, color: R.body, margin: "0 0 12px", lineHeight: 1.5 }}>
            Official profiles will be linked here when available.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: R.primary,
                textDecoration: "none",
                padding: "8px 14px",
                borderRadius: 999,
                border: hairline,
                background: R.card,
              }}
            >
              X (Twitter) — coming soon
            </a>
            <a
              href="https://www.linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: R.primary,
                textDecoration: "none",
                padding: "8px 14px",
                borderRadius: 999,
                border: hairline,
                background: R.card,
              }}
            >
              LinkedIn — coming soon
            </a>
          </div>
        </section>
      </div>
    </PublicLegalLayout>
  );
}
