'use strict';
(() => {
  if(typeof avatarSVG!=='function') return;
  const KEY='sushitan_login_bonus_v1';
  const EXPRESSIONS=['ふつう','にこにこ','ドヤ顔','びっくり','ねむそう'];
  const PETS=['なし','ねこ','すし','スライム','恐竜'];
  const AURAS=['なし','キラキラ','炎','電気','桜'];
  const base=avatarSVG;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function extras(a){
    const expression=Math.max(0,Math.min(EXPRESSIONS.length-1,Number(a.expression)||0));
    const pet=Math.max(0,Math.min(PETS.length-1,Number(a.pet)||0));
    const aura=Math.max(0,Math.min(AURAS.length-1,Number(a.aura)||0));
    let s='';
    if(aura===1)s+='<g font-size="18"><text x="39" y="62">✦</text><text x="184" y="90">✨</text><text x="45" y="177">✧</text><text x="177" y="205">✦</text></g>';
    if(aura===2)s+='<g font-size="23"><text x="38" y="178">🔥</text><text x="178" y="178">🔥</text><text x="57" y="229">🔥</text><text x="159" y="229">🔥</text></g>';
    if(aura===3)s+='<g font-size="21"><text x="43" y="102">⚡</text><text x="180" y="128">⚡</text><text x="50" y="218">⚡</text></g>';
    if(aura===4)s+='<g font-size="18"><text x="43" y="72">🌸</text><text x="181" y="112">🌸</text><text x="50" y="201">🌸</text></g>';
    if(pet){const p=['','🐱','🍣','🟢','🦖'][pet];s+=`<g><ellipse cx="194" cy="251" rx="25" ry="7" fill="#000" opacity=".09"/><text x="174" y="247" font-size="35">${p}</text></g>`;}
    if(expression===1)s+='<g fill="none" stroke="#8b4f43" stroke-width="3" stroke-linecap="round"><path d="M103 108 Q120 124 137 108"/></g><g fill="#e9958c" opacity=".5"><ellipse cx="91" cy="106" rx="8" ry="4"/><ellipse cx="149" cy="106" rx="8" ry="4"/></g>';
    if(expression===2)s+='<g fill="none" stroke="#354b47" stroke-width="3" stroke-linecap="round"><path d="M88 86 Q98 80 107 86"/><path d="M133 86 Q143 80 152 86"/></g><path d="M108 112 Q121 119 134 110" fill="none" stroke="#8b4f43" stroke-width="3" stroke-linecap="round"/>';
    if(expression===3)s+='<g fill="#354b47"><circle cx="98" cy="91" r="5"/><circle cx="142" cy="91" r="5"/></g><ellipse cx="120" cy="113" rx="7" ry="9" fill="#8b4f43"/>';
    if(expression===4)s+='<g fill="none" stroke="#354b47" stroke-width="3" stroke-linecap="round"><path d="M89 92 Q98 87 107 92"/><path d="M133 92 Q142 87 151 92"/></g><path d="M112 113 Q120 109 128 113" fill="none" stroke="#8b4f43" stroke-width="3" stroke-linecap="round"/>';
    return s;
  }
  avatarSVG=function funAvatarSVG(value=DEFAULT_AVATAR,previewId){const a={...DEFAULT_AVATAR,...value};let svg=base(value,previewId);const x=extras(a);return x?svg.replace(/<\/svg>\s*$/,x+'</svg>'):svg;};
  window.SushiAvatarFun={expressions:EXPRESSIONS,pets:PETS,auras:AURAS};

  function ledger(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
  function save(key,value){const l=ledger();l.gacha=l.gacha||{};l.gacha.avatar=l.gacha.avatar||{};l.gacha.avatar[key]=value;localStorage.setItem(KEY,JSON.stringify(l));window.dispatchEvent(new Event('focus'));}
  function addControls(){const box=document.getElementById('customizer');if(!box||box.querySelector('.avatarFunControl'))return;const l=ledger(),a=l.gacha?.avatar||{};[['expression','表情',EXPRESSIONS],['pet','ペット',PETS],['aura','オーラ',AURAS]].forEach(([key,label,names])=>{const v=Math.max(0,Math.min(names.length-1,Number(a[key])||0)),b=document.createElement('button');b.className='part avatarFunControl';b.innerHTML=`<small>${esc(label)} ↻</small><b>${esc(names[v])}</b>`;b.onclick=()=>save(key,(v+1)%names.length);box.append(b);});}
  }
  addControls();new MutationObserver(addControls).observe(document.documentElement,{childList:true,subtree:true});
})();
