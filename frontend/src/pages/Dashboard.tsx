import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpDown,
  BarChart3,
  Bookmark,
  History,
  Layers,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useJobStore } from "../store/useJobStore";
import { computeMatchScore } from "../lib/matchScore";
import { mapJobToRecruxCard } from "../recrux/mapJobToCard";
import { R } from "../recrux/theme";
import { RecruxStatCard } from "../components/recrux/RecruxStatCard";
import { RecruxStreakBar } from "../components/recrux/RecruxStreakBar";
import { RecruxJobCard } from "../components/recrux/RecruxJobCard";
import { RecruxMatchBreakdown } from "../components/recrux/RecruxMatchBreakdown";
import { RecruxJobCardSkeletonList } from "../components/recrux/RecruxJobCardSkeleton";
import { RecruxEmptyState } from "../components/recrux/RecruxEmptyState";
import { DashboardAIBottomChat } from "../components/DashboardAIBottomChat";
import type { Job } from "../types/job";

type MatchTab = "high" | "saved" | "recent";

const hairline = `0.5px solid ${R.border}`;

function statIconWrap(children: ReactNode) {
  return (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: 10,
        background: R.light,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: R.primary,
      }}
    >
      {children}
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [matchTab, setMatchTab] = useState<MatchTab>("high");

  const dashboardJobs = useJobStore((s) => s.dashboardJobs);
  const savedJobs = useJobStore((s) => s.savedJobs);
  const recentlyViewedJobs = useJobStore((s) => s.recentlyViewedJobs);
  const appliedJobIds = useJobStore((s) => s.appliedJobIds);
  const dashboardLoading = useJobStore((s) => s.dashboardLoading);
  const error = useJobStore((s) => s.error);
  const fetchDashboardPreview = useJobStore((s) => s.fetchDashboardPreview);
  const loadResumeFromSupabase = useJobStore((s) => s.loadResumeFromSupabase);
  const resumeText = useJobStore((s) => s.resumeText);
  const toggleSaveJob = useJobStore((s) => s.toggleSaveJob);
  const recordApplication = useJobStore((s) => s.recordApplication);
  const recordRecentView = useJobStore((s) => s.recordRecentView);

  useEffect(() => {
    if (user?.id) void loadResumeFromSupabase(user.id);
  }, [user?.id, loadResumeFromSupabase]);

  useEffect(() => {
    void fetchDashboardPreview(computeMatchScore);
  }, [fetchDashboardPreview, resumeText]);

  const display =
    (user?.user_metadata?.full_name as string) ||
    user?.email?.split("@")[0] ||
    "Annika";
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";

  const avgMatch = useMemo(() => {
    if (dashboardJobs.length === 0) return null;
    const sum = dashboardJobs.reduce((a, j) => a + (j.matchScore ?? 0), 0);
    return Math.round(sum / dashboardJobs.length);
  }, [dashboardJobs]);

  const savedIds = useMemo(() => new Set(savedJobs.map((j) => j.id)), [savedJobs]);

  const newSinceCopy = useMemo(() => {
    const n = Math.max(0, Math.min(dashboardJobs.length, 12));
    return `${n} new high-match roles since yesterday`;
  }, [dashboardJobs.length]);

  const listForTab = useMemo((): Job[] => {
    if (matchTab === "high") return dashboardJobs;
    if (matchTab === "saved") return savedJobs;
    return recentlyViewedJobs;
  }, [matchTab, dashboardJobs, savedJobs, recentlyViewedJobs]);

  const pill = (id: MatchTab, label: string) => {
    const active = matchTab === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => setMatchTab(id)}
        style={{
          padding: "8px 16px",
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
          background: active ? R.primary : R.card,
          color: active ? "#ffffff" : R.primary,
          border: hairline,
          boxShadow: "none",
        }}
      >
        {label}
      </button>
    );
  };

  const bottomTab = (id: MatchTab, Icon: typeof TrendingUp, label: string) => {
    const active = matchTab === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => setMatchTab(id)}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          padding: "10px 18px",
          borderRadius: 12,
          border: "none",
          background: active ? R.light : "transparent",
          color: R.primary,
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 11,
          fontWeight: 600,
          minWidth: 72,
        }}
      >
        <Icon size={20} strokeWidth={active ? 2.5 : 2} />
        <span style={{ textAlign: "center", lineHeight: 1.2 }}>{label}</span>
      </button>
    );
  };

  const renderJobList = () => {
    if (dashboardLoading && matchTab === "high") {
      return <RecruxJobCardSkeletonList count={4} />;
    }
    if (listForTab.length === 0) {
      if (matchTab === "saved") {
        return (
          <RecruxEmptyState
            variant="saved"
            compact
            title="No saved jobs"
            description="Save roles from search to see them here."
            ctaLabel="Search your first job"
            ctaTo="/jobs"
          />
        );
      }
      if (matchTab === "recent") {
        return (
          <RecruxEmptyState
            variant="search"
            compact
            title="No recently viewed"
            description="Open jobs from your feed to build this list."
            ctaLabel="Browse jobs"
            ctaTo="/jobs"
          />
        );
      }
      return (
        <RecruxEmptyState
          variant="search"
          compact
          title="No matches yet"
          description="We couldn’t load roles or your search returned nothing."
          ctaLabel="Search your first job"
          ctaTo="/jobs"
        />
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {listForTab.map((job) => (
          <div
            key={job.id}
            role="button"
            tabIndex={0}
            onClick={() => recordRecentView(job)}
            onKeyDown={(e) => e.key === "Enter" && recordRecentView(job)}
            style={{ cursor: "default" }}
          >
            <RecruxJobCard
              job={mapJobToRecruxCard(job)}
              saved={savedIds.has(job.id)}
              onToggleSave={() => toggleSaveJob(job)}
              onApply={(url) => {
                recordApplication(job);
                if (url) window.open(url, "_blank", "noopener");
              }}
              onOptimize={() => navigate("/resume")}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="recrux-dashboard-grid">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          minWidth: 0,
        }}
      >
        <header>
          <h1
            className="recrux-heading"
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#ffffff",
              margin: 0,
              letterSpacing: "-0.03em",
            }}
          >
            {greet}, {display}
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "rgba(255, 255, 255, 0.92)",
              margin: "8px 0 0",
              fontWeight: 500,
              lineHeight: 1.5,
            }}
          >
            {newSinceCopy}
          </p>
        </header>

        {error && (
          <div
            style={{
              fontSize: 12,
              color: R.deep,
              background: R.light,
              padding: "10px 12px",
              borderRadius: 10,
              border: hairline,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <RecruxStatCard
            label="Applications"
            value={appliedJobIds.length}
            valueColor={R.darkest}
            icon={statIconWrap(<Layers size={24} strokeWidth={2} />)}
          />
          <RecruxStatCard
            label="Avg match"
            value={avgMatch != null ? `${avgMatch}%` : "—"}
            valueColor={avgMatch != null ? R.primary : R.body}
            icon={statIconWrap(<BarChart3 size={24} strokeWidth={2} />)}
          />
          <RecruxStatCard
            label="Day streak"
            value="7"
            valueColor={R.darkest}
            icon={
              <div style={{ paddingTop: 2 }}>
                <RecruxStreakBar days={7} filled={7} />
              </div>
            }
          />
        </div>

        <div
          style={{
            background: R.card,
            border: hairline,
            borderRadius: 10,
            padding: "20px 20px 16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 14,
              flexWrap: "wrap",
            }}
          >
            <h2 className="recrux-heading" style={{ fontSize: 17, fontWeight: 700, color: R.darkest, margin: 0 }}>
              Top Matches
            </h2>
            <button
              type="button"
              aria-label="Sort"
              title="Sort"
              style={{
                border: "none",
                background: R.light,
                borderRadius: 10,
                padding: 8,
                cursor: "pointer",
                color: R.body,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ArrowUpDown size={18} strokeWidth={2} />
            </button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
            {pill("high", "High-Match Jobs")}
            {pill("saved", "Saved Jobs")}
            {pill("recent", "Recently Viewed")}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8, marginBottom: 8 }}>
            {renderJobList()}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              paddingTop: 8,
              paddingBottom: 4,
              borderTop: hairline,
              marginTop: 8,
            }}
          >
            {bottomTab("high", TrendingUp, "High-Match Jobs")}
            {bottomTab("saved", Bookmark, "Saved Jobs")}
            {bottomTab("recent", History, "Recently Viewed")}
          </div>

          <div style={{ textAlign: "center", paddingTop: 12 }}>
            <Link
              to="/jobs"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: R.primary,
                textDecoration: "none",
              }}
            >
              See all high-match jobs &gt;
            </Link>
          </div>
        </div>
      </div>

      <aside
        style={{
          position: "sticky",
          top: 80,
          width: 280,
          maxWidth: "100%",
          justifySelf: "end",
        }}
      >
        <div
          style={{
            background: R.card,
            borderLeft: hairline,
            padding: "18px 18px 18px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <RecruxMatchBreakdown />
        </div>
      </aside>

      <DashboardAIBottomChat />
    </div>
  );
}
