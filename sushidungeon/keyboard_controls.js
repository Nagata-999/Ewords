'use strict';
(function(){
  const MOVE_KEYS={
    ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],
    w:[0,-1],W:[0,-1],s:[0,1],S:[0,1],a:[-1,0],A:[-1,0],d:[1,0],D:[1,0],
    q:[-1,-1],Q:[-1,-1],e:[1,-1],E:[1,-1],z:[-1,1],Z:[-1,1],c:[1,1],C:[1,1]
  };
  function modalOpen(){
    return ['wordDialog','inventoryDialog','stairsDialog','keepDialog','gameOverDialog','logDialog','mapDialog']
      .some(id=>document.getElementById(id)?.open);
  }
  function editableTarget(t){
    return !!t?.closest?.('input,textarea,select,[contenteditable="true"]');
  }
  function press(id){document.getElementById(id)?.click()}
  window.addEventListener('keydown',e=>{
    if(e.repeat||editableTarget(e.target))return;
    const k=e.key;
    if(modalOpen()){
      if(k==='Escape')return;
      return;
    }
    const dir=MOVE_KEYS[k];
    if(dir){
      e.preventDefault();
      move(dir[0],dir[1]);
      return;
    }
    if(k===' '||k==='Enter'||k==='f'||k==='F'){
      e.preventDefault();
      press('attackBtn');
      return;
    }
    if(k==='i'||k==='I'){
      e.preventDefault();
      press('inventoryBtn');
      return;
    }
    if(k==='m'||k==='M'){
      e.preventDefault();
      press('mapBtn');
      return;
    }
    if(k==='l'||k==='L'){
      e.preventDefault();
      press('logBtn');
      return;
    }
    if(k==='.'||k==='5'){
      e.preventDefault();
      press('waitBtn');
    }
  },{passive:false});
})();
