-- Recrux frontend: tables expected by savedJobsApi.ts (saved_jobs, applications).
-- Run in Supabase SQL editor or via supabase db push if you use this folder as migrations source.
-- Safe to run if root migrations already created these tables (uses IF NOT EXISTS).

-- Saved jobs (one row per user + job_id)
create table if not exists public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  job_id text not null,
  job_data jsonb not null default '{}',
  saved_at timestamptz default now(),
  unique (user_id, job_id)
);

-- Applications (one row per user + job_id)
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  job_id text not null,
  job_data jsonb not null default '{}',
  applied_at timestamptz default now(),
  status text default 'Submitted',
  unique (user_id, job_id)
);

-- Optional: skill gaps / streaks (feature hooks)
create table if not exists public.skill_gaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  skill text not null,
  frequency int default 1,
  created_at timestamptz default now()
);

create table if not exists public.streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  applied_count int default 0,
  unique (user_id, date)
);

alter table public.saved_jobs enable row level security;
alter table public.applications enable row level security;
alter table public.skill_gaps enable row level security;
alter table public.streaks enable row level security;

drop policy if exists "saved_jobs own" on public.saved_jobs;
create policy "saved_jobs own" on public.saved_jobs for all using (auth.uid() = user_id);

drop policy if exists "applications own" on public.applications;
create policy "applications own" on public.applications for all using (auth.uid() = user_id);

drop policy if exists "skill_gaps own" on public.skill_gaps;
create policy "skill_gaps own" on public.skill_gaps for all using (auth.uid() = user_id);

drop policy if exists "streaks own" on public.streaks;
create policy "streaks own" on public.streaks for all using (auth.uid() = user_id);
