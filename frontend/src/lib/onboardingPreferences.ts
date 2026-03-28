import { supabase } from "./supabase";

export const ONBOARDING_DRAFT_KEY = "recrux_onboarding_draft";

export type OnboardingData = {
  industries: string[];
  roles: string[];
  experienceLevel: string;
  employmentTypes: string[];
  workLocation: string[];
  urgency: string;
  companySizes: string[];
  compensation: string;
};

export function readOnboardingDraft(): OnboardingData | null {
  const raw = window.sessionStorage.getItem(ONBOARDING_DRAFT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as OnboardingData;
    // Basic shape validation (avoid runtime crashes).
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearOnboardingDraft() {
  window.sessionStorage.removeItem(ONBOARDING_DRAFT_KEY);
}

export async function persistOnboardingPreferences(userId: string, onboardingData: OnboardingData) {
  // Supabase RLS policies will require an authenticated user matching user_id.
  await supabase.from("user_preferences").upsert(
    {
      user_id: userId,
      industries: onboardingData.industries ?? [],
      roles: onboardingData.roles ?? [],
      experience_level: onboardingData.experienceLevel ?? "",
      employment_types: onboardingData.employmentTypes ?? [],
      work_location: onboardingData.workLocation ?? [],
      urgency: onboardingData.urgency ?? "",
      company_sizes: onboardingData.companySizes ?? [],
      compensation: onboardingData.compensation ?? "",
    },
    { onConflict: "user_id" }
  );
}

