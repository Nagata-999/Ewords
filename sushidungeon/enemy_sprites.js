'use strict';
(function(){
  const palette={'緑小鬼':['#5f8d4e','#385f32','#d7c58f'],'洞窟コウモリ':['#5b536e','#332f43','#b8a6cf'],'骸骨兵':['#d8d4be','#888474','#4a4439'],'毒蜘蛛':['#4a3b53','#241f2b','#8d6aa0'],'オーク兵':['#7b7650','#4d4932','#b08a60'],'石像兵':['#7d817a','#535850','#aaa99b'],'洞窟トロル':['#6f7454','#404531','#a68e68']};
  const ATLAS_TEXT='assets/enemy_atlas48.b64.txt';
  const GOBLIN_ATLAS_TEXT='assets/goblin512_fixed_atlas.b64.txt';
  const ATLAS_ROWS={'洞窟ネズミ':0,'洞窟コウモリ':1,'骸骨兵':2,'オーク兵':3,'石像兵':4,'洞窟トロル':5};
  const ATLAS_COL={s:0,w:1,e:2,n:3};
  let atlasSrc='',goblinAtlasSrc='';
  function facing(el){for(const d of ['n','e','s','w'])if(el.classList.contains('facing-'+d))return d;return 's'}
  function wrap(body,cls='monsterSprite'){return `<svg viewBox="0 0 256 256" class="${cls}" preserveAspectRatio="xMidYMax meet"><g transform="scale(2.56)">${body}</g></svg>`}
  function spider(dir,c){const[a,b,s]=c;if(dir==='n')return wrap(`<ellipse cx="50" cy="54" rx="20" ry="25" fill="${a}"/><circle cx="50" cy="34" r="15" fill="${b}"/><path d="M32 45L10 27M30 55L5 52M32 65L10 82M68 45L90 27M70 55L95 52M68 65L90 82" stroke="${s}" stroke-width="5"/>`);if(dir==='e'||dir==='w')return wrap(`<ellipse cx="48" cy="57" rx="24" ry="19" fill="${a}"/><circle cx="67" cy="44" r="14" fill="${b}"/><circle cx="75" cy="42" r="3" fill="#ddd"/><path d="M31 49L8 31M29 58L5 58M31 67L10 84M65 56L89 38M67 63L94 62M63 70L87 85" stroke="${s}" stroke-width="5"/>`);return wrap(`<ellipse cx="50" cy="57" rx="24" ry="20" fill="${a}"/><circle cx="50" cy="39" r="15" fill="${b}"/><g fill="#ddd"><circle cx="43" cy="37" r="2.5"/><circle cx="50" cy="35" r="2.5"/><circle cx="57" cy="37" r="2.5"/></g><path d="M31 49L8 31M29 58L5 58M31 67L10 84M69 49L92 31M71 58L95 58M69 67L90 84" stroke="${s}" stroke-width="5"/>`)}
  function atlasStyle(row,dir){const col=ATLAS_COL[dir]??0,x=(col/3*100).toFixed(4),y=(row/5*100).toFixed(4);return `background-image:url(${atlasSrc});background-size:400% 600%;background-position:${x}% ${y}%;background-repeat:no-repeat;`}
  function goblinStyle(dir){const col=ATLAS_COL[dir]??0,x=(col/3*100).toFixed(4);return `background-image:url(${goblinAtlasSrc});background-size:400% 100%;background-position:${x}% 50%;background-repeat:no-repeat;`}
  function fallbackArt(name,dir){if(name==='毒蜘蛛')return spider(dir,palette[name]);return null}
  function goblinFallback(){return wrap('<path d="M28 86Q22 62 31 43L21 26 40 34Q50 25 60 34L79 26 69 43Q78 62 72 86Z" fill="#568a45" stroke="#263b27" stroke-width="4"/><circle cx="42" cy="51" r="4" fill="#f3e6b8"/><circle cx="58" cy="51" r="4" fill="#f3e6b8"/><path d="M39 67Q50 74 61 67" fill="none" stroke="#263b27" stroke-width="4"/><path d="M31 82L19 96M69 82L81 96" stroke="#d7c58f" stroke-width="6"/>','monsterSprite goblinEmergency')}
  function refresh(el){
    const name=el.title,dir=facing(el),sig=name+'-'+dir+'-'+(atlasSrc?'a':'f')+'-'+(goblinAtlasSrc?'g':'p');
    const hasExpected=name==='緑小鬼'?!!el.querySelector('.goblinRendered'):!!el.querySelector('.enemyAtlas512,.monsterSprite');
    if(el.dataset.fullSprite===sig&&hasExpected)return;
    el.dataset.fullSprite=sig;
    const hp=el.querySelector('.enemyHp')?.outerHTML||'';
    if(name==='緑小鬼'){
      if(goblinAtlasSrc)el.innerHTML=`<span class="enemyGlyph directionalEnemy enemyAtlas512 goblin512 goblinRendered" style="${goblinStyle(dir)}"></span>${hp}`;
      else el.innerHTML=`<span class="enemyGlyph directionalEnemy goblinRendered">${goblinFallback()}</span>${hp}`;
      return;
    }
    if(atlasSrc&&name in ATLAS_ROWS){el.innerHTML=`<span class="enemyGlyph directionalEnemy enemyAtlas512" style="${atlasStyle(ATLAS_ROWS[name],dir)}"></span>${hp}`;return}
    const art=fallbackArt(name,dir);if(art)el.innerHTML=`<span class="enemyGlyph directionalEnemy">${art}</span>${hp}`;
  }
  function refreshAll(){document.querySelectorAll('.entity.enemy').forEach(refresh)}
  async function loadTextAsset(url){try{const r=await fetch(url,{cache:'no-store'});if(!r.ok)return'';const t=(await r.text()).trim();return t.startsWith('UklGR')?'data:image/webp;base64,'+t:''}catch{return''}}
  async function loadAtlas(){atlasSrc=await loadTextAsset(ATLAS_TEXT);document.querySelectorAll('.entity.enemy').forEach(e=>delete e.dataset.fullSprite);refreshAll()}
  async function loadGoblin(){goblinAtlasSrc=await loadTextAsset(GOBLIN_ATLAS_TEXT);document.querySelectorAll('.entity.enemy[title="緑小鬼"]').forEach(e=>delete e.dataset.fullSprite);refreshAll()}
  let queued=false;function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;refreshAll()})}
  const obs=new MutationObserver(queue);
  window.addEventListener('DOMContentLoaded',()=>{const b=document.getElementById('board');if(b)obs.observe(b,{childList:true,subtree:true,characterData:true});refreshAll();loadGoblin();loadAtlas()});
})();