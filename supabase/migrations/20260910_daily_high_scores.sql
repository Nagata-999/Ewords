-- Run once in the existing Supabase project's SQL Editor, before uploading HTML.
-- Existing scores and save_high_score are deliberately retained.
begin;

create table if not exists public.daily_high_scores (
  mode text not null,
  score_date date not null,
  player_key text not null,
  player_name text not null,
  score integer not null check (score >= 0),
  max_combo integer not null check (max_combo >= 0),
  accuracy integer not null check (accuracy between 0 and 100),
  achieved_at timestamptz not null default now(),
  primary key (mode, score_date, player_key)
);
create index if not exists daily_high_scores_ranking_idx
  on public.daily_high_scores (mode, score_date, score desc, max_combo desc);
alter table public.daily_high_scores enable row level security;
revoke all on public.daily_high_scores from public, anon, authenticated;

-- One transaction saves both records, even when the all-time best is unchanged.
-- SECURITY DEFINER is limited to the named game modes and validated score fields.
create or replace function public.save_score_with_daily(
  p_player_name text, p_score integer, p_max_combo integer,
  p_accuracy integer, p_mode text
) returns void
-- The legacy function may reference "scores" without a schema qualification.
-- Keep public before pg_temp for that call; all new relations are qualified.
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_name text;
  v_day date := (statement_timestamp() at time zone 'Asia/Tokyo')::date;
begin
  if p_mode is null or p_mode not in
    ('sushi_idiom', 'core', 'core_level1', 'core_level2', 'core_level3', 'core_level4') then
    raise exception 'Unsupported ranking mode' using errcode = '22023';
  end if;
  if p_score is null or p_score < 0 or p_max_combo is null or p_max_combo < 0
    or p_accuracy is null or p_accuracy not between 0 and 100 then
    raise exception 'Invalid score' using errcode = '22023';
  end if;
  v_name := left(btrim(regexp_replace(normalize(coalesce(p_player_name, ''), NFKC), '\s+', ' ', 'g')), 20);
  if v_name = '' then v_name := 'NO NAME'; end if;

  -- Keep the existing all-time scoring contract and historical rows intact.
  perform public.save_high_score(
    p_player_name => v_name, p_score => p_score, p_max_combo => p_max_combo,
    p_accuracy => p_accuracy, p_mode => p_mode
  );

  insert into public.daily_high_scores as previous
    (mode, score_date, player_key, player_name, score, max_combo, accuracy)
  values (p_mode, v_day, lower(v_name), v_name, p_score, p_max_combo, p_accuracy)
  on conflict (mode, score_date, player_key) do update
    set player_name = excluded.player_name, score = excluded.score,
        max_combo = excluded.max_combo, accuracy = excluded.accuracy,
        achieved_at = statement_timestamp()
    where (excluded.score, excluded.max_combo, excluded.accuracy)
        > (previous.score, previous.max_combo, previous.accuracy);
end;
$$;

-- The server supplies today's date; device clocks/time zones cannot change it.
create or replace function public.get_daily_high_scores(p_mode text, p_limit integer default 50)
returns table(player_name text, score integer, max_combo integer, accuracy integer, mode text)
language sql stable security definer set search_path = ''
as $$
  select d.player_name, d.score, d.max_combo, d.accuracy, d.mode
  from public.daily_high_scores d
  where d.mode = p_mode
    and d.score_date = (statement_timestamp() at time zone 'Asia/Tokyo')::date
  order by d.score desc, d.max_combo desc, d.accuracy desc, d.achieved_at, d.player_key
  limit greatest(1, least(coalesce(p_limit, 50), 100));
$$;

revoke all on function public.save_score_with_daily(text, integer, integer, integer, text) from public;
revoke all on function public.get_daily_high_scores(text, integer) from public;
grant execute on function public.save_score_with_daily(text, integer, integer, integer, text) to anon, authenticated;
grant execute on function public.get_daily_high_scores(text, integer) to anon, authenticated;
notify pgrst, 'reload schema';
commit;
