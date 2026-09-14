'use strict';
(()=>{
  if(window.__sushiDailyClickBridgeLoaded)return;
  window.__sushiDailyClickBridgeLoaded=true;

  const page=decodeURIComponent((location.pathname.split('/').pop()||'').toLowerCase());
  const map={
    'sushitan.html':'sushitan',
    'shinotan.html':'shino',
    'antonitan.html':'antoni'
  };
  const quest=map[page];
  if(!quest)return;

  function getApi(){return window.SushiDailyQuest&&typeof window.SushiDailyQuest.state==='function'?window.SushiDailyQuest:null}

  document.addEventListener('click',e=>{
    const btn=e.target.closest?.('.balloon[data-type="correct"]');
    if(!btn||btn.dataset.dailyQuestChecked==='1')return;
    btn.dataset.dailyQuestChecked='1';

    const api=getApi();
    const before=api?.state?.().progress?.[quest]??null;

    // Existing taskbar observer gets first chance. If it misses the correct answer,
    // this bridge records exactly one answer after the game's correct animation starts.
    setTimeout(()=>{
      const currentApi=getApi();
      if(!currentApi)return;
      const now=currentApi.state().progress?.[quest]??0;
      if(before===null||now<=before)currentApi.add(quest,1);
    },220);
  },true);
})();