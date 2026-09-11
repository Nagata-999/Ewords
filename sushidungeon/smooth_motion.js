'use strict';
(function(){
  const prefersReduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if(prefersReduced)return;

  let movingPlayer=false;
  let playerStep=null;

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
      el.animate([
        {transform:`translate(${dx}px,${dy}px)`},
        {transform:'translate(0,0)'}
      ],{duration:135,easing:'cubic-bezier(.2,.8,.2,1)'});
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
    board.getAnimations?.().forEach(a=>a.cancel());
    board.animate([
      {transform:`translate(${dx*cellW}px,${dy*cellH}px)`},
      {transform:'translate(0,0)'}
    ],{duration:145,easing:'cubic-bezier(.16,.84,.25,1)'});
  }

  const baseMove=window.move;
  if(typeof baseMove==='function'){
    window.move=function(dx,dy){
      if(!game||game.dead)return baseMove.apply(this,arguments);
      const before={x:game.player.x,y:game.player.y};
      movingPlayer=true;
      playerStep={dx,dy};
      const out=baseMove.apply(this,arguments);
      const moved=game&&game.player&&(game.player.x!==before.x||game.player.y!==before.y);
      requestAnimationFrame(()=>{
        if(moved)cameraGlide(dx,dy);
        movingPlayer=false;
        playerStep=null;
      });
      return out;
    };
  }
})();
