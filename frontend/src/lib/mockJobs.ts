/** Dev/demo listings from `useJobStore` when JSearch keys are missing. */
export function isMockJobId(id: string | undefined): boolean {
  if (!id) return false;
  return id.startsWith("mock-job-") || id.startsWith("mock-dashboard-");
}
