import { useEffect } from "react";
import { PublicLegalLayout } from "../components/PublicLegalLayout";
import { applyPageSeo, resetDocumentSeoToHome } from "../lib/pageSeo";
import { R } from "../recrux/theme";

const hairline = `0.5px solid ${R.border}`;

const sections: { id: string; title: string; body: string[] }[] = [
  {
    id: "accept",
    title: "Acceptance of Terms",
    body: [
      "By accessing or using Recrux.ai, you agree to these Terms of Service and our Privacy Policy. If you do not agree, do not use the service.",
      "If you use Recrux.ai on behalf of an organization, you represent that you have authority to bind that organization to these terms.",
    ],
  },
  {
    id: "usage",
    title: "Platform Usage",
    body: [
      "Recrux.ai provides tools to support job search workflows, including browsing listings, saving roles, tracking applications, and resume-related features.",
      "We may update, suspend, or discontinue features, and we may impose reasonable usage limits to protect platform stability and security.",
    ],
  },
  {
    id: "ai",
    title: "AI-generated Recommendations Disclaimer",
    body: [
      "Job matches, scores, summaries, and other outputs may be generated using AI and statistical methods. These outputs are informational suggestions only.",
      "AI-generated recommendations may be incomplete, inaccurate, or outdated. You are responsible for verifying postings, employers, compensation, and requirements before applying.",
      "Recrux.ai does not guarantee employment outcomes, interview invitations, or compensation results from using the platform.",
    ],
  },
  {
    id: "responsibilities",
    title: "User Responsibilities",
    body: [
      "You must provide accurate information where requested and keep your credentials secure.",
      "You may not misuse Recrux.ai (including attempting to access non-public systems, scraping in violation of our policies, or uploading malware).",
      "You are responsible for your interactions with employers and third parties, including applications you submit and information you share.",
    ],
  },
  {
    id: "ip",
    title: "Intellectual Property",
    body: [
      "Recrux.ai and its branding, software, and content (excluding your uploads) are owned by us or our licensors and are protected by intellectual property laws.",
      "You retain rights in content you upload; you grant us a license to host, process, and display that content as needed to provide the service.",
    ],
  },
  {
    id: "termination",
    title: "Account Termination",
    body: [
      "You may stop using Recrux.ai at any time. We may suspend or terminate access if we reasonably believe you violated these terms or pose a risk to the service or other users.",
      "Upon termination, certain obligations survive (including disclaimers, limitations of liability, and dispute-related terms where applicable).",
    ],
  },
  {
    id: "liability",
    title: "Limitation of Liability",
    body: [
      "To the maximum extent permitted by law, Recrux.ai is provided &quot;as is&quot; without warranties of any kind, whether express or implied.",
      "We are not liable for indirect, incidental, special, consequential, or punitive damages, or for lost profits, data, or goodwill, arising from your use of the service.",
      "Our aggregate liability for claims arising out of the service will not exceed the greater of (a) the amounts you paid us in the twelve months before the claim or (b) one hundred U.S. dollars (USD $100), unless applicable law requires otherwise.",
    ],
  },
  {
    id: "changes",
    title: "Changes to Terms",
    body: [
      "We may update these terms from time to time. We will post the updated terms on this page and update the &quot;Last updated&quot; date.",
      "Continued use after changes become effective constitutes acceptance of the revised terms, except where applicable law requires additional consent.",
    ],
  },
];

export function TermsOfService() {
  useEffect(() => {
    applyPageSeo({
      title: "Terms of Service | Recrux.ai",
      description:
        "Recrux.ai terms covering platform usage, AI-generated job match disclaimers, user responsibilities, intellectual property, termination, and limitations of liability.",
      path: "/terms",
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
          Terms of Service
        </h1>
        <p style={{ fontSize: 14, color: R.body, margin: "0 0 28px", lineHeight: 1.55 }}>
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.65, margin: "0 0 32px" }}>
          These Terms of Service (&quot;Terms&quot;) govern your use of Recrux.ai. If you have questions, contact us through the Contact page.
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
