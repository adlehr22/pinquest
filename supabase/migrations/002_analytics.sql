create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  user_id uuid references auth.users null,
  session_id text null,
  challenge_date date null,
  mode text default 'daily',
  location_id integer null,
  round_number integer null,
  distance_miles numeric null,
  points_earned integer null,
  total_score integer null,
  metadata jsonb null,
  created_at timestamp default now()
);

-- No RLS needed — this is write-only from the client
alter table public.analytics_events enable row level security;

create policy "Anyone can insert analytics"
  on public.analytics_events for insert with check (true);

create policy "Only service role can read analytics"
  on public.analytics_events for select using (false);

-- Daily active players
create view public.analytics_daily_players as
  select
    challenge_date,
    count(distinct coalesce(user_id::text, session_id)) as players,
    count(distinct user_id) as logged_in_players,
    count(distinct session_id) filter (where user_id is null) as guest_players
  from public.analytics_events
  where event_type = 'game_started'
  group by challenge_date
  order by challenge_date desc;

-- Completion rate
create view public.analytics_completion_rate as
  select
    challenge_date,
    count(*) filter (where event_type = 'game_started') as started,
    count(*) filter (where event_type = 'game_completed') as completed,
    round(
      count(*) filter (where event_type = 'game_completed')::numeric /
      nullif(count(*) filter (where event_type = 'game_started'), 0) * 100, 1
    ) as completion_pct
  from public.analytics_events
  group by challenge_date
  order by challenge_date desc;

-- Average score by day
create view public.analytics_avg_score as
  select
    challenge_date,
    round(avg(total_score)) as avg_score,
    max(total_score) as top_score,
    count(*) as total_games
  from public.analytics_events
  where event_type = 'game_completed'
  group by challenge_date
  order by challenge_date desc;

-- Share rate
create view public.analytics_share_rate as
  select
    challenge_date,
    count(*) filter (where event_type = 'game_completed') as completed,
    count(*) filter (where event_type = 'share_clicked') as shared,
    round(
      count(*) filter (where event_type = 'share_clicked')::numeric /
      nullif(count(*) filter (where event_type = 'game_completed'), 0) * 100, 1
    ) as share_pct
  from public.analytics_events
  group by challenge_date
  order by challenge_date desc;
