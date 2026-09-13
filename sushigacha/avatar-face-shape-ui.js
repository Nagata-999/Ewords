'use strict';
(() => {
  const LEDGER='sushitan_login_bonus_v1';
  const names=window.SushiAvatarFaceShape?.names||['標準','丸顔','卵型','シャープ','面長'];

  function read(){
    try{return JSON.parse(localStorage.getItem(LEDGER)||'{}');}catch(_e){return {};}
  }
  function current(){
    const n=read()?.gacha?.avatar?.faceShape;
    return Number.isInteger(n)&&n>=0&&n<names.length?n:0;
  }
  function save(next){
    const ledger=read();
    ledger.gacha=ledger.gacha&&typeof ledger.gacha==='object'?ledger.gacha:{};
    ledger.gacha.avatar=ledger.gacha.avatar&&typeof ledger.gacha.avatar==='object'?ledger.gacha.avatar:{};
    ledger.gacha.avatar.faceShape=next;
    localStorage.setItem(LEDGER,JSON.stringify(ledger));
  }
  function ensure(){
    const host=document.getElementById('customizer');
    if(!host||host.querySelector('.faceShapePart')) return;
    const b=document.createElement('button');
    b.className='part faceShapePart';
    const n=current();
    b.innerHTML=`<small>輪郭 ↻</small><b>${names[n]}</b>`;
    b.setAttribute('aria-label',`輪郭：${names[n]}。次の輪郭へ`);
    b.onclick=()=>{
      const next=(current()+1)%names.length;
      save(next);
      window.dispatchEvent(new Event('focus'));
      requestAnimationFrame(ensure);
    };
    host.appendChild(b);
  }
  const host=document.getElementById('customizer');
  if(host){
    new MutationObserver(()=>ensure()).observe(host,{childList:true});
    ensure();
  }
})();
