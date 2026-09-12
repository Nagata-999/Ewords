'use strict';
(function(){
  const HERO={s:'assets/hero_s_padded.png',e:'assets/hero_e.png',n:'assets/hero_n.png',w:'assets/hero_w.png'};
  let forcedDir='s';
  let observer=null;
  let raf=0;

  function classFacing(el){
    if(el.classList.contains('facing-n'))return 'n';
    if(el.classList.contains('facing-e'))return 'e';
    if(el.classList.contains('facing-w'))return 'w';
    if(el.classList.contains('facing-s'))return 's';
    return null;
  }
  function facingOf(el){return forcedDir||classFacing(el)||'s';}
  function ensureSprite(){
    const wrap=document.getElementById('boardWrap');
    if(!wrap)return null;
    let img=document.getElementById('heroBoardSprite');
    if(!img){
      img=document.createElement('img');
      img.id='heroBoardSprite';
      img.className='heroBoardSprite';
      img.alt='';
      img.draggable=false;
      wrap.appendChild(img);
    }
    return img;
  }
  function paintNow(){
    raf=0;
    const player=document.querySelector('#board .entity.player');
    const wrap=document.getElementById('boardWrap');
    if(!player||!wrap)return;
    const cell=player.closest('.cell');
    if(!cell)return;
    const img=ensureSprite();
    if(!img)return;

    const dir=facingOf(player);
    const src=HERO[dir]||HERO.s;
    if(img.getAttribute('src')!==src) img.src=src;
    img.dataset.heroDir=dir;

    const c=cell.getBoundingClientRect();
    const w=wrap.getBoundingClientRect();
    const spriteW=c.width*(dir==='s'?1.62:1.48);
    const spriteH=c.height*(dir==='s'?2.08:1.94);
    const footX=c.left-w.left+c.width/2;
    const footY=c.top-w.top+c.height*.98;

    img.style.width=spriteW+'px';
    img.style.height=spriteH+'px';
    img.style.left=(footX-spriteW/2)+'px';
    img.style.top=(footY-spriteH)+'px';
    img.className='heroBoardSprite facing-'+dir+(player.classList.contains('motion-attack')?' motion-attack':'')+(player.classList.contains('motion-hit')?' motion-hit':'')+(player.classList.contains('motion-idle')?' motion-idle':'');
    player.style.visibility='hidden';
  }
  function paint(){if(!raf)raf=requestAnimationFrame(paintNow);}
  function setDirFromDelta(dx,dy){
    if(Math.abs(dx)>Math.abs(dy))forcedDir=dx>0?'e':'w';
    else if(dy!==0)forcedDir=dy>0?'s':'n';
    paint();
  }
  function bindInputFacing(){
    document.querySelectorAll('.dpad button[data-dir]').forEach(btn=>{
      const update=()=>{const [dx,dy]=(btn.dataset.dir||'0,0').split(',').map(Number);setDirFromDelta(dx,dy);};
      btn.addEventListener('pointerdown',update,{passive:true});
      btn.addEventListener('touchstart',update,{passive:true});
      btn.addEventListener('click',update,{passive:true});
    });
    document.addEventListener('keydown',e=>{
      const map={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
      if(map[e.key])setDirFromDelta(...map[e.key]);
    },{passive:true});
    window.addEventListener('resize',paint,{passive:true});
  }
  function watch(){
    const board=document.getElementById('board');
    if(!board||observer)return;
    observer=new MutationObserver(paint);
    observer.observe(board,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});
    bindInputFacing();
    paint();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});
  else watch();
})();