'use strict';
(function(){
  const skinPalette=['#f4cfae','#dba77f','#ac7657'];
  const hairPalette=['#493b32','#9b6241','#454e66'];
  function outfit(a){return (typeof ITEMS!=='undefined'&&ITEMS.find(x=>x.id===a.outfit&&x.slot==='outfit'))||{color:'#f6f1e4',accent:'#f4511e',kind:'tee'};}
  function avatarSide(a,flip=false){
    const skin=skinPalette[a.skin]||skinPalette[0],hair=hairPalette[a.hairColor]||hairPalette[0],it=outfit(a),c=it.color,ac=it.accent;
    const hairLong=[1,5,6,7,8,9].includes(+a.hair);
    const wing=a.accessory==='acc-wings'?`<path d="M104 126Q142 99 149 125Q141 144 105 153" fill="#f7f3dc" stroke="#c4ba83" stroke-width="3"/>`:'';
    const hat=a.hat?`<path d="M55 42Q80 19 113 42L107 52H51Z" fill="${ac}" stroke="#263a37" stroke-width="3"/>`:'';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 230" class="dirAvatar sideAvatar${flip?' flip':''}"><g>${wing}<path d="M74 122L45 143L39 202Q80 218 119 202L112 143L96 125Z" fill="${c}" stroke="#354b47" stroke-width="4"/><path d="M48 149L29 169L43 181L59 161" fill="${c}" stroke="#354b47" stroke-width="4"/><path d="M107 148L132 169L119 182L101 161" fill="${c}" stroke="#354b47" stroke-width="4"/><ellipse cx="82" cy="86" rx="40" ry="47" fill="${skin}" stroke="#354b47" stroke-width="4"/>${hairLong?`<path d="M51 79Q47 39 83 35Q121 35 125 77L119 135Q103 145 96 125L56 128Q44 140 43 121Z" fill="${hair}"/>`:`<path d="M48 81Q44 41 82 36Q121 34 124 78L109 65Q82 53 56 69Z" fill="${hair}"/>`}<path d="M88 91Q101 96 91 103" fill="none" stroke="#8f604c" stroke-width="3" stroke-linecap="round"/><ellipse cx="101" cy="84" rx="4" ry="6" fill="#35362f"/>${hat}<path d="M66 126Q83 137 100 126" fill="none" stroke="${ac}" stroke-width="5"/></g></svg>`;
  }
  function avatarBack(a){
    const skin=skinPalette[a.skin]||skinPalette[0],hair=hairPalette[a.hairColor]||hairPalette[0],it=outfit(a),c=it.color,ac=it.accent;
    const hairLong=[1,5,6,7,8,9].includes(+a.hair);
    const wing=a.accessory==='acc-wings'?`<path d="M75 135Q30 101 20 129Q24 155 69 167M105 135Q151 101 160 129Q156 155 111 167" fill="#f7f3dc" stroke="#c4ba83" stroke-width="3"/>`:'';
    const hat=a.hat?`<path d="M48 49Q88 22 132 49L125 61H53Z" fill="${ac}" stroke="#263a37" stroke-width="3"/>`:'';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 230" class="dirAvatar backAvatar"><g>${wing}<path d="M54 128L34 150L30 205Q90 222 150 205L145 150L126 128Z" fill="${c}" stroke="#354b47" stroke-width="4"/><ellipse cx="90" cy="87" rx="43" ry="49" fill="${skin}" stroke="#354b47" stroke-width="4"/>${hairLong?`<path d="M47 91Q39 35 90 31Q143 33 136 93L142 155Q119 167 108 145H73Q58 167 40 151Z" fill="${hair}"/>`:`<path d="M47 91Q42 39 90 34Q139 37 136 94L122 72Q89 60 57 75Z" fill="${hair}"/>`}<path d="M55 132Q90 151 126 132" fill="none" stroke="${ac}" stroke-width="5"/>${hat}</g></svg>`;
  }
  function playerGraphic(a,dir){if(dir==='s')return avatarSVG(a);if(dir==='n')return avatarBack(a);return avatarSide(a,dir==='w');}
  function ratSvg(dir){
    const side=dir==='e'||dir==='w';
    if(dir==='n')return `<svg viewBox="0 0 100 100" class="ratSprite"><ellipse cx="50" cy="58" rx="30" ry="25" fill="#796c63"/><circle cx="28" cy="31" r="14" fill="#8d7c70"/><circle cx="72" cy="31" r="14" fill="#8d7c70"/><ellipse cx="50" cy="48" rx="24" ry="24" fill="#85766d"/><path d="M50 62Q43 75 50 88Q57 75 50 62" fill="#5a4d47"/><path d="M29 67Q15 73 9 88M71 67Q85 73 91 88" stroke="#6b5d55" stroke-width="6" fill="none" stroke-linecap="round"/></svg>`;
    if(side)return `<svg viewBox="0 0 100 100" class="ratSprite ${dir==='w'?'flip':''}"><ellipse cx="46" cy="61" rx="30" ry="22" fill="#796c63"/><circle cx="61" cy="37" r="13" fill="#8d7c70"/><ellipse cx="68" cy="52" rx="22" ry="19" fill="#85766d"/><circle cx="78" cy="49" r="3" fill="#191919"/><path d="M87 57L96 60L88 64Z" fill="#d5968f"/><path d="M18 62Q2 54 5 39" stroke="#957f73" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M38 77L31 91M61 77L66 91" stroke="#62544e" stroke-width="6" stroke-linecap="round"/></svg>`;
    return `<svg viewBox="0 0 100 100" class="ratSprite"><ellipse cx="50" cy="62" rx="28" ry="24" fill="#796c63"/><circle cx="27" cy="34" r="14" fill="#8d7c70"/><circle cx="73" cy="34" r="14" fill="#8d7c70"/><ellipse cx="50" cy="50" rx="25" ry="23" fill="#85766d"/><circle cx="41" cy="49" r="4" fill="#191919"/><circle cx="59" cy="49" r="4" fill="#191919"/><ellipse cx="50" cy="61" rx="5" ry="4" fill="#d5968f"/><path d="M45 68Q50 72 55 68" stroke="#594b45" stroke-width="2" fill="none"/><path d="M21 61H40M60 61H79M20 68H40M60 68H80" stroke="#b9a99d" stroke-width="2"/></svg>`;
  }
  function dirFromClass(el){for(const d of ['n','e','s','w'])if(el.classList.contains('facing-'+d))return d;return 's';}
  function refreshEntity(el){
    const dir=dirFromClass(el);
    if(el.classList.contains('player')){
      const sig='p-'+dir+'-'+JSON.stringify(readAvatar());if(el.dataset.dirSig===sig)return;el.dataset.dirSig=sig;el.innerHTML=playerGraphic(readAvatar(),dir);
    }else if(el.classList.contains('enemy')&&el.title==='洞窟ネズミ'){
      const sig='r-'+dir;if(el.dataset.dirSig===sig)return;el.dataset.dirSig=sig;const hp=el.querySelector('.enemyHp')?.outerHTML||'';el.innerHTML=`<span class="enemyGlyph directionalEnemy">${ratSvg(dir)}</span>${hp}`;
    }
  }
  function refresh(){document.querySelectorAll('.entity.player,.entity.enemy').forEach(refreshEntity);}
  const obs=new MutationObserver(()=>requestAnimationFrame(refresh));
  window.addEventListener('DOMContentLoaded',()=>{obs.observe(document.getElementById('board'),{childList:true,subtree:true});refresh();});
})();
