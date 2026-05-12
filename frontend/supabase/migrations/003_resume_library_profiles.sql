-- Same as ../../supabase/migrations/009_resume_library_profiles.sql (duplicate for frontend/supabase workflows)

alter table public.profiles
  add column if not exists resume_library jsonb default '[]'::jsonb;

comment on column public.profiles.resume_library is
  'Array of saved resume objects: id, fileName, uploadedAt, storagePath, rawText, skills, summary, experience, skillsText, isPrimary';
