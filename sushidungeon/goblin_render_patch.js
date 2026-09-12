'use strict';
(function(){
  const LEGACY_RE=/enemy_goblin_[enw]\.svg(?:$|[?#])/i;
  let raf=0;

  function cleanGoblin(el){
    if(!el || el.title!=='緑小鬼') return;
    const img=el.querySelector('img.goblin512, img.enemySprite512');
    if(!img) return;

    const src=img.getAttribute('src')||'';
    // enemy_sprites.js paints the old SVG before the async 512 asset arrives.
    // Hide only that transient fallback for side/back directions; south is left
    // untouched until its dedicated 512 source is installed.
    if(LEGACY_RE.test(src)){
      img.style.visibility='hidden';
      img.style.opacity='0';
    }else{
      img.style.visibility='visible';
      img.style.opacity='1';
      img.style.background='transparent';
      img.style.filter='none';
    }
  }

  function refresh(){
    raf=0;
    document.querySelectorAll('.entity.enemy[title="緑小鬼"]').forEach(cleanGoblin);
  }
  function queue(){
    if(!raf) raf=requestAnimationFrame(refresh);
  }

  const obs=new MutationObserver(queue);
  function start(){
    const board=document.getElementById('board');
    if(!board) return;
    obs.observe(board,{subtree:true,childList:true,attributes:true,attributeFilter:['class','src','style']});
    refresh();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();