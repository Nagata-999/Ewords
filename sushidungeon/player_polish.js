'use strict';
(function(){
  const skinPalette=['#f4cfae','#dba77f','#ac7657'];
  const hairPalette=['#493b32','#9b6241','#454e66'];
  let walkUntil=0,walkTick=0;

  function facing(){const el=document.querySelector('#board .entity.player');if(!el)return 's';for(const d of ['n','e','s','w'])if(el.classList.contains('facing-'+d))return d;return 's'}
  function motion(){const el=document.querySelector('#board .entity.player');if(!el)return 'idle';if(el.classList.contains('motion-attack'))return 'attack';if(el.classList.contains('motion-hit'))return 'hit';if(performance.now()<walkUntil)return 'walk';return 'idle'}
  function outfit(a){return (typeof ITEMS!=='undefined'&&ITEMS.find(x=>x.id===a.outfit&&x.slot==='outfit'))||{color:'#e6e0cf',accent:'#c84f3b'};}
  function weaponSvg(name){
    if(!name)return '';
    const map={
      '木の棒':{blade:'#8b5d36',edge:'#5f3d23',len:34,w:7,guard:'#704828'},
      '川魚包丁':{blade:'#cbd5d8',edge:'#7f9298',len:25,w:12,guard:'#68442d'},
      '鉄の剣':{blade:'#b7c0c4',edge:'#66757b',len:34,w:8,guard:'#b28648'},
      'ロングソード':{blade:'#d5dde0',edge:'#7b8a91',len:42,w:7,guard:'#a87832'},
      '銀の出刃包丁':{blade:'#eef4f5',edge:'#91a8af',len:30,w:14,guard:'#513a2b'},
      '古騎士の剣':{blade:'#e5cf83',edge:'#8e7640',len:39,w:9,guard:'#825f2a'}
    },v=map[name]||map['鉄の剣'];
    const y=116-v.len;
    return `<g class="gear weaponGear"><rect x="132" y="112" width="6" height="20" fill="#5b3824"/><rect x="126" y="108" width="18" height="5" fill="${v.guard}"/><polygon points="${135-v.w/2},${108} ${135+v.w/2},108 ${135+v.w/2-1},${y+5} 135,${y} ${135-v.w/2+1},${y+5}" fill="${v.blade}" stroke="${v.edge}" stroke-width="2"/></g>`;
  }
  function shieldSvg(name){
    if(!name)return '';
    const defs={
      '木の盾':['#8a6038','#5b3b22','round'], '樽ぶた':['#9a6b3d','#49301f','round'],
      '鉄の盾':['#829097','#47545b','kite'],'堅いまな板':['#c79c62','#765531','board'],
      '騎士の盾':['#a8b4ba','#54636a','kite'],'黒檀のまな板':['#3a302a','#171310','board']
    },v=defs[name]||defs['木の盾'];
    if(v[2]==='board')return `<g class="gear shieldGear"><rect x="34" y="92" width="28" height="40" rx="3" fill="${v[0]}" stroke="${v[1]}" stroke-width="4"/><rect x="45" y="96" width="6" height="31" fill="${v[1]}" opacity=".45"/></g>`;
    if(v[2]==='kite')return `<g class="gear shieldGear"><path d="M48 89L65 96L61 121L48 135L35 121L31 96Z" fill="${v[0]}" stroke="${v[1]}" stroke-width="4"/><path d="M48 94V128M37 103H59" stroke="${v[1]}" stroke-width="3" opacity=".7"/></g>`;
    return `<g class="gear shieldGear"><circle cx="48" cy="111" r="20" fill="${v[0]}" stroke="${v[1]}" stroke-width="4"/><circle cx="48" cy="111" r="6" fill="${v[1]}"/><path d="M48 91V131M28 111H68" stroke="${v[1]}" stroke-width="3" opacity=".5"/></g>`;
  }
  function accessorySvg(a){
    if(!game?.accessory)return '';
    const fx=game.accessory.effect,colors={regen:'#8fe0a0',hunger:'#f0bd62',attack:'#ef766b',defense:'#82b9eb',luck:'#d898ed'},c=colors[fx]||'#ddd';
    return `<g class="gear accGear"><path d="M82 91Q90 101 98 91" fill="none" stroke="${c}" stroke-width="3"/><circle cx="90" cy="103" r="5" fill="${c}" stroke="#27322d" stroke-width="2"/></g>`;
  }
  function pose(m,frame){
    if(m==='walk')return [{ly:0,ry:4,la:-4,ra:4,b:-1},{ly:4,ry:0,la:4,ra:-4,b:1},{ly:0,ry:4,la:-4,ra:4,b:-1},{ly:4,ry:0,la:4,ra:-4,b:1}][frame%4];
    if(m==='attack')return [{ly:0,ry:0,la:0,ra:0,b:0},{ly:1,ry:0,la:-3,ra:-8,b:1},{ly:0,ry:2,la:4,ra:9,b:-3},{ly:0,ry:1,la:2,ra:14,b:-5},{ly:0,ry:0,la:0,ra:2,b:-1}][frame%5];
    if(m==='hit')return [{ly:0,ry:0,la:0,ra:0,b:0},{ly:3,ry:1,la:-6,ra:5,b:4},{ly:1,ry:3,la:3,ra:-4,b:2}][frame%3];
    return [{ly:0,ry:0,la:0,ra:0,b:0},{ly:1,ry:0,la:-1,ra:1,b:-1},{ly:0,ry:1,la:1,ra:-1,b:-2},{ly:0,ry:0,la:0,ra:0,b:-1}][frame%4];
  }
  function fullBodySvg(a,dir,m,frame){
    const skin=skinPalette[a.skin]||skinPalette[0],hair=hairPalette[a.hairColor]||hairPalette[0],it=outfit(a),c=it.color||'#e6e0cf',ac=it.accent||'#c84f3b',p=pose(m,frame);
    const flip=dir==='w';
    const back=dir==='n';
    const eye=back?'':`<rect x="76" y="48" width="6" height="7" rx="2" fill="#232722"/><rect x="99" y="48" width="6" height="7" rx="2" fill="#232722"/>`;
    const face=back?'':`<rect x="85" y="62" width="12" height="3" rx="1" fill="#a86658"/>`;
    const weapon=weaponSvg(game?.weapon?.name),shield=shieldSvg(game?.shield?.name),acc=accessorySvg(a);
    return `<svg viewBox="0 0 180 190" class="proPlayerSprite ${flip?'flip':''}" data-motion="${m}" data-frame="${frame}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><g transform="translate(0 ${p.b})">${shield}<g class="leg legL" transform="translate(0 ${p.ly})"><rect x="67" y="130" width="18" height="34" rx="5" fill="#33434b"/><rect x="63" y="158" width="25" height="12" rx="4" fill="#241f1c"/></g><g class="leg legR" transform="translate(0 ${p.ry})"><rect x="96" y="130" width="18" height="34" rx="5" fill="#33434b"/><rect x="93" y="158" width="25" height="12" rx="4" fill="#241f1c"/></g><rect x="59" y="89" width="62" height="51" rx="13" fill="${c}" stroke="#26332e" stroke-width="4"/><rect x="65" y="98" width="50" height="8" fill="${ac}" opacity=".9"/><g class="arm armL" transform="translate(0 ${p.la})"><rect x="46" y="94" width="18" height="43" rx="8" fill="${c}" stroke="#26332e" stroke-width="4"/><circle cx="54" cy="136" r="8" fill="${skin}"/></g><g class="arm armR" transform="translate(0 ${p.ra})"><rect x="116" y="94" width="18" height="43" rx="8" fill="${c}" stroke="#26332e" stroke-width="4"/><circle cx="126" cy="136" r="8" fill="${skin}"/></g><circle cx="90" cy="55" r="38" fill="${skin}" stroke="#26332e" stroke-width="4"/><path d="M55 51Q55 18 90 16Q126 18 126 52L113 40Q90 31 66 42Z" fill="${hair}"/><path d="M56 54Q58 22 90 18Q121 20 124 54L117 36Q89 23 62 39Z" fill="${hair}" opacity=".95"/>${eye}${face}${acc}${weapon}</g></svg>`;
  }
  function renderPlayer(){
    const el=document.querySelector('#board .entity.player');if(!el)return;
    const m=motion(),dir=facing();
    const max=m==='attack'?5:m==='hit'?3:4,frame=Math.floor(performance.now()/95)%max,a=readAvatar();
    const sig=[dir,m,frame,game?.weapon?.name||'',game?.shield?.name||'',game?.accessory?.name||'',a.skin,a.hairColor,a.outfit].join('|');
    if(el.dataset.proSig===sig)return;el.dataset.proSig=sig;el.dataset.proSprite='1';el.innerHTML=fullBodySvg(a,dir,m,frame);
  }

  const baseGenerate=window.generateFloor;
  if(typeof baseGenerate==='function')window.generateFloor=function(){const out=baseGenerate.apply(this,arguments);if(game?.player){cameraX=game.player.x;cameraY=game.player.y}requestAnimationFrame(()=>{render();renderPlayer()});return out};

  const baseMove=window.move;
  if(typeof baseMove==='function')window.move=function(dx,dy){
    const oldEl=document.querySelector('#board .entity.player'),oldRect=oldEl?.getBoundingClientRect(),before=game?.player?{x:game.player.x,y:game.player.y}:null;
    const out=baseMove.apply(this,arguments);
    const moved=before&&game?.player&&(before.x!==game.player.x||before.y!==game.player.y);
    if(moved){walkUntil=performance.now()+240;walkTick++;requestAnimationFrame(()=>{const el=document.querySelector('#board .entity.player');if(!el||!oldRect)return;const nr=el.getBoundingClientRect(),tx=oldRect.left-nr.left,ty=oldRect.top-nr.top;if(Math.abs(tx)<nr.width*1.7&&Math.abs(ty)<nr.height*1.7){el.getAnimations?.().filter(a=>a.id==='walkStep').forEach(a=>a.cancel());const an=el.animate([{transform:`translate(${tx}px,${ty}px)`},{transform:'translate(0,0)'}],{duration:190,easing:'cubic-bezier(.2,.72,.25,1)'});an.id='walkStep'}})}
    renderPlayer();return out
  };

  function markEquipped(){
    const list=document.getElementById('inventoryList');if(!list||!game)return;
    [...list.querySelectorAll('button')].forEach((btn,i)=>{
      const item=game.inventory?.[i];if(!item)return;
      const equipped=item===game.weapon||item===game.shield||item===game.accessory;
      btn.classList.toggle('isEquipped',equipped);
      let tag=btn.querySelector('.equipMark');
      if(equipped&&!tag){tag=document.createElement('span');tag.className='equipMark';tag.textContent='E';btn.prepend(tag)}
      if(!equipped&&tag)tag.remove();
    });
  }
  const invObs=new MutationObserver(()=>markEquipped());
  window.addEventListener('DOMContentLoaded',()=>{const list=document.getElementById('inventoryList');if(list)invObs.observe(list,{childList:true,subtree:true});renderPlayer()});
  const timer=setInterval(()=>{renderPlayer();markEquipped()},90);
  window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
})();