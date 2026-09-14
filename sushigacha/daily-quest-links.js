'use strict';
(()=>{
  if(window.__sushiDailyQuestLinksLoaded)return;
  window.__sushiDailyQuestLinksLoaded=true;
  const ROUTES={
    'すし単':'/sushitan.html',
    'しの単':'/shinotan.html',
    'あんとに単':'/antonitan.html',
    'すしイディオム':'/sushi_idiom%20(1).html',
    'すしクイズ':'/sushi_quiz.html',
    'すしTalk':'/sushitalk.html',
    'す界し':'/sukaishi_world_study_v03.html',
    'すしRUN':'/sushi_run.html'
  };
  function wire(){
    document.querySelectorAll('#sdqRows .sdq-row').forEach(row=>{
      if(row.dataset.dailyLinked==='1')return;
      const name=row.querySelector('.sdq-name')?.textContent?.trim();
      const href=ROUTES[name];
      if(!href)return;
      row.dataset.dailyLinked='1';
      row.setAttribute('role','link');
      row.setAttribute('tabindex','0');
      row.style.cursor='pointer';
      row.style.position='relative';
      row.title=`${name}を開く`;
      const reward=row.querySelector('.sdq-reward');
      if(reward&&!reward.querySelector('.sdq-go')){
        const go=document.createElement('span');
        go.className='sdq-go';
        go.textContent='  ›';
        go.style.cssText='font-size:18px;color:#c76525;vertical-align:-1px';
        reward.appendChild(go);
      }
      const go=()=>{location.href=href};
      row.addEventListener('click',go);
      row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}});
    });
  }
  const mo=new MutationObserver(wire);
  mo.observe(document.documentElement,{subtree:true,childList:true});
  wire();
})();