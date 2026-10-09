'use strict';
(()=>{
  const KEY='sushitan_achievement_progress_v1';
  const read=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');return v&&typeof v==='object'?v:{}}catch{return {}}};
  const save=v=>{localStorage.setItem(KEY,JSON.stringify(v));refresh()};
  const count=v=>Number.isSafeInteger(v)&&v>=0?v:0;
  const state=()=>{const v=read();return {total:count(v.total),selected:typeof v.selected==='string'?v.selected:null}};
  function refresh(){
    const engine=window.SushiAchievementRanks;if(!engine)return;
    const s=state(),rank=engine.applyToTaskbar(s.total,s.selected);
    const bar=document.getElementById('sushiTaskbar');
    if(bar){
      bar.querySelectorAll('a,button').forEach(el=>{el.style.setProperty('color',rank.fg,'important')});
      bar.querySelectorAll('.mini').forEach(el=>el.style.setProperty('color',rank.fg,'important'));
      bar.querySelectorAll('a:not(:last-child),button:not(:last-child)').forEach(el=>el.style.borderRightColor='var(--sushi-rank-divider)');
    }
    const p=engine.progress(s.total),label=document.getElementById('sushiAchievementInfo');
    if(label)label.textContent=p.next?`${s.total.toLocaleString()} 正解 / 次の${p.next.name}まで ${p.remaining.toLocaleString()}問`:`${s.total.toLocaleString()} 正解 / 最高ランク達成！`;
    const colors=document.getElementById('sushiAchievementColors');
    if(colors)colors.innerHTML=engine.RANKS.map(r=>{const enabled=s.total>=r.min;return `<button type="button" data-rank="${r.id}" ${enabled?'':'disabled'} aria-pressed="${rank.id===r.id}" style="background:${r.bg};color:${r.fg};border:${rank.id===r.id?'3px solid #e74b2a':'1px solid #bbb'};border-radius:12px;padding:12px 6px;font-weight:900;opacity:${enabled?1:.35}">${enabled?'':'🔒 '}${r.name}<br><small>${r.min.toLocaleString()}問</small></button>`}).join('');
  }
  function show(){
    let panel=document.getElementById('sushiAchievementPanel');
    if(!panel){
      panel=document.createElement('div');panel.id='sushiAchievementPanel';panel.style.cssText='position:fixed;inset:0;z-index:100010;background:#0009;display:grid;place-items:center;padding:16px;font-family:system-ui';
      panel.innerHTML='<section role="dialog" aria-modal="true" aria-label="学習ランク" style="background:#fffdf8;color:#263238;border-radius:20px;padding:24px;width:min(520px,100%);max-height:85vh;overflow:auto"><button id="sushiAchievementClose" style="float:right;font-size:22px" aria-label="閉じる">×</button><h2>🏆 学習ランク</h2><p id="sushiAchievementInfo"></p><div id="sushiAchievementColors" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(95px,1fr));gap:9px"></div><p style="font-size:12px;color:#666">到達済みの色を選べます。未到達の色は選べません。</p></section>';
      document.body.append(panel);
      panel.querySelector('#sushiAchievementClose').onclick=()=>panel.remove();
      panel.onclick=e=>{if(e.target===panel)panel.remove()};
      panel.querySelector('#sushiAchievementColors').onclick=e=>{const b=e.target.closest('button[data-rank]');if(!b||b.disabled)return;const s=state();save({...s,selected:b.dataset.rank})};
    }
    refresh();
  }
  // Increment only for verified correct answers; caller must ensure one call per answer.
  function addCorrect(game,n=1){
    if(typeof game!=='string'||!game||!Number.isSafeInteger(n)||n<1||n>1000)return state();
    const s=state();save({...s,total:s.total+n});return state();
  }
  window.SushiAchievements={state,addCorrect,show,refresh};
  function init(){
    const bar=document.getElementById('sushiTaskbar');if(!bar)return;
    const trigger=document.createElement('button');trigger.type='button';trigger.id='sushiAchievementOpen';trigger.title='学習ランク';trigger.textContent='🏆';trigger.style.cssText='position:absolute;top:0;right:0;width:25px;height:25px;z-index:2;font-size:14px;border-radius:0 0 0 10px;background:#ffffff77!important';
    trigger.onclick=show;bar.append(trigger);refresh();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.addEventListener('storage',refresh);
})();
