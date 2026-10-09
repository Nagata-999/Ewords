'use strict';
(()=>{
  const KEY='sushitan_achievement_progress_v1';
  const read=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');return v&&typeof v==='object'?v:{}}catch{return {}}};
  const save=v=>{localStorage.setItem(KEY,JSON.stringify(v));refresh()};
  const count=v=>Number.isSafeInteger(v)&&v>=0?v:0;
  const state=()=>{const v=read();return {...v,total:count(v.total),unlockedTotal:count(v.unlockedTotal),selected:typeof v.selected==='string'?v.selected:null}};
  function achievementMetrics(){
    let login={};try{login=JSON.parse(localStorage.getItem('sushitan_login_bonus_v1')||'{}')||{}}catch{}
    const gameplay=window.SushiAchievementGameStats?.read?.()||{};
    const s=state();
    const total=window.SushiAchievementLedger?.reconciledTotal?.()??s.total;
    const games=window.SushiAchievementLedger?.summary?.().games||{};
    return window.SushiAchievementMetrics?.compute?.({
      historicalTotal:s.total,ledgerTotal:total,byGame:games,
      loginStreak:Math.max(Number(login.loginBonusBestStreak)||0,Number(login.loginBonusStreak)||0),
      dailyClaims:new Set([...(Array.isArray(login.dailyGemClaims)?login.dailyGemClaims:[])]).size,
      gemsEarned:Math.max(count(login.gemsEarnedTotal),(Array.isArray(login.gemEvents)?login.gemEvents:[]).reduce((n,e)=>n+(e?.type==='earn'&&Number.isSafeInteger(e.amount)&&e.amount>0?e.amount:0),0)),
      avatarItems:new Set(Array.isArray(login.gacha?.owned)?login.gacha.owned:[]).size,
      gemPurchases:(Array.isArray(login.gemEvents)?login.gemEvents:[]).filter(e=>e?.type==='spend'&&Number(e.amount)>0).length,
      outfitChanges:Number(login.gacha?.avatarRevision)>0?1:0,
      distinctGamesInDay:window.SushiAchievementLedger?.distinctGamesInDay?.()||0,
      outcomeStats:window.SushiAchievementLedger?.outcomeSummary?.()||{},
      gameStats:gameplay
    })||{correct_total:Math.max(s.total,total),correct_vocabulary:0,login_streak:0};
  }
  // Server receipts are supplied only after an authenticated response.
  // Never persist a locally guessed claim or award gems from this UI.
  let verifiedReceipts=null;
  let receiptsSushiId=null;
  function setServerReceipts(response,sushiId){
    const connected=(localStorage.getItem('sushitan_sync_id_v1')||'').trim().toLowerCase();
    const parsed=connected&&sushiId===connected?window.SushiAchievementReceipts?.parse?.(response)||null:null;
    receiptsSushiId=parsed?connected:null;
    verifiedReceipts=parsed;
    refresh();
    return !!parsed;
  }
  const claimBusy=new Set(),claimedHere=new Set();
  function claimStatus(id){
    const sushiId=(localStorage.getItem('sushitan_sync_id_v1')||'').trim().toLowerCase();
    return claimedHere.has(sushiId+':'+id)||!!verifiedReceipts?.ids.includes(id);
  }
  async function claimReward(threshold,id,button,category){
    if(claimBusy.has(id))return;
    // Keep the clicked position before refresh replaces the button and the
    // authenticated request can take longer than the pointer history.
    const rect=button.getBoundingClientRect();
    const origin={x:rect.left+rect.width/2,y:rect.top+rect.height/2};
    claimBusy.add(id);button.disabled=true;button.textContent='受取中…';
    refresh();
    try{
      const result=await window.SushiAchievementSyncBridge.claim(threshold,category);
      const sushiId=(localStorage.getItem('sushitan_sync_id_v1')||'').trim().toLowerCase();
      claimedHere.add(sushiId+':'+id);
      if(result.gems>0&&!result.already_claimed)window.dispatchEvent(new CustomEvent('sushi-gems-earned',{detail:{gems:result.gems,source:'achievement',id,origin}}));
      refresh();
    }catch(error){window.alert('受取に失敗しました：'+error.message);button.disabled=false;button.textContent='🎁 受け取る'}
    finally{claimBusy.delete(id);refresh()}
  }
  function renderCatalog(){
    const box=document.getElementById('sushiAchievementList');
    if(!box||!window.SushiAchievementCatalog)return;
    if(receiptsSushiId!==(localStorage.getItem('sushitan_sync_id_v1')||'').trim().toLowerCase())verifiedReceipts=null;
    box.replaceChildren();
    const connected=/^[a-z0-9_-]{4,24}$/.test((localStorage.getItem('sushitan_sync_id_v1')||'').trim().toLowerCase())&&/^\d{4}$/.test(localStorage.getItem('sushitan_sync_pin_v1')||'');
    if(!connected){const note=document.createElement('p');note.textContent='報酬を受け取るには「データ同期」でIDとPINを設定してください。';note.style.cssText='font-size:13px;line-height:1.6;color:#645344';box.append(note)}
    for(const a of window.SushiAchievementCatalog.evaluate(achievementMetrics())){
      const item=document.createElement('div');item.style.cssText='border:1px solid #e8e1d5;border-radius:12px;padding:10px;margin:8px 0';
      const name=a.secret&&!a.reached?'???':a.title;
      item.textContent=a.secret&&!a.reached?'🔒 ???':(a.reached?'🏅 ':'🔒 ')+name+'  '+a.reached+'/'+a.stageCount+(a.next?'  ('+Math.min(a.value,a.next.threshold)+' / '+a.next.threshold+')':'  COMPLETE');
      const hidden=a.secret&&!a.reached;
      const definition=window.SushiAchievementCatalog.definitions.find(d=>d.id===a.id);
      const stages=definition?.stages||[{threshold:definition?.threshold||1,gems:definition?.gems||0}];
      const target=a.next||stages[stages.length-1];
      const description=document.createElement('div');
      description.style.cssText='font-size:13px;line-height:1.6;color:#645344;margin-top:5px';
      description.textContent=hidden?'達成条件：？？？':'達成条件：'+window.SushiAchievementCatalog.describe(a.id,target.threshold);
      item.append(description);
      const hint=document.createElement('div');
      hint.style.cssText='font-size:12px;color:#80694c;margin-top:3px';
      hint.textContent=hidden?'報酬：？？？':(a.next?'次の報酬：'+target.gems+'ジェム':'全段階達成！');
      item.append(hint);
      if(!hidden){
        const stagesBox=document.createElement('div');
        stagesBox.style.cssText='display:flex;flex-wrap:wrap;gap:5px;margin-top:8px';
        for(const stage of stages){
          const id='achievement:'+a.id+':'+stage.threshold;
          const achieved=a.value>=stage.threshold;
          const received=claimStatus(id);
          const chip=document.createElement('span');
          chip.style.cssText='font-size:11px;border-radius:7px;padding:4px 7px;border:1px solid '+(received?'#9bc6a1':achieved?'#e9b74e':'#ddd4c7')+';background:'+(received?'#e7f6e9':achieved?'#fff1c9':'#f5f2ec')+';color:#554635';
          chip.textContent=(received?'✅':achieved?'🎁':'🔒')+' '+stage.threshold.toLocaleString()+' / '+stage.gems+'💎';
          chip.title=received?'受取済み':achieved?'達成済み・報酬を確認':'未達成';
          stagesBox.append(chip);
        }
        item.append(stagesBox);
      }
      const reward=window.SushiAchievementRewards?.available?.(achievementMetrics(),window.SushiAchievementCatalog.definitions,[])?.filter(x=>x.id.startsWith('achievement:'+a.id+':'))||[];
      const claimed=verifiedReceipts?.ids.filter(id=>id.startsWith('achievement:'+a.id+':'))||[];
      if(!hidden&&(reward.length||claimed.length)){
        const badge=document.createElement('div');badge.style.cssText='font-size:12px;color:#8b5a1e;margin-top:5px';
        const pending=reward.filter(x=>!claimed.includes(x.id)&&!claimStatus(x.id));
        const supported=['all_correct','streak','vocabulary','toeic','giri','blast','daily','gems','avatar','first_purchase','first_outfit','all_games_day','review','combo','resilience','comeback'].includes(a.id);
        badge.textContent=(claimed.length?'✅ 受取済 '+claimed.length+'件　':'')+
          (pending.length?(supported?'🎁 未受取報酬 ':'🔧 報酬準備中 ')+pending.reduce((n,x)=>n+x.gems,0)+'ジェム':'');
        item.append(badge);
        if(supported&&window.SushiAchievementSyncBridge?.claim){
          for(const eligible of pending){
            if(claimStatus(eligible.id))continue;
            const button=document.createElement('button');
            button.type='button';button.textContent='🎁 '+eligible.gems+'ジェムを受け取る';
            button.style.cssText='display:block;margin-top:8px;padding:9px 12px;border:0;border-radius:9px;background:#f6b52b;color:#402500;font-weight:800;cursor:pointer';
            button.disabled=claimBusy.has(eligible.id)||!connected||!verifiedReceipts;
            if(claimBusy.has(eligible.id))button.textContent='受取中…';
            else if(!connected){button.textContent='同期設定後に受け取れます';button.style.opacity='.6';}
            else if(!verifiedReceipts)button.textContent='受取状況を確認中…';
            button.onclick=()=>claimReward(eligible.id.split(':').at(-1)*1,eligible.id,button,a.id);
            item.append(button);
          }
        }
      }
      box.append(item);
    }
  }
  function refresh(){
    const engine=window.SushiAchievementRanks;if(!engine)return;
    const s=state(),total=Math.max(achievementMetrics().correct_total,s.unlockedTotal),rank=engine.applyToTaskbar(total,s.selected);
    if(total>s.unlockedTotal)localStorage.setItem(KEY,JSON.stringify({...s,unlockedTotal:total}));
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
    renderTitles();
  }
  function renderTitles(){
    const box=document.getElementById('sushiAchievementTitles');
    if(!box||!window.SushiAchievementTitles||!window.SushiAchievementCatalog)return;
    const metrics=achievementMetrics(),defs=window.SushiAchievementCatalog.definitions;
    const available=window.SushiAchievementTitles.unlocked(metrics,defs);
    const selected=window.SushiAchievementTitles.selection(localStorage,metrics,defs);
    box.replaceChildren();
    const heading=document.createElement('p');heading.textContent='称号を選択';heading.style.cssText='margin:8px 0;font-weight:800';box.append(heading);
    const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:9px';
    const options=[{id:'',title:'称号なし',level:''},...available];
    for(const title of options){
      const button=document.createElement('button');button.type='button';
      const active=(selected?.id||'')===title.id;
      button.textContent=title.id?title.title+'\n'+title.level+'（'+title.threshold.toLocaleString()+'）':'称号なし';
      button.setAttribute('aria-pressed',String(active));
      button.style.cssText='white-space:pre-line;min-height:66px;padding:10px 8px;border-radius:12px;font:inherit;font-weight:800;cursor:pointer;border:'+(active?'3px solid #e8a12b':'1px solid #d9cdbb')+';background:'+(active?'#fff0b9':'#fff')+';color:#44311a';
      button.onclick=()=>{
        if(window.SushiAchievementTitles.set(localStorage,title.id,achievementMetrics(),defs)){
          window.dispatchEvent(new CustomEvent('sushi-achievement-title-change',{detail:{id:title.id||null}}));
          refresh();
        }
      };
      grid.append(button);
    }
    box.append(grid);
    const preview=document.createElement('p');preview.id='sushiAchievementTitlePreview';
    preview.style.cssText='margin:10px 0 0;padding:10px 12px;border-radius:12px;background:#fff3d5;color:#593b17;font-weight:800';
    preview.textContent=selected?'🏅 現在の称号：'+selected.title+'（'+selected.level+'）':'称号は未設定です。実績を解除すると選択できます。';
    box.append(preview);
  }
  window.addEventListener('sushi-achievement-receipts',event=>{
    const data=event.detail;
    const sushiId=(localStorage.getItem('sushitan_sync_id_v1')||'').trim().toLowerCase();
    if(data?.sushiId!==sushiId||!Array.isArray(data.receipts?.ids))return;
    setServerReceipts(data,sushiId);
  });
  window.addEventListener('sushi-achievement-baseline-sync',refresh);
  function show(){
    window.SushiAchievementSyncBridge?.receipts?.().catch(()=>null);
    let panel=document.getElementById('sushiAchievementPanel');
    if(!panel){
      panel=document.createElement('div');panel.id='sushiAchievementPanel';panel.style.cssText='position:fixed;inset:0 0 var(--sushi-taskbar-space,84px);z-index:100010;box-sizing:border-box;min-height:0;background:#0009;display:grid;place-items:center;padding:16px;font-family:system-ui';
      panel.innerHTML='<section role="dialog" aria-modal="true" aria-label="学習ランク" style="background:#fffdf8;color:#263238;border-radius:20px;padding:24px;width:min(520px,100%);box-sizing:border-box;min-height:0;max-height:100%;overflow:auto"><button id="sushiAchievementClose" style="float:right;font-size:22px" aria-label="閉じる">×</button><h2>🏆 学習ランク</h2><label style="font-size:12px"><input type="checkbox" id="sushiAchievementMute"> 解除音をミュート</label><p id="sushiAchievementInfo"></p><div id="sushiAchievementColors" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(95px,1fr));gap:9px"></div><p style="font-size:12px;color:#666">到達済みの色を選べます。未到達の色は選べません。</p><h3>称号</h3><div id="sushiAchievementTitles"></div><h3>実績一覧（プレビュー）</h3><div id="sushiAchievementList"></div></section>';
      document.body.append(panel);
      const mute=panel.querySelector('#sushiAchievementMute');mute.checked=localStorage.getItem('sushitan_achievement_muted')==='1';window.SushiAchievementSound?.setMuted?.(mute.checked);mute.onchange=()=>{localStorage.setItem('sushitan_achievement_muted',mute.checked?'1':'0');window.SushiAchievementSound?.setMuted?.(mute.checked)};
      panel.querySelector('#sushiAchievementClose').onclick=()=>panel.remove();
      panel.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();panel.remove();}});
      panel.querySelector('#sushiAchievementClose').focus();
      panel.onclick=e=>{if(e.target===panel)panel.remove()};
      panel.querySelector('#sushiAchievementColors').onclick=e=>{const b=e.target.closest('button[data-rank]');if(!b||b.disabled)return;const s=state();let device=localStorage.getItem('sushitan_achievement_v2:device');if(!device){device=window.crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2);localStorage.setItem('sushitan_achievement_v2:device',device)}save({...s,selected:b.dataset.rank,selectionRevision:count(s.selectionRevision)+1,selectionDevice:device});window.dispatchEvent(new CustomEvent('sushi-achievement-preference-change'))};
    }
    refresh();
  }
  let celebrationTimer=null;
  function celebrate(unlocks){
    if(!unlocks.length)return;
    let toast=document.getElementById('sushiAchievementToast');
    if(!toast){
      toast=document.createElement('div');toast.id='sushiAchievementToast';
      toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');
      toast.style.cssText='position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:100011;background:linear-gradient(125deg,#fff4c4,#fff);color:#533000;padding:15px 22px;border:2px solid #e8ad32;border-radius:18px;box-shadow:0 8px 25px #0003;font:bold 16px system-ui;text-align:center;max-width:min(90vw,420px);pointer-events:none';
      document.body.append(toast);
    }
    window.SushiAchievementSound?.play?.();
    toast.textContent='🏆 実績解除！ '+unlocks.map(x=>x.title+' ('+x.threshold.toLocaleString()+')').join('・');
    toast.animate?.([{opacity:0,transform:'translate(-50%,-15px) scale(.9)'},{opacity:1,transform:'translate(-50%,0) scale(1)'}],{duration:320,easing:'ease-out'});
    clearTimeout(celebrationTimer);celebrationTimer=setTimeout(()=>toast.remove(),3500);
  }
  // Increment only for verified correct answers; caller must ensure one call per answer.
  function addCorrect(game,n=1){
    if(typeof game!=='string'||!game||!Number.isSafeInteger(n)||n<1||n>1000)return state();
    const before=achievementMetrics();
    if(window.SushiAchievementLedger){
      const recorded=window.SushiAchievementLedger.record(game,n);
      if(recorded){
        const unlocked=window.SushiAchievementMilestones?.reachedBetween?.(before,achievementMetrics(),window.SushiAchievementCatalog?.definitions)||[];
        celebrate(unlocked);
      }
      refresh();return state();
    }
    const s=state();save({...s,total:s.total+n});return state();
  }
  window.SushiAchievementSound?.setMuted?.(localStorage.getItem('sushitan_achievement_muted')==='1');
  window.SushiAchievements={state,addCorrect,show,refresh,setServerReceipts};
  let previousMetrics=achievementMetrics();
  window.addEventListener('sushi-achievement-answer',()=>{
    const next=achievementMetrics();
    celebrate(window.SushiAchievementMilestones?.reachedBetween?.(previousMetrics,next,window.SushiAchievementCatalog?.definitions)||[]);
    previousMetrics=next;refresh();
  });
  window.addEventListener('sushi-profile-synced',()=>{previousMetrics=achievementMetrics();refresh()});
  window.addEventListener('sushi-gem-change',refresh);
  // Drain correct answers recorded while the async achievement modules loaded.
  const pending=Array.isArray(window.__sushiPendingAchievementCorrect)?window.__sushiPendingAchievementCorrect.splice(0,1000):[];
  for(const game of pending)if(typeof game==='string'&&/^[a-z0-9_-]{1,40}$/.test(game))addCorrect(game,1);
  function init(){
    const bar=document.getElementById('sushiTaskbar');if(!bar)return;
    const trigger=document.getElementById('sushiAchievementOpen');
    if(trigger){
      // Remove the obsolete floating icon if a cached script injected it.
      for(const child of [...trigger.children])if(child.id==='sushiAchievementOpen')child.remove();
      trigger.onclick=show;
    }
    refresh();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.addEventListener('sushi-achievement-sync',refresh);window.addEventListener('sushi-learning-change',refresh);
  window.addEventListener('storage',refresh);window.addEventListener('focus',refresh);window.addEventListener('sushi-achievement-change',refresh);
})();
