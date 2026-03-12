-- Users table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users primary key,
  username text unique,
  created_at timestamp default now(),
  current_streak integer default 0,
  longest_streak integer default 0,
  total_games integer default 0,
  average_score numeric default 0
);

-- Daily games table
create table public.games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles,
  played_date date not null,
  total_score integer not null,
  round_results jsonb not null,
  created_at timestamp default now(),
  unique(user_id, played_date)
);

-- Leaderboard view
create view public.leaderboard_today as
  select
    p.username,
    g.total_score,
    g.played_date,
    p.current_streak,
    row_number() over (order by g.total_score desc) as rank
  from public.games g
  join public.profiles p on p.id = g.user_id
  where g.played_date = current_date
  order by g.total_score desc
  limit 100;

-- All-time leaderboard view (min 5 games)
create view public.leaderboard_alltime as
  select
    p.username,
    p.average_score,
    p.total_games,
    p.current_streak,
    p.longest_streak,
    row_number() over (order by p.average_score desc) as rank
  from public.profiles p
  where p.total_games >= 5
  order by p.average_score desc
  limit 100;

-- ── Row Level Security ────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.games enable row level security;

-- Profiles: anyone can read (needed for leaderboard), only owner can write
create policy "Profiles are publicly readable"
  on public.profiles for select using (true);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Games: anyone can read (needed for leaderboard), only owner can write
create policy "Games are publicly readable"
  on public.games for select using (true);

create policy "Users can insert own games"
  on public.games for insert with check (auth.uid() = user_id);

create policy "Users can update own games"
  on public.games for update using (auth.uid() = user_id);

-- ── Auto-update profile stats on game insert ──────────────

create or replace function public.update_profile_stats()
returns trigger language plpgsql security definer as $$
begin
  update public.profiles
  set
    total_games = total_games + 1,
    average_score = (average_score * total_games + new.total_score) / (total_games + 1)
  where id = new.user_id;
  return new;
end;
$$;

create trigger on_game_inserted
  after insert on public.games
  for each row execute procedure public.update_profile_stats();

-- ── Auto-create profile on signup ────────────────────────

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
