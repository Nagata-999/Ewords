'use strict';
(function(){
  const INVENTORY_MAX=20;
  const gearTypes=new Set(['weapon','shield','accessory']);
  const typeOrder={weapon:0,shield:1,accessory:2,sushi:3,tea:4,scroll:5,whetstone:6,reinforce:7};

  function isEquipped(it){return it===game.weapon||it===game.shield||it===game.accessory}
  function inventoryFull(){return !!game&&game.inventory.length>=INVENTORY_MAX}
  function updateCount(){const n=document.getElementById('invCount');if(n)n.textContent=`${game.inventory.length}/${INVENTORY_MAX}`}

  const basePickup=pickup;
  pickup=function(){
    if(!game)return;
    const i=game.items.findIndex(it=>it.x===game.player.x&&it.y===game.player.y);
    if(i>=0&&inventoryFull()){
      msg('持ち物がいっぱいだ。');
      return;
    }
    basePickup();
    updateCount();
  };

  // Keep the English chest reward inside the same 20-slot rule, while
  // preserving the tap-to-dismiss result screen from ux_patch.js.
  openWordChest=function(){
    if(!words.length)return;
    const q=words[rnd(words.length)],wrong=[];
    while(wrong.length<3){const w=words[rnd(words.length)];if(w.jp!==q.jp&&!wrong.includes(w.jp))wrong.push(w.jp)}
    const choices=[q.jp,...wrong].sort(()=>Math.random()-.5);
    const prompt=$('wordPrompt'),grid=$('wordChoices');
    prompt.textContent=q.en;grid.replaceChildren();

    function finish(result){
      result.onclick=()=>{
        if($('wordDialog').open)$('wordDialog').close();
        if(game&&!game.dead)endTurn();
      };
      grid.replaceChildren(result);
    }

    for(const c of choices){
      const b=document.createElement('button');b.type='button';b.textContent=c;
      b.onclick=()=>{
        [...grid.children].forEach(x=>x.disabled=true);
        const result=document.createElement('button');
        result.type='button';result.className='treasureResult';
        if(c===q.jp){
          if(inventoryFull()){
            result.innerHTML=`<strong>✓ 正解！</strong><span>${q.en} = ${q.jp}</span><em>持ち物がいっぱいで受け取れなかった。</em><small>タップして閉じる</small>`;
            msg('✓ 英単語宝箱：正解！ しかし持ち物がいっぱいだ。');
            log(`英単語宝箱「${q.en}」正解 → 持ち物満杯`);
          }else{
            const prize=randomItem(true);game.inventory.push(prize);
            if(gearTypes.has(prize.type))game.foundGear.push({...prize});
            const plus=prize.plus?` +${prize.plus}`:'';
            result.innerHTML=`<strong>✓ 正解！</strong><span>${q.en} = ${q.jp}</span><em>🎁 ${prize.icon} ${prize.name}${plus} を手に入れた</em><small>タップして閉じる</small>`;
            msg('✓ 英単語宝箱：正解！');
            log(`英単語宝箱「${q.en}」正解 → ${prize.name}`);
          }
        }else{
          result.classList.add('wrong');
          result.innerHTML=`<strong>✕ 不正解</strong><span>${q.en} = ${q.jp}</span><em>宝箱は消えてしまった。</em><small>タップして閉じる</small>`;
          msg(`✕ 英単語宝箱：不正解。${q.en} = ${q.jp}`);
          log(`英単語宝箱「${q.en}」不正解`);
        }
        updateCount();finish(result);
      };
      grid.append(b);
    }
    $('wordDialog').showModal();
  };

  function sortInventory(){
    if(!game)return;
    game.inventory=game.inventory.map((it,i)=>({it,i})).sort((a,b)=>{
      const ae=isEquipped(a.it)?0:1,be=isEquipped(b.it)?0:1;
      const at=typeOrder[a.it.type]??99,bt=typeOrder[b.it.type]??99;
      return ae-be||at-bt||a.i-b.i;
    }).map(x=>x.it);
    renderInventory();render();
    msg('持ち物を整理した。');
  }

  function dropItem(index){
    const it=game?.inventory?.[index];if(!it)return;
    const equipped=isEquipped(it);
    if(equipped&&!window.confirm(`${it.name}は装備中です。外して床に置きますか？`))return;
    if(it===game.weapon)game.weapon=null;
    if(it===game.shield)game.shield=null;
    if(it===game.accessory)game.accessory=null;
    game.inventory.splice(index,1);
    game.items.push({...it,x:game.player.x,y:game.player.y});
    msg(`${it.icon} ${it.name}を床に置いた。`);
    log(`${it.name}を床に置いた。`);
    renderInventory();render();updateCount();
  }

  renderInventory=function(){
    const list=$('inventoryList');list.replaceChildren();
    const head=document.createElement('div');head.className='inventoryTools';
    const count=document.createElement('b');count.textContent=`持ち物 ${game.inventory.length}/${INVENTORY_MAX}`;
    const sort=document.createElement('button');sort.type='button';sort.className='inventorySort';sort.textContent='整理';sort.onclick=sortInventory;
    head.append(count,sort);list.append(head);
    if(!game.inventory.length){const p=document.createElement('p');p.className='empty';p.textContent='何も持っていない。';list.append(p);return}
    game.inventory.forEach((it,i)=>{
      const row=document.createElement('div');row.className='inventoryRow';
      const use=document.createElement('button');use.type='button';use.className='inventoryUse';
      const plus=it.plus?` +${it.plus}`:'';
      const equipped=isEquipped(it);
      use.innerHTML=`${equipped?'<em class="equipBadge" aria-label="装備中">E</em>':''}<span>${it.icon} ${it.name}${plus}</span><small>${it.type==='weapon'?'攻 '+it.power:it.type==='shield'?'防 '+it.power:it.desc||'使う / 装備'}</small>`;
      if(equipped)use.classList.add('equippedItem');
      use.onclick=()=>useItem(i);
      const drop=document.createElement('button');drop.type='button';drop.className='inventoryDrop';drop.textContent='捨てる';drop.onclick=()=>dropItem(i);
      row.append(use,drop);list.append(row);
    });
  };

  const baseRender=render;
  render=function(){baseRender();updateCount()};
})();
