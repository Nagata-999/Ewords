'use strict';
/* Local-only event ledger. PIN sync requires server-side idempotent merge before launch. */
(function(global){
  if(global.SushiAchievementLedger)return;
  const PREFIX='sushitan_achievement_v2:event:';
  const DEVICE='sushitan_achievement_v2:device';
  const KEY='sushitan_achievement_progress_v1';
  const BASELINE='sushitan_achievement_v2:baseline';
  const LEARNING='sushitan_learning_v1:event:';
  const VALID_GAME=/^[a-z0-9_-]{1,40}$/;
  function deviceId(){
    let id=localStorage.getItem(DEVICE);
    if(!id){id=global.crypto?.randomUUID?.()||('device-'+Date.now()+'-'+Math.random().toString(36).slice(2));localStorage.setItem(DEVICE,id)}
    return id;
  }
  function valid(e){return e&&e.version===2&&typeof e.id==='string'&&/^[A-Za-z0-9:_-]{1,159}$/.test(e.id)&&VALID_GAME.test(e.game)&&Number.isSafeInteger(e.correct)&&e.correct>0&&e.correct<=1000&&Number.isFinite(e.at)&&e.at>=0&&e.at<=8640000000000000}
  function learningTotal(){
    let total=0;
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);if(!key?.startsWith(LEARNING))continue;
      try{const e=JSON.parse(localStorage.getItem(key));if(e?.version===1&&e.correct===true&&e.id===key.slice(LEARNING.length)&&Number.isSafeInteger(e.count)&&e.count>0)total+=e.count}catch{}
    }
    return total;
  }
  function migrationBaseline(){
    try{const v=JSON.parse(localStorage.getItem(BASELINE)||'null');if(v?.version===1&&Number.isSafeInteger(v.total)&&v.total>=0)return v.total}catch{}
    return null;
  }
  function ensureMigrationBaseline(){
    const existing=migrationBaseline();if(existing!==null)return existing;
    // Snapshot only once: future learning events can overlap the new achievement stream.
    const baseline=Math.max(legacyBaseline(),learningTotal());
    try{localStorage.setItem(BASELINE,JSON.stringify({version:1,total:baseline,at:Date.now()}))}catch{}
    return baseline;
  }
  function record(game,correct=1,eventId){
    if(!VALID_GAME.test(game)||!Number.isSafeInteger(correct)||correct<1||correct>1000)return null;
    ensureMigrationBaseline();
    const id=eventId||deviceId()+':'+(global.crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2));
    if(typeof id!=='string'||!/^[A-Za-z0-9:_-]{1,159}$/.test(id))return null;
    const key=PREFIX+id;
    if(localStorage.getItem(key))return id;
    const event={version:2,id,game,correct,at:Date.now()};
    localStorage.setItem(key,JSON.stringify(event));
    global.dispatchEvent(new CustomEvent('sushi-achievement-change',{detail:{game,id}}));
    return id;
  }
  function summary(){
    const seen=new Set(),games=Object.create(null);let total=0;
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);if(!key?.startsWith(PREFIX))continue;
      try{const e=JSON.parse(localStorage.getItem(key));if(!valid(e)||key!==PREFIX+e.id||seen.has(e.id))continue;seen.add(e.id);total+=e.correct;games[e.game]=(games[e.game]||0)+e.correct}catch{}
    }
    return {total,games,eventCount:seen.size};
  }
  // A game counts on a day only when a verified correct-answer event exists.
  // Imported events are deduplicated by ID, so cross-device sync cannot inflate it.
  function distinctGamesInDay(){
    const days=new Map(),seen=new Set();
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);if(!key?.startsWith(PREFIX))continue;
      try{
        const e=JSON.parse(localStorage.getItem(key));
        if(!valid(e)||key!==PREFIX+e.id||seen.has(e.id))continue;
        seen.add(e.id);
        const day=new Date(e.at+9*3600000).toISOString().slice(0,10);
        if(!days.has(day))days.set(day,new Set());
        days.get(day).add(e.game);
      }catch{}
    }
    return Math.max(0,...[...days.values()].map(games=>games.size));
  }
  // Explicit answer outcomes, separate from aggregate correct counts.
  // A streak must never be inferred from correct-only events.
  const OUTCOME_PREFIX='sushitan_achievement_outcome_v1:';
  let outcomeClock=0,outcomeClockLoaded=false;
  function validOutcome(e){return e?.version===1&&typeof e.id==='string'&&/^[A-Za-z0-9:_-]{1,159}$/.test(e.id)&&VALID_GAME.test(e.game)&&typeof e.questionId==='string'&&!!e.questionId.trim()&&e.questionId.length<=160&&typeof e.correct==='boolean'&&typeof e.review==='boolean'&&Number.isSafeInteger(e.at)&&e.at>=0&&e.at<=8640000000000000}
  function recordOutcome(game,questionId,correct,{review=false,eventId}={}){
    if(!VALID_GAME.test(game)||typeof questionId!=='string'||!questionId.trim()||questionId.length>160||typeof correct!=='boolean')return null;
    const id=eventId||deviceId()+':'+(global.crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2));
    if(typeof id!=='string'||!/^[A-Za-z0-9:_-]{1,159}$/.test(id))return null;
    const existing=localStorage.getItem(OUTCOME_PREFIX+id);
    if(existing){try{const old=JSON.parse(existing);return old.game===game&&old.questionId===questionId&&old.correct===correct&&old.review===(review===true)?id:null}catch{return null}}
    if(!outcomeClockLoaded){for(const event of exportOutcomes())outcomeClock=Math.max(outcomeClock,event.at);outcomeClockLoaded=true;}
    outcomeClock=Math.max(Date.now(),outcomeClock+1);
    const event={version:1,id,game,questionId,correct,review:review===true,at:outcomeClock};
    try{localStorage.setItem(OUTCOME_PREFIX+id,JSON.stringify(event))}catch{return null}
    global.dispatchEvent(new CustomEvent('sushi-achievement-change',{detail:{outcome:true,game}}));
    return id;
  }
  function exportOutcomes(){
    const out=[];
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);if(!key?.startsWith(OUTCOME_PREFIX))continue;
      try{
        const e=JSON.parse(localStorage.getItem(key));
        if(validOutcome(e)&&key===OUTCOME_PREFIX+e.id)out.push(e);
      }catch{}
    }
    return out.sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id));
  }
  function importOutcomes(events){
    if(!Array.isArray(events)||events.length>10000)return 0;
    const staged=new Map();
    for(const e of events){
      if(!validOutcome(e))throw new Error('invalid_outcome_event');
      const previous=staged.get(e.id)||JSON.parse(localStorage.getItem(OUTCOME_PREFIX+e.id)||'null');
      if(previous&&(previous.game!==e.game||previous.questionId!==e.questionId||previous.correct!==e.correct||previous.review!==e.review||previous.at!==e.at))throw new Error('outcome_id_conflict');
      staged.set(e.id,e);
    }
    let added=0;
    for(const e of staged.values()){
      const key=OUTCOME_PREFIX+e.id;
      if(localStorage.getItem(key))continue;
      try{localStorage.setItem(key,JSON.stringify(e));outcomeClock=Math.max(outcomeClock,e.at);added++}catch{break}
    }
    if(added)global.dispatchEvent(new CustomEvent('sushi-achievement-change',{detail:{importedOutcomes:added}}));
    return added;
  }
  function outcomeSummary(){
    const events=[];
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);if(!key?.startsWith(OUTCOME_PREFIX))continue;
      try{
        const e=JSON.parse(localStorage.getItem(key));
        if(!validOutcome(e)||key!==OUTCOME_PREFIX+e.id)continue;
        events.push(e);
      }catch{}
    }
    events.sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id));
    let streak=0,maxStreak=0,reviewCorrect=0,recovered=0,comeback=0;
    const errors=new Map();let broken=false;
    for(const e of events){
      const key=e.game+':'+e.questionId;
      if(e.correct){
        streak++;maxStreak=Math.max(maxStreak,streak);
        if(e.review)reviewCorrect++;
        if((errors.get(key)||0)>=2){recovered++;errors.set(key,0)}
        if(broken&&streak>=10){comeback=1;broken=false}
      }else{
        errors.set(key,(errors.get(key)||0)+1);
        if(streak>=10)broken=true;
        streak=0;
      }
    }
    return {review_correct:reviewCorrect,correct_streak:maxStreak,repeat_mistake_recovered:recovered,comeback_streak:comeback,eventCount:events.length};
  }
  function legacyBaseline(){
    try{const old=JSON.parse(localStorage.getItem(KEY)||'{}');return Number.isSafeInteger(old.total)&&old.total>=0?old.total:0}catch{return 0}
  }
  function exportBatch(limit=500,offset=0){
    const events=[];
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);if(!key?.startsWith(PREFIX))continue;
      try{const e=JSON.parse(localStorage.getItem(key));if(valid(e)&&key===PREFIX+e.id)events.push(e)}catch{}
    }
    events.sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id));
    const start=Math.max(0,Math.floor(Number(offset)||0));const size=Math.max(1,Math.min(500,Math.floor(Number(limit)||500)));
    return {version:2,events:events.slice(start,start+size),nextOffset:start+size<events.length?start+size:null,totalEvents:events.length};
  }
  function exportAllPages(pageSize=500){
    // Snapshot once: stable pagination even when new answers arrive during export.
    const events=[];
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);if(!key?.startsWith(PREFIX))continue;
      try{const e=JSON.parse(localStorage.getItem(key));if(valid(e)&&key===PREFIX+e.id)events.push(e)}catch{}
    }
    events.sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id));
    const size=Math.max(1,Math.min(500,Math.floor(Number(pageSize)||500)));
    const pages=[];
    for(let offset=0;offset<events.length;offset+=size)pages.push({version:2,events:events.slice(offset,offset+size),nextOffset:offset+size<events.length?offset+size:null,totalEvents:events.length});
    return pages.length?pages:[{version:2,events:[],nextOffset:null,totalEvents:0}];
  }
  function importEvents(input){
    if(!Array.isArray(input))return {added:0,conflicts:0,rejected:0};
    // Preflight the entire page before writing. A conflicting server page must
    // not partially change local progress before the transport rejects it.
    if(input.length>1000)return {added:0,conflicts:0,rejected:input.length};
    const staged=new Map();let conflicts=0,rejected=0;
    for(const e of input){
      if(!valid(e)){rejected++;continue}
      const key=PREFIX+e.id;
      const duplicate=staged.get(key);
      if(duplicate){
        if(duplicate.game!==e.game||duplicate.correct!==e.correct||duplicate.at!==e.at)conflicts++;
        continue;
      }
      try{
        const old=localStorage.getItem(key);
        if(old){
          const prev=JSON.parse(old);
          if(!valid(prev)||prev.id!==e.id||prev.game!==e.game||prev.correct!==e.correct||prev.at!==e.at)conflicts++;
          continue;
        }
        staged.set(key,e);
      }catch{rejected++}
    }
    if(conflicts||rejected)return {added:0,conflicts,rejected};
    let added=0;
    try{
      for(const [key,e] of staged){localStorage.setItem(key,JSON.stringify(e));added++}
    }catch{
      // localStorage may reject writes (e.g. quota). Roll back only keys
      // created by this import; never remove pre-existing records.
      for(const key of [...staged.keys()].slice(0,added))try{localStorage.removeItem(key)}catch{}
      return {added:0,conflicts:0,rejected:1};
    }
    if(added)global.dispatchEvent(new CustomEvent('sushi-achievement-change',{detail:{imported:added}}));
    return {added,conflicts:0,rejected:0};
  }
  function baselineForSync(){
    const current=ensureMigrationBaseline();
    // A legacy counter may have advanced before the event-ledger rollout.
    return Math.max(current,legacyBaseline()-summary().total,0);
  }
  function mergeBaseline(remote){
    if(!Number.isSafeInteger(remote)||remote<0||remote>1000000000)return false;
    const current=ensureMigrationBaseline();
    // Legacy totals can exceed the migration snapshot on another device.
    // Subtract the event stream before comparing to avoid double counting.
    const inferred=Math.max(0,legacyBaseline()-summary().total);
    const target=Math.max(remote,current,inferred);
    if(target<=current)return false;
    localStorage.setItem(BASELINE,JSON.stringify({version:1,total:target,at:Date.now()}));
    global.dispatchEvent(new CustomEvent('sushi-achievement-baseline-sync',{detail:{total:target}}));
    return true;
  }
  function reconciledTotal(){
    const base=migrationBaseline();const historical=base===null?Math.max(legacyBaseline(),learningTotal()):base;
    const eventTotal=summary().total;
    // Learning records may include the same post-migration answers; use as a floor, not an addition.
    return Math.max(historical+eventTotal,learningTotal(),legacyBaseline());
  }
  global.SushiAchievementLedger=Object.freeze({record,recordOutcome,exportOutcomes,importOutcomes,outcomeSummary,summary,distinctGamesInDay,legacyBaseline,learningTotal,migrationBaseline,ensureMigrationBaseline,baselineForSync,mergeBaseline,reconciledTotal,exportBatch,exportAllPages,importEvents});
})(window);
