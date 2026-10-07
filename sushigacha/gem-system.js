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
  function awardGems(source,amount,awardId){
    source=String(source||'reward');amount=Math.max(0,Math.floor(Number(amount)||0));
    const ledger=read(),r=rewards(ledger),id=awardId?String(awardId):'';
    if(id&&r.awardIds.includes(id))return {gems:0,balance:balance(),duplicate:true};
    if(id){r.awardIds.push(id);if(r.awardIds.length>MAX_AWARD_IDS)r.awardIds.splice(0,r.awardIds.length-MAX_AWARD_IDS);}
    ledger.gems=(Number.isSafeInteger(ledger.gems)&&ledger.gems>=0?ledger.gems:0)+amount;
    addGemEvent(ledger,'earn',amount,source,id||'award-'+source+'-'+Date.now());
    write(ledger);
    window.dispatchEvent(new CustomEvent('sushi-gems-earned',{detail:{source,gems:amount,balance:ledger.gems}}));
    if(amount>0)window.dispatchEvent(new CustomEvent('sushi-avatar-reaction',{detail:{kind:'combo',text:`+${amount} GEM${amount===1?'':'S'}!`}}));
    return {gems:amount,balance:ledger.gems,duplicate:false};
  }
  function spendGems(source,amount,spendId){source=String(source||'spend');amount=Math.max(0,Math.floor(Number(amount)||0));const ledger=read(),current=Number.isSafeInteger(ledger.gems)&&ledger.gems>=0?ledger.gems:0;if(!amount||current<amount)return {spent:0,balance:current,ok:false};ledger.gems=current-amount;addGemEvent(ledger,'spend',amount,source,spendId);write(ledger);window.dispatchEvent(new CustomEvent('sushi-gems-spent',{detail:{source,gems:amount,balance:ledger.gems}}));return {spent:amount,balance:ledger.gems,ok:true};}
  window.SushiGem={awardScore,awardGems,spendGems,balance};

  // Shared visual feedback for every gem reward (daily quests, login bonuses,
  // lucky gems and game rewards). Kept here so all games get the same effect.
  function ensureGemFx(){
    if(document.getElementById('sushiGemFxStyle'))return;
    const st=document.createElement('style');st.id='sushiGemFxStyle';st.textContent=`
#sushiGemFx{position:fixed;left:50%;top:24%;z-index:2147483000;pointer-events:none;transform:translate(-50%,-50%);font-family:system-ui,-apple-system,'Segoe UI',sans-serif;text-align:center}
.sgf-pop{display:flex;align-items:center;gap:9px;padding:10px 18px;border-radius:999px;background:linear-gradient(135deg,#fffdf5ee,#fff5b9f2);border:2px solid #fff;box-shadow:0 8px 30px #4b2c0060,0 0 0 3px #f5c84255;color:#7a4b00;font-weight:1000;font-size:22px;white-space:nowrap;animation:sgfPop 1.45s cubic-bezier(.18,.9,.2,1) both;backdrop-filter:blur(5px)}
.sgf-pop b{font-size:28px;color:#e58a00;text-shadow:0 2px 0 #fff}
.sgf-gem{font-size:31px;filter:drop-shadow(0 3px 4px #3567a966);animation:sgfGem .55s ease-out both}
.sgf-spark{position:fixed;z-index:2147482999;pointer-events:none;font-size:17px;animation:sgfSpark .9s ease-out both}
@keyframes sgfPop{0%{opacity:0;transform:scale(.35) translateY(20px)}18%{opacity:1;transform:scale(1.13) translateY(0)}32%{transform:scale(1)}78%{opacity:1;transform:scale(1) translateY(0)}100%{opacity:0;transform:scale(.92) translateY(-25px)}}
@keyframes sgfGem{0%{transform:rotate(-25deg) scale(.2)}55%{transform:rotate(12deg) scale(1.28)}100%{transform:rotate(0) scale(1)}}
@keyframes sgfSpark{0%{opacity:1;transform:translate(0,0) scale(.4) rotate(0)}100%{opacity:0;transform:translate(var(--x),var(--y)) scale(1.1) rotate(180deg)}}
@media(prefers-reduced-motion:reduce){.sgf-pop,.sgf-gem,.sgf-spark{animation-duration:.01ms!important}}
`;document.head.appendChild(st);
  }
  function gemFx(amount){
    amount=Math.max(0,Math.floor(Number(amount)||0));if(!amount)return;
    ensureGemFx();document.getElementById('sushiGemFx')?.remove();
    const box=document.createElement('div');box.id='sushiGemFx';box.innerHTML=`<div class="sgf-pop"><span class="sgf-gem">💎</span><span>GEM <b>+${amount}</b></span></div>`;document.body.appendChild(box);
    const r=box.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
    for(let i=0;i<10;i++){const s=document.createElement('span');s.className='sgf-spark';s.textContent=i%3?'✨':'💎';s.style.left=cx+'px';s.style.top=cy+'px';const a=(Math.PI*2*i/10)+(Math.random()*.35-.175),d=45+Math.random()*65;s.style.setProperty('--x',Math.cos(a)*d+'px');s.style.setProperty('--y',Math.sin(a)*d+'px');document.body.appendChild(s);setTimeout(()=>s.remove(),950)}
    navigator.vibrate?.([18,28,35]);setTimeout(()=>box.remove(),1550);
  }
  window.addEventListener('sushi-gems-earned',e=>gemFx(e.detail?.gems));

  function loadOnce(match,src){
    if(document.querySelector(`script[src*="${match}"]`))return;
    const s=document.createElement('script');s.src=src;document.head.appendChild(s);
  }
  // Full-screen/action-heavy games such as Sushi Dungeon must not receive the
  // shared bottom taskbar. Gem and quest integration remain available.
  const inSushiDungeon=/\/sushidungeon(?:\/|$)/i.test(location.pathname);
  if(!inSushiDungeon)loadOnce('site-taskbar.js','/sushigacha/site-taskbar.js?v=20261008-3');
  loadOnce('daily-quest-click-bridge.js','/sushigacha/daily-quest-click-bridge.js?v=20261008-1');
  loadOnce('daily-quest-links.js','/sushigacha/daily-quest-links.js?v=20260914-1');
})();
