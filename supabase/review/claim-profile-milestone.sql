-- Review candidate only. Production function replacement requires user approval.
-- Only cumulative gem eligibility changes; receipt + credit remain transactional.
CREATE OR REPLACE FUNCTION public.sushi_claim_profile_milestone(p_sushi_id text, p_category text, p_threshold integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_reward integer;v_value bigint;v_id text;v_ledger jsonb;v_events jsonb;v_balance bigint;v_inserted integer;
begin
 v_reward:=case p_category
 when 'daily' then case p_threshold when 1 then 10 when 10 then 25 when 100 then 100 end
 when 'gems' then case p_threshold when 100 then 10 when 1000 then 25 when 10000 then 100 end
 when 'avatar' then case p_threshold when 1 then 10 when 10 then 50 when 30 then 150 end
 end;
 if v_reward is null then return jsonb_build_object('ok',false,'error','unknown_stage');end if;
 select ledger into v_ledger from public.sushi_id_profiles where sushi_id=p_sushi_id for update;
 if not found then return jsonb_build_object('ok',false,'error','unknown_account');end if;
 v_ledger:=coalesce(v_ledger,'{}'::jsonb);
 v_value:=case p_category
 when 'daily' then (select count(distinct x) from jsonb_array_elements_text(case when jsonb_typeof(v_ledger->'dailyGemClaims')='array' then v_ledger->'dailyGemClaims' else '[]'::jsonb end) x)
 when 'avatar' then (select count(distinct x) from jsonb_array_elements_text(case when jsonb_typeof(v_ledger#>'{gacha,owned}')='array' then v_ledger#>'{gacha,owned}' else '[]'::jsonb end) x)
 when 'gems' then greatest(case when (v_ledger->>'gemsEarnedTotal') ~ '^[0-9]{1,16}$' then least(9007199254740991,(v_ledger->>'gemsEarnedTotal')::bigint) else 0 end, (select coalesce(sum(greatest(0,least(1000000,case when e->>'type'='earn' and (e->>'amount')~'^[0-9]+$' then (e->>'amount')::bigint else 0 end))),0) from jsonb_array_elements(case when jsonb_typeof(v_ledger->'gemEvents')='array' then v_ledger->'gemEvents' else '[]'::jsonb end) e))
 else 0 end;
 if v_value<p_threshold then return jsonb_build_object('ok',false,'error','not_reached','value',v_value);end if;
 v_id:='achievement:'||p_category||':'||p_threshold;
 insert into public.sushi_achievement_claims(sushi_id,claim_id,gems) values(p_sushi_id,v_id,v_reward) on conflict do nothing;
 get diagnostics v_inserted=row_count;
 if v_inserted=0 then return jsonb_build_object('ok',true,'already_claimed',true,'claim_id',v_id,'gems',0);end if;
 v_events:=case when jsonb_typeof(v_ledger->'gemEvents')='array' then v_ledger->'gemEvents' else '[]'::jsonb end;
 if jsonb_path_exists(v_events,'$[*] ? (@.id == $claim)',jsonb_build_object('claim',v_id)) then raise exception 'duplicate_legacy_event';end if;
 v_events:=v_events||jsonb_build_array(jsonb_build_object('id',v_id,'type','earn','amount',v_reward,'source','achievement','at',floor(extract(epoch from now())*1000)::bigint));
 v_balance:=greatest(0,coalesce((v_ledger->>'gems')::bigint,0))+v_reward;
 v_ledger:=jsonb_set(jsonb_set(jsonb_set(v_ledger,'{gemEvents}',v_events,true),'{gems}',to_jsonb(v_balance),true),'{gemSyncBase}',to_jsonb(v_balance),true);
 update public.sushi_id_profiles set ledger=v_ledger,updated_at=now() where sushi_id=p_sushi_id;
 return jsonb_build_object('ok',true,'already_claimed',false,'claim_id',v_id,'gems',v_reward,'balance',v_balance);
end $function$;
