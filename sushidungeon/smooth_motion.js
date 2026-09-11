'use strict';
(function(){
  const prefersReduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if(prefersReduced)return;

  let movingPlayer=false;

  function rectMap(){
    const map=new Map();
    const player=document.querySelector('#board .entity.player');
    if(player)map.set('player',player.getBoundingClientRect());
    const counts={};
    document.querySelectorAll('#board .entity.enemy').forEach(el=>{
      const name=el.title||'enemy';
      const n=counts[name]=(counts[name]||0)+1;
      map.set(`enemy:${name}:${n}`,el.getBoundingClientRect());
    });
    return map;
  }

  function animateEntities(before){
    if(movingPlayer||!before?.size)return;
    const counts={};
    const items=[];
    const player=document.querySelector('#board .entity.player');
    if(player)items.push(['player',player]);
    document.querySelectorAll('#board .entity.enemy').forEach(el=>{
      const name=el.title||'enemy';
      const n=counts[name]=(counts[name]||0)+1;
      items.push([`enemy:${name}:${n}`,el]);
    });
    for(const [key,el] of items){
      const old=before.get(key);if(!old)continue;
      const now=el.getBoundingClientRect();
      const dx=old.left-now.left,dy=old.top-now.top;
      if(Math.abs(dx)<1&&Math.abs(dy)<1)continue;
      if(Math.abs(dx)>now.width*2.3||Math.abs(dy)>now.height*2.3)continue;
      el.getAnimations?.().forEach(a=>a.cancel());
      el.animate([
        {transform:`translate(${dx}px,${dy}px)`},
        {transform:'translate(0,0)'}
      ],{duration:185,easing:'cubic-bezier(.22,.72,.18,1)',fill:'both'});
    }
  }

  const baseRender=window.render;
  if(typeof baseRender==='function'){
    window.render=function(){
      const before=rectMap();
      const out=baseRender.apply(this,arguments);
      requestAnimationFrame(()=>animateEntities(before));
      return out;
    };
  }

  function cameraGlide(dx,dy){
    const board=document.getElementById('board');
    if(!board||(!dx&&!dy))return;
    const cellW=board.clientWidth/11,cellH=board.clientHeight/7;
    // Do not cancel a half-finished glide and snap to a new one. Finish the current
    // visual step first; rapid input otherwise looks faster and jerkier than grid movement.
    const running=board.getAnimations?.().find(a=>a.playState==='running');
    if(running)running.finish();
    board.animate([
      {transform:`translate(${dx*cellW}px,${dy*cellH}px)`},
      {transform:'translate(0,0)'}
    ],{duration:190,easing:'cubic-bezier(.25,.72,.2,1)',fill:'both'});
  }

  const baseMove=window.move;
  if(typeof baseMove==='function'){
    window.move=function(dx,dy){
      if(!game||game.dead||movingPlayer)return;
      const before={x:game.player.x,y:game.player.y};
      movingPlayer=true;
      const out=baseMove.apply(this,arguments);
      const moved=game&&game.player&&(game.player.x!==before.x||game.player.y!==before.y);
      requestAnimationFrame(()=>{
        if(moved)cameraGlide(dx,dy);
        // Keep one visual step readable before accepting another movement input.
        setTimeout(()=>{movingPlayer=false},moved?170:45);
      });
      return out;
    };
  }
})();
