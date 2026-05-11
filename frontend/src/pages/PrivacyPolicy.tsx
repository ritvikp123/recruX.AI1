import { useEffect } from "react";
import { PublicLegalLayout } from "../components/PublicLegalLayout";
import { applyPageSeo, resetDocumentSeoToHome } from "../lib/pageSeo";
import { R } from "../recrux/theme";

const hairline = `0.5px solid ${R.border}`;

const sections: { id: string; title: string; body: string[] }[] = [
  {
    id: "collect",
    title: "Information We Collect",
    body: [
      "When you create an account, we collect identifiers such as your email address and authentication data processed by our auth provider (Supabase).",
      "When you use Recrux.ai, we may collect profile and preference information you choose to provide (for example, target roles, industries, and work preferences).",
      "We collect limited technical data needed to operate the service, such as device/browser type, approximate region from IP, and timestamps of requests.",
    ],
  },
  {
    id: "resume",
    title: "Resume & User Data",
    body: [
      "If you upload a resume or paste text, that content may be processed for AI-powered resume analysis, skill extraction, and job matching features you enable.",
      "Resume data may be stored in your account profile and associated databases so you can return to the product and continue your job search.",
      "You should not upload unlawful content or sensitive categories of data not needed for job search (for example, government ID numbers) unless we explicitly request them.",
    ],
  },
  {
    id: "use",
    title: "How We Use Information",
    body: [
      "We use information to provide, maintain, and improve Recrux.ai—including search, recommendations, dashboards, and communications about your account.",
      "We use analytics tracking (described below) to understand product usage and reliability, and to prioritize improvements.",
      "We do not sell your personal information. We may use service providers (processors) to host infrastructure, databases, authentication, and analytics under appropriate agreements.",
    ],
  },
  {
    id: "security",
    title: "Data Security",
    body: [
      "We implement reasonable administrative, technical, and organizational measures intended to protect personal data, including secure handling practices for authentication and storage.",
      "No method of transmission or storage is 100% secure; you use Recrux.ai at your own risk consistent with the Terms of Service.",
    ],
  },
  {
    id: "cookies",
    title: "Cookies & Analytics",
    body: [
      "We and our vendors may use cookies and similar technologies for session management, security, preferences, and analytics tracking (for example, measuring page views and feature usage).",
      "Depending on your jurisdiction, you may have choices about certain non-essential cookies; where required, we will provide additional controls and notices as we mature the product.",
    ],
  },
  {
    id: "third",
    title: "Third-Party Services",
    body: [
      "Recrux.ai relies on third-party services such as hosting providers, databases, authentication, email delivery, and AI/ML providers. Those services may process data on our behalf under their terms and privacy policies.",
      "If you connect integrations or use external job listing sources, those providers may collect data independently; their practices are governed by their policies.",
    ],
  },
  {
    id: "rights",
    title: "User Rights",
    body: [
      "Depending on where you live, you may have rights to access, correct, delete, or export certain personal data, and to object to or restrict certain processing.",
      "We intend to align Recrux.ai with GDPR and CCPA expectations over time, including clearer data retention schedules, data processing agreements where appropriate, and self-service export/delete flows.",
      "To exercise rights today, contact us using the information below. We may need to verify your request.",
    ],
  },
  {
    id: "contact",
    title: "Contact Information",
    body: [
      "For privacy questions or requests, contact us via the Contact page at /contact on this website.",
      "If you believe there is a security issue, please include enough detail for us to investigate responsibly.",
    ],
  },
];

export function PrivacyPolicy() {
  useEffect(() => {
    applyPageSeo({
      title: "Privacy Policy | Recrux.ai",
      description:
        "Learn how Recrux.ai collects, uses, and protects your data—including resume analysis, analytics tracking, and security practices—with GDPR/CCPA alignment goals.",
      path: "/privacy",
    });
    return () => resetDocumentSeoToHome();
  }, []);

  return (
    <PublicLegalLayout>
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "clamp(24px, 5vw, 40px) 20px 48px",
          color: R.deep,
        }}
      >
        <h1 className="recrux-heading" style={{ fontSize: "clamp(26px, 5vw, 32px)", fontWeight: 700, color: R.darkest, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: 14, color: R.body, margin: "0 0 28px", lineHeight: 1.55 }}>
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.65, margin: "0 0 32px" }}>
          This Privacy Policy describes how Recrux.ai (&quot;Recrux,&quot; &quot;we,&quot; &quot;us&quot;) handles personal information when you use our website and
          services. By using Recrux.ai, you agree to this policy alongside our Terms of Service.
        </p>

        {sections.map((s) => (
          <section key={s.id} id={s.id} style={{ marginBottom: 28, paddingBottom: 28, borderBottom: hairline }}>
            <h2 className="recrux-heading" style={{ fontSize: 18, fontWeight: 700, color: R.darkest, margin: "0 0 12px" }}>
              {s.title}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {s.body.map((p, i) => (
                <p key={`${s.id}-${i}`} style={{ fontSize: 15, lineHeight: 1.65, margin: 0 }}>
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PublicLegalLayout>
  );
}
