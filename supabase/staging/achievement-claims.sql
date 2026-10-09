-- Transactional achievement claim for the server-verified all_correct stages only.
-- Never trust a client supplied gem amount or progress count.
create table if not exists public.sushi_achievement_claims (
 sushi_id text not null references public.sushi_id_profiles(sushi_id) on delete cascade,
 claim_id text not null,
 gems integer not null check (gems between 0 and 10000),
 claimed_at timestamptz not null default now(),
 primary key(sushi_id,claim_id)
);
alter table public.sushi_achievement_claims enable row level security;
revoke all on public.sushi_achievement_claims from anon,authenticated;
create or replace function public.sushi_claim_all_correct(p_sushi_id text,p_threshold integer)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
 v_reward integer;
 v_base bigint;
 v_event_total bigint;
 v_total bigint;
 v_id text;
 v_profile public.sushi_id_profiles%rowtype;
 v_ledger jsonb;
 v_events jsonb;
 v_balance bigint;
 v_inserted integer;
begin
 v_reward:=case p_threshold when 10 then 10 when 500 then 25 when 2000 then 50 when 5000 then 75 when 15000 then 100 when 50000 then 200 when 150000 then 300 else null end;
 if v_reward is null then return jsonb_build_object('ok',false,'error','unknown_stage');end if;
 select * into v_profile from public.sushi_id_profiles where sushi_id=p_sushi_id for update;
 if not found then return jsonb_build_object('ok',false,'error','unknown_account');end if;
 select coalesce(baseline_total,0) into v_base from public.sushi_achievement_baselines where sushi_id=p_sushi_id;
 select coalesce(sum(correct_count),0) into v_event_total from public.sushi_achievement_events where sushi_id=p_sushi_id;
 v_total:=coalesce(v_base,0)+coalesce(v_event_total,0);
 if v_total<p_threshold then return jsonb_build_object('ok',false,'error','not_reached','total',v_total);end if;
 v_id:='achievement:all_correct:'||p_threshold;
 insert into public.sushi_achievement_claims(sushi_id,claim_id,gems) values(p_sushi_id,v_id,v_reward) on conflict do nothing;
 get diagnostics v_inserted=row_count;
 if v_inserted=0 then return jsonb_build_object('ok',true,'already_claimed',true,'claim_id',v_id,'gems',0);end if;
 v_ledger:=coalesce(v_profile.ledger,'{}'::jsonb);
 -- Never credit a claim whose deterministic event ID already exists in the legacy ledger.
 if jsonb_path_exists(coalesce(v_ledger->'gemEvents','[]'::jsonb),'$[*] ? (@.id == $claim)',jsonb_build_object('claim',v_id)) then
   return jsonb_build_object('ok',false,'error','legacy_claim_event_exists');
 end if;
 v_events:=case when jsonb_typeof(v_ledger->'gemEvents')='array' then v_ledger->'gemEvents' else '[]'::jsonb end;
 -- A deterministic ID makes the existing profile sync merge idempotent.
 v_events:=v_events||jsonb_build_array(jsonb_build_object('id',v_id,'type','earn','amount',v_reward,'source','achievement','at',floor(extract(epoch from now())*1000)::bigint));
 v_balance:=greatest(0,coalesce((v_ledger->>'gems')::bigint,0))+v_reward;
 v_ledger:=jsonb_set(jsonb_set(jsonb_set(v_ledger,'{gemEvents}',v_events,true),'{gems}',to_jsonb(v_balance),true),'{gemSyncBase}',to_jsonb(v_balance),true);
 update public.sushi_id_profiles set ledger=v_ledger,updated_at=now() where sushi_id=p_sushi_id;
 return jsonb_build_object('ok',true,'already_claimed',false,'claim_id',v_id,'gems',v_reward,'balance',v_balance);
end $$;
revoke all on function public.sushi_claim_all_correct(text,integer) from public,anon,authenticated;
grant execute on function public.sushi_claim_all_correct(text,integer) to service_role;
