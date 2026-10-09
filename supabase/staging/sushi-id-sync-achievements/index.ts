// STAGING CANDIDATE ONLY. Do not deploy before schema migration and approval.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "https://sushitan.net",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
const validId=(s:string)=>/^[a-z0-9_-]{4,24}$/.test(s);
const validPin=(s:string)=>/^\d{4}$/.test(s);
const cleanName=(v:unknown)=>typeof v==="string"?v.normalize("NFKC").trim().slice(0,20):null;
const obj=(v:unknown)=>v && typeof v==="object" && !Array.isArray(v) ? v as Record<string,unknown> : {};
const uniq=(a:unknown[])=>[...new Set(a.filter(x=>typeof x==="string"))].slice(-500);
function mergeLearning(a0:unknown,b0:unknown){
  const a=obj(a0),b=obj(b0),byId=new Map<string,unknown>();
  for(const e of [...(Array.isArray(a.events)?a.events:[]),...(Array.isArray(b.events)?b.events:[])]){
    const x=obj(e),id=typeof x.id==="string"?x.id:"";
    if(!id)continue;
    const old=byId.get(id);
    if(!old){byId.set(id,e);continue}
    const prev=obj(old);
    // Legacy imports intentionally share an ID across devices. Preserve the
    // strongest observed snapshot instead of silently keeping whichever synced first.
    if(id.startsWith("import-")){
      const same=prev.word_id===x.word_id && prev.correct===x.correct && prev.game_id===x.game_id;
      if(same){
        byId.set(id,{...prev,...x,count:Math.max(Number(prev.count)||1,Number(x.count)||1),at:Math.max(Number(prev.at)||0,Number(x.at)||0)});
      }
    }
  }
  const cards=new Map<string,unknown>();
  for(const card of [...(Array.isArray(a.cards)?a.cards:[]),...(Array.isArray(b.cards)?b.cards:[])]){
    const x=obj(card),id=typeof x.word_id==="string"?x.word_id:"";
    if(/^dictionary:sw-\d{5,}$/.test(id) && typeof x.en==="string" && x.en.trim() && typeof x.jp==="string" && x.jp.trim() && !cards.has(id)) cards.set(id,card);
  }
  return {version:1,registry_version:Math.max(Number(a.registry_version)||0,Number(b.registry_version)||0),events:[...byId.values()],cards:[...cards.values()]};
}
function mergeLedger(a0:unknown,b0:unknown){
  const a=obj(a0),b=obj(b0),out={...a,...b} as Record<string,unknown>;
  const ae=Array.isArray(a.gemEvents)?a.gemEvents:[],be=Array.isArray(b.gemEvents)?b.gemEvents:[];
  const gemById=new Map<string,Record<string,unknown>>();
  const serverIds=new Set<string>();
  for(const ev of ae){const x=obj(ev),id=typeof x.id==="string"?x.id:"";if(id){serverIds.add(id);if(!gemById.has(id))gemById.set(id,x)}}
  let balance=Math.max(0,Math.floor(Number(a.gems)||0));
  for(const ev of be){
    const x=obj(ev),id=typeof x.id==="string"?x.id:"";
    if(!id)continue;
    if(!gemById.has(id))gemById.set(id,x);
    if(serverIds.has(id))continue;
    const amount=Math.max(0,Math.floor(Number(x.amount)||0));
    if(x.type==="earn")balance+=amount;
    else if(x.type==="spend")balance-=amount;
    serverIds.add(id);
  }
  const events=[...gemById.values()].slice(-1000);
  // Event IDs, not client timestamps, are the source of truth. Client clocks can
  // differ from the server and previously caused fresh rewards to be discarded.
  out.gemEvents=events;out.gems=Math.max(0,balance);
  out.gemSyncBase=out.gems;out.gemSyncBaseAt=Date.now();
  const ag=obj(a.gacha),bg=obj(b.gacha);
  const serverRev=Math.max(0,Number(ag.avatarRevision)||0),clientRev=Math.max(0,Number(bg.avatarRevision)||0);
  const serverAt=Math.max(0,Number(ag.avatarUpdatedAt)||0),clientAt=Math.max(0,Number(bg.avatarUpdatedAt)||0);
  const clientWins=clientRev>serverRev||(clientRev===serverRev&&clientRev>0&&clientAt>serverAt);
  const avatarSource=clientWins?bg:ag;
  out.gacha={...ag,...bg,avatar:avatarSource.avatar,avatarRevision:Math.max(serverRev,clientRev),avatarUpdatedAt:clientWins?clientAt:serverAt,owned:uniq([...(Array.isArray(ag.owned)?ag.owned:[]),...(Array.isArray(bg.owned)?bg.owned:[])])};
  const ad=obj(a.dailyQuests),bd=obj(b.dailyQuests);
  const aday=String(ad.day||""),bday=String(bd.day||"");
  if(aday&&bday&&aday===bday){
    const ap=obj(ad.progress),bp=obj(bd.progress),ac=obj(ad.claimed),bc=obj(bd.claimed);
    const progress:Record<string,number>={},claimed:Record<string,boolean>={};
    for(const k of new Set([...Object.keys(ap),...Object.keys(bp)])) progress[k]=Math.max(0,Number(ap[k])||0,Number(bp[k])||0);
    for(const k of new Set([...Object.keys(ac),...Object.keys(bc)])) claimed[k]=Boolean(ac[k]||bc[k]);
    const active=Array.isArray(bd.active)&&bd.active.length?bd.active:(Array.isArray(ad.active)?ad.active:[]);
    out.dailyQuests={...ad,...bd,day:bday,active,progress,claimed,chestClaimed:Boolean(ad.chestClaimed||bd.chestClaimed),chestReward:Math.max(Number(ad.chestReward)||0,Number(bd.chestReward)||0)};
  }else if(bday && (!aday || bday>aday)) out.dailyQuests=bd;
  else if(aday) out.dailyQuests=ad;
  for(const k of ["loginManualClaims","dailyGemClaims"]){
    out[k]=uniq([...(Array.isArray(a[k])?a[k] as unknown[]:[]),...(Array.isArray(b[k])?b[k] as unknown[]:[])]);
  }
  const total=Math.max(Number(a.loginBonusTotal)||0,Number(b.loginBonusTotal)||0,Number(a.total)||0,Number(b.total)||0,(out.dailyGemClaims as unknown[]).length);
  const streak=Math.max(Number(a.loginBonusStreak)||0,Number(b.loginBonusStreak)||0,Number(a.streak)||0,Number(b.streak)||0);
  const days=[a.loginBonusLastDay,b.loginBonusLastDay,a.lastDay,b.lastDay,a.lastLoginDay,b.lastLoginDay].map(x=>String(x||"")).sort();
  const lastDay=days[days.length-1]||"";
  out.loginBonusTotal=total; out.total=total;
  out.loginBonusStreak=streak; out.streak=streak;
  out.loginBonusLastDay=lastDay; out.lastDay=lastDay; out.lastLoginDay=lastDay;
  return out;
}
// Draft only. Do NOT deploy without integrating authenticated PIN checks and transaction-safe claims.
// This module is designed to be imported by the existing sushi-id-sync Edge Function.
type AchievementEvent={version:2;id:string;game:string;correct:number;at:number};
type AchievementSummary={total:number;games:Record<string,number>;eventCount:number};
const EVENT_ID=/^[A-Za-z0-9:_-]{1,159}$/;
const GAME_ID=/^[a-z0-9_-]{1,40}$/;
function validAchievementEvent(e:unknown):e is AchievementEvent{
  if(!e||typeof e!=='object'||Array.isArray(e))return false;
  const x=e as Record<string,unknown>;
  return x.version===2&&typeof x.id==='string'&&EVENT_ID.test(x.id)&&
    typeof x.game==='string'&&GAME_ID.test(x.game)&&Number.isSafeInteger(x.correct)&&
    (x.correct as number)>=1&&(x.correct as number)<=1000&&
    typeof x.at==='number'&&Number.isFinite(x.at)&&x.at>=0&&x.at<=8640000000000000;
}
function normalizeAchievementEvents(input:unknown,limit=500){
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
function summarizeAchievementEvents(events:AchievementEvent[]):AchievementSummary{
  const games:Record<string,number>=Object.create(null);let total=0;
  const unique=normalizeAchievementEvents(events,Number.MAX_SAFE_INTEGER).events;
  for(const e of unique){
    total+=e.correct;games[e.game]=(games[e.game]||0)+e.correct;
  }
  return {total,games,eventCount:unique.length};
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

// Staging-only reference. Must run *after* the existing sushi-id-sync PIN verification.
// Do not expose this handler as an unauthenticated endpoint.
type Client={from:(table:string)=>any};
type SyncInput={events?:unknown;cursor?:string|null;limit?:number};
const PAGE_SIZE=500;
async function syncAchievementPage(db:Client,sushiId:string,input:SyncInput){
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

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  if(req.method!=="POST") return reply({error:"method_not_allowed"},405);
  try{
    const body=await req.json();
    const action=String(body.action||"");
    const sushiId=String(body.sushi_id||"").normalize("NFKC").trim().toLowerCase();
    const pin=String(body.pin||"").trim();
    if(!validId(sushiId)||!validPin(pin)) return reply({error:"invalid_credentials"},400);
    const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const {data:row,error:qerr}=await db.from("sushi_id_profiles").select("*").eq("sushi_id",sushiId).maybeSingle();
    if(qerr) throw qerr;
    if(action==="create"){
      if(row) return reply({error:"id_taken"},409);
      const ledger=obj(body.ledger);
      const learning=mergeLearning({},body.learning);
      const {error}=await db.from("sushi_id_profiles").insert({sushi_id:sushiId,pin_hash:await hashPin(pin),player_name:cleanName(body.player_name),ledger,learning});
      if(error) throw error;
      return reply({ok:true,sushi_id:sushiId,player_name:cleanName(body.player_name),ledger,learning});
    }
    if(!row) return reply({error:"not_found"},404);
    if(row.locked_until && new Date(row.locked_until)>new Date()) return reply({error:"temporarily_locked"},429);
    const ok=await verifyPin(pin,row.pin_hash);
    if(!ok){
      const failures=(Number(row.failed_attempts)||0)+1;
      const lock=failures>=5?new Date(Date.now()+10*60*1000).toISOString():null;
      await db.from("sushi_id_profiles").update({failed_attempts:failures>=5?0:failures,locked_until:lock}).eq("sushi_id",sushiId);
      return reply({error:lock?"temporarily_locked":"wrong_pin"},lock?429:401);
    }
    if(action==="achievement_sync"){
      const page=await syncAchievementPage(db,sushiId,obj(body.achievements));
      return reply({ok:true,sushi_id:sushiId,achievements:page});
    }
    const incoming=obj(body.ledger);
    const merged=mergeLedger(row.ledger,incoming);
    const learning=mergeLearning(row.learning,body.learning);
    const name=cleanName(row.player_name||body.player_name);
    const {error:uerr}=await db.from("sushi_id_profiles").update({ledger:merged,learning,player_name:name,failed_attempts:0,locked_until:null,updated_at:new Date().toISOString()}).eq("sushi_id",sushiId);
    if(uerr) throw uerr;
    return reply({ok:true,sushi_id:sushiId,player_name:name,ledger:merged,learning});
  }catch(e){return reply({error:"server_error"},500)}
});

async function hashPin(pin:string){
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const hash=await derive(pin,salt);
  return b64(salt)+"."+b64(hash);
}
async function verifyPin(pin:string,stored:string){
  const [s,h]=stored.split("."); if(!s||!h)return false;
  const salt=from64(s), expected=from64(h), actual=await derive(pin,salt);
  if(actual.length!==expected.length)return false;
  let diff=0; for(let i=0;i<actual.length;i++)diff|=actual[i]^expected[i]; return diff===0;
}
async function derive(pin:string,salt:Uint8Array){
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(pin),"PBKDF2",false,["deriveBits"]);
  const bits=await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt,iterations:150000},key,256);
  return new Uint8Array(bits);
}
function b64(a:Uint8Array){return btoa(String.fromCharCode(...a))}
function from64(s:string){return Uint8Array.from(atob(s),c=>c.charCodeAt(0))}
