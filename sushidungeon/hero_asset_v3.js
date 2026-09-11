'use strict';
(function(){
  const HERO={
    s:'assets/hero_s.png',
    e:'assets/hero_e.png',
    n:'assets/hero_n.png',
    w:'assets/hero_w.png'
  };
  let forcedDir='s';
  let observer=null;

  function classFacing(el){
    if(el.classList.contains('facing-n'))return 'n';
    if(el.classList.contains('facing-e'))return 'e';
    if(el.classList.contains('facing-w'))return 'w';
    if(el.classList.contains('facing-s'))return 's';
    return null;
  }
  function facingOf(el){return forcedDir||classFacing(el)||'s';}

  function paint(){
    document.querySelectorAll('#board .entity.player').forEach(el=>{
      const dir=facingOf(el);
      const src=HERO[dir]||HERO.s;
      let img=el.querySelector('img.heroAssetV3');
      if(!img){
        img=document.createElement('img');
        img.className='heroAssetV3';
        img.alt='';
        img.draggable=false;
        el.replaceChildren(img);
      }
      if(img.dataset.heroDir!==dir){
        img.src=src;
        img.dataset.heroDir=dir;
      }
      el.dataset.heroAssetVisual='1';
    });
  }

  function setDirFromDelta(dx,dy){
    if(Math.abs(dx)>Math.abs(dy))forcedDir=dx>0?'e':'w';
    else if(dy!==0)forcedDir=dy>0?'s':'n';
    paint();
  }

  function bindInputFacing(){
    document.querySelectorAll('.dpad button[data-dir]').forEach(btn=>{
      const update=()=>{
        const [dx,dy]=(btn.dataset.dir||'0,0').split(',').map(Number);
        setDirFromDelta(dx,dy);
      };
      btn.addEventListener('pointerdown',update,{passive:true});
      btn.addEventListener('touchstart',update,{passive:true});
      btn.addEventListener('click',update,{passive:true});
    });
    document.addEventListener('keydown',e=>{
      const map={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
      if(map[e.key])setDirFromDelta(...map[e.key]);
    },{passive:true});
  }

  function watch(){
    const board=document.getElementById('board');
    if(!board||observer)return;
    observer=new MutationObserver(()=>requestAnimationFrame(paint));
    observer.observe(board,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
    bindInputFacing();
    paint();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});
  else watch();
})();
