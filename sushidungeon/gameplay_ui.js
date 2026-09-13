'use strict';
(function(){
  const recent=[];

  function classify(t){
    if(/^あなた →/.test(t)||/に\d+ダメージ/.test(t))return 'playerAttack';
    if(/^敵 →/.test(t)||/の攻撃|強打|豪腕|毒牙|突進/.test(t))return 'enemyAttack';
    if(/HP回復|回復した|全回復|満腹度回復/.test(t))return 'healEvent';
    if(/F。階段|Fへ降りた|階段|レベル\d+/.test(t))return 'floorEvent';
    if(/^🎁/.test(t)||/拾った|手に入れた|装備した|食べた|飲んだ|鍛えた|補強した/.test(t))return 'itemEvent';
    if(/^✓/.test(t)||/正解/.test(t))return 'successEvent';
    return 'system';
  }

  function paint(){
    const box=document.getElementById('recentLog');
    if(!box)return;
    box.replaceChildren();
    for(const entry of recent){
      const p=document.createElement('p');
      p.className=entry.kind;
      p.textContent=entry.text;
      box.appendChild(p);
    }
  }

  function pushOne(text,kind){
    const t=String(text||'').trim();if(!t)return;
    recent.push({text:t,kind:kind||classify(t)});
    while(recent.length>4)recent.shift();
    paint();
  }

  function push(text){
    if(!text)return;
    const t=String(text).trim();
    if(!t)return;

    let m=t.match(/^(.+?)に(\d+)ダメージ。?$/);
    if(m){pushOne(`あなた → ${m[1]}：${m[2]}ダメージ`,'playerAttack');return;}

    m=t.match(/^(.+?)の(?:攻撃|毒牙|強打|豪腕|突進)！\s*(\d+)ダメージ。?$/);
    if(m){pushOne(`敵 → あなた：${m[1]}の攻撃 ${m[2]}ダメージ`,'enemyAttack');return;}

    m=t.match(/^正解！\s*(.+?)\s+(.+?)を手に入れた。?$/);
    if(m){
      pushOne('✓ 英単語宝箱：正解！','successEvent');
      pushOne(`🎁 獲得：${m[1]} ${m[2]}`,'itemEvent');
      return;
    }

    m=t.match(/^(.+?)を拾った。?$/);
    if(m){pushOne(`🎒 拾った：${m[1]}`,'itemEvent');return;}

    pushOne(t);
  }

  function damageLayer(){
    const wrap=document.getElementById('boardWrap');
    if(!wrap)return null;
    let layer=wrap.querySelector('.damageLayer');
    if(!layer){
      layer=document.createElement('div');
      layer.className='damageLayer';
      wrap.appendChild(layer);
    }
    return layer;
  }

  function enemyEntityByName(name){
    return [...document.querySelectorAll('#board .entity.enemy')].find(el=>el.title===name)||null;
  }
  function cellForWorld(x,y){
    try{
      const vx=x-(game.player.x-5),vy=y-(game.player.y-3);
      if(vx<0||vy<0||vx>=11||vy>=7)return null;
      return document.getElementById('board')?.children?.[vy*11+vx]||null;
    }catch{return null}
  }
  function exactEnemyEntity(name){
    const t=window.__sushiLastHitTarget;
    if(t&&t.name===name){
      const exact=cellForWorld(t.x,t.y)?.querySelector('.entity.enemy');
      if(exact)return exact;
    }
    return enemyEntityByName(name);
  }

  function showDamage(target,amount,kind){
    if(!target||!amount)return;
    const wrap=document.getElementById('boardWrap'),layer=damageLayer();
    if(!wrap||!layer)return;
    const wr=wrap.getBoundingClientRect(),tr=target.getBoundingClientRect();
    const pop=document.createElement('span');
    pop.className=`damagePop ${kind}`;
    pop.textContent=`-${amount}`;
    pop.style.left=`${tr.left-wr.left+tr.width/2}px`;
    pop.style.top=`${tr.top-wr.top+Math.max(2,tr.height*.16)}px`;
    pop.style.setProperty('--drift',`${Math.round((Math.random()-.5)*12)}px`);
    layer.appendChild(pop);
    pop.addEventListener('animationend',()=>pop.remove(),{once:true});
    setTimeout(()=>pop.remove(),1100);
  }

  function damageFromMessage(text){
    const t=String(text||'');
    let m=t.match(/^(.+?)に(\d+)ダメージ/);
    if(m){
      showDamage(exactEnemyEntity(m[1]),Number(m[2]),'dealt');
      return;
    }
    m=t.match(/^(.+?)の(?:攻撃|毒牙|強打|豪腕|突進)！\s*(\d+)ダメージ/);
    if(m)showDamage(document.querySelector('#board .entity.player'),Number(m[2]),'taken');
  }

  const originalMsg=window.msg;
  if(typeof originalMsg==='function'){
    window.msg=function(t){
      push(t);
      damageFromMessage(t);
      return originalMsg(t);
    };
  }

  const originalDescend=window.descend;
  if(typeof originalDescend==='function'){
    window.descend=function(){
      const dialog=document.getElementById('stairsDialog');
      if(!dialog){originalDescend();return;}
      const text=document.getElementById('stairsText');
      if(text)text.textContent=game.floor>=10?'この階段の先へ進みますか？':'階段を降りて次の階へ進みますか？';
      if(!dialog.open)dialog.showModal();
    };
  }

  window.sushiDungeonRecentLog=push;
  document.addEventListener('DOMContentLoaded',()=>{
    const source=document.getElementById('message');
    if(source&&source.textContent.trim())push(source.textContent.trim());

    const dialog=document.getElementById('stairsDialog');
    const yes=document.getElementById('stairsYes');
    const no=document.getElementById('stairsNo');
    if(yes)yes.addEventListener('click',()=>{
      if(dialog?.open)dialog.close();
      if(typeof originalDescend==='function')originalDescend();
    });
    if(no)no.addEventListener('click',()=>{
      if(dialog?.open)dialog.close();
      if(game&&!game.dead)endTurn();
    });
  });
})();
