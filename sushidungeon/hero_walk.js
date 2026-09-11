'use strict';
(function(){
  const WALK={
    s:'data:image/png;base64,PLACEHOLDER_S',
    w:'data:image/png;base64,PLACEHOLDER_W',
    n:'data:image/png;base64,PLACEHOLDER_N',
    e:'data:image/png;base64,PLACEHOLDER_E'
  };
  let pendingUntil=0;
  let token=0;

  function facingOf(el){
    if(el.classList.contains('facing-n'))return 'n';
    if(el.classList.contains('facing-e'))return 'e';
    if(el.classList.contains('facing-w'))return 'w';
    return 's';
  }

  function showStep(){
    if(performance.now()>pendingUntil)return;
    const p=document.querySelector('#board .entity.player');
    if(!p)return;
    const img=p.querySelector('img.heroAssetV3');
    if(!img)return;
    const dir=facingOf(p);
    const my=++token;
    img.src=WALK[dir]||WALK.s;
    img.dataset.walkFrame='1';
    p.classList.remove('walk-visual');
    void p.offsetWidth;
    p.classList.add('walk-visual');
    setTimeout(()=>{
      if(my!==token)return;
      img.removeAttribute('data-walk-frame');
      p.classList.remove('walk-visual');
      // hero_direction owns the idle directional sprite; a harmless class nudge asks it to repaint.
      p.classList.add('hero-walk-idle-return');
      requestAnimationFrame(()=>p.classList.remove('hero-walk-idle-return'));
    },145);
  }

  function armWalk(){
    pendingUntil=performance.now()+260;
    requestAnimationFrame(showStep);
  }

  function bind(){
    document.querySelectorAll('.dpad button[data-dir]').forEach(btn=>{
      btn.addEventListener('pointerdown',armWalk,{passive:true});
    });
    document.addEventListener('keydown',e=>{
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))armWalk();
    },{passive:true});
    const board=document.getElementById('board');
    if(board){
      board.addEventListener('pointerup',()=>{
        if(performance.now()<=pendingUntil)requestAnimationFrame(showStep);
      },{passive:true});
      const obs=new MutationObserver(()=>{
        if(performance.now()<=pendingUntil)requestAnimationFrame(showStep);
      });
      obs.observe(board,{childList:true,subtree:true});
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});
  else bind();
})();
