'use strict';
(function(){
  const TIERS={
    low:{label:'低',min:0,max:1000,questions:1,className:'chestLow'},
    mid:{label:'中',min:1000,max:1600,questions:1,className:'chestMid'},
    hard:{label:'難',min:1600,max:2000,questions:2,className:'chestHard'}
  };
  const gearTypes=new Set(['weapon','shield','accessory']);
  function chooseTier(){const r=Math.random();return r<.40?'low':r<.75?'mid':'hard'}
  function tier(){return TIERS[game?.chest?.tier]||TIERS.low}
  function poolFor(t){const pool=words.slice(t.min,Math.min(t.max,words.length));return pool.length?pool:words}
  function fourChoices(q,pool){const wrong=[];while(wrong.length<3&&pool.length>1){const w=pool[rnd(pool.length)];if(w&&w.jp!==q.jp&&!wrong.includes(w.jp))wrong.push(w.jp)}while(wrong.length<3){const w=words[rnd(words.length)];if(w&&w.jp!==q.jp&&!wrong.includes(w.jp))wrong.push(w.jp)}return [q.jp,...wrong].sort(()=>Math.random()-.5)}
  function ensureChestTier(){if(game?.chest&&!game.chest.tier)game.chest.tier=chooseTier()}
  function weightedCopy(arr){return weighted(arr)}
  function consumableByType(types){const pool=CONSUMABLES.filter(x=>types.includes(x.type));return weightedCopy(pool.length?pool:CONSUMABLES)}
  function strongWeapon(){const pool=WEAPONS.filter(x=>(x.power||0)>=5);return weightedCopy(pool.length?pool:WEAPONS)}
  function strongShield(){const pool=SHIELDS.filter(x=>(x.power||0)>=5);return weightedCopy(pool.length?pool:SHIELDS)}
  function rewardForTier(t){
    const r=Math.random();
    if(t===TIERS.low){
      // Survival / growth chest: food, tea and upgrade materials dominate.
      if(r<.30)return consumableByType(['sushi']);
      if(r<.60)return consumableByType(['tea']);
      if(r<.78)return consumableByType(['whetstone']);
      if(r<.96)return consumableByType(['reinforce']);
      return weightedCopy(CONSUMABLES);
    }
    if(t===TIERS.mid){
      // Equipment chest: still has useful items, but weapons and shields are the main prize.
      if(r<.34)return weightedCopy(WEAPONS);
      if(r<.68)return weightedCopy(SHIELDS);
      if(r<.80)return weightedCopy(ACCESSORIES);
      return weightedCopy(CONSUMABLES);
    }
    // Hard chest: two questions, with a strong bias toward high-tier gear.
    if(r<.45)return strongWeapon();
    if(r<.78)return strongShield();
    if(r<.90)return weightedCopy(ACCESSORIES);
    if(r<.96)return weightedCopy(WEAPONS);
    return weightedCopy(SHIELDS);
  }

  const baseGenerate=generateFloor;
  generateFloor=function(){const r=baseGenerate.apply(this,arguments);ensureChestTier();return r};

  // Refresh the vocabulary source to the full 2,000-word master list.
  fetch('../data/words_master_v2_reviewed.json').then(r=>r.json()).then(data=>{const full=data.filter(x=>x&&x.en&&x.jp).slice(0,2000);if(full.length)words=full}).catch(()=>{});

  openWordChest=function(){
    if(!words.length)return;
    ensureChestTier();
    const t=tier(),pool=poolFor(t);let number=0,finished=false;
    const prompt=$('wordPrompt'),grid=$('wordChoices'),dialog=$('wordDialog');
    const kicker=dialog?.querySelector('small'),heading=dialog?.querySelector('h2');
    if(kicker)kicker.textContent=`ENGLISH TREASURE · ${t.label}`;
    if(heading)heading.textContent=t.questions===2?`英単語宝箱【${t.label}】 1/2`:`英単語宝箱【${t.label}】`;

    function closeTurn(){if(dialog.open)dialog.close();if(game&&!game.dead)endTurn()}
    function fail(q){
      finished=true;const result=document.createElement('button');result.type='button';result.className='treasureResult wrong';
      result.innerHTML=`<strong>✕ 不正解</strong><span>${q.en} = ${q.jp}</span><em>宝箱は消えてしまった。</em><small>タップして閉じる</small>`;
      result.onclick=closeTurn;grid.replaceChildren(result);msg(`✕ ${t.label}宝箱：不正解。${q.en} = ${q.jp}`);log(`${t.label}宝箱「${q.en}」不正解`);
    }
    function reward(){
      finished=true;const result=document.createElement('button');result.type='button';result.className='treasureResult';
      if(game.inventory.length>=20){result.innerHTML=`<strong>✓ ${t.questions===2?'2問正解！':'正解！'}</strong><em>持ち物がいっぱいで受け取れなかった。</em><small>タップして閉じる</small>`;msg(`✓ ${t.label}宝箱：正解！ しかし持ち物がいっぱいだ。`)}
      else{const prize=rewardForTier(t);game.inventory.push(prize);if(gearTypes.has(prize.type))game.foundGear.push({...prize});const plus=prize.plus?` +${prize.plus}`:'';result.innerHTML=`<strong>✓ ${t.questions===2?'2問正解！':'正解！'}</strong><em>🎁 ${prize.icon} ${prize.name}${plus} を手に入れた</em><small>タップして閉じる</small>`;msg(`✓ ${t.label}宝箱：正解！`);log(`${t.label}宝箱クリア → ${prize.name}`)}
      result.onclick=closeTurn;grid.replaceChildren(result);const n=$('invCount');if(n)n.textContent=`${game.inventory.length}/20`;
    }
    function ask(){
      if(finished)return;number++;const q=pool[rnd(pool.length)],choices=fourChoices(q,pool);prompt.textContent=q.en;grid.replaceChildren();
      if(heading)heading.textContent=t.questions===2?`英単語宝箱【${t.label}】 ${number}/2`:`英単語宝箱【${t.label}】`;
      for(const c of choices){const b=document.createElement('button');b.type='button';b.textContent=c;b.onclick=()=>{[...grid.children].forEach(x=>x.disabled=true);if(c!==q.jp){fail(q);return}if(number<t.questions){msg(`✓ 1問目正解！ あと1問。`);setTimeout(ask,420)}else reward()};grid.append(b)}
    }
    ask();dialog.showModal();
  };

  const baseRender=render;
  render=function(){baseRender.apply(this,arguments);ensureChestTier();const el=document.querySelector('#board .treasure');if(el&&game?.chest&&!game.chest.open){const t=tier();el.classList.add(t.className);el.textContent='🎁';el.title=`英単語宝箱【${t.label}】`}}
})();
