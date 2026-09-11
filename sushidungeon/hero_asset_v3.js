'use strict';
(function(){
  const FRONT_SOURCE='https://raw.githubusercontent.com/Nagata-999/Ewords/adf4cc0be9ca55fad9b554f4494c5ed65ec4ad83/sushidungeon/hero_asset_v3.js';
  const DIR_SOURCE='https://raw.githubusercontent.com/Nagata-999/Ewords/aeef4502b4e74e06f103ea54217499f3b3ecc412/sushidungeon/hero_asset_v3.js';
  let heroFront=null;
  let heroDirs=null;
  let observer=null;

  function facingOf(el){
    if(el.classList.contains('facing-n'))return 'n';
    if(el.classList.contains('facing-e'))return 'e';
    if(el.classList.contains('facing-w'))return 'w';
    return 's';
  }

  function sourceFor(el){
    const dir=facingOf(el);
    return (heroDirs&&heroDirs[dir]) || heroFront || (heroDirs&&heroDirs.s) || null;
  }

  function paint(){
    document.querySelectorAll('#board .entity.player').forEach(el=>{
      const src=sourceFor(el);
      if(!src)return;
      let img=el.querySelector('img.heroAssetV3');
      if(!img){
        img=document.createElement('img');
        img.className='heroAssetV3';
        img.alt='';
        img.draggable=false;
        el.replaceChildren(img);
      }
      const dir=facingOf(el);
      if(img.dataset.heroDir!==dir || img.src!==src){
        img.src=src;
        img.dataset.heroDir=dir;
      }
      el.dataset.heroAssetVisual='1';
    });
  }

  function watch(){
    const board=document.getElementById('board');
    if(!board||observer)return;
    observer=new MutationObserver(()=>requestAnimationFrame(paint));
    observer.observe(board,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
    paint();
    let tries=0;
    const timer=setInterval(()=>{paint();if(++tries>=80)clearInterval(timer)},50);
  }

  Promise.allSettled([
    fetch(FRONT_SOURCE,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('front load failed');return r.text()}).then(text=>{
      const m=text.match(/const HERO='([^']+)'/);if(!m)throw new Error('front data missing');heroFront=m[1];
    }),
    fetch(DIR_SOURCE,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('dir load failed');return r.text()}).then(text=>{
      const m=text.match(/const HERO=(\{[\s\S]*?\});/);if(!m)throw new Error('dir data missing');heroDirs=Function('"use strict";return ('+m[1]+')')();
    })
  ]).then(()=>{watch();paint()}).catch(()=>{watch();paint()});

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});
  else watch();
})();
