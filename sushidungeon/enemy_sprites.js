'use strict';
(function(){
  const palette={
    '緑小鬼':['#5f8d4e','#385f32','#d7c58f'],
    '洞窟コウモリ':['#5b536e','#332f43','#b8a6cf'],
    '骸骨兵':['#d8d4be','#888474','#4a4439'],
    '毒蜘蛛':['#4a3b53','#241f2b','#8d6aa0'],
    'オーク兵':['#7b7650','#4d4932','#b08a60'],
    '石像兵':['#7d817a','#535850','#aaa99b'],
    '洞窟トロル':['#6f7454','#404531','#a68e68']
  };
  const GOBLIN={
    s:'assets/enemy_goblin_s.svg',
    n:'assets/enemy_goblin_n.svg',
    e:'assets/enemy_goblin_e.svg',
    w:'assets/enemy_goblin_w.svg'
  };
  Object.values(GOBLIN).forEach(src=>{const i=new Image();i.src=src});
  function facing(el){for(const d of ['n','e','s','w'])if(el.classList.contains('facing-'+d))return d;return 's'}
  function wrap(body,dir,cls='monsterSprite'){return `<svg viewBox="0 0 256 256" class="${cls}" preserveAspectRatio="xMidYMax meet"><g transform="scale(2.56)">${body}</g></svg>`}
  function bat(dir,c){const [a,b,s]=c;if(dir==='n')return wrap(`<path d="M50 48Q18 15 5 37Q17 44 24 58Q10 63 26 75Q39 65 50 59Q61 65 74 75Q90 63 76 58Q83 44 95 37Q82 15 50 48Z" fill="${a}"/><circle cx="50" cy="48" r="15" fill="${b}"/>`,dir);if(dir==='e'||dir==='w')return wrap(`<path d="M37 50Q8 20 5 45Q18 48 26 61Q13 67 29 76Q40 68 49 61Q65 54 89 38Q88 62 63 68Q54 74 42 75Z" fill="${a}"/><circle cx="53" cy="49" r="14" fill="${b}"/><circle cx="62" cy="46" r="2.5" fill="${s}"/>`,dir);return wrap(`<path d="M50 48Q18 15 5 37Q17 44 24 58Q10 63 26 75Q39 65 50 59Q61 65 74 75Q90 63 76 58Q83 44 95 37Q82 15 50 48Z" fill="${a}"/><circle cx="50" cy="48" r="15" fill="${b}"/><circle cx="44" cy="46" r="3" fill="${s}"/><circle cx="56" cy="46" r="3" fill="${s}"/>`,dir)}
  function skeleton(dir,c){const [a,b,s]=c;if(dir==='n')return wrap(`<circle cx="50" cy="30" r="18" fill="${a}"/><path d="M50 47V73M32 58L68 58M40 72L31 94M60 72L69 94" stroke="${a}" stroke-width="8" stroke-linecap="round"/><path d="M32 52L20 72" stroke="${b}" stroke-width="5"/>`,dir);if(dir==='e'||dir==='w')return wrap(`<circle cx="57" cy="30" r="18" fill="${a}"/><circle cx="65" cy="29" r="4" fill="#24231f"/><path d="M53 47L49 73M37 57L69 61M43 72L34 94M56 73L65 94" stroke="${a}" stroke-width="8" stroke-linecap="round"/><path d="M34 54L18 73" stroke="${b}" stroke-width="5"/>`,dir);return wrap(`<circle cx="50" cy="30" r="18" fill="${a}"/><circle cx="43" cy="28" r="4" fill="#24231f"/><circle cx="57" cy="28" r="4" fill="#24231f"/><path d="M42 39H58" stroke="${b}" stroke-width="3"/><path d="M50 47V73M32 58L68 58M40 72L31 94M60 72L69 94" stroke="${a}" stroke-width="8" stroke-linecap="round"/><path d="M32 52L20 72" stroke="${s}" stroke-width="5"/>`,dir)}
  function spider(dir,c){const [a,b,s]=c;if(dir==='n')return wrap(`<ellipse cx="50" cy="54" rx="20" ry="25" fill="${a}"/><circle cx="50" cy="34" r="15" fill="${b}"/><path d="M32 45L10 27M30 55L5 52M32 65L10 82M68 45L90 27M70 55L95 52M68 65L90 82" stroke="${s}" stroke-width="5"/>`,dir);if(dir==='e'||dir==='w')return wrap(`<ellipse cx="48" cy="57" rx="24" ry="19" fill="${a}"/><circle cx="67" cy="44" r="14" fill="${b}"/><circle cx="75" cy="42" r="3" fill="#ddd"/><path d="M31 49L8 31M29 58L5 58M31 67L10 84M65 56L89 38M67 63L94 62M63 70L87 85" stroke="${s}" stroke-width="5"/>`,dir);return wrap(`<ellipse cx="50" cy="57" rx="24" ry="20" fill="${a}"/><circle cx="50" cy="39" r="15" fill="${b}"/><g fill="#ddd"><circle cx="43" cy="37" r="2.5"/><circle cx="50" cy="35" r="2.5"/><circle cx="57" cy="37" r="2.5"/></g><path d="M31 49L8 31M29 58L5 58M31 67L10 84M69 49L92 31M71 58L95 58M69 67L90 84" stroke="${s}" stroke-width="5"/>`,dir)}
  function brute(dir,c,kind){const [a,b,s]=c,stone=kind==='石像兵',troll=kind==='洞窟トロル';const head=troll?24:stone?20:22,body=troll?'M17 84Q20 48 50 43Q80 48 83 84Z':'M23 84Q26 50 50 44Q74 50 77 84Z';if(dir==='n')return wrap(`<path d="${body}" fill="${a}"/><circle cx="50" cy="33" r="${head}" fill="${a}"/><path d="M32 79L25 96M68 79L75 96" stroke="${b}" stroke-width="11"/><path d="M31 56L12 75M69 56L88 75" stroke="${b}" stroke-width="10"/>`,dir);if(dir==='e'||dir==='w')return wrap(`<path d="${body}" fill="${a}"/><circle cx="59" cy="34" r="${head}" fill="${a}"/><circle cx="70" cy="33" r="3" fill="#111"/><path d="M36 80L29 96M63 80L70 96" stroke="${b}" stroke-width="11"/><path d="M35 58L14 76M70 57L90 74" stroke="${b}" stroke-width="10"/>`,dir);return wrap(`<path d="${body}" fill="${a}"/><circle cx="50" cy="33" r="${head}" fill="${a}"/><circle cx="42" cy="31" r="3" fill="#111"/><circle cx="58" cy="31" r="3" fill="#111"/><path d="M39 45Q50 50 61 45" stroke="${s}" stroke-width="4" fill="none"/><path d="M32 79L25 96M68 79L75 96" stroke="${b}" stroke-width="11"/><path d="M31 56L12 75M69 56L88 75" stroke="${b}" stroke-width="10"/>`,dir)}
  function svg(name,dir){const c=palette[name];if(!c||name==='緑小鬼')return null;if(name==='洞窟コウモリ')return bat(dir,c);if(name==='骸骨兵')return skeleton(dir,c);if(name==='毒蜘蛛')return spider(dir,c);return brute(dir,c,name)}
  function refresh(el){
    const name=el.title,dir=facing(el),sig=name+'-'+dir;
    if(el.dataset.fullSprite===sig)return;
    el.dataset.fullSprite=sig;
    const hp=el.querySelector('.enemyHp')?.outerHTML||'';
    if(name==='緑小鬼'){
      el.innerHTML=`<span class="enemyGlyph directionalEnemy"><img class="enemySprite256 goblin256" src="${GOBLIN[dir]||GOBLIN.s}" alt=""></span>${hp}`;
      return;
    }
    const art=svg(name,dir);if(!art)return;
    el.innerHTML=`<span class="enemyGlyph directionalEnemy">${art}</span>${hp}`;
  }
  function refreshAll(){document.querySelectorAll('.entity.enemy').forEach(refresh)}
  const obs=new MutationObserver(()=>requestAnimationFrame(refreshAll));window.addEventListener('DOMContentLoaded',()=>{const b=document.getElementById('board');if(b)obs.observe(b,{childList:true,subtree:true});refreshAll()});
})();