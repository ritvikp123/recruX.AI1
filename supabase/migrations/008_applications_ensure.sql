-- Ensure applications table exists and RLS allows insert
-- Run in Supabase SQL Editor if "Recently Applied" doesn't show applied jobs
-- or you get "could not find public.applications" error

create table if not exists applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  job_id text not null,
  job_data jsonb not null,
  applied_at timestamptz default now(),
  status text default 'Submitted',
  auto_applied boolean default false
);

alter table applications enable row level security;

drop policy if exists "Users own applications" on applications;
create policy "Users own applications" on applications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
