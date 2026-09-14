// Sushi Quiz expansion entrypoint.
// Kept at this stable URL because older cached shared loaders already request it.
(() => {
  if (window.__sushiQuizBankEntrypointStarted) return;
  window.__sushiQuizBankEntrypointStarted = true;

  const VERSION='20260915-4';
  const load = (src) => new Promise((resolve,reject) => {
    const s=document.createElement('script');
    s.src=src;
    s.async=false;
    s.onload=resolve;
    s.onerror=reject;
    document.head.appendChild(s);
  });

  function mergeExtra(){
    if(typeof QUESTIONS==='undefined' || !Array.isArray(QUESTIONS)) return 0;
    if(typeof SUSHI_QUIZ_EXTRA_QUESTIONS==='undefined' || !Array.isArray(SUSHI_QUIZ_EXTRA_QUESTIONS)) return 0;
    const existing=new Set(QUESTIONS.map(q=>`${q.cat}::${q.q}`));
    const additions=SUSHI_QUIZ_EXTRA_QUESTIONS.filter(q=>!existing.has(`${q.cat}::${q.q}`));
    QUESTIONS.push(...additions);
    window.__sushiQuizExtraQuestionsLoaded=true;
    return additions.length;
  }

  function refresh(){
    if(typeof renderCategoryCards==='function'){
      ['soloCatCards','localCatCards','onlineCatCards','buzzerCatCards'].forEach(renderCategoryCards);
    }
  }

  (async()=>{
    const results=[];
    try{
      if(typeof SUSHI_QUIZ_EXTRA_QUESTIONS==='undefined'){
        try{ await load(`/sushi_quiz_extra_questions.js?v=${VERSION}`); results.push('extra:loaded'); }
        catch(err){ results.push('extra:error'); console.warn('Extra bank failed',err); }
      }
      const extraAdded=mergeExtra();
      results.push(`extra:+${extraAdded}`);

      try{ await load(`/sushi_quiz_math_literature_bank.js?v=${VERSION}`); results.push('math-lit:ok'); }
      catch(err){ results.push('math-lit:error'); console.warn('Math/literature bank failed',err); }

      try{ await load(`/sushi_quiz_classical_music.js?v=${VERSION}`); results.push('classical:ok'); }
      catch(err){ results.push('classical:error'); console.warn('Classical music bank failed',err); }

      refresh();
      window.__sushiQuizBankEntrypointLoaded=true;
      console.info(`Sushi Quiz banks loaded. ${results.join(' / ')} / Total ${typeof QUESTIONS!=='undefined' ? QUESTIONS.length : 'unknown'}`);
    }catch(err){
      console.warn('Sushi Quiz bank loading failed:',err);
    }
  })();
})();
