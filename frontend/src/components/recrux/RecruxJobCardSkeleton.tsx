import { R } from "../../recrux/theme";

const hairline = `0.5px solid ${R.border}`;

export function RecruxJobCardSkeleton() {
  return (
    <div
      className="recrux-job-card-skeleton"
      style={{
        background: R.card,
        border: hairline,
        borderRadius: 10,
        padding: 14,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
      aria-hidden
    >
      <div className="recrux-skeleton recrux-skeleton-icon" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="recrux-skeleton recrux-skeleton-line-lg" />
        <div className="recrux-skeleton recrux-skeleton-line-sm" style={{ marginTop: 8 }} />
        <div style={{ display: "flex", gap: 5, marginTop: 10 }}>
          <div className="recrux-skeleton recrux-skeleton-pill" />
          <div className="recrux-skeleton recrux-skeleton-pill" />
        </div>
      </div>
      <div style={{ flexShrink: 0, textAlign: "right" }}>
        <div className="recrux-skeleton recrux-skeleton-match" style={{ marginLeft: "auto" }} />
        <div className="recrux-skeleton recrux-skeleton-bar" style={{ marginTop: 8, marginLeft: "auto" }} />
      </div>
    </div>
  );
}

export function RecruxJobCardSkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: count }, (_, i) => (
        <RecruxJobCardSkeleton key={i} />
      ))}
    </div>
  );
}
