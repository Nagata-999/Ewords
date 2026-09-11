'use strict';
(function(){
  const FRAME_MS=120;
  let tick=0;

  function motionOf(el){
    if(el.classList.contains('motion-attack'))return 'attack';
    if(el.classList.contains('motion-hit'))return 'hit';
    return 'idle';
  }

  function frameFor(motion){
    if(motion==='attack')return tick%5;
    if(motion==='hit')return tick%3;
    return tick%4;
  }

  function poseSvg(svg,frame,motion,isPlayer){
    if(!svg)return;
    svg.dataset.spriteFrame=String(frame);
    svg.dataset.spriteMotion=motion;
    const dirHost=svg.closest('.entity');
    const facing=dirHost?.classList.contains('facing-n')?'n':dirHost?.classList.contains('facing-e')?'e':dirHost?.classList.contains('facing-w')?'w':'s';
    let x=0,y=0,r=0,sx=1,sy=1;
    if(motion==='idle'){
      const poses=isPlayer?[[0,0,0,1,1],[-1,-1,-1,1.01,.99],[0,-2,0,.995,1.015],[1,-1,1,1.01,.99]]:[[0,0,0,1,1],[-1,-1,-2,1.02,.98],[0,-3,0,.98,1.04],[1,-1,2,1.02,.98]];
      [x,y,r,sx,sy]=poses[frame%poses.length];
    }else if(motion==='attack'){
      const sign=facing==='w'?-1:1;
      const poses=[[0,0,0,1,1],[-4*sign,1,-6*sign,.96,1.02],[3*sign,-3,4*sign,1.05,.98],[8*sign,-5,8*sign,1.12,.92],[2*sign,-1,2*sign,1.03,.99]];
      [x,y,r,sx,sy]=poses[frame%poses.length];
    }else{
      const poses=[[0,0,0,1,1],[7,0,4,.92,1.04],[-4,1,-3,.96,1.02]];
      [x,y,r,sx,sy]=poses[frame%poses.length];
    }
    svg.style.transformOrigin='50% 80%';
    svg.style.transform=`translate(${x}%,${y}%) rotate(${r}deg) scale(${sx},${sy})`;
  }

  function articulateEnemy(svg,frame,motion){
    if(!svg)return;
    const parts=[...svg.children];
    if(parts.length<2)return;
    const phase=frame%4;
    const a=phase===1?-2:phase===3?2:0;
    const b=phase===1?2:phase===3?-2:0;
    // Subtle per-part offsets make each frame a different drawing rather than only moving the whole sprite.
    parts.forEach((p,i)=>{
      if(!(p instanceof SVGElement))return;
      let t='';
      if(motion==='idle'){
        if(i%3===0)t=`translate(${a} ${Math.abs(a)})`;
        else if(i%3===1)t=`translate(${b} 0)`;
      }else if(motion==='attack'){
        const q=frame%5;
        if(i%2===0)t=`translate(${q*1.2} ${-Math.max(0,q-1)}) rotate(${q*1.4} 50 50)`;
      }else if(motion==='hit'){
        const q=frame%3;t=`translate(${q===1?5:q===2?-2:0} 0)`;
      }
      if(t)p.setAttribute('transform',t);else p.removeAttribute('transform');
    });
  }

  function update(){
    tick++;
    document.querySelectorAll('#board .entity.player,#board .entity.enemy').forEach(el=>{
      const motion=motionOf(el),frame=frameFor(motion),svg=el.querySelector('svg');
      poseSvg(svg,frame,motion,el.classList.contains('player'));
      if(el.classList.contains('enemy'))articulateEnemy(svg,frame,motion);
      el.dataset.animFrame=String(frame);
    });
  }

  const timer=setInterval(update,FRAME_MS);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)update()});
  window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
})();
