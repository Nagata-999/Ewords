'use strict';
(function(){
  function wrap(){return document.getElementById('boardWrap')}
  function layer(){
    const w=wrap();if(!w)return null;
    let l=w.querySelector('.fxLayer');
    if(!l){l=document.createElement('div');l.className='fxLayer';w.appendChild(l)}
    return l;
  }
  function posFor(el){
    const w=wrap();if(!w||!el)return null;
    const a=w.getBoundingClientRect(),b=el.getBoundingClientRect();
    return {x:b.left-a.left+b.width/2,y:b.top-a.top+b.height*.48};
  }
  function cellForWorld(x,y){
    try{
      const vx=x-(game.player.x-5),vy=y-(game.player.y-3);
      if(vx<0||vy<0||vx>=11||vy>=7)return null;
      return document.getElementById('board')?.children?.[vy*11+vx]||null;
    }catch{return null}
  }
  function enemyByName(name){return [...document.querySelectorAll('#board .entity.enemy')].find(e=>e.title===name)||null}
  function enemyForHit(name){
    const t=window.__sushiLastHitTarget;
    if(t&&t.name===name){
      const exact=cellForWorld(t.x,t.y)?.querySelector('.entity.enemy');
      if(exact)return exact;
    }
    return enemyByName(name);
  }
  function gameEnemyForHit(name){
    try{
      const t=window.__sushiLastHitTarget;
      if(t&&t.name===name&&t.enemy)return t.enemy.hp<=0?t.enemy:null;
      return game?.enemies?.find(e=>e.name===name&&e.hp<=0)||null;
    }catch{return null}
  }
  function burstAt(el,kind='hit'){
    const l=layer(),p=posFor(el);if(!l||!p)return;
    const node=document.createElement('span');node.className=`fxBurst ${kind}`;node.style.left=p.x+'px';node.style.top=p.y+'px';
    node.innerHTML='<i></i><i></i><i></i><i></i><i></i><i></i>';
    l.appendChild(node);setTimeout(()=>node.remove(),760);
  }
  function slashAt(el){
    const l=layer(),p=posFor(el);if(!l||!p)return;
    const s=document.createElement('span');s.className='fxSlash';s.style.left=p.x+'px';s.style.top=p.y+'px';l.appendChild(s);setTimeout(()=>s.remove(),460);
  }
  function ringAt(el,kind='pickup'){
    const l=layer(),p=posFor(el);if(!l||!p)return;
    const r=document.createElement('span');r.className=`fxRing ${kind}`;r.style.left=p.x+'px';r.style.top=p.y+'px';l.appendChild(r);setTimeout(()=>r.remove(),820);
  }
  function sparkleAt(el,kind='gold'){
    const l=layer(),p=posFor(el);if(!l||!p)return;
    const s=document.createElement('span');s.className=`fxSparkle ${kind}`;s.style.left=p.x+'px';s.style.top=p.y+'px';
    s.innerHTML='<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>';
    l.appendChild(s);setTimeout(()=>s.remove(),900);
  }
  function defeatAt(el){
    if(!el)return;
    burstAt(el,'defeat');sparkleAt(el,'defeat');
    el.classList.remove('fxDefeated');void el.offsetWidth;el.classList.add('fxDefeated');
    shake('light');haptic([16,18,28]);
  }
  function shake(strength='light'){
    const w=wrap();if(!w)return;w.classList.remove('fxShakeLight','fxShakeHeavy');void w.offsetWidth;w.classList.add(strength==='heavy'?'fxShakeHeavy':'fxShakeLight');setTimeout(()=>w.classList.remove('fxShakeLight','fxShakeHeavy'),280);
  }
  function flash(kind='gold'){
    const w=wrap();if(!w)return;const f=document.createElement('span');f.className=`fxScreenFlash ${kind}`;w.appendChild(f);setTimeout(()=>f.remove(),520);
  }
  function haptic(ms){try{navigator.vibrate?.(ms)}catch{}}
  function player(){return document.querySelector('#board .entity.player')}
  function explosionAt(x,y,hit=[]){
    const center=cellForWorld(x,y)||player()?.closest('.cell');
    if(center){ringAt(center,'explosion');burstAt(center,'explosion')}
    const cells=[];
    for(let yy=y-2;yy<=y+2;yy++)for(let xx=x-2;xx<=x+2;xx++){
      const c=cellForWorld(xx,yy);if(c)cells.push(c);
    }
    cells.forEach((c,i)=>setTimeout(()=>burstAt(c,'explosion'),Math.min(i,12)*12));
    hit.forEach((h,i)=>setTimeout(()=>{
      const e=cellForWorld(h.x,h.y)?.querySelector('.entity.enemy');
      if(e){burstAt(e,'explosionHit');sparkleAt(e,'defeat')}
    },40+i*35));
    flash('explosion');shake('heavy');haptic([25,18,32]);
  }
  window.addEventListener('sushi-explosion',e=>{
    const d=e.detail||{};explosionAt(d.x,d.y,d.hit||[]);
  });
  function react(text){
    const t=String(text||'');let m;
    m=t.match(/^(.+?)に(\d+)ダメージ/);
    if(m){
      const e=enemyForHit(m[1]);slashAt(e);burstAt(e,'hit');haptic(12);
      if(gameEnemyForHit(m[1]))setTimeout(()=>defeatAt(e),55);
      return;
    }
    m=t.match(/^(.+?)の(?:攻撃|毒牙|強打|豪腕|突進)！\s*(\d+)ダメージ/);
    if(m){burstAt(player(),'hurt');shake(Number(m[2])>=7?'heavy':'light');haptic(Number(m[2])>=7?[18,25,18]:24);return}
    if(/^正解！/.test(t)){ringAt(player(),'level');sparkleAt(player(),'gold');flash('gold');haptic([10,20,10]);return}
    if(/拾った|手に入れた/.test(t)){ringAt(player(),'pickup');sparkleAt(player(),'pickup');haptic(8);return}
    if(/レベル\d+！/.test(t)){ringAt(player(),'level');burstAt(player(),'level');sparkleAt(player(),'gold');flash('level');haptic([12,30,12]);return}
    if(/HP回復|飲んだ/.test(t)){ringAt(player(),'heal');sparkleAt(player(),'heal');return}
  }
  const prev=window.msg;
  if(typeof prev==='function')window.msg=function(t){react(t);return prev(t)};
  window.sushiDungeonFx={burstAt,slashAt,ringAt,sparkleAt,defeatAt,shake,flash,explosionAt};
})();