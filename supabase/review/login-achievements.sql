-- Review candidate. Apply to production only after explicit user approval.
-- One summary row per account; the server clock alone determines JST visits.
create table if not exists public.sushi_login_activity (
  sushi_id text primary key references public.sushi_id_profiles(sushi_id) on delete cascade,
  last_day date not null,
  streak integer not null check (streak >= 1),
  best_streak integer not null check (best_streak >= streak),
  hour_03 boolean not null default false,
  hour_05 boolean not null default false,
  hour_23 boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.sushi_login_activity enable row level security;
revoke all on public.sushi_login_activity from public,anon,authenticated;
grant select,insert,update,delete on public.sushi_login_activity to service_role;

create or replace function public.sushi_record_login_visit(p_sushi_id text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_now timestamp := statement_timestamp() at time zone 'Asia/Tokyo';
  v_day date := v_now::date;
  v_hour integer := extract(hour from v_now);
  v_activity public.sushi_login_activity%rowtype;
begin
  if not exists(select 1 from public.sushi_id_profiles where sushi_id=p_sushi_id) then
    return jsonb_build_object('ok',false,'error','unknown_account');
  end if;
  insert into public.sushi_login_activity as a
    (sushi_id,last_day,streak,best_streak,hour_03,hour_05,hour_23)
  values(p_sushi_id,v_day,1,1,v_hour=3,v_hour=5,v_hour=23)
  on conflict(sushi_id) do update set
    streak=case when a.last_day=v_day then a.streak when a.last_day=v_day-1 then a.streak+1 when a.last_day<v_day then 1 else a.streak end,
    best_streak=greatest(a.best_streak,case when a.last_day=v_day-1 then a.streak+1 else a.streak end),
    last_day=greatest(a.last_day,v_day),
    hour_03=a.hour_03 or excluded.hour_03,
    hour_05=a.hour_05 or excluded.hour_05,
    hour_23=a.hour_23 or excluded.hour_23,
    updated_at=statement_timestamp()
  returning * into v_activity;
  return jsonb_build_object('ok',true,'login',jsonb_build_object(
    'lastDay',v_activity.last_day,'streak',v_activity.streak,'bestStreak',v_activity.best_streak,
    'hour03',v_activity.hour_03,'hour05',v_activity.hour_05,'hour23',v_activity.hour_23));
end $$;

create or replace function public.sushi_claim_login_achievement(p_sushi_id text,p_category text,p_threshold integer)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_reward integer;
  v_value integer := 0;
  v_id text;
  v_ledger jsonb;
  v_events jsonb;
  v_balance bigint;
  v_inserted integer;
  v_activity public.sushi_login_activity%rowtype;
begin
  if p_category='practice' then
    v_reward:=case p_threshold when 7 then 10 when 14 then 25 when 21 then 50 when 28 then 75 when 35 then 100 when 42 then 200 when 49 then 300 else null end;
  elsif p_category in ('login_03','login_05','login_23') and p_threshold=1 then v_reward:=10;
  end if;
  if v_reward is null then return jsonb_build_object('ok',false,'error','unknown_stage'); end if;
  -- Use the same profile row lock as existing wallet RPCs. Receipt and credit
  -- commit together; repeats and concurrent requests return zero new gems.
  select ledger into v_ledger from public.sushi_id_profiles where sushi_id=p_sushi_id for update;
  if not found then return jsonb_build_object('ok',false,'error','unknown_account'); end if;
  v_id:='achievement:'||p_category||':'||p_threshold;
  if exists(select 1 from public.sushi_achievement_claims where sushi_id=p_sushi_id and claim_id=v_id) then
    return jsonb_build_object('ok',true,'already_claimed',true,'claim_id',v_id,'gems',0);
  end if;
  select * into v_activity from public.sushi_login_activity where sushi_id=p_sushi_id;
  if p_category='practice' then
    v_value:=coalesce(v_activity.best_streak,0);
  else
    v_value:=case p_category when 'login_03' then coalesce(v_activity.hour_03,false)::integer
      when 'login_05' then coalesce(v_activity.hour_05,false)::integer
      when 'login_23' then coalesce(v_activity.hour_23,false)::integer else 0 end;
  end if;
  if v_value<p_threshold then return jsonb_build_object('ok',false,'error','not_reached'); end if;
  insert into public.sushi_achievement_claims(sushi_id,claim_id,gems) values(p_sushi_id,v_id,v_reward) on conflict do nothing;
  get diagnostics v_inserted=row_count;
  if v_inserted=0 then return jsonb_build_object('ok',true,'already_claimed',true,'claim_id',v_id,'gems',0); end if;
  v_events:=case when jsonb_typeof(v_ledger->'gemEvents')='array' then v_ledger->'gemEvents' else '[]'::jsonb end;
  if jsonb_path_exists(v_events,'$[*] ? (@.id == $claim)',jsonb_build_object('claim',v_id)) then raise exception 'legacy_claim_event_exists'; end if;
  v_events:=v_events||jsonb_build_array(jsonb_build_object('id',v_id,'type','earn','amount',v_reward,'source','achievement','at',floor(extract(epoch from statement_timestamp())*1000)::bigint));
  v_balance:=greatest(0,coalesce((v_ledger->>'gems')::bigint,0))+v_reward;
  v_ledger:=jsonb_set(jsonb_set(jsonb_set(v_ledger,'{gemEvents}',v_events,true),'{gems}',to_jsonb(v_balance),true),'{gemSyncBase}',to_jsonb(v_balance),true);
  update public.sushi_id_profiles set ledger=v_ledger,updated_at=clock_timestamp() where sushi_id=p_sushi_id;
  return jsonb_build_object('ok',true,'already_claimed',false,'claim_id',v_id,'gems',v_reward,'balance',v_balance);
end $$;

revoke all on function public.sushi_record_login_visit(text) from public,anon,authenticated;
revoke all on function public.sushi_claim_login_achievement(text,text,integer) from public,anon,authenticated;
grant execute on function public.sushi_record_login_visit(text) to service_role;
grant execute on function public.sushi_claim_login_achievement(text,text,integer) to service_role;
