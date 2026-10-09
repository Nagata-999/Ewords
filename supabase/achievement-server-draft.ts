// Draft only. Do NOT deploy without integrating authenticated PIN checks and transaction-safe claims.
// This module is designed to be imported by the existing sushi-id-sync Edge Function.
export type AchievementEvent={version:2;id:string;game:string;correct:number;at:number};
export type AchievementSummary={total:number;games:Record<string,number>;eventCount:number};
const EVENT_ID=/^[A-Za-z0-9:_-]{1,159}$/;
const GAME_ID=/^[a-z0-9_-]{1,40}$/;
export function validAchievementEvent(e:unknown):e is AchievementEvent{
  if(!e||typeof e!=='object'||Array.isArray(e))return false;
  const x=e as Record<string,unknown>;
  return x.version===2&&typeof x.id==='string'&&EVENT_ID.test(x.id)&&
    typeof x.game==='string'&&GAME_ID.test(x.game)&&Number.isSafeInteger(x.correct)&&
    (x.correct as number)>=1&&(x.correct as number)<=1000&&
    typeof x.at==='number'&&Number.isFinite(x.at)&&x.at>=0&&x.at<=8640000000000000;
}
export function normalizeAchievementEvents(input:unknown,limit=500){
  if(!Array.isArray(input))return {events:[] as AchievementEvent[],rejected:0,conflicts:[] as string[]};
  const seen=new Map<string,AchievementEvent>(),conflicts=new Set<string>();
  let rejected=0;
  for(const e of input.slice(0,limit)){
    if(!validAchievementEvent(e)){rejected++;continue}
    const prev=seen.get(e.id);
    if(prev){if(prev.game!==e.game||prev.correct!==e.correct)conflicts.add(e.id);continue}
    seen.set(e.id,{version:2,id:e.id,game:e.game,correct:e.correct,at:e.at});
  }
  rejected+=Math.max(0,input.length-limit);
  return {events:[...seen.values()],rejected,conflicts:[...conflicts]};
}
export function summarizeAchievementEvents(events:AchievementEvent[]):AchievementSummary{
  const games:Record<string,number>=Object.create(null);let total=0;
  for(const e of normalizeAchievementEvents(events,Number.MAX_SAFE_INTEGER).events){
    total+=e.correct;games[e.game]=(games[e.game]||0)+e.correct;
  }
  return {total,games,eventCount:events.length};
}
// Intended server flow:
// 1. Verify sushi_id/PIN with the existing rate-limited authorization path.
// 2. Normalize events; reject conflicting duplicate IDs rather than overwriting.
// 3. Insert with onConflict:'sushi_id,event_id', ignoreDuplicates:true.
// 4. Re-read canonical events (paginate) and calculate authoritative totals.
// 5. Return summary and synced event IDs; client deletes nothing until confirmed.
// 6. Achievement reward claims require a separate SQL transaction/RPC.
// Avoid putting event arrays in sushi_id_profiles.learning or .ledger JSONB:
// concurrent read-modify-write updates can drop events.
