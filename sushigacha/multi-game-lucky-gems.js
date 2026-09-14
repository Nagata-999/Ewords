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

// Sushi Quiz ranking message dedupe fix.
(() => {
  if (!/sushi_quiz\.html$/i.test(location.pathname)) return;
  function clearRankingChase(tableId){
    const table=document.getElementById(tableId);
    if(!table || !table.parentNode) return;
    [...table.parentNode.children].forEach(el=>{
      if(el!==table && el.classList?.contains('chase-message') && el.classList.contains('hot')) el.remove();
    });
  }
  const previousOnlineRanking=window.showOnlineRanking;
  if(typeof previousOnlineRanking==='function'){
    window.showOnlineRanking=function(...args){
      clearRankingChase('onlineTable');
      return previousOnlineRanking.apply(this,args);
    };
  }
  const previousBuzzerRanking=window.showBuzzerRanking;
  if(typeof previousBuzzerRanking==='function'){
    window.showBuzzerRanking=async function(...args){
      clearRankingChase('buzzerRankTable');
      return await previousBuzzerRanking.apply(this,args);
    };
  }
})();

// Sushi Quiz: independent bank loading, weighted selection, and visible diagnostics.
(() => {
  if (!/sushi_quiz\.html$/i.test(location.pathname)) return;
  if (window.__sushiQuizReliableLoaderStarted) return;
  window.__sushiQuizReliableLoaderStarted = true;

  const VERSION='20260915-4';
  const bankState={extra:'loading',mathLiterature:'loading',classical:'loading'};

  const refreshCards=()=>{
    if(typeof renderCategoryCards==='function'){
      ['soloCatCards','localCatCards','onlineCatCards','buzzerCatCards'].forEach(renderCategoryCards);
    }
  };

  const countCat=(name)=>{
    try{return Array.isArray(QUESTIONS)?QUESTIONS.filter(q=>q.cat===name).length:0}catch(_e){return 0}
  };

  const musicCount=()=>{
    try{
      if(!Array.isArray(QUESTIONS)) return 0;
      return QUESTIONS.filter(q=>/music|instrument/i.test(q.cat||'')).length;
    }catch(_e){return 0}
  };

  function renderDiagnostics(){
    if(typeof QUESTIONS==='undefined' || !Array.isArray(QUESTIONS)) return;
    let el=document.getElementById('quizBankDiagnostics');
    if(!el){
      const target=document.querySelector('#soloSetup .notice') || document.getElementById('soloSetup');
      if(!target) return;
      el=document.createElement('div');
      el.id='quizBankDiagnostics';
      el.style.cssText='margin-top:10px;padding:9px 12px;border-radius:12px;background:#ecfeff;border:1px solid #67e8f9;color:#155e75;font:900 13px/1.45 system-ui';
      target.insertAdjacentElement('afterend',el);
    }
    const status=Object.entries(bankState).map(([k,v])=>`${k}:${v==='ok'?'✓':v==='loading'?'…':'×'}`).join(' / ');
    el.textContent=`BANK CHECK  Total ${QUESTIONS.length}｜Math ${countCat('Math')}｜Literature ${countCat('Literature')}｜Music ${musicCount()}｜${status}`;
  }

  function loadScriptOnce(id,src){
    return new Promise((resolve,reject)=>{
      const old=document.getElementById(id);
      if(old){
        if(old.dataset.loaded==='1') return resolve();
        old.addEventListener('load',()=>resolve(),{once:true});
        old.addEventListener('error',()=>reject(new Error(src)),{once:true});
        return;
      }
      const s=document.createElement('script');
      s.id=id;
      s.src=src;
      s.async=false;
      s.onload=()=>{s.dataset.loaded='1';resolve();};
      s.onerror=()=>reject(new Error(src));
      document.head.appendChild(s);
    });
  }

  function installWeightedPick(){
    if(typeof QUESTIONS==='undefined' || !Array.isArray(QUESTIONS)) return;
    const fallbackWeights={
      'Anime & Manga':4,'Popular Music':4,'Music History':4,'Music':4,'Classical Music':4,
      'Musical Instruments':4,'Disney':3,'World Capitals':2,'Retro Games':3,
      'Sports General':3,'Western Movies':3,'Math':2,'Literature':2,'World Literature':2
    };
    window.pick=function(cat,used=[]){
      let sourcePool;
      if(Array.isArray(cat)) sourcePool=QUESTIONS.filter(q=>cat.includes(q.cat));
      else sourcePool=QUESTIONS.filter(q=>cat==='Random' || q.cat===cat);
      let available=sourcePool.filter(q=>!used.includes(q.q));
      if(!available.length) available=sourcePool;
      if(!available.length) return undefined;

      const weighted=[];
      available.forEach(q=>{
        let w=fallbackWeights[q.cat]||1;
        try{ if(typeof CATEGORY_WEIGHTS!=='undefined' && CATEGORY_WEIGHTS[q.cat]) w=CATEGORY_WEIGHTS[q.cat]; }catch(_e){}
        for(let i=0;i<w;i++) weighted.push(q);
      });
      return weighted[Math.floor(Math.random()*weighted.length)] || available[Math.floor(Math.random()*available.length)];
    };
    window.__sushiQuizWeightedPickInstalled=true;
  }

  async function loadBank(key,id,src){
    try{
      await loadScriptOnce(id,src);
      bankState[key]='ok';
    }catch(err){
      bankState[key]='error';
      console.warn(`Sushi Quiz bank failed: ${src}`,err);
    }
    refreshCards();
    installWeightedPick();
    renderDiagnostics();
  }

  const start=()=>{
    if(typeof QUESTIONS==='undefined' || !Array.isArray(QUESTIONS)){
      setTimeout(start,120);
      return;
    }

    installWeightedPick();
    renderDiagnostics();

    // All banks load independently: one failure cannot block the others.
    loadBank('extra','sq-bank-extra',`/sushi_quiz_extra_questions.js?v=${VERSION}`);
    loadBank('mathLiterature','sq-bank-math-lit',`/sushi_quiz_math_literature.js?v=${VERSION}`);
    loadBank('classical','sq-bank-classical',`/sushi_quiz_classical_music.js?v=${VERSION}`);

    // Refresh diagnostics once more after nested entrypoint scripts have had time to merge.
    setTimeout(()=>{refreshCards();installWeightedPick();renderDiagnostics();},700);
    setTimeout(()=>{refreshCards();installWeightedPick();renderDiagnostics();},1800);
  };

  start();
})();
