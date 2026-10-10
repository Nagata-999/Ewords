CREATE OR REPLACE FUNCTION public.sushi_claim_outcome_milestone(p_sushi_id text, p_category text, p_threshold integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_total int:=0;v_streak int:=0;v_max int:=0;v_recovered int:=0;v_comeback int:=0;v_broken boolean:=false;v_misses jsonb:='{}';v_key text;v_miss int;v_event record;v_reward int;v_claim text;v_ledger jsonb;v_events jsonb;v_balance int;
begin
 v_reward:=case when p_category='review' then case p_threshold when 10 then 10 when 100 then 25 when 1000 then 50 when 5000 then 100 end when p_category='combo' then case p_threshold when 10 then 10 when 50 then 50 when 100 then 200 end when p_category in ('resilience','comeback') and p_threshold=1 then 100 end;
 if v_reward is null then return jsonb_build_object('ok',false,'error','invalid_threshold');end if;
 for v_event in select game_id,question_id,correct,review from public.sushi_achievement_outcomes where sushi_id=p_sushi_id order by occurred_at,event_id loop
 v_key:=v_event.game_id||':'||v_event.question_id;
 if v_event.correct then
 v_streak:=v_streak+1;v_max:=greatest(v_max,v_streak);
 if v_event.review then v_total:=v_total+1;end if;
 v_miss:=coalesce((v_misses->>v_key)::int,0);
 if v_miss>=2 then v_recovered:=v_recovered+1;v_misses:=jsonb_set(v_misses,array[v_key],'0'::jsonb,true);end if;
 if v_broken and v_streak>=10 then v_comeback:=1;v_broken:=false;end if;
 else
 v_miss:=coalesce((v_misses->>v_key)::int,0);
 v_misses:=jsonb_set(v_misses,array[v_key],to_jsonb(v_miss+1),true);
 if v_streak>=10 then v_broken:=true;end if;
 v_streak:=0;
 end if;
 end loop;
 if (case p_category when 'review' then v_total when 'combo' then v_max when 'resilience' then v_recovered else v_comeback end)<p_threshold then return jsonb_build_object('ok',false,'error','not_reached');end if;
 v_claim:='achievement:'||p_category||':'||p_threshold;
 select ledger into v_ledger from public.sushi_id_profiles where sushi_id=p_sushi_id for update;
 if not found then return jsonb_build_object('ok',false,'error','not_found');end if;
 if exists(select 1 from public.sushi_achievement_claims where sushi_id=p_sushi_id and claim_id=v_claim) then return jsonb_build_object('ok',true,'already_claimed',true,'claim_id',v_claim,'gems',0);end if;
 v_ledger:=coalesce(v_ledger,'{}'::jsonb);
 v_events:=coalesce(v_ledger->'gemEvents','[]'::jsonb);
 v_balance:=coalesce((v_ledger->>'gems')::int,0)+v_reward;
 update public.sushi_id_profiles set ledger=jsonb_set(jsonb_set(v_ledger,'{gemEvents}',v_events||jsonb_build_array(jsonb_build_object('id',v_claim,'type','earn','amount',v_reward,'source','achievement','at',(extract(epoch from clock_timestamp())*1000)::bigint)),true),'{gems}',to_jsonb(v_balance),true) ,updated_at=now() where sushi_id=p_sushi_id;
 insert into public.sushi_achievement_claims(sushi_id,claim_id,gems) values(p_sushi_id,v_claim,v_reward);
 return jsonb_build_object('ok',true,'gems',v_reward,'claim_id',v_claim);
end $function$;
