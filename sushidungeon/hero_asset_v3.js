'use strict';
(function(){
  const FRONT_SOURCE='https://raw.githubusercontent.com/Nagata-999/Ewords/adf4cc0be9ca55fad9b554f4494c5ed65ec4ad83/sushidungeon/hero_asset_v3.js';
  const DIR_SOURCE='https://raw.githubusercontent.com/Nagata-999/Ewords/aeef4502b4e74e06f103ea54217499f3b3ecc412/sushidungeon/hero_asset_v3.js';
  let heroFront=null;
  let heroDirs=null;
  let observer=null;
  let forcedDir='s';

  function classFacing(el){
    if(el.classList.contains('facing-n'))return 'n';
    if(el.classList.contains('facing-e'))return 'e';
    if(el.classList.contains('facing-w'))return 'w';
    if(el.classList.contains('facing-s'))return 's';
    return null;
  }
  function facingOf(el){return forcedDir||classFacing(el)||'s';}

  function parseDirObject(text){
    const out={};
    const start=text.indexOf('const HERO={');
    if(start<0)return null;
    const chunk=text.slice(start, Math.min(text.length,start+500000));
    for(const d of ['s','e','n','w']){
      const marker=d+":'";
      const i=chunk.indexOf(marker);
      if(i<0)continue;
      const j=i+marker.length;
      const k=chunk.indexOf("'",j);
      if(k>j)out[d]=chunk.slice(j,k);
    }
    return Object.keys(out).length===4?out:null;
  }

  function paint(){
    document.querySelectorAll('#board .entity.player').forEach(el=>{
      const dir=facingOf(el);
      const src=(heroDirs&&heroDirs[dir])||heroFront||(heroDirs&&heroDirs.s);
      if(!src)return;
      let img=el.querySelector('img.heroAssetV3');
      if(!img){
        img=document.createElement('img');
        img.className='heroAssetV3';
        img.alt='';
        img.draggable=false;
        el.replaceChildren(img);
      }
      if(img.dataset.heroDir!==dir || img.getAttribute('src')!==src){
        img.setAttribute('src',src);
        img.dataset.heroDir=dir;
      }
      el.dataset.heroAssetVisual='1';
    });
  }

  function setDirFromDelta(dx,dy){
    if(Math.abs(dx)>Math.abs(dy))forcedDir=dx>0?'e':'w';
    else if(dy!==0)forcedDir=dy>0?'s':'n';
    paint();
    requestAnimationFrame(paint);
    setTimeout(paint,40);
  }

  function bindInputFacing(){
    document.querySelectorAll('.dpad button[data-dir]').forEach(btn=>{
      const update=()=>{
        const [dx,dy]=(btn.dataset.dir||'0,0').split(',').map(Number);
        setDirFromDelta(dx,dy);
      };
      btn.addEventListener('pointerdown',update,{passive:true});
      btn.addEventListener('touchstart',update,{passive:true});
      btn.addEventListener('click',update,{passive:true});
    });
    document.addEventListener('keydown',e=>{
      const map={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
      if(map[e.key])setDirFromDelta(...map[e.key]);
    },{passive:true});
  }

  function watch(){
    const board=document.getElementById('board');
    if(!board||observer)return;
    observer=new MutationObserver(()=>requestAnimationFrame(paint));
    observer.observe(board,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
    bindInputFacing();
    paint();
    let tries=0;
    const timer=setInterval(()=>{paint();if(++tries>=80)clearInterval(timer)},50);
  }

  Promise.allSettled([
    fetch(FRONT_SOURCE,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('front load failed');return r.text()}).then(text=>{
      const m=text.match(/const HERO='([^']+)'/);if(m)heroFront=m[1];
    }),
    fetch(DIR_SOURCE,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('dir load failed');return r.text()}).then(text=>{
      heroDirs=parseDirObject(text);
      if(!heroDirs)throw new Error('dir data missing');
    })
  ]).then(()=>{watch();paint()});

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});
  else watch();
})();
