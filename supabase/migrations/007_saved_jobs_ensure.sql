-- Ensure saved_jobs table exists and RLS allows insert
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- if saving jobs fails with "permission denied" or "relation does not exist"

create table if not exists saved_jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  job_id text not null,
  job_data jsonb not null,
  saved_at timestamptz default now()
);

alter table saved_jobs enable row level security;

drop policy if exists "Users own saved_jobs" on saved_jobs;
create policy "Users own saved_jobs" on saved_jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
