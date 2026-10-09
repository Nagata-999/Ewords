'use strict';
/* Local-only event ledger. PIN sync requires server-side idempotent merge before launch. */
(function(global){
  const PREFIX='sushitan_achievement_v2:event:';
  const DEVICE='sushitan_achievement_v2:device';
  const KEY='sushitan_achievement_progress_v1';
  const VALID_GAME=/^[a-z0-9_-]{1,40}$/;
  function deviceId(){
    let id=localStorage.getItem(DEVICE);
    if(!id){id=global.crypto?.randomUUID?.()||('device-'+Date.now()+'-'+Math.random().toString(36).slice(2));localStorage.setItem(DEVICE,id)}
    return id;
  }
  function valid(e){return e&&e.version===2&&typeof e.id==='string'&&e.id.length<160&&VALID_GAME.test(e.game)&&Number.isSafeInteger(e.correct)&&e.correct>0&&e.correct<=1000&&Number.isFinite(e.at)}
  function record(game,correct=1,eventId){
    if(!VALID_GAME.test(game)||!Number.isSafeInteger(correct)||correct<1||correct>1000)return null;
    const id=eventId||deviceId()+':'+(global.crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2));
    if(typeof id!=='string'||id.length>159)return null;
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
  function legacyBaseline(){
    try{const old=JSON.parse(localStorage.getItem(KEY)||'{}');return Number.isSafeInteger(old.total)&&old.total>=0?old.total:0}catch{return 0}
  }
  function exportBatch(limit=500){
    const events=[];
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);if(!key?.startsWith(PREFIX))continue;
      try{const e=JSON.parse(localStorage.getItem(key));if(valid(e)&&key===PREFIX+e.id)events.push(e)}catch{}
    }
    events.sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id));
    return {version:2,events:events.slice(0,Math.max(1,Math.min(500,limit)))};
  }
  function importEvents(input){
    if(!Array.isArray(input))return {added:0,conflicts:0,rejected:0};
    let added=0,conflicts=0,rejected=0;
    for(const e of input.slice(0,1000)){
      if(!valid(e)){rejected++;continue}
      const key=PREFIX+e.id;
      try{
        const old=localStorage.getItem(key);
        if(old){const prev=JSON.parse(old);if(prev.game!==e.game||prev.correct!==e.correct)conflicts++;continue}
        localStorage.setItem(key,JSON.stringify(e));added++;
      }catch{rejected++}
    }
    if(added)global.dispatchEvent(new CustomEvent('sushi-achievement-change',{detail:{imported:added}}));
    return {added,conflicts,rejected};
  }
  global.SushiAchievementLedger=Object.freeze({record,summary,legacyBaseline,exportBatch,importEvents});
})(window);
