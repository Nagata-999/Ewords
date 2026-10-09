'use strict';
(() => {
  if (window.SushiGem) return;
  const LEDGER='sushitan_login_bonus_v1';
  const MAX_AWARD_IDS=120;
  const MAX_GEM_EVENTS=1000;

  function read(){
    try{
      const raw=localStorage.getItem(LEDGER);
      const ledger=raw?JSON.parse(raw):{};
      if(!ledger||typeof ledger!=='object'||Array.isArray(ledger))return {gems:0};
      return ledger;
    }catch(_e){return {gems:0};}
  }
  function write(ledger){localStorage.setItem(LEDGER,JSON.stringify(ledger));}
  function rewards(ledger){
    if(!ledger.gemRewards||typeof ledger.gemRewards!=='object'||Array.isArray(ledger.gemRewards))ledger.gemRewards={};
    if(!ledger.gemRewards.sources||typeof ledger.gemRewards.sources!=='object')ledger.gemRewards.sources={};
    if(!Array.isArray(ledger.gemRewards.awardIds))ledger.gemRewards.awardIds=[];
    return ledger.gemRewards;
  }
  function gemEvents(ledger){if(!Array.isArray(ledger.gemEvents))ledger.gemEvents=[];return ledger.gemEvents;}
  function addGemEvent(ledger,type,amount,source,id){amount=Math.max(0,Math.floor(Number(amount)||0));if(!amount)return;const events=gemEvents(ledger),eid=String(id||((globalThis.crypto?.randomUUID?.())||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)));if(events.some(e=>e?.id===eid))return;events.push({id:eid,type,amount,source:String(source||''),at:Date.now()});if(events.length>MAX_GEM_EVENTS)events.splice(0,events.length-MAX_GEM_EVENTS);}
  function balance(){const ledger=read();return Number.isSafeInteger(ledger.gems)&&ledger.gems>=0?ledger.gems:0;}
  function awardScore(source,score,awardId,pointsPerGem=100){
    source=String(source||'game');score=Math.max(0,Math.floor(Number(score)||0));pointsPerGem=Math.max(1,Math.floor(Number(pointsPerGem)||100));
    const ledger=read(),r=rewards(ledger),id=awardId?String(awardId):'';
    if(id&&r.awardIds.includes(id))return {gems:0,remainder:r.sources[source]?.remainder||0,balance:balance(),duplicate:true};
    const src=r.sources[source]&&typeof r.sources[source]==='object'?r.sources[source]:{remainder:0,totalScore:0,totalGems:0};
    const previous=Math.max(0,Math.floor(Number(src.remainder)||0));
    const total=previous+score,gems=Math.floor(total/pointsPerGem),remainder=total%pointsPerGem;
    src.remainder=remainder;src.totalScore=Math.max(0,Math.floor(Number(src.totalScore)||0))+score;src.totalGems=Math.max(0,Math.floor(Number(src.totalGems)||0))+gems;
    r.sources[source]=src;
    if(id){r.awardIds.push(id);if(r.awardIds.length>MAX_AWARD_IDS)r.awardIds.splice(0,r.awardIds.length-MAX_AWARD_IDS);}
    ledger.gems=(Number.isSafeInteger(ledger.gems)&&ledger.gems>=0?ledger.gems:0)+gems;
    addGemEvent(ledger,'earn',gems,source,id||'score-'+source+'-'+Date.now());
    write(ledger);
    window.dispatchEvent(new CustomEvent('sushi-gems-earned',{detail:{source,score,gems,remainder,balance:ledger.gems}}));
    if(gems>0)window.dispatchEvent(new CustomEvent('sushi-avatar-reaction',{detail:{kind:'combo',text:`+${gems} GEM${gems===1?'':'S'}!`}}));
    return {gems,remainder,balance:ledger.gems,duplicate:false};
  }
  function awardGems(source,amount,awardId,{origin}={}){
    source=String(source||'reward');amount=Math.max(0,Math.floor(Number(amount)||0));
    const ledger=read(),r=rewards(ledger),id=awardId?String(awardId):'';
    if(id&&r.awardIds.includes(id))return {gems:0,balance:balance(),duplicate:true};
    if(id){r.awardIds.push(id);if(r.awardIds.length>MAX_AWARD_IDS)r.awardIds.splice(0,r.awardIds.length-MAX_AWARD_IDS);}
    ledger.gems=(Number.isSafeInteger(ledger.gems)&&ledger.gems>=0?ledger.gems:0)+amount;
    addGemEvent(ledger,'earn',amount,source,id||'award-'+source+'-'+Date.now());
    write(ledger);
    window.dispatchEvent(new CustomEvent('sushi-gems-earned',{detail:{source,gems:amount,balance:ledger.gems,origin}}));
    if(amount>0)window.dispatchEvent(new CustomEvent('sushi-avatar-reaction',{detail:{kind:'combo',text:`+${amount} GEM${amount===1?'':'S'}!`}}));
    return {gems:amount,balance:ledger.gems,duplicate:false};
  }
  function spendGems(source,amount,spendId){source=String(source||'spend');amount=Math.max(0,Math.floor(Number(amount)||0));const ledger=read(),current=Number.isSafeInteger(ledger.gems)&&ledger.gems>=0?ledger.gems:0;if(!amount||current<amount)return {spent:0,balance:current,ok:false};ledger.gems=current-amount;addGemEvent(ledger,'spend',amount,source,spendId);write(ledger);window.dispatchEvent(new CustomEvent('sushi-gems-spent',{detail:{source,gems:amount,balance:ledger.gems,origin}}));return {spent:amount,balance:ledger.gems,ok:true};}
  window.SushiGem={awardScore,awardGems,spendGems,balance};

  // Taskbar-only pages also award gems. Load visuals independently of the
  // accounting API, and retain rewards received while the script is loading.
  function loadGemEffects(){
    if(window.SushiGemFx||window.__sushiGemFxLoading)return;
    window.__sushiGemFxLoading=true;
    let pending=0, pendingOrigin;
    const remember=e=>{pending+=Math.max(0,Math.floor(Number(e.detail?.gems)||0));if(e.detail?.origin)pendingOrigin=e.detail.origin;};
    window.addEventListener('sushi-gems-earned',remember);
    const script=document.createElement('script');
    script.src='/sushigacha/gem-effects.js?v=20261009-23';
    const finish=()=>{window.removeEventListener('sushi-gems-earned',remember);window.__sushiGemFxLoading=false;};
    script.onload=()=>{finish();if(pending)window.SushiGemFx?.play(pending,pendingOrigin);};
    script.onerror=()=>{finish();script.remove();};
    document.head.appendChild(script);
  }
  loadGemEffects();

  function loadOnce(match,src){
    if(document.querySelector(`script[src*="${match}"]`))return;
    const s=document.createElement('script');s.src=src;document.head.appendChild(s);
  }
  // Full-screen/action-heavy games such as Sushi Dungeon must not receive the
  // shared bottom taskbar. Gem and quest integration remain available.
  const inSushiDungeon=/\/sushidungeon(?:\/|$)/i.test(location.pathname);
  if(!inSushiDungeon)loadOnce('site-taskbar.js','/sushigacha/site-taskbar.js?v=20261009-23');
  loadOnce('daily-quest-click-bridge.js','/sushigacha/daily-quest-click-bridge.js?v=20261008-1');
  loadOnce('daily-quest-links.js','/sushigacha/daily-quest-links.js?v=20261009-23');
})();
