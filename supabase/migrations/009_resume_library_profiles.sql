-- Persist resume library (metadata + parsed text) per user so it survives browsers/devices.
-- Used by ResumeOptimizer: profiles.resume_library is JSON array of resume entries.

alter table public.profiles
  add column if not exists resume_library jsonb default '[]'::jsonb;

comment on column public.profiles.resume_library is
  'Array of saved resume objects: id, fileName, uploadedAt, storagePath, rawText, skills, summary, experience, skillsText, isPrimary';
