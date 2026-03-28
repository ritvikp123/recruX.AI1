import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { R } from "../../recrux/theme";

const DRAFT_KEY = "recrux_onboarding_draft";

const INDUSTRY_OPTIONS = [
  "Technology & Software",
  "Artificial Intelligence & Machine Learning",
  "Cybersecurity",
  "Data & Analytics",
  "Cloud & Infrastructure",
  "Product & UX Design",
  "Finance & Fintech",
  "Banking & Investment",
  "Accounting & Audit",
  "Healthcare & Biotech",
  "Pharmaceuticals",
  "Medical Devices",
  "Consulting & Strategy",
  "Marketing & Growth",
  "Sales & Business Development",
  "E-Commerce & Retail",
  "Supply Chain & Logistics",
  "Manufacturing & Engineering",
  "Energy & Sustainability",
  "Legal & Compliance",
  "Education & EdTech",
  "Government & Public Sector",
  "Nonprofit & Social Impact",
  "Real Estate & PropTech",
  "Media & Entertainment",
  "Gaming",
  "Aerospace & Defense",
  "Agriculture & FoodTech",
  "Sports & Fitness",
  "Hospitality & Travel",
];

const ROLE_OPTIONS = [
  "Software Engineering",
  "Frontend Development",
  "Backend Development",
  "Full Stack Development",
  "Mobile Development (iOS/Android)",
  "DevOps & Site Reliability",
  "Cloud Engineering",
  "Data Engineering",
  "Data Science",
  "Machine Learning / AI Engineering",
  "MLOps",
  "Cybersecurity Analyst",
  "Penetration Testing / Ethical Hacking",
  "Security Engineering",
  "Network Engineering",
  "Embedded Systems / Firmware",
  "Robotics Engineering",
  "Hardware Engineering",
  "Product Management",
  "Program / Project Management",
  "Scrum Master / Agile Coach",
  "UX Research",
  "UI/UX Design",
  "Graphic / Visual Design",
  "Business Analysis",
  "Business Intelligence",
  "Financial Analysis",
  "Accounting / Auditing",
  "Investment Banking",
  "Quantitative Analysis",
  "Risk & Compliance",
  "Legal / Paralegal",
  "Operations Management",
  "Supply Chain / Logistics",
  "Sales Engineering",
  "Account Executive / Sales",
  "Marketing Analyst",
  "Growth Hacking / SEO",
  "Content Strategy",
  "Technical Writing",
  "Customer Success",
  "Human Resources / Recruiting",
  "Research & Development",
  "Biomedical Engineering",
  "Clinical Research",
  "Healthcare Administration",
];

const EXPERIENCE_OPTIONS = [
  "High School Student",
  "Undergraduate (Freshman / Sophomore)",
  "Undergraduate (Junior / Senior)",
  "Bootcamp Graduate",
  "Recent Graduate (< 1 year)",
  "Entry Level (1-2 years)",
  "Mid Level (3-5 years)",
  "Senior Level (5-8 years)",
  "Staff / Principal (8-12 years)",
  "Director / VP (10+ years)",
  "Executive / C-Suite",
  "Career Changer (switching fields)",
  "Returning to Workforce",
];

const EMPLOYMENT_OPTIONS = [
  "Full-Time",
  "Part-Time",
  "Internship",
  "Co-op",
  "Contract / Freelance",
  "Contract-to-Hire",
  "Temporary / Seasonal",
];

const WORK_LOCATION_OPTIONS = [
  "Fully Remote",
  "Hybrid (1-2 days in office)",
  "Hybrid (3-4 days in office)",
  "On-Site Only",
  "Open to Relocation",
  "No Preference",
];

const URGENCY_OPTIONS = [
  "Actively applying — need a job ASAP",
  "Actively applying — not in a rush",
  "Casually exploring opportunities",
  "Just researching the market",
  "Not actively looking, but open to the right role",
];

const COMPANY_SIZE_OPTIONS = [
  "Startup (1-50 employees)",
  "Small (51-200 employees)",
  "Mid-size (201-1,000 employees)",
  "Large (1,001-10,000 employees)",
  "Enterprise (10,000+ employees)",
  "No preference",
];

