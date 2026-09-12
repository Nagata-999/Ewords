'use strict';
(function(){
  const isGameTarget=t=>!!t?.closest?.('.controls,.dpad,.actions,#boardWrap,.miniMap,button');
  document.addEventListener('gesturestart',e=>{if(isGameTarget(e.target))e.preventDefault()},{passive:false});
  document.addEventListener('gesturechange',e=>{if(isGameTarget(e.target))e.preventDefault()},{passive:false});
  document.addEventListener('dblclick',e=>{if(isGameTarget(e.target))e.preventDefault()},{passive:false});
})();
