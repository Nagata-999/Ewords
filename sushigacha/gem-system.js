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

  // Visuals never change the ledger: saving and balance updates stay immediate.
  const motionQuery=window.matchMedia('(prefers-reduced-motion: reduce)');
  const flights=new Set(), impacts=new Set();
  const MAX_FLIGHTS=18;
  let lastPointer=null, noticeTimer=0, noticeAmount=0;
  window.addEventListener('pointerdown',e=>{
    lastPointer={x:e.clientX,y:e.clientY,at:performance.now()};
  },{capture:true,passive:true});
  window.addEventListener('keydown',()=>{lastPointer=null;},{capture:true});

  function ensureGemFx(){
    if(document.getElementById('sushiGemFxStyle'))return;
    const st=document.createElement('style');st.id='sushiGemFxStyle';st.textContent=`
#sushiGemFx{position:fixed;left:50%;top:24%;z-index:2147483000;pointer-events:none;transform:translate(-50%,-50%);font:800 17px/1.4 system-ui,-apple-system,'Segoe UI',sans-serif;white-space:nowrap;color:#075985;background:#f0fbffff;border:1px solid #a5e2f5;border-radius:999px;padding:9px 16px;box-shadow:0 6px 24px #07598526}
.sgf-flight{position:fixed;left:0;top:0;width:28px;height:28px;display:grid;place-items:center;z-index:2147482999;pointer-events:none;font-size:25px;line-height:1;filter:drop-shadow(0 0 5px #38bdf888);will-change:transform,opacity}
.sgf-flight::after{content:'';position:absolute;inset:6px;border-radius:50%;background:#7dd3fc;filter:blur(7px);z-index:-1}
.sgf-arrival{position:fixed;width:30px;height:30px;border:2px solid #38bdf8;border-radius:50%;z-index:2147482999;pointer-events:none;box-shadow:0 0 10px #7dd3fc99}
`;document.head.appendChild(st);
  }
  function gemTarget(){
    const balance=document.getElementById('sushiBarGems');
    const el=balance?.closest('.mini')||balance;
    if(!el)return null;
    const r=el.getBoundingClientRect();
    if(!r.width||!r.height||r.bottom<0||r.top>innerHeight)return null;
    return {el,x:r.left+r.width/2,y:r.top+r.height/2};
  }
  function originPoint(){
    let x=innerWidth/2,y=innerHeight*.35;
    if(lastPointer&&performance.now()-lastPointer.at<1200){({x,y}=lastPointer);}
    else{
      const active=document.activeElement;
      if(active?.matches('button,a,input')){
        const r=active.getBoundingClientRect();
        if(r.width&&r.height&&r.top>=0&&r.bottom<=innerHeight){x=r.left+r.width/2;y=r.top+r.height/2;}
      }
    }
    return {x:Math.max(24,Math.min(innerWidth-24,x)),y:Math.max(60,Math.min(innerHeight-100,y))};
  }
  function showGemNotice(amount,origin){
    clearTimeout(noticeTimer);
    let box=document.getElementById('sushiGemFx');
    if(!box){
      noticeAmount=0;box=document.createElement('div');box.id='sushiGemFx';
      box.setAttribute('role','status');box.setAttribute('aria-live','polite');box.setAttribute('aria-atomic','true');
      document.body.appendChild(box);
    }
    noticeAmount+=amount;
    box.textContent=`💎 +${noticeAmount.toLocaleString()} ジェム`;
    box.style.top=Math.max(40,origin.y-48)+'px';
    const half=box.getBoundingClientRect().width/2+12;
    box.style.left=Math.max(half,Math.min(innerWidth-half,origin.x))+'px';
    noticeTimer=setTimeout(()=>{box.remove();noticeAmount=0;},1600);
  }
  function arrival(){
    const target=gemTarget();if(!target||motionQuery.matches)return;
    // Each incoming gem gives the destination a small "pop", without delaying
    // the real balance or animating the navigation link's hit area.
    target.el.getAnimations().filter(a=>a.id==='sushi-gem-arrival').forEach(a=>a.cancel());
    target.el.animate([
      {transform:'scale(1)',color:'#0284c7'},
      {transform:'scale(1.35)',color:'#0284c7',offset:.35},
      {transform:'scale(1)',color:'#0284c7'}
    ],{id:'sushi-gem-arrival',duration:210,easing:'ease-out'});
    const ring=document.createElement('span');ring.className='sgf-arrival';ring.setAttribute('aria-hidden','true');
    ring.style.left=(target.x-15)+'px';ring.style.top=(target.y-15)+'px';document.body.appendChild(ring);
    const animation=ring.animate([{transform:'scale(.4)',opacity:.9},{transform:'scale(1.7)',opacity:0}],{duration:280,easing:'ease-out'});
    const item={el:ring,animation};impacts.add(item);
    const clean=()=>{ring.remove();impacts.delete(item);};animation.finished.then(clean,clean);
  }
  function flyGem(origin,target,index){
    const el=document.createElement('span');el.className='sgf-flight';el.textContent='💎';el.setAttribute('aria-hidden','true');
    document.body.appendChild(el);
    const spread=(index%2?1:-1)*(32+(index%4)*16);
    const p1={x:Math.max(18,Math.min(innerWidth-18,origin.x+spread)),y:Math.max(20,origin.y-100-index%3*18)};
    const p2={x:target.x+spread*.55,y:Math.max(20,target.y-110)};
    const frames=Array.from({length:25},(_,i)=>{
      const t=i/24,u=1-t;
      const x=u*u*u*origin.x+3*u*u*t*p1.x+3*u*t*t*p2.x+t*t*t*target.x;
      const y=u*u*u*origin.y+3*u*u*t*p1.y+3*u*t*t*p2.y+t*t*t*target.y;
      const scale=t<.16?.45+t*3.5:1.01-(t-.16)*.82;
      return {offset:t,transform:`translate(${x-14}px,${y-14}px) scale(${scale}) rotate(${spread*(1-t)}deg)`,opacity:t<.1?t*10:t>.9?(1-t)*10:1};
    });
    const animation=el.animate(frames,{duration:680+(index%3)*30,delay:100+index*65,easing:'cubic-bezier(.35,0,.65,1)',fill:'both'});
    const item={el,animation};flights.add(item);
    const clean=()=>{el.remove();flights.delete(item);};
    animation.finished.then(()=>{clean();arrival();},clean);
  }
  function clearFlights(){
    for(const item of [...flights,...impacts]){item.animation.cancel();item.el.remove();}
    flights.clear();impacts.clear();
    const target=gemTarget();target?.el.getAnimations().filter(a=>a.id==='sushi-gem-arrival').forEach(a=>a.cancel());
  }
  function gemFx(amount){
    amount=Math.max(0,Math.floor(Number(amount)||0));if(!amount||document.hidden)return;
    ensureGemFx();const origin=originPoint();showGemNotice(amount,origin);
    const target=gemTarget();
    // Full-screen games without a taskbar and reduced-motion users keep a
    // readable, static reward notice instead of a flight to an invented target.
    if(!target||motionQuery.matches||!Element.prototype.animate)return;
    const count=Math.min(amount,12,MAX_FLIGHTS-flights.size);
    for(let i=0;i<count;i++)flyGem(origin,target,i);
  }
  window.addEventListener('sushi-gems-earned',e=>gemFx(e.detail?.gems));
  window.addEventListener('resize',clearFlights,{passive:true});
  window.addEventListener('pagehide',clearFlights);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clearFlights();clearTimeout(noticeTimer);document.getElementById('sushiGemFx')?.remove();noticeAmount=0;}});
  motionQuery.addEventListener('change',()=>{if(motionQuery.matches)clearFlights();});


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
