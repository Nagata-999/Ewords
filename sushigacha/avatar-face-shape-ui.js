'use strict';
(() => {
  const LEDGER='sushitan_login_bonus_v1';
  const faceNames=window.SushiAvatarFaceShape?.names||['標準','丸顔','シャープ'];
  const pets=window.SushiAvatarFun?.pets||['なし','ねこ','すし','スライム','恐竜'];
  const auras=window.SushiAvatarFun?.auras||['なし','キラキラ','炎','電気','桜'];
  function read(){try{return JSON.parse(localStorage.getItem(LEDGER)||'{}');}catch(_e){return {};}}
  function get(key,names){const n=read()?.gacha?.avatar?.[key];return Number.isInteger(n)&&n>=0&&n<names.length?n:0;}
  function save(key,next){const ledger=read();ledger.gacha=ledger.gacha&&typeof ledger.gacha==='object'?ledger.gacha:{};ledger.gacha.avatar=ledger.gacha.avatar&&typeof ledger.gacha.avatar==='object'?ledger.gacha.avatar:{};ledger.gacha.avatar[key]=next;localStorage.setItem(LEDGER,JSON.stringify(ledger));window.dispatchEvent(new Event('focus'));}
  function button(host,cls,key,label,names){if(host.querySelector('.'+cls))return;const b=document.createElement('button');b.className='part '+cls;const n=get(key,names);b.innerHTML=`<small>${label} ↻</small><b>${names[n]}</b>`;b.setAttribute('aria-label',`${label}：${names[n]}。次へ`);b.onclick=()=>save(key,(get(key,names)+1)%names.length);host.appendChild(b);}
  function ensure(){const host=document.getElementById('customizer');if(!host)return;button(host,'faceShapePart','faceShape','輪郭',faceNames);button(host,'petPart','pet','ペット',pets);button(host,'auraPart','aura','オーラ',auras);}
  const host=document.getElementById('customizer');if(host){new MutationObserver(ensure).observe(host,{childList:true});ensure();}
})();
