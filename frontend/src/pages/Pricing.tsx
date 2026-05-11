import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { PublicLegalLayout } from "../components/PublicLegalLayout";
import { applyPageSeo, resetDocumentSeoToHome } from "../lib/pageSeo";
import { R } from "../recrux/theme";

const hairline = `0.5px solid ${R.border}`;

type Plan = {
  key: "free" | "quarterly" | "monthly";
  title: string;
  priceLabel: string;
  description: string;
  features: string[];
  ctaLabel: string;
  highlighted?: boolean;
};

const plans: Plan[] = [
  {
    key: "free",
    title: "Free",
    priceLabel: "$0",
    description: "Start with AI job matching basics and a preview of your resume analysis.",
    features: [
      "AI-powered resume analysis for job matching",
      "Starter skill gap insights",
      "Personalized recommendations",
      "Resume optimizer preview",
    ],
    ctaLabel: "Get started free",
  },
  {
    key: "quarterly",
    title: "Quarterly",
    priceLabel: "$49 / quarter",
    description: "For focused tech careers who want steady AI insights and resume guidance.",
    features: [
      "Resume analysis + deeper skill gap breakdown",
      "More tailored, tech-career job recommendations",
      "Priority matching signals",
      "Resume optimization suggestions",
    ],
    ctaLabel: "Get started",
  },
  {
    key: "monthly",
    title: "Monthly",
    priceLabel: "$19 / month",
    description: "Stay on track with continuous AI job matching and ongoing resume improvements.",
    features: [
      "AI job matching and resume analysis (ongoing)",
      "Personalized recommendations for each search",
      "Consistent skill gap insights and updates",
      "Best value for active tech careers",
    ],
    ctaLabel: "Get started",
    highlighted: true,
  },
];

function PricingContent() {
  return (
    <div
      style={{
        maxWidth: 1040,
        margin: "0 auto",
        padding: "clamp(24px, 5vw, 44px) 20px 48px",
        color: R.deep,
      }}
    >
        <h1
          className="recrux-heading"
          style={{
            fontSize: "clamp(26px, 5vw, 36px)",
            fontWeight: 700,
            color: R.darkest,
            margin: "0 0 10px",
            letterSpacing: "-0.02em",
            textAlign: "center",
          }}
        >
          Pricing
        </h1>

        <p
          style={{
            fontSize: "clamp(14px, 2.8vw, 16px)",
            color: R.deep,
            margin: "0 auto 28px",
            maxWidth: 720,
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          Simple plans for AI job matching, resume analysis, skill gap insights, and personalized recommendations.
        </p>

        <div className="pricing-grid">
          {plans.map((p) => (
            <article
              key={p.key}
              className={p.highlighted ? "pricing-card pricing-card--highlighted" : "pricing-card"}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <h3
                    className="recrux-heading"
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: R.darkest,
                      margin: 0,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    {p.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 34,
                      fontWeight: 900,
                      color: p.highlighted ? R.primary : R.darkest,
                      margin: "10px 0 0",
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {p.priceLabel}
                  </p>
                </div>

                {p.highlighted && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      borderRadius: 999,
                      background: R.light,
                      border: hairline,
                      color: R.primary,
                      fontSize: 12,
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Sparkles size={16} strokeWidth={2.5} aria-hidden />
                    Most popular
                  </div>
                )}
              </div>

              <p style={{ margin: "12px 0 16px", fontSize: 14, color: R.body, lineHeight: 1.6 }}>
                {p.description}
              </p>

              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {p.features.map((f) => (
                  <li
                    key={f}
                    style={{ display: "flex", gap: 10, alignItems: "flex-start", color: R.body, fontSize: 14, lineHeight: 1.5 }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: R.mid,
                        marginTop: 6,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ minWidth: 0 }}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/get-started"
                className="pricing-cta"
                aria-label={`${p.title} plan: ${p.ctaLabel}`}
              >
                {p.ctaLabel}
                <ArrowRight size={18} strokeWidth={2.2} aria-hidden />
              </Link>
            </article>
          ))}
        </div>

        <style>{`
          .pricing-grid {
            margin-top: 18px;
            display: grid;
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .pricing-card {
            background: ${R.card};
            border: ${hairline};
            border-radius: 16px;
            padding: 22px 18px 18px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
            transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
            min-width: 0;
          }

          .pricing-card--highlighted {
            border-color: ${R.primary};
            box-shadow: 0 18px 48px rgba(24, 95, 165, 0.18);
          }

          @media (min-width: 900px) {
            .pricing-grid {
              grid-template-columns: repeat(3, 1fr);
            }
          }

          @media (hover: hover) and (pointer: fine) {
            .pricing-card:hover {
              transform: translateY(-3px);
              box-shadow: 0 18px 48px rgba(4, 44, 83, 0.12);
              border-color: ${R.primary};
            }
          }

          .pricing-cta {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            text-decoration: none;
            border-radius: 999px;
            padding: 14px 20px;
            margin-top: 18px;
            font-size: 14px;
            font-weight: 800;
            color: #fff;
            background: ${R.primary};
            box-shadow: 0 4px 14px rgba(24, 95, 165, 0.25);
          }

          @media (max-width: 520px) {
            .pricing-card {
              padding: 18px 14px 14px;
            }
          }
        `}</style>
    </div>
  );
}

/**
 * Public route (/pricing visited while logged out) — renders with the
 * landing-style header/footer via PublicLegalLayout.
 *
 * Authenticated route (/pricing inside AppShell) — pass standalone={false}
 * so the AppShell navbar/footer are used instead.
 */
export function Pricing({ standalone = true }: { standalone?: boolean }) {
  useEffect(() => {
    applyPageSeo({
      title: "Pricing | Recrux.ai",
      description:
        "Choose a Free, Quarterly, or Monthly plan for AI job matching. Includes resume analysis, skill gap insights, and personalized recommendations for tech careers.",
      path: "/pricing",
    });

    return () => resetDocumentSeoToHome();
  }, []);

  if (standalone) {
    return (
      <PublicLegalLayout>
        <PricingContent />
      </PublicLegalLayout>
    );
  }

  return <PricingContent />;
}

