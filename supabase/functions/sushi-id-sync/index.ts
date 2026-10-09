// Reviewed candidate. Deploy separately after the wallet concurrency tests pass.
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
function mergeRankPreferences(a:any={},b:any={}){
    const normalize=(value:any)=>({selected:['white','yellow','orange','green','blue','purple','black'].includes(value?.selected)?value.selected:null,selectionRevision:Number.isSafeInteger(value?.selectionRevision)&&value.selectionRevision>=0?value.selectionRevision:0,selectionDevice:typeof value?.selectionDevice==='string'?value.selectionDevice.slice(0,160):'',unlockedTotal:Number.isSafeInteger(value?.unlockedTotal)&&value.unlockedTotal>=0?value.unlockedTotal:0});
    const left=normalize(a),right=normalize(b);
    const rightWins=right.selectionRevision>left.selectionRevision||(right.selectionRevision===left.selectionRevision&&(right.selectionDevice>left.selectionDevice||(right.selectionDevice===left.selectionDevice&&String(right.selected)>String(left.selected))));
    const winner=rightWins?right:left;
    return {...winner,unlockedTotal:Math.max(left.unlockedTotal,right.unlockedTotal)};
  }
function mergeLedger(a0:unknown,b0:unknown,claimIds:string[]=[]){
  const a=obj(a0),b=obj(b0),out={...a,...b} as Record<string,unknown>;
  delete out.gemPendingEvents;
  out.achievementPreferences=mergeRankPreferences(obj(a.achievementPreferences),obj(b.achievementPreferences));
  const scores:Record<string,number>={};
  for(const game of ["giri","blast"]){const previous=obj(a.achievementGameScores)[game],incoming=obj(b.achievementGameScores)[game];scores[game]=Math.max(Number.isSafeInteger(previous)?previous as number:0,Number.isSafeInteger(incoming)?incoming as number:0,0)}
  out.achievementGameScores=scores;
  const ae=Array.isArray(a.gemEvents)?a.gemEvents:[],be=Array.isArray(b.gemEvents)?b.gemEvents:[];
  const gemById=new Map<string,Record<string,unknown>>();
  // Keep processed IDs after the visible 1,000-event history is pruned.
  // Only server state and authenticated claim receipts seed this archive.
  const serverIds=new Set<string>([...(Array.isArray(a.gemEventIds)?a.gemEventIds:[]),...claimIds].filter((id):id is string=>typeof id==="string"&&id.length>0&&id.length<=200));
  const archivedIds=new Set(Array.isArray(a.gemEventIds)?a.gemEventIds:[]);
  let earned=Math.max(0,Number(a.gemsEarnedTotal)||0);
  for(const event of ae){const e=obj(event);if(e.type==="earn"&&(!Number.isSafeInteger(a.gemsEarnedTotal)||!archivedIds.has(e.id)))earned+=Math.max(0,Number(e.amount)||0);}
  for(const ev of ae){const x=obj(ev),id=typeof x.id==="string"?x.id:"";if(id){serverIds.add(id);if(!gemById.has(id))gemById.set(id,x)}}
  let balance=Math.max(0,Math.floor(Number(a.gems)||0));
  for(const ev of be){
    const x=obj(ev),id=typeof x.id==="string"?x.id:"";
    if(!id)continue;
    if(serverIds.has(id))continue;
    // Achievement credits are minted only by the claim RPC, never client events.
    if(id.startsWith("achievement:"))continue;
    if((x.type!=="earn"&&x.type!=="spend")||!Number.isSafeInteger(x.amount)||(x.amount as number)<=0)throw new Error("invalid_gem_event");
    gemById.set(id,x);
    const amount=Math.max(0,Math.floor(Number(x.amount)||0));
    if(x.type==="earn"){balance+=amount;earned+=amount;}
    else if(x.type==="spend")balance-=amount;
    serverIds.add(id);
  }
  const events=[...gemById.values()].slice(-1000);
  // Event IDs, not client timestamps, are the source of truth. Client clocks can
  // differ from the server and previously caused fresh rewards to be discarded.
  out.gemEvents=events;out.gems=Math.max(0,balance);
  out.gemEventIds=[...serverIds];
  out.gemsEarnedTotal=earned;
  if(!Number.isSafeInteger(balance)||!Number.isSafeInteger(earned))throw new Error("invalid_gem_total");
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
  // Merge only known game score-tier unlock IDs. Never trust these for gem awards.
  const allowed=new Set(["giri:10000","giri:30000","giri:50000","blast:1000","blast:5000","blast:10000","blast:20000"]);
  const unlocks=[...(Array.isArray(a.achievementUnlocks)?a.achievementUnlocks:[]),...(Array.isArray(b.achievementUnlocks)?b.achievementUnlocks:[])];
  out.achievementUnlocks=[...new Set(unlocks.filter(x=>typeof x==="string"&&x.startsWith("achievement:")&&allowed.has(x.slice(12))))];
  for(const k of ["loginManualClaims","dailyGemClaims"]){
    out[k]=uniq([...(Array.isArray(a[k])?a[k] as unknown[]:[]),...(Array.isArray(b[k])?b[k] as unknown[]:[])]);
  }
  const total=Math.max(Number(a.loginBonusTotal)||0,Number(b.loginBonusTotal)||0,Number(a.total)||0,Number(b.total)||0,(out.dailyGemClaims as unknown[]).length);
  const aStreak=Math.max(0,Number(a.loginBonusStreak??a.streak)||0),bStreak=Math.max(0,Number(b.loginBonusStreak??b.streak)||0);
  const aDay=String(a.loginBonusLastDay||a.lastDay||a.lastLoginDay||""),bDay=String(b.loginBonusLastDay||b.lastDay||b.lastLoginDay||"");
  const streak=aDay>bDay?aStreak:bDay>aDay?bStreak:Math.max(aStreak,bStreak);
  out.loginBonusBestStreak=Math.max(Number(a.loginBonusBestStreak)||0,Number(b.loginBonusBestStreak)||0,aStreak,bStreak);
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
    if(action==="outcome_sync"){
      const incoming=body.outcomes?.events;
      const offset=Number(body.outcomes?.offset??0);
      if(!Array.isArray(incoming)||incoming.length>200||!Number.isSafeInteger(offset)||offset<0||offset>1000000)return reply({error:"invalid_outcome_page"},400);
      const rows:any[]=[];
      const ids=new Set<string>();
      for(const e of incoming){
        if(e?.version!==1||typeof e.id!=="string"||!/^[A-Za-z0-9:_-]{1,159}$/.test(e.id)||ids.has(e.id)||typeof e.game!=="string"||!/^[a-z0-9_-]{1,40}$/.test(e.game)||typeof e.questionId!=="string"||!e.questionId||e.questionId.length>160||typeof e.correct!=="boolean"||typeof e.review!=="boolean"||!Number.isSafeInteger(e.at)||e.at<0||e.at>Date.now()+86400000)return reply({error:"invalid_outcome_event"},400);
        ids.add(e.id);
        rows.push({sushi_id:sushiId,event_id:e.id,game_id:e.game,question_id:e.questionId,correct:e.correct,review:e.review,occurred_at:new Date(e.at).toISOString()});
      }
      if(rows.length){
        const {data:existing,error:readErr}=await db.from("sushi_achievement_outcomes").select("event_id,game_id,question_id,correct,review,occurred_at").eq("sushi_id",sushiId).in("event_id",rows.map(x=>x.event_id));
        if(readErr)throw readErr;
        const byId=new Map((existing||[]).map((e:any)=>[e.event_id,e]));
        for(const row of rows){const old:any=byId.get(row.event_id);if(old&&(old.game_id!==row.game_id||old.question_id!==row.question_id||old.correct!==row.correct||old.review!==row.review||new Date(old.occurred_at).getTime()!==new Date(row.occurred_at).getTime()))return reply({error:"outcome_id_conflict"},409)}
        const newRows=rows.filter(x=>!byId.has(x.event_id));
        if(newRows.length){const {error:insertErr}=await db.from("sushi_achievement_outcomes").upsert(newRows,{onConflict:"sushi_id,event_id",ignoreDuplicates:true});if(insertErr)throw insertErr}
      }
      const {data:remote,error:pageErr}=await db.from("sushi_achievement_outcomes").select("event_id,game_id,question_id,correct,review,occurred_at").eq("sushi_id",sushiId).order("occurred_at",{ascending:true}).order("event_id",{ascending:true}).range(offset,offset+199);
      if(pageErr)throw pageErr;
      return reply({ok:true,outcomes:{events:(remote||[]).map((e:any)=>({version:1,id:e.event_id,game:e.game_id,questionId:e.question_id,correct:e.correct,review:e.review,at:new Date(e.occurred_at).getTime()})),nextOffset:(remote||[]).length===200?offset+200:null}});
    }
    if(action==="achievement_claims"){
      const {data:claims,error:claimsError}=await db.from("sushi_achievement_claims").select("claim_id").eq("sushi_id",sushiId).limit(1000);
      if(claimsError)throw claimsError;
      return reply({ok:true,sushi_id:sushiId,receipts:{ids:(claims||[]).map((c:any)=>c.claim_id)}});
    }
    if(action==="achievement_claim"){
      const threshold=Number(body.threshold);
      if(!Number.isSafeInteger(threshold))return reply({error:"invalid_threshold"},400);
      const category=String(body.category||"all_correct");
      if(!["all_correct","streak","vocabulary","toeic","giri","blast","daily","gems","avatar","first_purchase","first_outfit","all_games_day","review","combo","resilience","comeback"].includes(category))return reply({error:"unsupported_category"},400);
      const procedure=["review","combo","resilience","comeback"].includes(category)?"sushi_claim_outcome_milestone":category==="all_games_day"?"sushi_claim_five_games_day":category==="streak"?"sushi_claim_login_streak":category==="all_correct"?"sushi_claim_all_correct":category==="giri"||category==="blast"?"sushi_claim_score_unlock":["daily","gems","avatar"].includes(category)?"sushi_claim_profile_milestone":["first_purchase","first_outfit"].includes(category)?"sushi_claim_first_action":"sushi_claim_game_correct";
      const args=["vocabulary","toeic","giri","blast","daily","gems","avatar","first_purchase","first_outfit","review","combo","resilience","comeback"].includes(category)?{p_sushi_id:sushiId,p_category:category,p_threshold:threshold}:{p_sushi_id:sushiId,p_threshold:threshold};
      const {data:claim,error:claimError}=await db.rpc(procedure,args);
      if(claimError)throw claimError;
      if(claim?.ok){
        const {data:credited,error:creditError}=await db.from("sushi_id_profiles").select("ledger").eq("sushi_id",sushiId).single();
        if(creditError)throw creditError;
        const wallet=obj(credited?.ledger);
        const events=Array.isArray(wallet.gemEvents)?wallet.gemEvents:[];
        const known=new Set([...(Array.isArray(wallet.gemEventIds)?wallet.gemEventIds:[]),...events.map((event:unknown)=>obj(event).id)]);
        const requested=Array.isArray(body.wallet_event_ids)?body.wallet_event_ids.slice(0,1000):[];
        return reply({...claim,wallet:{gems:Math.max(0,Math.floor(Number(wallet.gems)||0)),gemEvents:events,gemAcknowledgedIds:requested.filter((id:unknown)=>typeof id==="string"&&known.has(id))}},200);
      }
      return reply(claim,409);
    }
    if(action==="achievement_sync"){
      let page;
      try{page=await syncAchievementPage(db,sushiId,obj(body.achievements))}
      catch(error){return reply({error:error instanceof Error?error.message:"achievement_sync_failed"},409)}
      const baseline=body.achievements?.baseline;
      if(!Number.isSafeInteger(baseline)||baseline<0||baseline>1000000000)return reply({error:"invalid_achievement_baseline"},400);
      const {data:mergedBaseline,error:baselineError}=await db.rpc("sushi_achievement_merge_baseline",{p_sushi_id:sushiId,p_total:baseline});
      if(baselineError)throw baselineError;
      return reply({ok:true,sushi_id:sushiId,achievements:{...page,baseline:mergedBaseline}});
    }
    if(action!=="sync")return reply({error:"unsupported_action"},400);
    const incoming=obj(body.ledger);
    const {data:claims,error:claimsError}=await db.from("sushi_achievement_claims").select("claim_id").eq("sushi_id",sushiId).limit(1000);
    if(claimsError)throw claimsError;
    const claimIds=(claims||[]).map((claim:any)=>String(claim.claim_id));
    let snapshot=row;
    for(let attempt=0;attempt<5;attempt++){
      const merged=mergeLedger(snapshot.ledger,incoming,claimIds);
      const learning=mergeLearning(snapshot.learning,body.learning);
      const name=cleanName(snapshot.player_name||body.player_name);
      // Compare the complete source documents inside Postgres too. Timestamp
      // equality alone cannot detect timestamp reuse by another wallet writer.
      const {data:saved,error:saveError}=await db.rpc("sushi_save_profile_if_current",{
        p_sushi_id:sushiId,p_expected_updated_at:snapshot.updated_at,
        p_expected_ledger:snapshot.ledger,p_expected_learning:snapshot.learning,
        p_ledger:merged,p_learning:learning,p_player_name:name,p_updated_at:new Date().toISOString()
      });
      if(saveError)throw saveError;
      if(saved){
        const known=new Set(merged.gemEventIds as string[]);
        const {gemEventIds:_archive,...publicLedger}=merged;
        publicLedger.gemAcknowledgedIds=(Array.isArray(incoming.gemEvents)?incoming.gemEvents:[]).map((event:unknown)=>obj(event).id).filter((id:unknown)=>typeof id==="string"&&known.has(id));
        return reply({ok:true,sushi_id:sushiId,player_name:name,ledger:publicLedger,learning});
      }
      const {data:fresh,error:readError}=await db.from("sushi_id_profiles").select("*").eq("sushi_id",sushiId).single();
      if(readError)throw readError;
      if(fresh.pin_hash!==row.pin_hash)return reply({error:"credentials_changed"},409);
      snapshot=fresh;
    }
    return reply({error:"profile_sync_conflict"},409);
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

