-- Reviewed draft: apply only after approval of the production DB change.
begin;
create table if not exists public.sushi_admin_users (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
create table if not exists public.sushi_usage_sessions (
 session_id uuid primary key,
 visitor_id uuid not null,
 sushi_id text references public.sushi_id_profiles(sushi_id),
 game_id text not null check (game_id ~ '^[a-z0-9_-]{1,40}$'),
 started_at timestamptz not null,
 active_seconds integer not null default 0 check(active_seconds between 0 and 14400),
 answers integer not null default 0 check(answers between 0 and 50000),
 correct integer not null default 0 check(correct between 0 and answers),
 updated_at timestamptz not null default now()
);
create index if not exists sushi_usage_visitor on public.sushi_usage_sessions(visitor_id,started_at desc);
create index if not exists sushi_usage_started on public.sushi_usage_sessions(started_at desc);
create index if not exists sushi_usage_actor on public.sushi_usage_sessions(sushi_id,started_at desc) where sushi_id is not null;
alter table public.sushi_admin_users enable row level security;
alter table public.sushi_usage_sessions enable row level security;
revoke all on public.sushi_admin_users,public.sushi_usage_sessions from public,anon,authenticated;
grant select,insert,update,delete on public.sushi_admin_users,public.sushi_usage_sessions to service_role;

create or replace function public.sushi_record_usage(p_session uuid,p_visitor uuid,p_game text,p_started timestamptz,p_seconds integer,p_answers integer,p_correct integer,p_sushi_id text default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_count integer;
begin
 if p_session is null or p_visitor is null or p_game is null or p_game !~ '^[a-z0-9_-]{1,40}$' or p_started is null or p_started>now()+interval '5 minutes' or p_started<now()-interval '7 days' or p_seconds is null or p_seconds not between 0 and 14400 or p_answers is null or p_answers not between 0 and 50000 or p_correct is null or p_correct not between 0 and p_answers then return jsonb_build_object('ok',false,'error','invalid_usage');end if;
 -- Bound new sessions per device. Updates reuse a row and monotonically merge.
 perform pg_advisory_xact_lock(hashtextextended(p_visitor::text,0));
 if not exists(select 1 from public.sushi_usage_sessions where session_id=p_session) then
  perform pg_advisory_xact_lock(724561129);
  delete from public.sushi_usage_sessions where started_at<now()-interval '90 days';
  select count(*) into v_count from public.sushi_usage_sessions;
  if v_count>=50000 then return jsonb_build_object('ok',false,'error','usage_capacity_reached');end if;
  select count(*) into v_count from public.sushi_usage_sessions where visitor_id=p_visitor and started_at>now()-interval '1 hour';
  if v_count>=60 then return jsonb_build_object('ok',false,'error','usage_rate_limit');end if;
 end if;
 insert into public.sushi_usage_sessions(session_id,visitor_id,sushi_id,game_id,started_at,active_seconds,answers,correct)
 values(p_session,p_visitor,p_sushi_id,p_game,p_started,p_seconds,p_answers,p_correct)
 on conflict(session_id) do update set active_seconds=greatest(public.sushi_usage_sessions.active_seconds,excluded.active_seconds),answers=greatest(public.sushi_usage_sessions.answers,excluded.answers),correct=greatest(public.sushi_usage_sessions.correct,excluded.correct),updated_at=now()
 where public.sushi_usage_sessions.visitor_id=excluded.visitor_id and public.sushi_usage_sessions.sushi_id is not distinct from excluded.sushi_id and public.sushi_usage_sessions.game_id=excluded.game_id and public.sushi_usage_sessions.started_at=excluded.started_at;
 get diagnostics v_count=row_count;
 return jsonb_build_object('ok',v_count=1,'error',case when v_count=0 then 'usage_identity_conflict' else null end);
end $$;
revoke all on function public.sushi_record_usage(uuid,uuid,text,timestamptz,integer,integer,integer,text) from public,anon,authenticated;
grant execute on function public.sushi_record_usage(uuid,uuid,text,timestamptz,integer,integer,integer,text) to service_role;

create or replace function public.sushi_usage_report(p_from date,p_to date,p_game text default '',p_search text default '',p_offset integer default 0)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_result jsonb;
begin
 if p_from is null or p_to is null or p_to<p_from or p_to-p_from>365 or p_offset<0 or p_offset>100000 or length(p_search)>80 then raise exception 'invalid_range';end if;
 with records as (
  select s.*,case when s.sushi_id is null then 'guest:'||s.visitor_id else 'id:'||s.sushi_id end as actor,coalesce(p.player_name,'') as player_name
  from public.sushi_usage_sessions s left join public.sushi_id_profiles p on p.sushi_id=s.sushi_id
  where s.started_at >= p_from::timestamp at time zone 'Asia/Tokyo' and s.started_at < (p_to+1)::timestamp at time zone 'Asia/Tokyo'
  and (p_game='' or s.game_id=p_game)
  and (p_search='' or strpos(lower(coalesce(s.sushi_id,'guest:'||s.visitor_id)),lower(p_search))>0 or strpos(lower(coalesce(p.player_name,'')),lower(p_search))>0)
 ), game_totals as (
  select game_id,count(*) as opens,count(distinct actor) as people,sum(active_seconds) as seconds,sum(answers) as answers,sum(correct) as correct from records group by game_id
 ), actor_game as (
  select actor,max(player_name) as player_name,game_id,count(*) as opens,sum(active_seconds) as seconds,sum(answers) as answers,sum(correct) as correct,count(distinct (started_at at time zone 'Asia/Tokyo')::date) as days,max(updated_at) as last_seen from records group by actor,game_id
 ), actor_totals as (
  select actor,max(player_name) as player_name,sum(opens) as opens,sum(seconds) as seconds,sum(answers) as answers,sum(correct) as correct,max(last_seen) as last_seen,jsonb_agg(jsonb_build_object('game',game_id,'opens',opens,'seconds',seconds,'answers',answers,'correct',correct,'days',days) order by seconds desc,game_id) as games from actor_game group by actor
 ), page as (select * from actor_totals order by last_seen desc,actor limit 50 offset p_offset)
 select jsonb_build_object('summary',jsonb_build_object('people',(select count(*) from actor_totals),'opens',(select count(*) from records),'seconds',coalesce((select sum(active_seconds) from records),0),'answers',coalesce((select sum(answers) from records),0),'correct',coalesce((select sum(correct) from records),0)), 'games',coalesce((select jsonb_agg(to_jsonb(g) order by seconds desc,game_id) from game_totals g),'[]'::jsonb),'people',coalesce((select jsonb_agg(to_jsonb(a) order by last_seen desc,actor) from page a),'[]'::jsonb),'offset',p_offset,'hasMore',p_offset+50<(select count(*) from actor_totals)) into v_result;
 return v_result;
end $$;
revoke all on function public.sushi_usage_report(date,date,text,text,integer) from public,anon,authenticated;
grant execute on function public.sushi_usage_report(date,date,text,text,integer) to service_role;
commit;
