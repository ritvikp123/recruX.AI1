import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { R } from "../recrux/theme";

const EXPERIENCE_OPTIONS = [
  "Student / New Grad",
  "Entry Level (0-2 yrs)",
  "Mid Level (2-5 yrs)",
  "Senior Level (5+ yrs)",
];

const FIELD_OPTIONS = [
  "AI / Machine Learning",
  "Software Engineering",
  "Cybersecurity / Ethical Hacking",
  "Cloud Engineering",
  "Data Engineering",
  "DevOps",
  "Full Stack",
  "Other",
];

type ProfileRow = {
  full_name?: string | null;
  target_field?: string | null;
  experience_level?: string | null;
  skills?: string[] | null;
  resume_text?: string | null;
};

const hairline = `0.5px solid ${R.border}`;

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="recrux-heading"
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: R.deep,
        margin: "0 0 8px 4px",
      }}
    >
      {children}
    </h2>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: R.card,
        border: hairline,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function Row({
  children,
  borderTop,
  padding = "14px 16px",
}: {
  children: React.ReactNode;
  borderTop?: boolean;
  padding?: string;
}) {
  return (
    <div
      style={{
        padding,
        borderTop: borderTop ? hairline : undefined,
      }}
    >
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  borderTop,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  borderTop?: boolean;
}) {
  return (
    <Row borderTop={borderTop}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: R.darkest }}>{label}</div>
          {description && (
            <div style={{ fontSize: 12, color: R.body, marginTop: 4, lineHeight: 1.4 }}>{description}</div>
          )}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          style={{
            width: 48,
            height: 28,
            borderRadius: 14,
            border: "none",
            padding: 2,
            cursor: "pointer",
            background: checked ? R.primary : R.muted,
            flexShrink: 0,
            position: "relative",
            transition: "background 0.2s",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 2,
              left: checked ? 22 : 2,
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "#fff",
              boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
              transition: "left 0.2s",
            }}
          />
        </button>
      </div>
    </Row>
  );
}

