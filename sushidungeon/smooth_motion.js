'use strict';
(function(){
  const prefersReduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if(prefersReduced)return;

  let pendingStep=null;
  let lastEnemyRects=new Map();

  function cellSize(){
    const board=document.getElementById('board');
    if(!board)return {w:0,h:0};
    return {w:board.clientWidth/11,h:board.clientHeight/7};
  }

  function snapshotEnemies(){
    const map=new Map(),counts={};
    document.querySelectorAll('#board .entity.enemy').forEach(el=>{
      const name=el.title||'enemy';
      const n=counts[name]=(counts[name]||0)+1;
      map.set(`${name}:${n}`,el.getBoundingClientRect());
    });
    return map;
  }

  function animatePlayer(){
    if(!pendingStep)return;
    const el=document.querySelector('#board .entity.player');
    if(!el)return;
    const {w,h}=cellSize();
    const {dx,dy}=pendingStep;
    el.getAnimations?.().forEach(a=>a.cancel());
    el.animate([
      {transform:`translate(${-dx*w}px,${-dy*h}px)`,offset:0},
      {transform:`translate(${-dx*w*.18}px,${-dy*h*.18}px)`,offset:.72},
      {transform:'translate(0,0)',offset:1}
    ],{duration:185,easing:'cubic-bezier(.2,.78,.22,1)',fill:'none'});
    pendingStep=null;
  }

  function animateEnemies(before){
    if(!before?.size)return;
    const counts={};
    document.querySelectorAll('#board .entity.enemy').forEach(el=>{
      const name=el.title||'enemy';
      const n=counts[name]=(counts[name]||0)+1;
      const old=before.get(`${name}:${n}`);
      if(!old)return;
      const now=el.getBoundingClientRect();
      const dx=old.left-now.left,dy=old.top-now.top;
      if(Math.abs(dx)<2&&Math.abs(dy)<2)return;
      if(Math.abs(dx)>now.width*1.8||Math.abs(dy)>now.height*1.8)return;
      el.getAnimations?.().forEach(a=>a.cancel());
      el.animate([
        {transform:`translate(${dx}px,${dy}px)`},
        {transform:'translate(0,0)'}
      ],{duration:170,easing:'cubic-bezier(.2,.78,.22,1)',fill:'none'});
    });
  }

  const baseRender=window.render;
  if(typeof baseRender==='function'){
    window.render=function(){
      const before=snapshotEnemies();
      const out=baseRender.apply(this,arguments);
      requestAnimationFrame(()=>{
        animatePlayer();
        animateEnemies(before);
      });
      return out;
    };
  }

  const baseMove=window.move;
  if(typeof baseMove==='function'){
    window.move=function(dx,dy){
      if(!game||game.dead)return baseMove.apply(this,arguments);
      const before={x:game.player.x,y:game.player.y};
      const out=baseMove.apply(this,arguments);
      const moved=game&&game.player&&(game.player.x!==before.x||game.player.y!==before.y);
      if(moved)pendingStep={dx,dy};
      else pendingStep=null;
      requestAnimationFrame(()=>animatePlayer());
      return out;
    };
  }
})();
