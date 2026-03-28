-- User onboarding preferences for personalized job generation

create extension if not exists pgcrypto;

create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  industries text[] default '{}',
  roles text[] default '{}',
  experience_level text,
  employment_types text[] default '{}',
  work_location text[] default '{}',
  urgency text,
  company_sizes text[] default '{}',
  compensation text,
  created_at timestamptz default now(),
  unique (user_id)
);

alter table public.user_preferences enable row level security;

create policy "user_preferences own" on public.user_preferences
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

