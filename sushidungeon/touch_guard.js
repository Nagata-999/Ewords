'use strict';
(function(){
  const isGameTarget=t=>!!t?.closest?.('.app,.controls,.dpad,.actions,#boardWrap,.miniMap,button,dialog');
  const stop=e=>{if(isGameTarget(e.target))e.preventDefault()};
  document.addEventListener('gesturestart',stop,{passive:false});
  document.addEventListener('gesturechange',stop,{passive:false});
  document.addEventListener('dblclick',stop,{passive:false});
  document.addEventListener('selectstart',stop,{passive:false});
  document.addEventListener('contextmenu',stop,{passive:false});
  document.addEventListener('dragstart',stop,{passive:false});
  document.addEventListener('selectionchange',()=>{
    const s=window.getSelection?.();
    if(!s||s.isCollapsed)return;
    const n=s.anchorNode?.nodeType===1?s.anchorNode:s.anchorNode?.parentElement;
    if(n?.closest?.('.app,dialog'))s.removeAllRanges();
  });
})();
