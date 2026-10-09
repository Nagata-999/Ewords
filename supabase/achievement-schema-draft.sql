-- Draft only: review and deploy separately after testing Edge Function authorization.
-- No client role receives direct access; PIN verification remains in sushi-id-sync.
create table if not exists public.sushi_achievement_events (
  sushi_id text not null references public.sushi_id_profiles(sushi_id) on delete cascade,
  event_id text not null,
  game_id text not null,
  correct_count integer not null,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  primary key (sushi_id,event_id),
  constraint sushi_achievement_event_id_valid check (length(event_id) between 1 and 159 and event_id ~ '^[A-Za-z0-9:_-]+$'),
  constraint sushi_achievement_game_id_valid check (game_id ~ '^[a-z0-9_-]{1,40}$'),
  constraint sushi_achievement_correct_valid check (correct_count between 1 and 1000)
);
create index if not exists sushi_achievement_events_by_user_time on public.sushi_achievement_events(sushi_id,occurred_at desc);
alter table public.sushi_achievement_events enable row level security;
revoke all on public.sushi_achievement_events from anon,authenticated;
-- No RLS policies. Only the service-role Edge Function, after PIN validation,
-- may read/write. Never expose the service-role key in browser code.

create table if not exists public.sushi_achievement_claims (
  sushi_id text not null references public.sushi_id_profiles(sushi_id) on delete cascade,
  achievement_stage_id text not null,
  gems_awarded integer not null check (gems_awarded >= 0 and gems_awarded <= 10000),
  claimed_at timestamptz not null default now(),
  primary key (sushi_id,achievement_stage_id),
  constraint sushi_achievement_stage_id_valid check (length(achievement_stage_id) between 1 and 120)
);
alter table public.sushi_achievement_claims enable row level security;
revoke all on public.sushi_achievement_claims from anon,authenticated;
-- IMPORTANT: A unique claim row alone does not guarantee atomic gem credit.
-- Claim insertion and gem balance/event update must happen in one DB transaction.
