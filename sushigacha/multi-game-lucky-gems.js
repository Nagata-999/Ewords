'use strict';
(() => {
  if (window.__multiGameLuckyGemsLoaded) return;
  window.__multiGameLuckyGemsLoaded = true;

  const page = (location.pathname.split('/').pop() || '').toLowerCase();
  const source = page.replace(/\.html$/,'') || 'sushi-game';
  const session = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  let seq = 0, streak = 0, audioCtx = null, lastPointer = 0, lastAwardCheck = 0;
  const seen = new WeakSet();

  const style = document.createElement('style');
  style.textContent = `
    .multi-lucky-gem{position:fixed;left:50%;top:42%;z-index:999999;pointer-events:none;font:1000 30px/1 system-ui;color:#67e8f9;text-shadow:0 0 10px #fff,0 0 20px #22d3ee,0 3px 0 #0e7490;animation:multiLuckyPop 1s ease-out forwards;white-space:nowrap}
    .multi-lucky-gem.rainbow{color:#f5d0fe;text-shadow:0 0 10px #fff,0 0 22px #f472b6,0 0 34px #22d3ee}
    @keyframes multiLuckyPop{0%{opacity:0;transform:translate(-50%,-30%) scale(.55)}18%{opacity:1;transform:translate(-50%,-45%) scale(1.3)}100%{opacity:0;transform:translate(-50%,-150%) scale(.9)}}`;
  document.head.appendChild(style);

  function ensureAudio(){
    try{
      if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if(audioCtx.state === 'suspended') audioCtx.resume();
    }catch(_e){}
  }
  function chime(rainbow){
    ensureAudio(); if(!audioCtx) return;
    const now=audioCtx.currentTime;
    const notes=rainbow?[[1047,0],[1319,.055],[1568,.11],[2093,.17]]:[[988,0],[1319,.07],[1760,.14]];
    notes.forEach(([f,d])=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.setValueAtTime(f,now+d);g.gain.setValueAtTime(.001,now+d);g.gain.exponentialRampToValueAtTime(.08,now+d+.01);g.gain.exponentialRampToValueAtTime(.001,now+d+.13);o.connect(g);g.connect(audioCtx.destination);o.start(now+d);o.stop(now+d+.15)});
  }
  function show(amount,rainbow,bonusText=''){
    const el=document.createElement('div');
    el.className='multi-lucky-gem'+(rainbow?' rainbow':'');
    el.textContent=(rainbow?'🌈 JACKPOT! ':'💎 LUCKY! ')+`+${amount}`+(bonusText?` ${bonusText}`:'');
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),1050);
    chime(rainbow);
    navigator.vibrate?.(rainbow?[25,30,25,30,70]:[20,25,20]);
  }
  function award(amount,rainbow,bonusText=''){
    if(!window.SushiGem) return;
    window.SushiGem.awardScore(`lucky-${source}`,amount,`lucky-${source}:${session}:${++seq}`,1);
    show(amount,rainbow,bonusText);
  }
  function onCorrect(node){
    const now=performance.now();
    if(now-lastPointer>1800 || now-lastAwardCheck<420) return;
    if(node && seen.has(node)) return;
    if(node) seen.add(node);
    lastAwardCheck=now;
    streak++;
    const boost=Math.min(2,1+Math.floor(streak/10)*0.25);
    const r=Math.random();
    const rainbowChance=.004*boost;
    const normalChance=.04*boost;
    if(r<rainbowChance) award(5,true,streak>=10?`STREAK x${streak}`:'');
    else if(r<rainbowChance+normalChance) award(1,false,streak>=10?`STREAK x${streak}`:'');
  }
  function onWrong(){streak=0;}
  function inspect(node){
    if(!(node instanceof Element)) return;
    const correct = node.matches?.('.choice.correct,.word-btn.correct,.resultBox.ok,.correct-flash,.good') ? node : node.querySelector?.('.choice.correct,.word-btn.correct,.resultBox.ok,.correct-flash,.good');
    if(correct) onCorrect(correct);
    const wrong = node.matches?.('.choice.wrong,.word-btn.wrong,.resultBox.no,.wrong-flash,.bad') ? node : node.querySelector?.('.choice.wrong,.word-btn.wrong,.resultBox.no,.wrong-flash,.bad');
    if(wrong) onWrong();
  }

  document.addEventListener('pointerdown',()=>{lastPointer=performance.now();ensureAudio()},{capture:true});
  document.addEventListener('keydown',()=>{lastPointer=performance.now();ensureAudio()},{capture:true});

  new MutationObserver(ms=>{
    for(const m of ms){
      if(m.type==='attributes') inspect(m.target);
      for(const n of m.addedNodes||[]) inspect(n);
    }
  }).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
})();
