-- Review candidate only. Production function replacement requires user approval.
-- Eligibility includes the best observed streak after the current streak resets.
CREATE OR REPLACE FUNCTION public.sushi_claim_login_streak(p_sushi_id text, p_threshold integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
 v_reward integer;
 v_streak bigint;
 v_id text;
 v_ledger jsonb;
 v_events jsonb;
 v_balance bigint;
 v_inserted integer;
begin
 v_reward:=case p_threshold when 3 then 10 when 7 then 25 when 30 then 50 when 100 then 100 when 365 then 300 else null end;
 if v_reward is null then return jsonb_build_object('ok',false,'error','unknown_stage');end if;
 select ledger into v_ledger from public.sushi_id_profiles where sushi_id=p_sushi_id for update;
 if not found then return jsonb_build_object('ok',false,'error','unknown_account');end if;
 v_ledger:=coalesce(v_ledger,'{}'::jsonb);
 v_streak:=greatest(coalesce((v_ledger->>'loginBonusBestStreak')::bigint,0),coalesce((v_ledger->>'loginBonusStreak')::bigint,0),coalesce((v_ledger->>'streak')::bigint,0));
 if v_streak<p_threshold then return jsonb_build_object('ok',false,'error','not_reached','streak',v_streak);end if;
 v_id:='achievement:streak:'||p_threshold;
 insert into public.sushi_achievement_claims(sushi_id,claim_id,gems) values(p_sushi_id,v_id,v_reward) on conflict do nothing;
 get diagnostics v_inserted=row_count;
 if v_inserted=0 then return jsonb_build_object('ok',true,'already_claimed',true,'claim_id',v_id,'gems',0);end if;
 v_events:=case when jsonb_typeof(v_ledger->'gemEvents')='array' then v_ledger->'gemEvents' else '[]'::jsonb end;
 if jsonb_path_exists(v_events,'$[*] ? (@.id == $claim)',jsonb_build_object('claim',v_id)) then raise exception 'legacy_claim_event_exists';end if;
 v_events:=v_events||jsonb_build_array(jsonb_build_object('id',v_id,'type','earn','amount',v_reward,'source','achievement','at',floor(extract(epoch from now())*1000)::bigint));
 v_balance:=greatest(0,coalesce((v_ledger->>'gems')::bigint,0))+v_reward;
 v_ledger:=jsonb_set(jsonb_set(jsonb_set(v_ledger,'{gemEvents}',v_events,true),'{gems}',to_jsonb(v_balance),true),'{gemSyncBase}',to_jsonb(v_balance),true);
 update public.sushi_id_profiles set ledger=v_ledger,updated_at=now() where sushi_id=p_sushi_id;
 return jsonb_build_object('ok',true,'already_claimed',false,'claim_id',v_id,'gems',v_reward,'balance',v_balance);
end $function$
