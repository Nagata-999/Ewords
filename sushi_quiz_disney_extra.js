// Additional Disney animation questions. Choice order is shuffled by the shared quiz picker.
(()=>{
const EXTRA=undefined;
function merge(){if(typeof QUESTIONS==='undefined'||!Array.isArray(QUESTIONS))return false;const existing=new Set(QUESTIONS.map(q=>q.cat+'::'+q.q));const additions=EXTRA.filter(q=>!existing.has(q.cat+'::'+q.q));QUESTIONS.push(...additions);if(typeof renderCategoryCards==='function')['soloCatCards','localCatCards','onlineCatCards','buzzerCatCards'].forEach(renderCategoryCards);console.info('Disney quiz: added '+additions.length+' questions');return true;}
if(!merge())setTimeout(merge,500);
})();
