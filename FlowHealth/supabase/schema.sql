-- FlowHealth database schema
-- Run once in Supabase: SQL Editor -> New query -> paste everything -> Run.

-- 1. Profile: one row per user
create table if not exists public.profiles (
  user_id        uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  name           text not null,
  bmr            integer not null check (bmr between 500 and 6000),
  activity       text not null check (activity in ('Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Extremely Active')),
  age            integer check (age between 10 and 120),
  sex            text check (sex in ('Female', 'Male')),
  height         numeric(5, 1) check (height between 50 and 250),
  current_weight numeric(5, 1) not null check (current_weight between 20 and 400),
  target_weight  numeric(5, 1) not null check (target_weight between 20 and 400),
  adjustment     integer not null,
  updated_at     timestamptz not null default now()
);

-- 2. Weigh-ins: one row per user and date
create table if not exists public.weight_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date       date not null,
  weight_kg  numeric(5, 1) not null check (weight_kg between 20 and 400),
  note       text check (char_length(note) <= 500),
  logged_at  timestamptz not null default now(),
  unique (user_id, date)
);

create index if not exists weight_entries_user_date on public.weight_entries (user_id, date);

-- 3. Row Level Security: each user can only see and change their own rows
alter table public.profiles enable row level security;
alter table public.weight_entries enable row level security;

drop policy if exists "Users manage their own profile" on public.profiles;
create policy "Users manage their own profile" on public.profiles
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own weigh-ins" on public.weight_entries;
create policy "Users manage their own weigh-ins" on public.weight_entries
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
