/* Reserve the shared navigation area without changing game state or saved data. */
(()=>{
  if(window.__sushiSiteLayoutLoaded)return;
  window.__sushiSiteLayoutLoaded=true;
  const css=document.createElement('style');
  css.textContent=`
    :root{--sushi-taskbar-space:calc(76px + max(8px,env(safe-area-inset-bottom)));--sushi-page-height:calc(100dvh - var(--sushi-taskbar-space))}
    html{scroll-padding-bottom:calc(var(--sushi-taskbar-space) + 16px)}
    body.sushi-taskbar-on{padding-bottom:var(--sushi-taskbar-space)}
    .sushi-viewport-root{height:var(--sushi-page-height)!important;min-height:0!important;box-sizing:border-box}
    .sushi-scroll-game{overflow-y:auto!important;overscroll-behavior:contain}
    .sushi-safe-overlay{bottom:var(--sushi-taskbar-space)!important;height:auto!important;max-height:var(--sushi-page-height)!important;box-sizing:border-box;overflow-y:auto;overscroll-behavior:contain}
    .sushi-safe-panel{max-height:calc(var(--sushi-page-height) - 32px)!important;min-height:0!important;overflow-y:auto!important;overscroll-behavior:contain;box-sizing:border-box}
    body.sushi-taskbar-on #homeAvatarWalker,body.sushi-taskbar-on #sushiAvatarWidget{bottom:var(--sushi-taskbar-space)!important}
    body.sushi-taskbar-on #sushiGemToast{bottom:calc(var(--sushi-taskbar-space) + 8px)!important}
    body.sushi-taskbar-on #sushiSyncButton{bottom:calc(var(--sushi-taskbar-space) + 8px)!important}
    body.sushi-taskbar-on .ssp-card,body.sushi-taskbar-on .slb-card{max-height:calc(100dvh - 24px);overflow-y:auto;box-sizing:border-box}
    #sushiDailySheet .sdq-card{max-height:calc(100dvh - 16px);box-sizing:border-box}
    #sushiTaskbar a:focus-visible,#sushiTaskbar button:focus-visible{outline:3px solid #ea580c;outline-offset:-4px;border-radius:12px}
    body.sushi-taskbar-on .side-menu{height:var(--sushi-page-height)!important;max-height:var(--sushi-page-height);overflow-y:auto;box-sizing:border-box}
    @media(max-width:600px){:root{--sushi-taskbar-space:calc(60px + env(safe-area-inset-bottom))}}
    @media print{#sushiTaskbar,#sushiDailySheet,#sushiTaskToast{display:none!important}:root{--sushi-taskbar-space:0px}body.sushi-taskbar-on{padding-bottom:0!important}}
  `;
  document.head.append(css);
  const route=decodeURIComponent(location.pathname).replace(/\.html$/,'').toLowerCase();
  const roots={sushitan:'.app',shinotan:'.app',antonitan:'.app',sharitan:'.app',sushi_blast:'.app',sushigiri:'#game',sushi_run:'#game',sushi_survivor:'#app',sushicross:'#game, #hud','sushi-run3d':'#world'};
  const name=route.split('/').filter(Boolean).pop()||'index';
  for(const el of document.querySelectorAll(roots[name]||':not(*)'))el.classList.add('sushi-viewport-root');
  if(name==='sushi_blast')document.querySelector('.app')?.classList.add('sushi-scroll-game');
  if(/^\/sushiquest(?:\/|$)/.test(route))document.querySelector('.game')?.classList.add('sushi-viewport-root');
  // Only fixed viewport overlays are moved. Absolute overlays already follow their game root.
  const overlaySelector='.overlay,#overlay,.modal,.startOverlay,.screen,.titleScreen,.student-board,.display,.side-menu,.install-modal,.chest-modal,.weak-review-modal,.result-overlay,.review-overlay,.countdown-overlay,.shuffle-overlay,.discovery';
  const panelSelector='.modal,.modalbox,.modalCard,.startbox,.resultbox,.dialog,.panel-card,.modal-card,#overlay>.card,dialog';
  const bottomStyles=new WeakMap();
  function fit(){
    for(const el of document.querySelectorAll(overlaySelector)){
      const s=getComputedStyle(el);
      if(s.position==='fixed'&&s.top!=='auto'&&s.bottom!=='auto')el.classList.add('sushi-safe-overlay');
    }
    for(const el of document.querySelectorAll(panelSelector)){
      if(el.closest('#sushiDailySheet,#sushiTaskbar'))continue;
      if(!el.classList.contains('sushi-safe-overlay')&&(el.matches('dialog')||el.closest('.overlay,#overlay,.modal,.startOverlay,.result-overlay,.review-overlay')))el.classList.add('sushi-safe-panel');
    }
    for(const el of document.querySelectorAll('#controls,#controlBar,.controls,.tabs,.scaleDock,.answered-bar,#stage')){
      const original=bottomStyles.get(el);
      if(original)original.value?el.style.setProperty('bottom',original.value,original.priority):el.style.removeProperty('bottom');
      const s=getComputedStyle(el);
      if(s.position!=='fixed'||s.bottom==='auto')continue;
      if(!original)bottomStyles.set(el,{value:el.style.getPropertyValue('bottom'),priority:el.style.getPropertyPriority('bottom')});
      el.style.setProperty('bottom',`calc(var(--sushi-taskbar-space) + ${s.bottom})`,'important');
    }
  }
  fit();
  // Panels can be created after loading (rankings, review and game results).
  let pending=false;
  const watched=overlaySelector+','+panelSelector;
  new MutationObserver(records=>{if(pending||!records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches(watched)||n.querySelector(watched)))))return;pending=true;requestAnimationFrame(()=>{pending=false;fit();});}).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('resize',fit,{passive:true});
  window.dispatchEvent(new Event('resize'));
})();
