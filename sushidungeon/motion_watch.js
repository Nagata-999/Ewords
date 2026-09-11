'use strict';
(function(){
  let last=null,idleTimer=null;
  function tick(){
    if(game?.player){
      const cur={x:game.player.x,y:game.player.y};
      if(last){
        const dx=cur.x-last.x,dy=cur.y-last.y;
        if(dx||dy){
          if(typeof facingFrom==='function')playerFacing=facingFrom(dx,dy,playerFacing||'s');
          playerMotion='walk';
          if(typeof followCamera==='function')followCamera();
          if(typeof render==='function')render();
          clearTimeout(idleTimer);
          idleTimer=setTimeout(()=>{if(game&&!game.dead){playerMotion='idle';if(typeof render==='function')render()}},170);
        }
      }
      last=cur;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();