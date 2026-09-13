'use strict';
(() => {
  if (window.__sushiDungeonGemChestLoaded) return;
  window.__sushiDungeonGemChestLoaded = true;

  const choices = document.getElementById('wordChoices');
  const message = document.getElementById('message');
  if (!choices || !message) return;

  const session = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  let seq = 0, audioCtx = null, locked = false;

  const style = document.createElement('style');
  style.textContent = `
    .dungeon-gem-drop{position:fixed;left:50%;top:38%;z-index:99999;pointer-events:none;white-space:nowrap;font:1000 30px/1 system-ui;color:#67e8f9;text-shadow:0 0 9px #fff,0 0 20px #22d3ee,0 4px 0 #0e7490;animation:dungeonGemPop 1.15s ease-out forwards}
    .dungeon-gem-drop.rare{color:#fde68a;text-shadow:0 0 10px #fff,0 0 22px #f59e0b,0 4px 0 #92400e}
    .dungeon-gem-drop.rainbow{font-size:34px;color:#f5d0fe;text-shadow:0 0 10px #fff,0 0 20px #f472b6,0 0 34px #22d3ee}
    @keyframes dungeonGemPop{0%{opacity:0;transform:translate(-50%,-20%) scale(.5)}18%{opacity:1;transform:translate(-50%,-45%) scale(1.28)}65%{opacity:1;transform:translate(-50%,-75%) scale(1)}100%{opacity:0;transform:translate(-50%,-155%) scale(.9)}}`;
  document.head.appendChild(style);

  function ensureAudio(){
    try{
      if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
      if(audioCtx.state==='suspended') audioCtx.resume();
    }catch(_e){}
  }
  function chime(tier){
    ensureAudio(); if(!audioCtx) return;
    const now=audioCtx.currentTime;
    const notes=tier==='rainbow'?[[988,0],[1319,.055],[1760,.11],[2093,.17],[2637,.23]]:tier==='rare'?[[880,0],[1175,.07],[1568,.14],[1976,.21]]:[[784,0],[1047,.08],[1397,.16]];
    notes.forEach(([f,d])=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.setValueAtTime(f,now+d);g.gain.setValueAtTime(.001,now+d);g.gain.exponentialRampToValueAtTime(.085,now+d+.01);g.gain.exponentialRampToValueAtTime(.001,now+d+.14);o.connect(g);g.connect(audioCtx.destination);o.start(now+d);o.stop(now+d+.16)});
  }
  function show(amount,tier){
    const el=document.createElement('div');
    el.className=`dungeon-gem-drop ${tier==='rainbow'?'rainbow':tier==='rare'?'rare':''}`;
    el.textContent=tier==='rainbow'?`🌈 RAINBOW CHEST! +${amount}💎`:tier==='rare'?`✨ GEM CHEST! +${amount}💎`:`💎 TREASURE! +${amount}`;
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),1200);
    chime(tier);
    navigator.vibrate?.(tier==='rainbow'?[30,30,30,30,80]:tier==='rare'?[25,30,50]:[20,25,20]);
  }
  function award(amount,tier){
    if(!window.SushiGem) return;
    window.SushiGem.awardScore('sushidungeon-chest',amount,`sushidungeon-chest:${session}:${++seq}`,1);
    show(amount,tier);
  }
  function roll(){
    const r=Math.random();
    if(r<.01) award(10,'rainbow');
    else if(r<.06) award(3,'rare');
    else if(r<.26) award(1,'normal');
  }

  choices.addEventListener('pointerdown',ensureAudio,{capture:true});
  choices.addEventListener('click',e=>{
    const btn=e.target.closest('button');
    if(!btn || locked) return;
    locked=true;
    setTimeout(()=>{
      const text=(message.textContent||'').trim();
      if(text.startsWith('正解！')) roll();
      setTimeout(()=>{locked=false},500);
    },40);
  },{capture:false});
})();
