'use strict';
(function(){
  const recent=[];
  function classify(t){
    if(/に\d+ダメージ/.test(t))return 'playerAttack';
    if(/の攻撃|強打|豪腕|毒牙/.test(t))return 'enemyAttack';
    if(/拾った|手に入れた|装備した|食べた|飲んだ|鍛えた|補強した/.test(t))return 'itemEvent';
    return 'system';
  }
  function paint(){
    const box=document.getElementById('recentLog');
    if(!box)return;
    box.replaceChildren();
    for(const entry of recent.slice(0,4)){
      const p=document.createElement('p');
      p.className=entry.kind;
      p.textContent=entry.text;
      box.appendChild(p);
    }
  }
  function push(text){
    if(!text)return;
    const t=String(text).trim();
    if(!t)return;
    recent.unshift({text:t,kind:classify(t)});
    recent.splice(4);
    paint();
  }
  const originalMsg=window.msg;
  if(typeof originalMsg==='function'){
    window.msg=function(t){push(t);return originalMsg(t)};
  }
  window.sushiDungeonRecentLog=push;
  document.addEventListener('DOMContentLoaded',()=>{
    const source=document.getElementById('message');
    if(source&&source.textContent.trim())push(source.textContent.trim());
  });
})();