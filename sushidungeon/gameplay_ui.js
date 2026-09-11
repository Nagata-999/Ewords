'use strict';
(function(){
  const recent=[];

  function classify(t){
    if(/に\d+ダメージ/.test(t))return 'playerAttack';
    if(/の攻撃|強打|豪腕|毒牙|突進/.test(t))return 'enemyAttack';
    if(/拾った|手に入れた|装備した|食べた|飲んだ|鍛えた|補強した/.test(t))return 'itemEvent';
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

  function push(text){
    if(!text)return;
    const t=String(text).trim();
    if(!t)return;
    recent.push({text:t,kind:classify(t)});
    while(recent.length>4)recent.shift();
    paint();
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
      showDamage(enemyEntityByName(m[1]),Number(m[2]),'dealt');
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