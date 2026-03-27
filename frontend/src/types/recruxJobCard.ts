/** Shape expected by Recrux JobCard (frontend-2) */
export interface RecruxJobCardData {
  id?: string;
  title: string;
  company: string;
  location: string;
  pay: string | null;
  matchPct: number;
  fit: "great" | "gap" | "warn";
  fitLabel: string;
  iconBg: string;
  iconColor: string;
  iconLetter: string;
  matchColor: string;
  /** Company logo URL; letter fallback if missing or broken */
  logoUrl?: string;
  applyUrl?: string;
}
