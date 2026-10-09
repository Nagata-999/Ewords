'use strict';
/* Native answer hooks: one shared ID links an outcome and its correct count. */
(function(root){
  if(root.SushiAchievementEvents)return;
  function answer(game,questionId,correct,options={}){
    try{
      const ledger=root.SushiAchievementLedger;
      if(!ledger)return null;
      ledger.ensureMigrationBaseline();
      let key=String(questionId||'');
      if(key.length>160){let a=2166136261,b=5381;for(const c of key){a=Math.imul(a^c.charCodeAt(0),16777619);b=Math.imul(b,33)^c.charCodeAt(0)}key='text:'+key.length+':'+(a>>>0).toString(16)+':'+(b>>>0).toString(16)}
      const id=ledger.recordOutcome(game,key,correct,options);
      if(!id)return null;
      if(correct)ledger.record(game,1,id);
      root.dispatchEvent(new CustomEvent('sushi-achievement-answer',{detail:{game,id,correct}}));
      return id;
    }catch(error){
      // Optional telemetry must never interrupt the game's scoring or controls.
      root.dispatchEvent(new CustomEvent('sushi-achievement-storage-error',{detail:{message:'学習実績を保存できませんでした'}}));
      return null;
    }
  }
  root.SushiAchievementEvents=Object.freeze({answer});
  try{root.SushiAchievementLedger?.ensureMigrationBaseline()}catch{}
  const native=new Set(['sushitan','shinotan','antonitan','sushi_idiom','toeic','sushi_blast','sushicross','sushitalk','sukaishi','sushi_quiz','sushigiri']);
  root.addEventListener('sushi-learning-answer',event=>{
    const e=event.detail?.event;
    if(!e||native.has(e.game_id))return;
    answer(e.game_id,e.word_id,e.correct,{review:!!event.detail.was_review,eventId:'learning:'+e.id});
  });
})(window);
