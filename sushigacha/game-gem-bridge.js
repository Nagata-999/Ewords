'use strict';
(() => {
  if (window.__sushiGameGemBridgeLoaded) return;
  window.__sushiGameGemBridgeLoaded = true;

  const page = (location.pathname.split('/').pop() || '').toLowerCase();
  const session = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  let seq = 0;
  const seen = new Set();

  function award(source, score, rate, signature){
    if (!window.SushiGem || !signature || seen.has(signature)) return;
    seen.add(signature);
    const id = `${source}:${session}:${++seq}:${signature}`;
    const result = window.SushiGem.awardScore(source, score, id, rate);
    if (result && result.gems > 0) showToast(`💎 +${result.gems} GEM${result.gems===1?'':'S'}`);
    else if (result && !result.duplicate) showToast(`💎 ${result.remainder}/${rate}`);
  }

  function showToast(text){
    let el=document.getElementById('sushiGemToast');
    if(!el){
      el=document.createElement('div');
      el.id='sushiGemToast';
      Object.assign(el.style,{position:'fixed',left:'50%',bottom:'22px',transform:'translateX(-50%) translateY(12px)',zIndex:'99999',padding:'10px 16px',borderRadius:'999px',background:'rgba(15,23,42,.94)',color:'#fff',font:'900 14px/1 system-ui,sans-serif',boxShadow:'0 10px 28px rgba(0,0,0,.28)',opacity:'0',transition:'.2s',pointerEvents:'none'});
      document.body.appendChild(el);
    }
    el.textContent=text; el.style.opacity='1'; el.style.transform='translateX(-50%) translateY(0)';
    clearTimeout(el._gemTimer); el._gemTimer=setTimeout(()=>{el.style.opacity='0';el.style.transform='translateX(-50%) translateY(12px)';},1700);
  }

  function watchType(){
    const el=document.getElementById('resultText');
    if(!el)return;
    const check=()=>{
      const t=(el.textContent||'').trim();
      if(!/(TIME UP!|All chunks cleared!)/i.test(t))return;
      const m=t.match(/Score\s+(\d+)/i); if(!m)return;
      const score=Number(m[1]);
      award('sushitype',score,500,`result:${t}`);
    };
    new MutationObserver(check).observe(el,{childList:true,subtree:true,characterData:true});
    check();
  }

  function watchRun(){
    const menu=document.getElementById('menu');
    if(!menu)return;
    const check=()=>{
      const t=(menu.textContent||'').replace(/\s+/g,' ').trim();
      if(!/GAME OVER/i.test(t))return;
      const m=t.match(/DISTANCE\s*:\s*(\d+)m/i); if(!m)return;
      const distance=Number(m[1]);
      award('sushirun',distance,1000,`gameover:${distance}:${t.slice(0,120)}`);
    };
    new MutationObserver(check).observe(menu,{childList:true,subtree:true,characterData:true});
    check();
  }

  function init(){
    if(page==='sushitype.html')watchType();
    else if(page==='sushi_run.html')watchRun();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
