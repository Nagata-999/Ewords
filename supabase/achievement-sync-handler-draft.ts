// Staging-only reference. Must run *after* the existing sushi-id-sync PIN verification.
// Do not expose this handler as an unauthenticated endpoint.
import { normalizeAchievementEvents, summarizeAchievementEvents } from "./achievement-server-draft.ts";
type Client={from:(table:string)=>any};
type SyncInput={events?:unknown;cursor?:string|null;limit?:number};
const PAGE_SIZE=500;
export async function syncAchievementPage(db:Client,sushiId:string,input:SyncInput){
  if(!sushiId||typeof sushiId!=="string")throw new Error("missing_verified_sushi_id");
  if(input?.cursor!==undefined&&input.cursor!==null&&
    (typeof input.cursor!=="string"||!/^[A-Za-z0-9:_-]{1,159}$/.test(input.cursor)))
    throw new Error("invalid_page_cursor");
  if(input?.limit!==undefined&&(!Number.isSafeInteger(input.limit)||input.limit<1||input.limit>PAGE_SIZE))
    throw new Error("invalid_page_limit");
  const raw=input?.events??[];
  if(!Array.isArray(raw)||raw.length>PAGE_SIZE)throw new Error("invalid_event_batch_size");
  const normalized=normalizeAchievementEvents(raw,PAGE_SIZE);
  if(normalized.rejected||normalized.conflicts.length)throw new Error("invalid_or_conflicting_events");
  const ids=normalized.events.map(e=>e.id);
  if(ids.length){
    const {data:existing,error:readError}=await db.from("sushi_achievement_events")
      .select("event_id,game_id,correct_count,occurred_at").eq("sushi_id",sushiId).in("event_id",ids);
    if(readError)throw readError;
    const byId=new Map((existing||[]).map((e:any)=>[e.event_id,e]));
    for(const event of normalized.events){
      const old:any=byId.get(event.id);
      if(old&&(old.game_id!==event.game||old.correct_count!==event.correct||new Date(old.occurred_at).getTime()!==event.at))
        throw new Error("event_id_conflict");
    }
    const inserts=normalized.events.filter(e=>!byId.has(e.id)).map(e=>({
      sushi_id:sushiId,event_id:e.id,game_id:e.game,correct_count:e.correct,
      occurred_at:new Date(e.at).toISOString()
    }));
    if(inserts.length){
      const {error:insertError}=await db.from("sushi_achievement_events")
        .upsert(inserts,{onConflict:"sushi_id,event_id",ignoreDuplicates:true});
      if(insertError)throw insertError;
    }
  }
  // Re-read after the insert: concurrent writers may have raced on the same ID.
  // ignoreDuplicates prevents overwrite, but without this check the losing
  // writer could otherwise receive a false acknowledgment.
  if(ids.length){
    const {data:canonical,error:verifyError}=await db.from("sushi_achievement_events")
      .select("event_id,game_id,correct_count,occurred_at").eq("sushi_id",sushiId).in("event_id",ids);
    if(verifyError)throw verifyError;
    const verified=new Map((canonical||[]).map((e:any)=>[e.event_id,e]));
    for(const event of normalized.events){
      const row:any=verified.get(event.id);
      if(!row||row.game_id!==event.game||row.correct_count!==event.correct||
         new Date(row.occurred_at).getTime()!==event.at)
        throw new Error("event_id_conflict_or_missing");
    }
  }
  // Keyset pagination avoids offset drift when another device adds new events.
  // Cursor is event_id, the stable primary-key component.
  const cursor=input.cursor??null;
  const limit=input.limit??PAGE_SIZE;
  let query=db.from("sushi_achievement_events")
    .select("event_id,game_id,correct_count,occurred_at")
    .eq("sushi_id",sushiId).order("event_id",{ascending:true}).limit(limit+1);
  if(cursor)query=query.gt("event_id",cursor);
  const {data:rows,error:pageError}=await query;
  if(pageError)throw pageError;
  const hasMore=(rows||[]).length>limit;
  const page=(rows||[]).slice(0,limit);
  return {
    version:2,synced:true,accepted:ids,
    events:page.map((r:any)=>({version:2,id:r.event_id,game:r.game_id,correct:r.correct_count,at:new Date(r.occurred_at).getTime()})),
    nextCursor:hasMore?page[page.length-1].event_id:null
  };
}
// Summary must be calculated from ALL canonical rows, not a single page.
// summarizeAchievementEvents is only suitable when the full set is loaded.
