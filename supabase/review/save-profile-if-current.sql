-- Review candidate only. Apply before deploying the matching Edge Function.
-- No tables, columns, balances or existing histories are changed here.
create or replace function public.sushi_save_profile_if_current(
  p_sushi_id text,
  p_expected_updated_at timestamptz,
  p_expected_ledger jsonb,
  p_expected_learning jsonb,
  p_ledger jsonb,
  p_learning jsonb,
  p_player_name text,
  p_updated_at timestamptz
) returns boolean
language plpgsql
security invoker
set search_path = public
as $function$
declare affected integer;
begin
  update public.sushi_id_profiles
  set ledger=p_ledger,learning=p_learning,player_name=p_player_name,
      failed_attempts=0,locked_until=null,updated_at=p_updated_at
  where sushi_id=p_sushi_id
    and updated_at=p_expected_updated_at
    and ledger=p_expected_ledger
    and learning=p_expected_learning;
  get diagnostics affected=row_count;
  return affected=1;
end;
$function$;
revoke all on function public.sushi_save_profile_if_current(text,timestamptz,jsonb,jsonb,jsonb,jsonb,text,timestamptz) from public,anon,authenticated;
grant execute on function public.sushi_save_profile_if_current(text,timestamptz,jsonb,jsonb,jsonb,jsonb,text,timestamptz) to service_role;
