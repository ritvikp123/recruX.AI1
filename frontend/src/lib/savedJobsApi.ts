import { supabase } from "./supabase";
import type { Job } from "../types/job";

/** JSON-serializable snapshot for `saved_jobs.job_data` / `applications.job_data` */
function jobToRow(job: Job): Record<string, unknown> {
  return JSON.parse(JSON.stringify(job)) as Record<string, unknown>;
}

/**
 * Upsert into `saved_jobs`: one row per (user_id, job_id).
 * Updates `job_data` and `saved_at` if the row already exists.
 */
export async function saveJob(userId: string, job: Job): Promise<void> {
  const job_data = jobToRow(job);
  const { data: existing, error: selErr } = await supabase
    .from("saved_jobs")
    .select("id")
    .eq("user_id", userId)
    .eq("job_id", job.id)
    .maybeSingle();

  if (selErr) {
    console.error("saveJob select:", selErr.message);
    return;
  }

  if (existing?.id) {
    const { error } = await supabase
      .from("saved_jobs")
      .update({
        job_data,
        saved_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) console.error("saveJob update:", error.message);
    return;
  }

  const { error } = await supabase.from("saved_jobs").insert({
    user_id: userId,
    job_id: job.id,
    job_data,
  });
  if (error) console.error("saveJob insert:", error.message);
}

/** Deletes one saved row for the user/job pair. */
export async function removeSavedJob(userId: string, jobId: string): Promise<void> {
  const { error } = await supabase
    .from("saved_jobs")
    .delete()
    .eq("user_id", userId)
    .eq("job_id", jobId);
  if (error) console.error("removeSavedJob delete:", error.message);
}

/**
 * Upsert into `applications`: one row per (user_id, job_id).
 * Updates `job_data` and `applied_at` if the row already exists.
 */
export async function applyJob(userId: string, job: Job): Promise<void> {
  const job_data = jobToRow(job);
  const { data: existing, error: selErr } = await supabase
    .from("applications")
    .select("id")
    .eq("user_id", userId)
    .eq("job_id", job.id)
    .maybeSingle();

  if (selErr) {
    console.error("applyJob select:", selErr.message);
    return;
  }

  if (existing?.id) {
    const { error } = await supabase
      .from("applications")
      .update({
        job_data,
        applied_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) console.error("applyJob update:", error.message);
    return;
  }

  const { error } = await supabase.from("applications").insert({
    user_id: userId,
    job_id: job.id,
    job_data,
  });
  if (error) console.error("applyJob insert:", error.message);
}
