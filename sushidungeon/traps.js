'use strict';
(function(){
  const TYPES=[
    {type:'spike',name:'トゲ床',icon:'✦'},
    {type:'hunger',name:'空腹の罠',icon:'◌'},
    {type:'warp',name:'転移の罠',icon:'◎'}
  ];

  function makeTraps(){
    if(!game)return;
    game.traps=[];
    if(game.floor<3)return;
    const count=game.floor>=7?2:1;
    const blocked=new Set([
      key(game.player.x,game.player.y),key(game.exit.x,game.exit.y),
      ...game.items.map(i=>key(i.x,i.y)),
      ...game.enemies.filter(e=>e.hp>0).map(e=>key(e.x,e.y))
    ]);
    if(game.chest)blocked.add(key(game.chest.x,game.chest.y));
    const spots=[];
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)if(game.grid[y]?.[x]&&!blocked.has(key(x,y)))spots.push({x,y});
    for(let i=0;i<count&&spots.length;i++){
      const p=spots.splice(rnd(spots.length),1)[0],t=TYPES[rnd(TYPES.length)];
      game.traps.push({...t,x:p.x,y:p.y,revealed:false,spent:false});
    }
  }

  const baseGenerate=window.generateFloor;
  if(typeof baseGenerate==='function')window.generateFloor=function(){baseGenerate();makeTraps();setTimeout(paint,0)};

  function openSpot(){
    const spots=[];
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){
      if(!game.grid[y]?.[x])continue;
      if(game.enemies.some(e=>e.hp>0&&e.x===x&&e.y===y))continue;
      if(x===game.exit.x&&y===game.exit.y)continue;
      spots.push({x,y});
    }
    return spots.length?spots[rnd(spots.length)]:null;
  }

  function triggerTrap(){
    if(!game?.traps)return;
    const t=game.traps.find(t=>!t.spent&&t.x===game.player.x&&t.y===game.player.y);
    if(!t)return;
    t.revealed=true;t.spent=true;
    if(t.type==='spike'){
      const dmg=4+Math.floor(game.floor/3);
      game.hp-=dmg;msg(`⚠ ${t.name}！ ${dmg}ダメージ。`);log(`${t.name}を踏んだ。`);
      if(game.hp<=0){die(t.name);return}
    }else if(t.type==='hunger'){
      game.hunger=Math.max(0,game.hunger-15);msg(`⚠ ${t.name}！ 満腹度が15減った。`);log(`${t.name}を踏んだ。`);
    }else if(t.type==='warp'){
      const p=openSpot();if(p){game.player={x:p.x,y:p.y};msg(`⚠ ${t.name}！ 別の場所へ飛ばされた。`);log(`${t.name}を踏んだ。`)}
    }
    render();paint();navigator.vibrate?.([30,30,55]);
  }

  const baseMove=window.move;
  if(typeof baseMove==='function')window.move=function(dx,dy){
    const before=game?.player?key(game.player.x,game.player.y):'';
    baseMove(dx,dy);
    if(game?.player&&key(game.player.x,game.player.y)!==before)triggerTrap();
    setTimeout(paint,0);
  };

  function paint(){
    const board=document.getElementById('board');if(!board||!game?.traps)return;
    const cells=[...board.children];
    cells.forEach((c,i)=>{
      c.querySelector('.trapMark')?.remove();
      const vx=i%11,vy=Math.floor(i/11);
      const x=game.player.x+(vx-5),y=game.player.y+(vy-3);
      const t=game.traps.find(t=>t.revealed&&t.x===x&&t.y===y);
      if(!t)return;
      const s=document.createElement('span');s.className='trapMark'+(t.spent?' spent':'');s.textContent=t.icon;s.title=t.name;c.append(s);
    });
  }

  document.addEventListener('DOMContentLoaded',()=>{
    const board=document.getElementById('board');if(board)new MutationObserver(()=>requestAnimationFrame(paint)).observe(board,{childList:true,subtree:true});
  });
})();
