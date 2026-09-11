'use strict';
(function(){
  const prefersReduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if(prefersReduced)return;

  function snapshot(){
    const map=new Map(),counts={};
    const player=document.querySelector('#board .entity.player');
    if(player)map.set('player',player.getBoundingClientRect());
    document.querySelectorAll('#board .entity.enemy').forEach(el=>{
      const name=el.title||'enemy';
      const n=counts[name]=(counts[name]||0)+1;
      map.set(`enemy:${name}:${n}`,el.getBoundingClientRect());
    });
    return map;
  }

  function animateFrom(before){
    if(!before?.size)return;
    const entries=[];
    const player=document.querySelector('#board .entity.player');
    if(player)entries.push(['player',player]);
    const counts={};
    document.querySelectorAll('#board .entity.enemy').forEach(el=>{
      const name=el.title||'enemy';
      const n=counts[name]=(counts[name]||0)+1;
      entries.push([`enemy:${name}:${n}`,el]);
    });
    for(const [key,el] of entries){
      const old=before.get(key);if(!old)continue;
      const now=el.getBoundingClientRect();
      const dx=old.left-now.left,dy=old.top-now.top;
      if(Math.abs(dx)<1&&Math.abs(dy)<1)continue;
      if(Math.abs(dx)>now.width*1.6||Math.abs(dy)>now.height*1.6)continue;
      el.animate([
        {transform:`translate(${dx}px,${dy}px)`},
        {transform:'translate(0,0)'}
      ],{duration:key==='player'?150:165,easing:'cubic-bezier(.22,.72,.25,1)'});
    }
  }

  const baseRender=window.render;
  if(typeof baseRender==='function'){
    window.render=function(){
      const before=snapshot();
      const out=baseRender.apply(this,arguments);
      requestAnimationFrame(()=>animateFrom(before));
      return out;
    };
  }
})();