const COMPENSATION_OPTIONS = [
  "Under $40K/year",
  "$40K-$60K/year",
  "$60K-$80K/year",
  "$80K-$100K/year",
  "$100K-$130K/year",
  "$130K-$160K/year",
  "$160K-$200K/year",
  "$200K+/year",
  "Hourly / Open to discuss",
  "Prefer not to say",
];

function ChipGrid({ options, selected, onToggle, maxHeight = 260, ariaLabel }) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      style={{
        maxHeight,
        overflowY: "auto",
        paddingRight: 6,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(opt)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 12px",
                borderRadius: 999,
                border: active ? `2px solid ${R.primary}` : `1px solid ${R.border}`,
                background: active ? R.light : R.card,
                color: active ? R.primary : R.darkest,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: active ? "0 2px 8px rgba(24,95,165,0.12)" : "none",
                lineHeight: 1.1,
                minHeight: 44,
              }}
            >
              {active ? <Check size={16} strokeWidth={3} /> : <span style={{ width: 16, height: 16 }} />}
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProgressHeader({ stepIndex }) {
  const steps = [
    { label: "Industry" },
    { label: "Role" },
    { label: "Experience" },
    { label: "Preferences" },
    { label: "Search" },
  ];

  return (
    <div style={{ width: "100%", padding: "18px 18px 0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: R.primary }}>
            Get started
          </p>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: R.darkest, lineHeight: 1.2 }}>
            Step {stepIndex + 1} of 5
          </p>
        </div>
        <div style={{ flex: 1 }} />
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ height: 10, borderRadius: 999, background: R.light, border: `0.5px solid ${R.border}`, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${((stepIndex + 1) / 5) * 100}%`,
              background: `linear-gradient(90deg, ${R.primary}, ${R.mid})`,
              transition: "width 250ms ease",
            }}
          />
        </div>
        <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          {steps.map((s, idx) => (
            <span
              key={s.label}
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: idx <= stepIndex ? R.primary : R.body,
                opacity: idx <= stepIndex ? 1 : 0.7,
              }}
            >
              {s.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function OnboardingFlow() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [error, setError] = useState("");

  const [onboardingData, setOnboardingData] = useState({
    industries: [],
    roles: [],
    experienceLevel: "",
    employmentTypes: [],
    workLocation: [],
    urgency: "",
    companySizes: [],
    compensation: "",
  });

  // Persist draft so refresh/redirect doesn't wipe answers.
  useEffect(() => {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(onboardingData));
  }, [onboardingData]);

  const stepNames = useMemo(() => ["Industry / Field", "Job Function / Role Type", "Experience Level", "Work Preferences", "Search Urgency"], []);

  const canNext = useMemo(() => {
    if (stepIndex === 0) return onboardingData.industries.length > 0;
    if (stepIndex === 1) return onboardingData.roles.length > 0;
    if (stepIndex === 2) return !!onboardingData.experienceLevel;
    if (stepIndex === 3) return onboardingData.employmentTypes.length > 0 && onboardingData.workLocation.length > 0;
    if (stepIndex === 4) {
      return (
        !!onboardingData.urgency &&
        onboardingData.companySizes.length > 0 &&
        !!onboardingData.compensation
      );
    }
    return false;
  }, [onboardingData, stepIndex]);

  const setMulti = (key, value) => {
    setOnboardingData((prev) => {
      const list = prev[key] || [];
      const exists = list.includes(value);
      const next = exists ? list.filter((x) => x !== value) : [...list, value];
      return { ...prev, [key]: next };
    });
  };

  const goNext = () => {
    setError("");
    if (!canNext) {
      setError("Please select at least one option to continue.");
      return;
    }
    setDirection(1);
    setStepIndex((i) => Math.min(4, i + 1));
  };

  const goBack = () => {
    setError("");
    setDirection(-1);
    setStepIndex((i) => Math.max(0, i - 1));
  };

  const onFinish = () => {
    setError("");
    if (!canNext) {
      setError("Please complete the form before continuing.");
      return;
    }

    const payload = onboardingData;
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    navigate("/signup", { state: { onboardingData: payload } });
  };

  const hairline = `0.5px solid ${R.border}`;
  const cardShadow = "0 10px 30px rgba(4,44,83,0.10)";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: R.bg,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ProgressHeader stepIndex={stepIndex} />

      <div style={{ padding: 18, flex: 1, display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
        <div
          style={{
            width: "100%",
            maxWidth: 980,
            borderRadius: 16,
            background: R.card,
            border: hairline,
            boxShadow: cardShadow,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ height: 4, background: `linear-gradient(90deg, ${R.primary}, ${R.mid})` }} />

          <div style={{ padding: 20, flex: 1, minHeight: 0 }}>
            {error ? (
              <div style={{ background: "rgba(255, 70, 70, 0.10)", border: hairline, color: R.warnText, padding: 12, borderRadius: 10, marginBottom: 12, fontSize: 13, fontWeight: 700 }}>
                {error}
              </div>
            ) : null}

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={stepIndex}
                initial={{ opacity: 0, x: direction * 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -40 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                style={{ width: "100%" }}
              >
                <h2 style={{ fontSize: 20, fontWeight: 900, color: R.darkest, margin: "4px 0 6px" }}>
                  {stepNames[stepIndex]}
                </h2>
                <p style={{ fontSize: 13, color: R.body, margin: "0 0 16px", lineHeight: 1.5, fontWeight: 600 }}>
                  {stepIndex === 0 && "What industry or field are you targeting?"}
                  {stepIndex === 1 && "What type of role are you looking for?"}
                  {stepIndex === 2 && "What's your experience level?"}
                  {stepIndex === 3 && "What are your work preferences?"}
                  {stepIndex === 4 && "Tell us a bit more about your search."}
                </p>

                {stepIndex === 0 && (
                  <>
                    <p style={{ fontSize: 12, fontWeight: 800, color: R.primary, margin: "0 0 10px" }}>
                      Select all that apply
                    </p>
                    <ChipGrid
                      options={INDUSTRY_OPTIONS}
                      selected={onboardingData.industries}
                      onToggle={(v) => setMulti("industries", v)}
                      ariaLabel="Industry selection"
                    />
                  </>
                )}

                {stepIndex === 1 && (
                  <>
                    <p style={{ fontSize: 12, fontWeight: 800, color: R.primary, margin: "0 0 10px" }}>
                      Select all that apply
                    </p>
                    <ChipGrid
                      options={ROLE_OPTIONS}
                      selected={onboardingData.roles}
                      onToggle={(v) => setMulti("roles", v)}
                      maxHeight={240}
                      ariaLabel="Role selection"
                    />
                  </>
                )}

                {stepIndex === 2 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <p style={{ fontSize: 12, fontWeight: 800, color: R.primary, margin: 0 }}>
                      Choose one
                    </p>
                    <ChipGrid
                      options={EXPERIENCE_OPTIONS}
                      selected={onboardingData.experienceLevel ? [onboardingData.experienceLevel] : []}
                      onToggle={(v) => setOnboardingData((p) => ({ ...p, experienceLevel: v }))}
                      maxHeight={260}
                      ariaLabel="Experience level"
                    />
                  </div>
                )}

                {stepIndex === 3 && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 900, color: R.darkest, margin: "0 0 8px" }}>Employment Type</p>
                      <p style={{ fontSize: 12, fontWeight: 800, color: R.primary, margin: "0 0 10px" }}>
                        Select all that apply
                      </p>
                      <ChipGrid
                        options={EMPLOYMENT_OPTIONS}
                        selected={onboardingData.employmentTypes}
                        onToggle={(v) => setMulti("employmentTypes", v)}
                        maxHeight={220}
                        ariaLabel="Employment type"
                      />
                    </div>

                    <div>
                      <p style={{ fontSize: 12, fontWeight: 900, color: R.darkest, margin: "0 0 8px" }}>Work Location</p>
                      <p style={{ fontSize: 12, fontWeight: 800, color: R.primary, margin: "0 0 10px" }}>
                        Select all that apply
                      </p>
                      <ChipGrid
                        options={WORK_LOCATION_OPTIONS}
                        selected={onboardingData.workLocation}
                        onToggle={(v) => setMulti("workLocation", v)}
                        maxHeight={220}
                        ariaLabel="Work location"
                      />
                    </div>
                  </div>
                )}

                {stepIndex === 4 && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 900, color: R.darkest, margin: "0 0 8px" }}>How urgently are you looking?</p>
                      <p style={{ fontSize: 12, fontWeight: 800, color: R.primary, margin: "0 0 10px" }}>Choose one</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                        {URGENCY_OPTIONS.map((opt) => {
                          const active = onboardingData.urgency === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              aria-pressed={active}
                              onClick={() => setOnboardingData((p) => ({ ...p, urgency: opt }))}
                              style={{
                                minHeight: 44,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "10px 12px",
                                borderRadius: 999,
                                border: active ? `2px solid ${R.primary}` : `1px solid ${R.border}`,
                                background: active ? R.light : R.card,
                                color: active ? R.primary : R.darkest,
                                fontSize: 13,
                                fontWeight: 800,
                                cursor: "pointer",
                              }}
                            >
                              {active ? <Check size={16} strokeWidth={3} /> : <span style={{ width: 16, height: 16 }} />}
                              <span>{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <p style={{ fontSize: 12, fontWeight: 900, color: R.darkest, margin: "0 0 8px" }}>Company size preference</p>
                      <p style={{ fontSize: 12, fontWeight: 800, color: R.primary, margin: "0 0 10px" }}>
                        Select all that apply
                      </p>
                      <ChipGrid
                        options={COMPANY_SIZE_OPTIONS}
                        selected={onboardingData.companySizes}
                        onToggle={(v) => setMulti("companySizes", v)}
                        maxHeight={180}
                        ariaLabel="Company size preference"
                      />
                    </div>

                    <div>
                      <p style={{ fontSize: 12, fontWeight: 900, color: R.darkest, margin: "0 0 8px" }}>Compensation expectations</p>
                      <p style={{ fontSize: 12, fontWeight: 800, color: R.primary, margin: "0 0 10px" }}>Choose one</p>
                      <ChipGrid
                        options={COMPENSATION_OPTIONS}
                        selected={onboardingData.compensation ? [onboardingData.compensation] : []}
                        onToggle={(v) => setOnboardingData((p) => ({ ...p, compensation: v }))}
                        maxHeight={220}
                        ariaLabel="Compensation expectations"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div style={{ padding: 18, borderTop: hairline, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <button
              type="button"
              onClick={goBack}
              disabled={stepIndex === 0}
              style={{
                border: hairline,
                background: stepIndex === 0 ? R.card : R.light,
                borderRadius: 12,
                padding: "10px 14px",
                cursor: stepIndex === 0 ? "not-allowed" : "pointer",
                color: R.darkest,
                fontSize: 13,
                fontWeight: 900,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                minHeight: 44,
                opacity: stepIndex === 0 ? 0.7 : 1,
              }}
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
              Back
            </button>

            {stepIndex < 4 ? (
              <button
                type="button"
                onClick={goNext}
                style={{
                  border: "none",
                  background: R.primary,
                  color: "#fff",
                  borderRadius: 12,
                  padding: "10px 18px",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 900,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  minHeight: 44,
                  boxShadow: "0 6px 20px rgba(24,95,165,0.28)",
                }}
              >
                Next
                <ChevronRight size={18} strokeWidth={2.5} />
              </button>
            ) : (
              <button
                type="button"
                onClick={onFinish}
                style={{
                  border: "none",
                  background: R.primary,
                  color: "#fff",
                  borderRadius: 12,
                  padding: "12px 18px",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 900,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  minHeight: 44,
                  boxShadow: "0 6px 20px rgba(24,95,165,0.28)",
                }}
              >
                Create My Account
                <ChevronRight size={18} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

