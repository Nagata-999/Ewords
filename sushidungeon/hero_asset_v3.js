'use strict';
(function(){
  function heroSvg(dir){
    const side=dir==='e'||dir==='w';
    const back=dir==='n';
    const face=back?'':`<ellipse cx="256" cy="194" rx="72" ry="66" fill="#f7d6bd"/><path d="M214 192Q230 180 246 192" stroke="#684633" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M266 192Q282 180 298 192" stroke="#684633" stroke-width="8" fill="none" stroke-linecap="round"/><circle cx="234" cy="198" r="8" fill="#1d385a"/><circle cx="278" cy="198" r="8" fill="#1d385a"/><path d="M238 224Q256 238 274 224" stroke="#9a4d45" stroke-width="7" fill="none" stroke-linecap="round"/>`;
    const shield=dir==='e'?`<g transform="translate(145 286)"><circle cx="0" cy="0" r="67" fill="url(#bronze)" stroke="#6f4728" stroke-width="10"/><circle cx="0" cy="0" r="44" fill="none" stroke="#9b6637" stroke-width="8"/><circle cx="0" cy="0" r="13" fill="#d8a45e"/></g>`:`<g transform="translate(362 290)"><circle cx="0" cy="0" r="67" fill="url(#bronze)" stroke="#6f4728" stroke-width="10"/><circle cx="0" cy="0" r="44" fill="none" stroke="#9b6637" stroke-width="8"/><circle cx="0" cy="0" r="13" fill="#d8a45e"/></g>`;
    const sword=dir==='e'?`<g transform="translate(362 288) rotate(34)"><rect x="-10" y="-18" width="20" height="72" rx="8" fill="#9a622e"/><path d="M-18 -26L0 -164L18 -26L0 2Z" fill="url(#steel)" stroke="#607080" stroke-width="7"/><rect x="-30" y="0" width="60" height="14" rx="7" fill="#d7a94f"/></g>`:`<g transform="translate(144 286) rotate(-34)"><rect x="-10" y="-18" width="20" height="72" rx="8" fill="#9a622e"/><path d="M-18 -26L0 -164L18 -26L0 2Z" fill="url(#steel)" stroke="#607080" stroke-width="7"/><rect x="-30" y="0" width="60" height="14" rx="7" fill="#d7a94f"/></g>`;
    const eyes=back?'':face;
    const cape=back?`<path d="M185 236Q256 206 327 236L356 392Q294 428 256 408Q218 428 156 392Z" fill="url(#navy)" stroke="#101b2d" stroke-width="9"/>`:`<path d="M182 250Q256 224 330 250L344 358Q303 382 256 368Q209 382 168 358Z" fill="#1f3557" opacity=".85"/>`;
    const headX=side?(dir==='e'?272:240):256;
    const bodyShift=side?(dir==='e'?18:-18):0;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="salmon" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ff8b72"/><stop offset="1" stop-color="#df4f43"/></linearGradient><linearGradient id="rice" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fffdf5"/><stop offset="1" stop-color="#d9d6cc"/></linearGradient><linearGradient id="navy" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#2c476f"/><stop offset="1" stop-color="#131e31"/></linearGradient><linearGradient id="bronze" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d09a54"/><stop offset="1" stop-color="#7d4e2c"/></linearGradient><linearGradient id="steel" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#f8fbff"/><stop offset=".5" stop-color="#b7c9d8"/><stop offset="1" stop-color="#718697"/></linearGradient><filter id="shadow"><feGaussianBlur stdDeviation="5"/></filter></defs><ellipse cx="256" cy="447" rx="104" ry="23" fill="#000" opacity=".25" filter="url(#shadow)"/>${cape}<g transform="translate(${bodyShift} 0)"><path d="M204 278Q256 248 308 278L326 392Q256 430 186 392Z" fill="url(#navy)" stroke="#111a2a" stroke-width="10"/><path d="M218 290Q256 272 294 290L306 348Q256 370 206 348Z" fill="#7b5438" stroke="#503621" stroke-width="8"/><rect x="209" y="344" width="94" height="24" rx="10" fill="#b98a52"/><rect x="244" y="338" width="24" height="36" rx="6" fill="#d8b06b"/><path d="M214 390L204 438Q218 456 245 438L250 394Z" fill="#3a2d2b"/><path d="M298 390L308 438Q294 456 267 438L262 394Z" fill="#3a2d2b"/></g>${eyes}<g transform="translate(${headX} 0)"><path d="M-92 139Q0 92 92 139L82 183Q0 209 -82 183Z" fill="url(#rice)" stroke="#bcb8ad" stroke-width="7"/><path d="M-106 116Q0 48 106 116Q94 160 0 166Q-94 160 -106 116Z" fill="url(#salmon)" stroke="#9e3e36" stroke-width="8"/><path d="M-76 108Q-43 79 -4 72M-26 132Q10 91 55 84M25 141Q54 112 82 105" stroke="#ffd0ba" stroke-width="8" fill="none" stroke-linecap="round"/></g>${sword}${shield}</svg>`)}`;
  }

  const HERO={s:heroSvg('s'),e:heroSvg('e'),n:heroSvg('n'),w:heroSvg('w')};
  let forcedDir='s';
  let observer=null;
  let raf=0;

  function classFacing(el){
    if(el.classList.contains('facing-n'))return 'n';
    if(el.classList.contains('facing-e'))return 'e';
    if(el.classList.contains('facing-w'))return 'w';
    if(el.classList.contains('facing-s'))return 's';
    return null;
  }
  function facingOf(el){return forcedDir||classFacing(el)||'s';}
  function ensureSprite(){
    const wrap=document.getElementById('boardWrap');
    if(!wrap)return null;
    let img=document.getElementById('heroBoardSprite');
    if(!img){
      img=document.createElement('img');
      img.id='heroBoardSprite';
      img.className='heroBoardSprite';
      img.alt='';
      img.draggable=false;
      wrap.appendChild(img);
    }
    return img;
  }
  function paintNow(){
    raf=0;
    const player=document.querySelector('#board .entity.player');
    const wrap=document.getElementById('boardWrap');
    if(!player||!wrap)return;
    const cell=player.closest('.cell');
    if(!cell)return;
    const img=ensureSprite();
    if(!img)return;

    const dir=facingOf(player);
    const src=HERO[dir]||HERO.s;
    if(img.getAttribute('src')!==src)img.src=src;
    img.dataset.heroDir=dir;

    const c=cell.getBoundingClientRect();
    const w=wrap.getBoundingClientRect();
    const spriteW=c.width*2.08;
    const spriteH=c.height*2.82;
    const footX=c.left-w.left+c.width/2;
    const footY=c.top-w.top+c.height*.99;

    img.style.width=spriteW+'px';
    img.style.height=spriteH+'px';
    img.style.left=(footX-spriteW/2)+'px';
    img.style.top=(footY-spriteH)+'px';
    img.className='heroBoardSprite facing-'+dir+(player.classList.contains('motion-attack')?' motion-attack':'')+(player.classList.contains('motion-hit')?' motion-hit':'')+(player.classList.contains('motion-idle')?' motion-idle':'');
    player.style.visibility='hidden';
  }
  function paint(){if(!raf)raf=requestAnimationFrame(paintNow);}
  function setDirFromDelta(dx,dy){
    if(Math.abs(dx)>Math.abs(dy))forcedDir=dx>0?'e':'w';
    else if(dy!==0)forcedDir=dy>0?'s':'n';
    paint();
  }
  function bindInputFacing(){
    document.querySelectorAll('.dpad button[data-dir]').forEach(btn=>{
      const update=()=>{const [dx,dy]=(btn.dataset.dir||'0,0').split(',').map(Number);setDirFromDelta(dx,dy);};
      btn.addEventListener('pointerdown',update,{passive:true});
      btn.addEventListener('touchstart',update,{passive:true});
      btn.addEventListener('click',update,{passive:true});
    });
    document.addEventListener('keydown',e=>{
      const map={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
      if(map[e.key])setDirFromDelta(...map[e.key]);
    },{passive:true});
    window.addEventListener('resize',paint,{passive:true});
  }
  function watch(){
    const board=document.getElementById('board');
    if(!board||observer)return;
    observer=new MutationObserver(paint);
    observer.observe(board,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});
    bindInputFacing();
    paint();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});
  else watch();
})();