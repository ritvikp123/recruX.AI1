/**
 * Supabase password-recovery links put `type=recovery` in the URL hash (or rarely in query).
 * If we treat the user as "signed in" on `/` and redirect to `/dashboard`, the hash is lost and reset fails.
 */
export function urlIndicatesPasswordRecovery(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hash;
  const s = window.location.search;
  return (
    h.includes("type=recovery") ||
    h.includes("type%3Drecovery") ||
    s.includes("type=recovery") ||
    s.includes("type%3Drecovery")
  );
}
