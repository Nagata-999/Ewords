'use strict';
(function(){
  const SOURCE='https://raw.githubusercontent.com/Nagata-999/Ewords/aeef4502b4e74e06f103ea54217499f3b3ecc412/sushidungeon/hero_asset_v3.js';
  let directional=null;
  let observer=null;

  function facingOf(el){
    if(el.classList.contains('facing-n'))return 'n';
    if(el.classList.contains('facing-e'))return 'e';
    if(el.classList.contains('facing-w'))return 'w';
    return 's';
  }

  function repaint(){
    if(!directional)return;
    document.querySelectorAll('#board .entity.player').forEach(el=>{
      const img=el.querySelector('img.heroAssetV3');
      if(!img)return;
      const dir=facingOf(el);
      if(img.dataset.heroDir===dir)return;
      img.src=directional[dir]||directional.s;
      img.dataset.heroDir=dir;
    });
  }

  function observeBoard(){
    const board=document.getElementById('board');
    if(!board||observer)return;
    observer=new MutationObserver(()=>requestAnimationFrame(repaint));
    observer.observe(board,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
    repaint();
  }

  fetch(SOURCE,{cache:'force-cache'})
    .then(r=>{if(!r.ok)throw new Error('direction data load failed');return r.text()})
    .then(text=>{
      const match=text.match(/const HERO=(\{[\s\S]*?\});/);
      if(!match)throw new Error('direction data not found');
      directional=Function('"use strict";return ('+match[1]+')')();
      observeBoard();
    })
    .catch(()=>{});

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',observeBoard,{once:true});
  }else{
    observeBoard();
  }
})();
