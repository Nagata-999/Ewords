'use strict';
(()=>{
  const KEY='sushitan_achievement_progress_v1';
  const read=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');return v&&typeof v==='object'?v:{}}catch{return {}}};
  const save=v=>{localStorage.setItem(KEY,JSON.stringify(v));refresh()};
  const count=v=>Number.isSafeInteger(v)&&v>=0?v:0;
  const state=()=>{const v=read();return {total:count(v.total),selected:typeof v.selected==='string'?v.selected:null}};
  function achievementMetrics(){
    const s=state();let correct=0;
    try{for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);if(!key?.startsWith('sushitan_learning_v1:event:'))continue;
      const e=JSON.parse(localStorage.getItem(key));
      if(e?.version===1&&e.correct===true&&e.id===key.slice(27)&&Number.isSafeInteger(e.count)&&e.count>0)correct+=e.count;
    }}catch{}
    let login={};try{login=JSON.parse(localStorage.getItem('sushitan_login_bonus_v1')||'{}')||{}}catch{}
    const ledger=window.SushiAchievementLedger?.summary();const newTotal=ledger?.total||0;const total=Math.max(s.total+newTotal,correct);return {correct_total:total,correct_vocabulary:total,login_streak:Number(login.loginBonusStreak)||0};
  }
  function renderCatalog(){
    const box=document.getElementById('sushiAchievementList');
    if(!box||!window.SushiAchievementCatalog)return;
    box.replaceChildren();
    for(const a of window.SushiAchievementCatalog.evaluate(achievementMetrics())){
      const item=document.createElement('div');item.style.cssText='border:1px solid #e8e1d5;border-radius:12px;padding:10px;margin:8px 0';
      const name=a.secret&&!a.reached?'???':a.title;
      item.textContent=(a.reached?'🏅 ':'🔒 ')+name+'  '+a.reached+'/'+a.stageCount+(a.next?'  ('+Math.min(a.value,a.next.threshold)+' / '+a.next.threshold+')':'  COMPLETE');
      box.append(item);
    }
  }
  function refresh(){
    const engine=window.SushiAchievementRanks;if(!engine)return;
    const s=state(),total=achievementMetrics().correct_total,rank=engine.applyToTaskbar(total,s.selected);
    const bar=document.getElementById('sushiTaskbar');
    if(bar){
      bar.querySelectorAll('a,button').forEach(el=>{el.style.setProperty('color',rank.fg,'important')});
      bar.querySelectorAll('.mini').forEach(el=>el.style.setProperty('color',rank.fg,'important'));
      bar.querySelectorAll('a:not(:last-child),button:not(:last-child)').forEach(el=>el.style.borderRightColor='var(--sushi-rank-divider)');
    }
    const p=engine.progress(total),label=document.getElementById('sushiAchievementInfo');
    if(label)label.textContent=p.next?`${total.toLocaleString()} 正解 / 次の${p.next.name}まで ${p.remaining.toLocaleString()}問`:`${total.toLocaleString()} 正解 / 最高ランク達成！`;
    const colors=document.getElementById('sushiAchievementColors');
    if(colors)colors.innerHTML=engine.RANKS.map(r=>{const enabled=total>=r.min;return `<button type="button" data-rank="${r.id}" ${enabled?'':'disabled'} aria-pressed="${rank.id===r.id}" style="background:${r.bg};color:${r.fg};border:${rank.id===r.id?'3px solid #e74b2a':'1px solid #bbb'};border-radius:12px;padding:12px 6px;font-weight:900;opacity:${enabled?1:.35}">${enabled?'':'🔒 '}${r.name}<br><small>${r.min.toLocaleString()}問</small></button>`}).join('');
    renderCatalog();
  }
  function show(){
    let panel=document.getElementById('sushiAchievementPanel');
    if(!panel){
      panel=document.createElement('div');panel.id='sushiAchievementPanel';panel.style.cssText='position:fixed;inset:0;z-index:100010;background:#0009;display:grid;place-items:center;padding:16px;font-family:system-ui';
      panel.innerHTML='<section role="dialog" aria-modal="true" aria-label="学習ランク" style="background:#fffdf8;color:#263238;border-radius:20px;padding:24px;width:min(520px,100%);max-height:85vh;overflow:auto"><button id="sushiAchievementClose" style="float:right;font-size:22px" aria-label="閉じる">×</button><h2>🏆 学習ランク</h2><p id="sushiAchievementInfo"></p><div id="sushiAchievementColors" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(95px,1fr));gap:9px"></div><p style="font-size:12px;color:#666">到達済みの色を選べます。未到達の色は選べません。</p><h3>実績一覧（プレビュー）</h3><div id="sushiAchievementList"></div></section>';
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
    if(window.SushiAchievementLedger){window.SushiAchievementLedger.record(game,n);refresh();return state()}const s=state();save({...s,total:s.total+n});return state();
  }
  window.SushiAchievements={state,addCorrect,show,refresh};
  function init(){
    const bar=document.getElementById('sushiTaskbar');if(!bar)return;
    const trigger=document.createElement('button');trigger.type='button';trigger.id='sushiAchievementOpen';trigger.title='学習ランク';trigger.textContent='🏆';trigger.style.cssText='position:absolute;top:0;right:0;width:25px;height:25px;z-index:2;font-size:14px;border-radius:0 0 0 10px;background:#ffffff77!important';
    trigger.onclick=show;bar.append(trigger);refresh();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.addEventListener('storage',refresh);window.addEventListener('focus',refresh);window.addEventListener('sushi-achievement-change',refresh);
})();
