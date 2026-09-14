// Sushi Quiz latest expansion loader — 2026-09-15
(() => {
 if(window.__sushiQuizLatestLoaderStarted) return;
 window.__sushiQuizLatestLoaderStarted=true;
 const V='20260915-modern-1';
 const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});
 (async()=>{
   for(const file of ['sushi_quiz_modern_world.js','sushi_quiz_current_companies.js']){
     try{await load(`/${file}?v=${V}`);}catch(e){console.warn(`Sushi Quiz: failed to load ${file}`,e);}
   }
   if(typeof renderCategoryCards==='function') ['soloCatCards','localCatCards','onlineCatCards','buzzerCatCards'].forEach(renderCategoryCards);
   console.info(`Sushi Quiz latest expansion loaded. Total ${typeof QUESTIONS!=='undefined'?QUESTIONS.length:'unknown'}.`);
 })();
})();