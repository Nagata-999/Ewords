// Sushi Quiz expansion entrypoint.
// This URL is already loaded by older cached versions of the shared quiz loader.
(() => {
  if (window.__sushiQuizBankEntrypointStarted) return;
  window.__sushiQuizBankEntrypointStarted = true;

  const load = (src) => new Promise((resolve,reject) => {
    const s=document.createElement('script');
    s.src=src;
    s.async=false;
    s.onload=resolve;
    s.onerror=reject;
    document.head.appendChild(s);
  });

  (async()=>{
    try{
      await load('/sushi_quiz_math_literature_bank.js?v=20260915-1');
      await load('/sushi_quiz_classical_music.js?v=20260915-2');
      if(typeof renderCategoryCards==='function'){
        ['soloCatCards','localCatCards','onlineCatCards','buzzerCatCards'].forEach(renderCategoryCards);
      }
      console.info(`Sushi Quiz banks loaded. Total questions: ${typeof QUESTIONS!=='undefined' ? QUESTIONS.length : 'unknown'}`);
    }catch(err){
      console.warn('Sushi Quiz bank loading failed:',err);
    }
  })();
})();
