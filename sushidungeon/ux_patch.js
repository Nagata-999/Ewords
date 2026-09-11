'use strict';
(function(){
  function closeWordAfterTap(){
    const dlg=document.getElementById('wordDialog');
    if(dlg?.open)dlg.close();
    if(game&&!game.dead)endTurn();
  }

  openWordChest=function(){
    if(!words.length)return;
    const q=words[rnd(words.length)],wrong=[];
    while(wrong.length<3){
      const w=words[rnd(words.length)];
      if(w.jp!==q.jp&&!wrong.includes(w.jp))wrong.push(w.jp);
    }
    const choices=[q.jp,...wrong].sort(()=>Math.random()-.5);
    const prompt=document.getElementById('wordPrompt');
    const grid=document.getElementById('wordChoices');
    const close=document.getElementById('wordClose');
    prompt.textContent=q.en;
    grid.replaceChildren();
    if(close)close.hidden=true;

    for(const c of choices){
      const b=document.createElement('button');
      b.type='button';
      b.textContent=c;
      b.onclick=()=>{
        [...grid.children].forEach(x=>x.disabled=true);
        grid.replaceChildren();
        const result=document.createElement('button');
        result.type='button';
        result.className='treasureResult';
        if(c===q.jp){
          const prize=randomItem(true);
          game.inventory.push(prize);
          if(['weapon','shield','accessory'].includes(prize.type))game.foundGear.push({...prize});
          const plus=prize.plus?` +${prize.plus}`:'';
          result.innerHTML=`<strong>✓ 正解！</strong><span>${q.en} = ${q.jp}</span><em>🎁 ${prize.icon} ${prize.name}${plus} を手に入れた</em><small>タップして閉じる</small>`;
          msg(`✓ 英単語宝箱：正解！`);
          msg(`🎁 獲得：${prize.icon} ${prize.name}${plus}`);
          log(`英単語宝箱「${q.en}」正解 → ${prize.name}`);
        }else{
          result.classList.add('wrong');
          result.innerHTML=`<strong>✕ 不正解</strong><span>${q.en} = ${q.jp}</span><em>宝箱は消えてしまった。</em><small>タップして閉じる</small>`;
          msg(`✕ 英単語宝箱：不正解。${q.en} = ${q.jp}`);
          log(`英単語宝箱「${q.en}」不正解`);
        }
        result.onclick=closeWordAfterTap;
        grid.appendChild(result);
      };
      grid.appendChild(b);
    }
    document.getElementById('wordDialog')?.showModal();
  };
})();
