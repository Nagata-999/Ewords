'use strict';
(function(){
  const isGameTarget=t=>!!t?.closest?.('.app,.controls,.dpad,.actions,#boardWrap,.miniMap,button,dialog');
  const stop=e=>{if(isGameTarget(e.target))e.preventDefault()};
  const clearSelection=()=>{const s=window.getSelection?.();if(s&&!s.isCollapsed)s.removeAllRanges()};
  document.addEventListener('gesturestart',stop,{passive:false,capture:true});
  document.addEventListener('gesturechange',stop,{passive:false,capture:true});
  document.addEventListener('dblclick',e=>{if(isGameTarget(e.target)){e.preventDefault();clearSelection()}},{passive:false,capture:true});
  document.addEventListener('selectstart',e=>{if(isGameTarget(e.target)){e.preventDefault();clearSelection()}},{passive:false,capture:true});
  document.addEventListener('contextmenu',stop,{passive:false,capture:true});
  document.addEventListener('dragstart',stop,{passive:false,capture:true});
  document.addEventListener('selectionchange',clearSelection);
  document.addEventListener('touchstart',e=>{if(isGameTarget(e.target))clearSelection()},{passive:true,capture:true});
  document.addEventListener('touchend',e=>{if(isGameTarget(e.target))setTimeout(clearSelection,0)},{passive:true,capture:true});
})();
