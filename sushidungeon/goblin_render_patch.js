'use strict';
(function(){
  let raf=0;
  function cleanGoblin(el){
    if(!el || el.title!=='緑小鬼') return;
    const img=el.querySelector('img.goblin512, img.enemySprite512');
    if(!img) return;
    img.style.visibility='visible';
    img.style.opacity='1';
    img.style.background='transparent';
    img.style.filter='none';
  }
  function refresh(){
    raf=0;
    document.querySelectorAll('.entity.enemy[title="緑小鬼"]').forEach(cleanGoblin);
  }
  function queue(){if(!raf) raf=requestAnimationFrame(refresh)}
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