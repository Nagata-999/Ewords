'use strict';
(function(){
  const SOURCE='https://raw.githubusercontent.com/Nagata-999/Ewords/adf4cc0be9ca55fad9b554f4494c5ed65ec4ad83/sushidungeon/hero_asset_v3.js';
  let hero=null;

  function paint(){
    if(!hero)return;
    document.querySelectorAll('#board .entity.player').forEach(el=>{
      let img=el.querySelector('img.heroAssetV3');
      if(!img){
        img=document.createElement('img');
        img.className='heroAssetV3';
        img.alt='';
        img.draggable=false;
        el.replaceChildren(img);
      }
      if(!img.src || !img.src.startsWith('data:image/png;base64,')) img.src=hero;
      el.dataset.heroAssetVisual='1';
    });
  }

  function watch(){
    const board=document.getElementById('board');
    if(!board)return;
    paint();
    const obs=new MutationObserver(()=>requestAnimationFrame(paint));
    obs.observe(board,{subtree:true,childList:true});
    let tries=0;
    const timer=setInterval(()=>{
      paint();
      if(++tries>=80)clearInterval(timer);
    },50);
  }

  fetch(SOURCE,{cache:'no-store'})
    .then(r=>{if(!r.ok)throw new Error('hero source load failed');return r.text();})
    .then(text=>{
      const m=text.match(/const HERO='([^']+)'/);
      if(!m)throw new Error('hero data not found');
      hero=m[1];
      watch();
    })
    .catch(err=>console.warn('[hero_asset_v3]',err));

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});
  else watch();
})();