export function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [fullName, setFullName] = useState("");
  const [targetField, setTargetField] = useState(FIELD_OPTIONS[0]);
  const [experienceLevel, setExperienceLevel] = useState(EXPERIENCE_OPTIONS[0]);
  const [skillsStr, setSkillsStr] = useState("");
  const [resumeTextSnapshot, setResumeTextSnapshot] = useState<string | null>(null);

  const [emailDigest, setEmailDigest] = useState(true);
  const [jobAlerts, setJobAlerts] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, target_field, experience_level, skills, resume_text")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setMessage("Could not load profile.");
        setLoading(false);
        return;
      }
      const row = data as ProfileRow | null;
      if (row) {
        setFullName(row.full_name || "");
        if (row.target_field) setTargetField(row.target_field);
        if (row.experience_level) setExperienceLevel(row.experience_level);
        setSkillsStr(Array.isArray(row.skills) ? row.skills.filter(Boolean).join(", ") : "");
        setResumeTextSnapshot(row.resume_text ?? null);
      } else {
        setFullName((user.user_metadata?.full_name as string) || "");
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.user_metadata]);

  const handleSaveCareer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setMessage("");
    setSaving(true);
    const skills = skillsStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        full_name: fullName.trim() || null,
        target_field: targetField || null,
        experience_level: experienceLevel || null,
        skills: skills.length ? skills : null,
        resume_text: resumeTextSnapshot,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    setSaving(false);
    if (error) {
      setMessage(error.message || "Save failed.");
      return;
    }
    setMessage("Changes saved.");
  };

  const inputStyle = {
    width: "100%",
    marginTop: 6,
    padding: "10px 12px",
    fontSize: 14,
    border: hairline,
    borderRadius: 10,
    color: R.darkest,
    background: R.card,
    boxSizing: "border-box" as const,
  };

  const pageWrap = {
    width: "100%",
    maxWidth: "none",
    margin: 0,
    padding: "24px 20px 48px",
    boxSizing: "border-box" as const,
    minHeight: "calc(100vh - 56px)",
    display: "flex",
    flexDirection: "column",
  };

  const settingsPanel = {
    background: R.card,
    border: hairline,
    borderRadius: 16,
    boxShadow: "0 4px 28px rgba(4, 44, 83, 0.1), 0 1px 3px rgba(0, 0, 0, 0.06)",
    overflow: "hidden" as const,
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
  };

  if (loading) {
    return (
      <div style={pageWrap}>
        <div style={settingsPanel}>
          <div
            style={{
              height: 3,
              background: `linear-gradient(90deg, ${R.primary}, ${R.mid})`,
            }}
          />
          <div style={{ padding: 28, flex: 1, minHeight: 0, overflowY: "auto" }}>
            <p style={{ color: R.body, margin: 0 }}>Loading settings…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageWrap}>
      <header style={{ marginBottom: 22 }}>
        <h1 className="recrux-heading" style={{ fontSize: 26, fontWeight: 700, color: R.darkest, margin: 0 }}>
          Settings
        </h1>
        <p style={{ fontSize: 14, color: R.body, margin: "8px 0 0", lineHeight: 1.5 }}>
          Manage your account, career profile, and preferences.
        </p>
      </header>

      <div style={settingsPanel}>
        <div
          aria-hidden
          style={{
            height: 3,
            background: `linear-gradient(90deg, ${R.primary}, ${R.mid})`,
          }}
        />
        <div
          style={{
            padding: "26px 22px 30px",
            background: `linear-gradient(180deg, ${R.light} 0%, ${R.card} 48px)`,
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        <section>
          <SectionTitle>Account</SectionTitle>
          <Card>
            <Row>
              <div style={{ fontSize: 12, fontWeight: 600, color: R.body, marginBottom: 4 }}>Email</div>
              <div style={{ fontSize: 15, color: R.darkest }}>{user?.email ?? "—"}</div>
            </Row>
            <Row borderTop>
              <Link
                to="/reset-password"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: R.darkest }}>Password</div>
                  <div style={{ fontSize: 12, color: R.body, marginTop: 4 }}>Reset via email</div>
                </div>
                <ChevronRight size={18} color={R.muted} strokeWidth={2} />
              </Link>
            </Row>
            <Row borderTop>
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  navigate("/");
                }}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontSize: 15,
                  fontWeight: 500,
                  color: "#b91c1c",
                  fontFamily: "inherit",
                  textAlign: "left",
                }}
              >
                Sign out
              </button>
            </Row>
          </Card>
        </section>

        <section>
          <SectionTitle>Career profile</SectionTitle>
          <form onSubmit={handleSaveCareer}>
            <Card>
              <Row>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: R.darkest }}>
                  Full name
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={inputStyle}
                    autoComplete="name"
                  />
                </label>
              </Row>
              <Row borderTop>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: R.darkest }}>
                  Target field
                  <select
                    value={targetField}
                    onChange={(e) => setTargetField(e.target.value)}
                    style={inputStyle}
                  >
                    {FIELD_OPTIONS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </label>
              </Row>
              <Row borderTop>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: R.darkest }}>
                  Experience level
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    style={inputStyle}
                  >
                    {EXPERIENCE_OPTIONS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </label>
              </Row>
              <Row borderTop>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: R.darkest }}>
                  Skills
                  <input
                    value={skillsStr}
                    onChange={(e) => setSkillsStr(e.target.value)}
                    placeholder="Comma-separated, e.g. TypeScript, React"
                    style={inputStyle}
                  />
                </label>
              </Row>
              <Row borderTop padding="16px">
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      padding: "10px 20px",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#fff",
                      background: R.primary,
                      border: "none",
                      borderRadius: 10,
                      cursor: saving ? "wait" : "pointer",
                      opacity: saving ? 0.75 : 1,
                      fontFamily: "inherit",
                    }}
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                  {message && (
                    <span
                      style={{
                        fontSize: 13,
                        color: message.includes("saved") || message === "Changes saved." ? "#166534" : R.warnText,
                      }}
                    >
                      {message}
                    </span>
                  )}
                </div>
              </Row>
            </Card>
          </form>
        </section>

        <section>
          <SectionTitle>Resume</SectionTitle>
          <Card>
            <Row>
              <Link
                to="/resume"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: R.darkest }}>Resume optimizer</div>
                  <div style={{ fontSize: 12, color: R.body, marginTop: 4 }}>Upload, parse, and tune for roles</div>
                </div>
                <ChevronRight size={18} color={R.muted} strokeWidth={2} />
              </Link>
            </Row>
          </Card>
        </section>

        <section>
          <SectionTitle>Notifications</SectionTitle>
          <Card>
            <ToggleRow
              label="Weekly digest"
              description="Summary of new matches and saved roles"
              checked={emailDigest}
              onChange={setEmailDigest}
            />
            <ToggleRow
              label="Job alerts"
              description="Email when we find strong new matches"
              checked={jobAlerts}
              onChange={setJobAlerts}
              borderTop
            />
            <Row borderTop padding="12px 16px">
              <p style={{ fontSize: 11, color: R.body, margin: 0, lineHeight: 1.45 }}>
                Notification preferences are local for now and are not synced to the server.
              </p>
            </Row>
          </Card>
        </section>

        <section>
          <SectionTitle>Privacy</SectionTitle>
          <Card>
            <Row>
              <div style={{ fontSize: 15, fontWeight: 500, color: R.darkest }}>Your data</div>
              <p style={{ fontSize: 13, color: R.body, margin: "8px 0 0", lineHeight: 1.5 }}>
                Profile and resume text are stored in your Supabase workspace. You can export or delete data from the
                Supabase dashboard or by contacting support.
              </p>
            </Row>
          </Card>
        </section>

        <section>
          <SectionTitle>About</SectionTitle>
          <Card>
            <Row>
              <div style={{ fontSize: 15, fontWeight: 500, color: R.darkest }}>Recrux</div>
              <div style={{ fontSize: 13, color: R.body, marginTop: 6 }}>Version 1.0.0</div>
            </Row>
          </Card>
        </section>
          </div>
        </div>
      </div>
    </div>
  );
}
