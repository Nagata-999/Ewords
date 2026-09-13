'use strict';
(function(){
  const NAMES=new Set(['水スライム','水路コウモリ','毒ヒル','沼ゴブリン','錆びた鎧兵']);
  function dir(el){for(const d of ['n','e','s','w'])if(el.classList.contains('facing-'+d))return d;return 's'}
  function svg(body,cls='zone2Sprite'){return `<svg viewBox="0 0 100 100" class="${cls}" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${body}</svg>`}
  const eye=(x,y)=>`<ellipse cx="${x}" cy="${y}" rx="3" ry="5" fill="#07121d"/><circle cx="${x-1}" cy="${y-2}" r="1" fill="#dff8ff"/>`;
  function slime(d){
    if(d==='n')return svg(`<ellipse cx="50" cy="86" rx="35" ry="7" fill="#207dc0" opacity=".55"/><path d="M18 82Q23 43 50 34Q77 43 82 82Q70 90 50 89Q30 90 18 82Z" fill="#39aef0" stroke="#0c5d9b" stroke-width="4"/><path d="M31 56Q40 42 55 42" fill="none" stroke="#bcecff" stroke-width="6" stroke-linecap="round" opacity=".8"/><circle cx="69" cy="57" r="5" fill="#258fd0"/>`);
    if(d==='e')return svg(`<ellipse cx="48" cy="86" rx="36" ry="7" fill="#207dc0" opacity=".55"/><path d="M15 82Q20 48 47 37Q71 38 84 65Q88 78 77 85Q47 91 15 82Z" fill="#39aef0" stroke="#0c5d9b" stroke-width="4"/><path d="M34 52Q45 42 58 44" fill="none" stroke="#c7f1ff" stroke-width="6" stroke-linecap="round"/>${eye(72,62)}`);
    if(d==='w')return svg(`<ellipse cx="52" cy="86" rx="36" ry="7" fill="#207dc0" opacity=".55"/><path d="M85 82Q80 48 53 37Q29 38 16 65Q12 78 23 85Q53 91 85 82Z" fill="#39aef0" stroke="#0c5d9b" stroke-width="4"/><path d="M66 52Q55 42 42 44" fill="none" stroke="#c7f1ff" stroke-width="6" stroke-linecap="round"/>${eye(28,62)}`);
    return svg(`<ellipse cx="50" cy="86" rx="36" ry="7" fill="#207dc0" opacity=".55"/><path d="M16 82Q21 44 50 35Q79 44 84 82Q72 90 50 89Q28 90 16 82Z" fill="#39aef0" stroke="#0c5d9b" stroke-width="4"/><path d="M30 53Q40 40 53 42" fill="none" stroke="#c7f1ff" stroke-width="6" stroke-linecap="round"/>${eye(38,65)}${eye(62,65)}`)
  }
  function bat(d){
    if(d==='n')return svg(`<path d="M47 46L18 30L8 47L27 50L13 66L39 61M53 46L82 30L92 47L73 50L87 66L61 61" fill="#31375d" stroke="#171b35" stroke-width="4"/><ellipse cx="50" cy="57" rx="14" ry="23" fill="#343a64"/><path d="M43 38L47 25L52 39L58 25L60 43" fill="#343a64" stroke="#171b35" stroke-width="4"/>`);
    const side=d==='e'||d==='w',flip=d==='w'?'transform="translate(100 0) scale(-1 1)"':'';
    if(side)return svg(`<g ${flip}><path d="M43 51L13 29L8 48L27 51L15 68L45 62M57 51L82 35L93 52L74 55L87 69L60 63" fill="#3a3f70" stroke="#171b35" stroke-width="4"/><ellipse cx="54" cy="57" rx="14" ry="22" fill="#343a64"/><path d="M60 39L67 27L70 43" fill="#343a64" stroke="#171b35" stroke-width="4"/>${eye(67,49)}<circle cx="68" cy="49" r="2" fill="#ff4c50"/></g>`);
    return svg(`<path d="M43 49L15 28L7 47L27 51L12 67L41 61M57 49L85 28L93 47L73 51L88 67L59 61" fill="#3d4277" stroke="#171b35" stroke-width="4"/><ellipse cx="50" cy="58" rx="15" ry="23" fill="#343a64"/><path d="M39 43L42 27L50 39L58 27L61 43" fill="#343a64" stroke="#171b35" stroke-width="4"/><circle cx="44" cy="51" r="3" fill="#ff4148"/><circle cx="56" cy="51" r="3" fill="#ff4148"/><path d="M43 64Q50 70 57 64" fill="none" stroke="#eee" stroke-width="2"/>`)
  }
  function leech(d){
    if(d==='n')return svg(`<ellipse cx="50" cy="78" rx="28" ry="15" fill="#687531" stroke="#30381c" stroke-width="4"/><path d="M27 74Q34 39 50 34Q66 39 73 74" fill="#78843a" stroke="#30381c" stroke-width="4"/><path d="M34 48H66M30 58H70M28 68H72" stroke="#a4a94b" stroke-width="4" opacity=".7"/>`);
    const flip=d==='w'?'transform="translate(100 0) scale(-1 1)"':'';
    if(d==='e'||d==='w')return svg(`<g ${flip}><path d="M14 80Q25 58 51 50Q72 44 87 58Q80 76 61 83Q35 90 14 80Z" fill="#778338" stroke="#30381c" stroke-width="4"/><ellipse cx="76" cy="61" rx="13" ry="15" fill="#d48777" stroke="#3b241e" stroke-width="4"/><ellipse cx="77" cy="61" rx="7" ry="9" fill="#34191a"/><path d="M73 54L75 58M82 55L79 59M83 66L79 63M72 68L75 64" stroke="#f2d4b7" stroke-width="2"/></g>`);
    return svg(`<path d="M22 80Q25 47 50 38Q75 47 78 80Q67 89 50 89Q33 89 22 80Z" fill="#778338" stroke="#30381c" stroke-width="4"/><ellipse cx="50" cy="62" rx="17" ry="18" fill="#d48777" stroke="#3b241e" stroke-width="4"/><ellipse cx="50" cy="62" rx="9" ry="11" fill="#321719"/><path d="M43 50L47 56M57 50L53 56M62 60L55 61M59 72L53 66M41 72L47 66M38 60L45 61" stroke="#f4d9bd" stroke-width="2"/>`)
  }
  function goblin(d){
    const back=d==='n',side=d==='e'||d==='w',flip=d==='w'?'transform="translate(100 0) scale(-1 1)"':'';
    if(side)return svg(`<g ${flip}><path d="M38 36L25 25L29 45Q22 55 27 70L22 87H37L43 70H60L66 88H80L70 67Q76 50 62 41L59 25L50 38Z" fill="#6f8b45" stroke="#29351f" stroke-width="4"/><path d="M46 48L65 50L73 58L62 64L45 61Z" fill="#7f994e"/>${eye(64,52)}<path d="M73 41L78 82" stroke="#76512e" stroke-width="5"/><path d="M78 38L83 29L87 39Z" fill="#d9d4bf" stroke="#5b5548" stroke-width="2"/></g>`);
    if(back)return svg(`<path d="M31 43L23 28L39 36Q50 29 61 36L77 28L69 43Q76 56 69 72L76 89H59L55 72H45L41 89H24L31 71Q24 56 31 43Z" fill="#617d3e" stroke="#29351f" stroke-width="4"/><path d="M32 57Q50 66 68 57V73Q50 80 32 73Z" fill="#55472f"/><path d="M78 39L82 83" stroke="#76512e" stroke-width="5"/>`);
    return svg(`<path d="M31 43L22 28L39 35Q50 28 61 35L78 28L69 43Q77 56 69 72L76 89H59L55 72H45L41 89H24L31 71Q23 56 31 43Z" fill="#718d46" stroke="#29351f" stroke-width="4"/>${eye(41,51)}${eye(59,51)}<path d="M41 63Q50 69 59 63" fill="none" stroke="#29351f" stroke-width="3"/><path d="M76 38L81 84" stroke="#76512e" stroke-width="5"/><path d="M76 38L82 26L88 39Z" fill="#ded8c5" stroke="#5b5548" stroke-width="2"/>`)
  }
  function armor(d){
    const back=d==='n',side=d==='e'||d==='w',flip=d==='w'?'transform="translate(100 0) scale(-1 1)"':'';
    if(side)return svg(`<g ${flip}><ellipse cx="51" cy="39" rx="18" ry="17" fill="#8b624d" stroke="#3e302b" stroke-width="4"/><path d="M38 35H67V45H38Z" fill="#28282b"/><path d="M35 54Q51 46 66 54L72 79H59L58 92H46L43 79H31Z" fill="#8f664f" stroke="#3e302b" stroke-width="4"/><ellipse cx="73" cy="66" rx="13" ry="18" fill="#9b6b4d" stroke="#49362d" stroke-width="4"/><path d="M26 52L17 87" stroke="#b8b1a0" stroke-width="5"/><path d="M18 49L24 37L28 52Z" fill="#d4cfc1"/></g>`);
    if(back)return svg(`<ellipse cx="50" cy="38" rx="19" ry="17" fill="#805b48" stroke="#3e302b" stroke-width="4"/><path d="M32 55Q50 46 68 55L72 80H59L57 93H44L42 80H28Z" fill="#855f4b" stroke="#3e302b" stroke-width="4"/><path d="M34 61Q50 68 66 61" fill="none" stroke="#b27b58" stroke-width="4"/><ellipse cx="77" cy="67" rx="13" ry="19" fill="#8f6349" stroke="#49362d" stroke-width="4"/>`);
    return svg(`<ellipse cx="50" cy="38" rx="19" ry="18" fill="#94684f" stroke="#3e302b" stroke-width="4"/><path d="M32 34H68V45H32Z" fill="#24262a"/><path d="M38 38H44M49 38H55M60 38H65" stroke="#d4b18d" stroke-width="2"/><path d="M32 55Q50 46 68 55L72 80H59L57 93H44L42 80H28Z" fill="#9b6c50" stroke="#3e302b" stroke-width="4"/><ellipse cx="76" cy="67" rx="14" ry="20" fill="#a06d4d" stroke="#49362d" stroke-width="4"/><circle cx="76" cy="67" r="7" fill="none" stroke="#c48a61" stroke-width="3"/><path d="M24 52L16 88" stroke="#bdb6a5" stroke-width="5"/><path d="M17 49L23 36L28 51Z" fill="#d6d0c1" stroke="#5b5548" stroke-width="2"/>`)
  }
  const art={'水スライム':slime,'水路コウモリ':bat,'毒ヒル':leech,'沼ゴブリン':goblin,'錆びた鎧兵':armor};
  function paint(el){const name=el.title;if(!NAMES.has(name))return;const d=dir(el),sig=`z2-${name}-${d}`;if(el.dataset.zone2Sprite===sig)return;el.dataset.zone2Sprite=sig;const hp=el.querySelector('.enemyHp')?.outerHTML||'';el.innerHTML=`<span class="enemyGlyph directionalEnemy zone2Rendered">${art[name](d)}</span>${hp}`}
  function paintAll(){document.querySelectorAll('.entity.enemy').forEach(paint)}
  let queued=false;function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;paintAll()})}
  const obs=new MutationObserver(queue);
  window.addEventListener('DOMContentLoaded',()=>{const b=document.getElementById('board');if(b)obs.observe(b,{childList:true,subtree:true,attributes:true,attributeFilter:['class','title']});paintAll()});
})();