'use strict';
(() => {
  const LEDGER='sushitan_login_bonus_v1';

  function savedAvatar(){
    try{
      const raw=localStorage.getItem(LEDGER);
      if(!raw)return {...DEFAULT_AVATAR};
      const ledger=JSON.parse(raw);
      const old=ledger?.gacha?.avatar||{};
      const a={...DEFAULT_AVATAR,...old};
      if(old.outfit&&!old.top)a.top=old.outfit;
      delete a.outfit;
      return a;
    }catch(_e){return {...DEFAULT_AVATAR};}
  }

  function mount(){
    const top=document.querySelector('.miniTop');
    if(!top||document.getElementById('dungeonAvatar'))return;
    const link=document.createElement('a');
    link.id='dungeonAvatar';
    link.className='dungeonAvatar';
    link.href='../sushigacha/sushi-avatar.html';
    link.title='マイアバターを着せ替える';
    link.setAttribute('aria-label','マイアバターを着せ替える');
    link.innerHTML=avatarSVG(savedAvatar());
    const close=top.querySelector('a');
    top.insertBefore(link,close||null);
  }

  function refresh(){
    const el=document.getElementById('dungeonAvatar');
    if(el)el.innerHTML=avatarSVG(savedAvatar());
    else mount();
  }

  window.addEventListener('storage',e=>{if(e.key===LEDGER)refresh();});
  window.addEventListener('focus',refresh);
  window.addEventListener('pageshow',refresh);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
})();
