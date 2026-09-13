'use strict';
(() => {
  if (window.__sushiRunGemPickupsLoaded) return;
  window.__sushiRunGemPickupsLoaded = true;

  const road=document.getElementById('road');
  const player=document.getElementById('player');
  const distanceEl=document.getElementById('distance');
  const overlay=document.getElementById('overlay');
  if(!road||!player||!distanceEl) return;

  const session=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  const laneLeft=[1,34.333,67.666];
  let nextSpawn=1000;
  let active=null;
  let lastDistance=0;
  let raf=0;
  let seq=0;
  let audioCtx=null;

  const style=document.createElement('style');
  style.textContent=`
    .run-gem-pickup{position:absolute;top:90px;width:31%;height:64px;z-index:20;display:flex;align-items:center;justify-content:center;pointer-events:none;filter:drop-shadow(0 0 14px rgba(34,211,238,.95));}
    .run-gem-pickup .gem-cluster{position:relative;width:54px;height:48px;animation:gemFloat .55s ease-in-out infinite alternate}
    .run-gem-pickup .gem{position:absolute;font-size:30px;line-height:1;text-shadow:0 0 12px #67e8f9,0 0 22px #22d3ee;}
    .run-gem-pickup .gem.g1{left:2px;top:8px;transform:rotate(-10deg)}
    .run-gem-pickup .gem.g2{right:2px;top:0;transform:rotate(10deg)}
    .run-gem-collect{position:fixed;left:50%;top:50%;z-index:99999;pointer-events:none;font:1000 28px/1 system-ui,sans-serif;color:#67e8f9;text-shadow:0 2px 0 #0e7490,0 0 18px #22d3ee;animation:gemCollect .9s ease-out forwards}
    .run-gem-ring{position:absolute;width:26px;height:26px;border:4px solid #67e8f9;border-radius:50%;pointer-events:none;z-index:80;animation:gemRing .55s ease-out forwards}
    @keyframes gemFloat{from{transform:translateY(-3px) scale(.96)}to{transform:translateY(3px) scale(1.04)}}
    @keyframes gemCollect{0%{opacity:0;transform:translate(-50%,-50%) scale(.55)}20%{opacity:1;transform:translate(-50%,-60%) scale(1.22)}100%{opacity:0;transform:translate(-50%,-140%) scale(.9)}}
    @keyframes gemRing{0%{opacity:1;transform:translate(-50%,-50%) scale(.4)}100%{opacity:0;transform:translate(-50%,-50%) scale(3.1)}}
  `;
  document.head.appendChild(style);

  function getDistance(){const m=(distanceEl.textContent||'').match(/(\d+)/);return m?Number(m[1]):0;}
  function isGameRunning(){return overlay ? getComputedStyle(overlay).display==='none' : true;}
  function laneFromPlayer(){
    const rr=road.getBoundingClientRect(), pr=player.getBoundingClientRect();
    const center=pr.left+pr.width/2-rr.left;
    return Math.max(0,Math.min(2,Math.floor(center/(rr.width/3))));
  }
  function ensureAudio(){try{if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();}catch(_e){}}
  function chime(){
    ensureAudio(); if(!audioCtx)return;
    const now=audioCtx.currentTime;
    [[880,0],[1174,.07],[1568,.14]].forEach(([freq,delay])=>{
      const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.setValueAtTime(freq,now+delay);g.gain.setValueAtTime(.001,now+delay);g.gain.exponentialRampToValueAtTime(.085,now+delay+.01);g.gain.exponentialRampToValueAtTime(.001,now+delay+.12);o.connect(g);g.connect(audioCtx.destination);o.start(now+delay);o.stop(now+delay+.14);
    });
  }
  function spawn(milestone){
    if(active) active.el.remove();
    const lane=Math.floor(Math.random()*3);
    const el=document.createElement('div');
    el.className='run-gem-pickup';
    el.style.left=laneLeft[lane]+'%';
    el.style.top='96px';
    el.innerHTML='<div class="gem-cluster"><span class="gem g1">💎</span><span class="gem g2">💎</span></div>';
    road.appendChild(el);
    active={el,lane,y:96,milestone,collected:false};
  }
  function intersects(a,b){const r1=a.getBoundingClientRect(),r2=b.getBoundingClientRect(),pad=8;return !(r1.right<r2.left+pad||r1.left>r2.right-pad||r1.bottom<r2.top+pad||r1.top>r2.bottom-pad);}
  function awardTwo(milestone){
    if(!window.SushiGem)return;
    const id=`sushirun-pickup:${session}:${++seq}:${milestone}`;
    window.SushiGem.awardScore('sushirun-pickup',2,id,1);
  }
  function collect(){
    if(!active||active.collected)return;
    active.collected=true;
    const r=active.el.getBoundingClientRect();
    const ring=document.createElement('div'); ring.className='run-gem-ring'; ring.style.left=(r.left+r.width/2)+'px'; ring.style.top=(r.top+r.height/2)+'px'; document.body.appendChild(ring);setTimeout(()=>ring.remove(),600);
    const t=document.createElement('div');t.className='run-gem-collect';t.textContent='💎 +2';document.body.appendChild(t);setTimeout(()=>t.remove(),950);
    chime();
    if(navigator.vibrate) navigator.vibrate([22,32,22]);
    awardTwo(active.milestone);
    active.el.remove();active=null;
  }
  function reset(){if(active){active.el.remove();active=null;}nextSpawn=1000;lastDistance=0;}
  function tick(){
    raf=requestAnimationFrame(tick);
    const d=getDistance();
    if(!isGameRunning()){
      if(d===0&&lastDistance>0) reset();
      lastDistance=d;return;
    }
    if(d<lastDistance-100) reset();
    lastDistance=d;
    while(d>=nextSpawn){spawn(nextSpawn);nextSpawn+=1000;}
    if(active){
      const rr=road.getBoundingClientRect();
      const speed=3.2+Math.min(5,d/4500);
      active.y+=speed;
      active.el.style.top=active.y+'px';
      if(active.lane===laneFromPlayer()&&intersects(active.el,player)) collect();
      else if(active.y>rr.height+90){active.el.remove();active=null;}
    }
  }
  window.addEventListener('pointerdown',ensureAudio,{once:true});
  window.addEventListener('keydown',ensureAudio,{once:true});
  raf=requestAnimationFrame(tick);
})();
