'use strict';
(() => {
  if (window.SushiProfileSync) return;
  const URL='https://rxyoyveykxdfrpomkltl.supabase.co/functions/v1/sushi-id-sync';
  const KEY='sb_publishable_RmWOSxRfsV5YRwCDnKPPAQ_m3VzsUM7';
  const LEDGER_KEY='sushitan_login_bonus_v1',NAME_KEY='sushitan_shared_player_name_v1';
  const ID_KEY='sushitan_sync_id_v1',PIN_KEY='sushitan_sync_pin_v1',LEARNING_EVENT='sushitan_learning_v1:event:';
  const readLearning=()=>{
    if(window.SushiLearning?.exportData)return window.SushiLearning.exportData();
    const events=[];
    for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith(LEARNING_EVENT))try{events.push(JSON.parse(localStorage.getItem(k)))}catch{}}
    return {version:1,registry_version:1,events};
  };
  const readJSON=k=>{try{const v=JSON.parse(localStorage.getItem(k)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch{return{}}};
  const creds=()=>({sushi_id:(localStorage.getItem(ID_KEY)||'').trim().toLowerCase(),pin:localStorage.getItem(PIN_KEY)||''});
  const RANK_KEY='sushitan_achievement_progress_v1';
  function mergeRankPreferences(a={},b={}){
    const normalize=value=>({selected:['white','yellow','orange','green','blue','purple','black'].includes(value?.selected)?value.selected:null,selectionRevision:Number.isSafeInteger(value?.selectionRevision)&&value.selectionRevision>=0?value.selectionRevision:0,selectionDevice:typeof value?.selectionDevice==='string'?value.selectionDevice.slice(0,160):'',unlockedTotal:Number.isSafeInteger(value?.unlockedTotal)&&value.unlockedTotal>=0?value.unlockedTotal:0});
    const left=normalize(a),right=normalize(b);
    const rightWins=right.selectionRevision>left.selectionRevision||(right.selectionRevision===left.selectionRevision&&(right.selectionDevice>left.selectionDevice||(right.selectionDevice===left.selectionDevice&&String(right.selected)>String(left.selected))));
    const winner=rightWins?right:left;
    return {...winner,unlockedTotal:Math.max(left.unlockedTotal,right.unlockedTotal)};
  }
  function applyWalletSnapshot(current,remote,acknowledged=[]){
    if(!Number.isSafeInteger(remote?.gems)||remote.gems<0||!Array.isArray(remote.gemEvents))throw new Error('invalid_wallet_snapshot');
    const known=new Set([...remote.gemEvents.map(e=>e?.id),...(remote.gemAcknowledgedIds||[]),...acknowledged]);
    const localEvents=new Map();for(const e of [...(Array.isArray(current.gemEvents)?current.gemEvents:[]),...(Array.isArray(current.gemPendingEvents)?current.gemPendingEvents:[])])if(e?.id)localEvents.set(e.id,e);
    const pending=[...localEvents.values()].filter(e=>!known.has(e.id));
    const delta=pending.reduce((sum,e)=>sum+(e.type==='earn'?1:e.type==='spend'?-1:0)*(Number.isSafeInteger(e.amount)&&e.amount>0?e.amount:0),0);
    const events=new Map();for(const e of [...remote.gemEvents,...pending])if(e?.id)events.set(e.id,e);
    const gems=Math.max(0,remote.gems+delta);
    return {...remote,gems,gemEvents:[...events.values()].slice(-1000),gemPendingEvents:pending,gemAcknowledgedIds:[...known].filter(id=>typeof id==='string'),gemSyncBase:remote.gems,gemSyncBaseAt:Date.now()};
  }
  function mergeDailyQuests(local={},remote={}){
    if(!local.day)return remote;if(!remote.day)return local;
    if(local.day!==remote.day)return local.day>remote.day?local:remote;
    const progress={},claimed={};for(const k of new Set([...Object.keys(local.progress||{}),...Object.keys(remote.progress||{})]))progress[k]=Math.max(0,Number(local.progress?.[k])||0,Number(remote.progress?.[k])||0);
    for(const k of new Set([...Object.keys(local.claimed||{}),...Object.keys(remote.claimed||{})]))claimed[k]=!!(local.claimed?.[k]||remote.claimed?.[k]);
    return {...remote,...local,progress,claimed,chestClaimed:!!(local.chestClaimed||remote.chestClaimed),chestReward:Math.max(Number(local.chestReward)||0,Number(remote.chestReward)||0)};
  }
  async function call(action,id,pin){
    const sentLedger=readJSON(LEDGER_KEY);sentLedger.achievementUnlocks=[...new Set([...(Array.isArray(sentLedger.achievementUnlocks)?sentLedger.achievementUnlocks:[]),...(window.SushiAchievementGameStats?.unlocked?.()||[])])];if(sentLedger.gacha)delete sentLedger.gacha.avatar;const sentAvatarUpdatedAt=Number(sentLedger.gacha?.avatarUpdatedAt)||0,sentAvatarRevision=Math.max(0,Number(sentLedger.gacha?.avatarRevision)||0),sentAvatar=sentLedger.gacha?.avatar?JSON.stringify(sentLedger.gacha.avatar):'';
    sentLedger.achievementPreferences=mergeRankPreferences(readJSON(RANK_KEY),sentLedger.achievementPreferences);
    const events=new Map();for(const event of [...(sentLedger.gemEvents||[]),...(sentLedger.gemPendingEvents||[])])if(event?.id)events.set(event.id,event);sentLedger.gemEvents=[...events.values()];delete sentLedger.gemPendingEvents;
    const r=await fetch(URL,{method:'POST',headers:{'Content-Type':'application/json','apikey':KEY},body:JSON.stringify({action,sushi_id:id,pin,player_name:window.SushiPlayer?.getName?.()||localStorage.getItem(NAME_KEY)||'',ledger:sentLedger,learning:readLearning()})});
    const data=await r.json().catch(()=>({error:'network'})); if(!r.ok)throw Object.assign(new Error(data.error||'sync_failed'),{code:data.error,status:r.status}); data.__sentGemIds=(sentLedger.gemEvents||[]).map(e=>e?.id).filter(Boolean); data.__sentAvatarUpdatedAt=sentAvatarUpdatedAt; data.__sentAvatarRevision=sentAvatarRevision; data.__sentAvatar=sentAvatar; return data;
  }
  // Read-only, bounded diagnostics: never store PIN, account ID or full ledger.
  const LOGIN_DIAG_KEY='sushitan_login_sync_diagnostics_v1';
  function loginSnapshot(l){return {streak:Math.max(0,Number(l.loginBonusStreak??l.streak)||0),total:Math.max(0,Number(l.loginBonusTotal??l.total)||0),lastDay:String(l.loginBonusLastDay||l.lastDay||''),manualClaims:Array.isArray(l.loginManualClaims)?l.loginManualClaims.length:0,dailyClaims:Array.isArray(l.dailyGemClaims)?l.dailyGemClaims.length:0};}
  function recordLoginSync(before,remote,after){
    try{const history=JSON.parse(sessionStorage.getItem(LOGIN_DIAG_KEY)||'[]');const rows=Array.isArray(history)?history:[];rows.push({at:new Date().toISOString(),before:loginSnapshot(before),remote:loginSnapshot(remote),after:loginSnapshot(after)});sessionStorage.setItem(LOGIN_DIAG_KEY,JSON.stringify(rows.slice(-20)))}catch{}
  }
  window.SushiLoginSyncDiagnostics={getHistory:()=>{try{return JSON.parse(sessionStorage.getItem(LOGIN_DIAG_KEY)||'[]')}catch{return []}},clear:()=>sessionStorage.removeItem(LOGIN_DIAG_KEY)};
  function apply(data){
    if(data.ledger?.achievementGameScores){
      const current=readJSON(LEDGER_KEY).achievementGameScores||{},remote=data.ledger.achievementGameScores;
      for(const game of ['giri','blast'])remote[game]=Math.max(0,Number(current[game])||0,Number(remote[game])||0);
      window.SushiAchievementGameStats?.mergeScores?.(remote);
    }
    if(data.ledger?.achievementPreferences){
      const progress=readJSON(RANK_KEY),preferences=mergeRankPreferences(progress,data.ledger.achievementPreferences);
      data.ledger.achievementPreferences=preferences;
      localStorage.setItem(RANK_KEY,JSON.stringify({...progress,...preferences}));
    }
    if(data.ledger){const current=readJSON(LEDGER_KEY);data.ledger={...data.ledger,...applyWalletSnapshot(current,data.ledger,data.__sentGemIds||[])};data.ledger.dailyQuests=mergeDailyQuests(current.dailyQuests,data.ledger.dailyQuests);data.ledger.loginBonusBestStreak=Math.max(Number(current.loginBonusBestStreak)||0,Number(data.ledger.loginBonusBestStreak)||0);const remoteLoginSnapshot=loginSnapshot(data.ledger);window.SushiAchievementGameStats?.merge?.(data.ledger.achievementUnlocks);data.ledger.achievementUnlocks=[...new Set([...(Array.isArray(current.achievementUnlocks)?current.achievementUnlocks:[]),...(Array.isArray(data.ledger.achievementUnlocks)?data.ledger.achievementUnlocks:[]),...(window.SushiAchievementGameStats?.unlocked?.()||[])])];for(const k of ['loginManualClaims','dailyGemClaims','claimedMilestones']){data.ledger[k]=[...new Set([...(Array.isArray(current[k])?current[k]:[]),...(Array.isArray(data.ledger[k])?data.ledger[k]:[])])].slice(-400);}for(const k of ['total','loginBonusTotal'])data.ledger[k]=Math.max(0,Number(current[k])||0,Number(data.ledger[k])||0);const localDay=String(current.loginBonusLastDay||current.lastDay||''),remoteDay=String(data.ledger.loginBonusLastDay||data.ledger.lastDay||'');if(localDay>remoteDay){for(const k of ['loginBonusLastDay','lastDay','streak','loginBonusStreak'])if(current[k]!==undefined)data.ledger[k]=current[k];}else if(localDay===remoteDay){for(const k of ['streak','loginBonusStreak'])data.ledger[k]=Math.max(0,Number(current[k])||0,Number(data.ledger[k])||0);}const localAvatar=current.gacha?.avatar;const localAvatarRevision=current.gacha?.avatarRevision;const localAvatarUpdatedAt=current.gacha?.avatarUpdatedAt;const currentAvatarUpdatedAt=Number(current.gacha?.avatarUpdatedAt)||0,sentAvatarUpdatedAt=Number(data.__sentAvatarUpdatedAt)||0,currentAvatarRevision=Math.max(0,Number(current.gacha?.avatarRevision)||0),sentAvatarRevision=Math.max(0,Number(data.__sentAvatarRevision)||0),serverAvatarRevision=Math.max(0,Number(data.ledger.gacha?.avatarRevision)||0);const currentAvatar=current.gacha?.avatar?JSON.stringify(current.gacha.avatar):'',sentAvatar=String(data.__sentAvatar||'');const changedDuringSync=currentAvatarRevision>sentAvatarRevision||currentAvatarUpdatedAt>sentAvatarUpdatedAt||(currentAvatar&&currentAvatar!==sentAvatar);const localRevisionWins=currentAvatarRevision>serverAvatarRevision;if((changedDuringSync||localRevisionWins)&&current.gacha?.avatar){data.ledger.gacha={...(data.ledger.gacha||{}),avatar:current.gacha.avatar,avatarUpdatedAt:currentAvatarUpdatedAt,avatarRevision:currentAvatarRevision}}data.ledger.gacha={...(data.ledger.gacha||{}),avatar:localAvatar||current.gacha?.avatar||{},avatarRevision:localAvatarRevision,avatarUpdatedAt:localAvatarUpdatedAt,owned:[...new Set([...(current.gacha?.owned||[]),...(data.ledger.gacha?.owned||[])])]};recordLoginSync(current,{loginBonusStreak:remoteLoginSnapshot.streak,loginBonusTotal:remoteLoginSnapshot.total,loginBonusLastDay:remoteLoginSnapshot.lastDay,loginManualClaims:Array(remoteLoginSnapshot.manualClaims).fill(null),dailyGemClaims:Array(remoteLoginSnapshot.dailyClaims).fill(null)},data.ledger);localStorage.setItem(LEDGER_KEY,JSON.stringify(data.ledger));window.dispatchEvent(new CustomEvent('sushi-daily-quest-change',{detail:{fromProfileSync:true}}));window.dispatchEvent(new CustomEvent('sushi-gem-change'))}
    if(data.player_name){localStorage.setItem(NAME_KEY,data.player_name);window.SushiPlayer?.setName?.(data.player_name)}
    if(Array.isArray(data.learning?.cards) && window.SushiLearning?.importCards) window.SushiLearning.importCards(data.learning.cards);
    if(Array.isArray(data.learning?.events)){
      for(const e of data.learning.events){if(e&&typeof e.id==='string'&&/^[a-zA-Z0-9_:-]{1,160}$/.test(e.id))localStorage.setItem(LEARNING_EVENT+e.id,JSON.stringify(e))}
      if(window.SushiLearning?.reloadFromStorage)window.SushiLearning.reloadFromStorage();else window.dispatchEvent(new CustomEvent('sushi-learning-change'));
    }
    const ev=new Event('sushi-avatar-changed');ev.__fromProfileSync=true;window.dispatchEvent(ev);
    window.dispatchEvent(new CustomEvent('sushi-profile-synced',{detail:{sushiId:data.sushi_id}}));
  }
  // Serialize server wallet mutations together with their local application.
  // An older profile response must finish before an achievement credits gems.
  let walletQueue=Promise.resolve();
  function withWalletTransaction(operation){
    const result=walletQueue.then(operation);
    walletQueue=result.catch(()=>{});
    return result;
  }
  let syncInFlight=null,syncAgain=false;
  async function runSync(){
    const c=creds(); if(!c.sushi_id||!c.pin)return {connected:false};
    const sent=readLearning(); const data=await call('sync',c.sushi_id,c.pin); if(creds().sushi_id!==c.sushi_id||creds().pin!==c.pin)return {connected:false,discarded:true}; apply(data); const weak=window.SushiLearning?.getStats?.().weak ?? null; const ld=window.SushiLearning?.getDiagnostics?.()||{}; const diag={sentEvents:sent.events?.length||0,sentCards:sent.cards?.length||0,serverEvents:data.learning?.events?.length||0,serverCards:data.learning?.cards?.length||0,weak,...ld}; try{localStorage.setItem('sushitan_sync_diag_v1',JSON.stringify(diag))}catch{} window.dispatchEvent(new CustomEvent('sushi-sync-diagnostic',{detail:diag})); return {connected:true,sushiId:c.sushi_id,...diag};
  }
  let outcomesSyncing=false;
  async function syncOutcomes(){
    const c=creds(),ledger=window.SushiAchievementLedger;
    if(outcomesSyncing||!c.sushi_id||!/^\d{4}$/.test(c.pin)||!ledger?.exportOutcomes||!ledger?.importOutcomes)return;
    outcomesSyncing=true;
    try{
      const local=ledger.exportOutcomes();
      // Keep requests bounded; each upload is idempotent on the server.
      const send=async(events,offset)=>{
        const response=await fetch(URL,{method:'POST',headers:{'Content-Type':'application/json','apikey':KEY},body:JSON.stringify({action:'outcome_sync',sushi_id:c.sushi_id,pin:c.pin,outcomes:{events,offset}})});
        const data=await response.json();
        if(!response.ok||!data.ok)throw new Error(data.error||'outcome_sync_failed');
        ledger.importOutcomes(data.outcomes?.events||[]);
        return data.outcomes?.nextOffset;
      };
      let offset=0,next=null;
      for(let i=0;i<local.length;i+=200){next=await send(local.slice(i,i+200),0)}
      if(!local.length)next=await send([],0);
      // Fetch every server page, including after the first upload page.
      if(next!==null){offset=next;for(let page=0;next!==null&&page<100;page++){next=await send([],offset);offset=next??offset}}
    }finally{outcomesSyncing=false}
  }
  async function syncNow(){
    if(syncInFlight){syncAgain=true;return syncInFlight}
    syncInFlight=withWalletTransaction(runSync).then(async result=>{await syncOutcomes().catch(error=>console.warn('Achievement outcome sync:',error));return result});
    try{return await syncInFlight}
    finally{syncInFlight=null;if(syncAgain){syncAgain=false;queueMicrotask(()=>syncNow().catch(()=>{}))}}
  }
  async function connect(id,pin,create=false){
    id=String(id||'').normalize('NFKC').trim().toLowerCase();pin=String(pin||'').trim();
    if(!/^[a-z0-9_-]{4,24}$/.test(id))throw new Error('IDは4〜24文字の半角英数字・_・-で入力してください');
    if(!/^\d{4}$/.test(pin))throw new Error('PINは4桁の数字で入力してください');
    const sent=readLearning(); const data=await withWalletTransaction(async()=>{const data=await call(create?'create':'sync',id,pin);localStorage.setItem(ID_KEY,id);localStorage.setItem(PIN_KEY,pin);apply(data);return data}); const weak=window.SushiLearning?.getStats?.().weak ?? null; const ld=window.SushiLearning?.getDiagnostics?.()||{}; const diag={sentEvents:sent.events?.length||0,sentCards:sent.cards?.length||0,serverEvents:data.learning?.events?.length||0,serverCards:data.learning?.cards?.length||0,weak,...ld}; try{localStorage.setItem('sushitan_sync_diag_v1',JSON.stringify(diag))}catch{} render();return {...data,...diag};
  }
  function disconnect(){localStorage.removeItem(ID_KEY);localStorage.removeItem(PIN_KEY);render()}
  const msg=e=>({id_taken:'そのIDはすでに使われています',not_found:'そのIDは見つかりません',wrong_pin:'PINが違います',temporarily_locked:'失敗が続いたため10分間ロックされています'}[e?.code]||e?.message||'同期できませんでした');
  function ensureUI(){
    if(document.getElementById('sushiSyncButton'))return;
    const st=document.createElement('style');st.textContent=`#sushiSyncButton{position:fixed;right:14px;bottom:76px;z-index:100015;border:1px solid #fed7aa;border-radius:999px;background:#fffaf2;color:#c2410c;padding:9px 12px;font:800 12px system-ui;box-shadow:0 6px 18px #0002;cursor:pointer}#sushiSyncSheet{position:fixed;inset:0;z-index:100030;background:#1423208a;display:none;align-items:flex-end;justify-content:center;font-family:system-ui}#sushiSyncSheet.open{display:flex}.ssp-card{width:min(520px,100%);background:#fffdf8;border-radius:24px 24px 0 0;padding:20px 18px calc(28px + env(safe-area-inset-bottom));color:#243b37}.ssp-card h2{margin:0 0 8px}.ssp-card p{font-size:13px;line-height:1.6;color:#667}.ssp-input{display:grid;gap:8px;margin:12px 0}.ssp-input input{font:700 16px system-ui;padding:12px;border:1px solid #ddd3c5;border-radius:12px}.ssp-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px}.ssp-actions button{border:0;border-radius:14px;padding:13px;font-weight:900;cursor:pointer}.ssp-main{background:#f4511e;color:#fff}.ssp-sub{background:#eee8dd;color:#344}.ssp-status{padding:10px;border-radius:12px;background:#f7f2e8;font-size:12px;font-weight:800}`;document.head.appendChild(st);
    const b=document.createElement('button');b.id='sushiSyncButton';b.textContent='☁ データ同期';
    const s=document.createElement('div');s.id='sushiSyncSheet';s.innerHTML=`<div class="ssp-card"><h2>☁ データ同期</h2><p>普段は登録なしで遊べます。一度つなぐと、この端末ではジェム・名前・取得アバターを自動同期します。共有端末では使い終わったら「この端末から切断」を押してください。</p><div class="ssp-status" id="sspStatus"></div><div class="ssp-input"><input id="sspId" autocomplete="username" maxlength="24" placeholder="すしID（例 sushi1234）"><input id="sspPin" inputmode="numeric" autocomplete="one-time-code" maxlength="4" placeholder="4桁PIN"></div><div class="ssp-actions"><button class="ssp-main" id="sspLoad">このIDで同期</button><button class="ssp-sub" id="sspCreate">新しく作る</button><button class="ssp-sub" id="sspClose">閉じる</button><button class="ssp-sub" id="sspOut">この端末から切断</button></div></div>`;document.body.append(b,s);
    const id=s.querySelector('#sspId'),pin=s.querySelector('#sspPin');id.value=localStorage.getItem(ID_KEY)||'';pin.value=localStorage.getItem(PIN_KEY)||'';
    const run=async create=>{try{setStatus(create?'作成しています…':'同期しています…');await connect(id.value,pin.value,create);const d=JSON.parse(localStorage.getItem('sushitan_sync_diag_v1')||'{}');setStatus('✓ 同期 '+localStorage.getItem(ID_KEY)+'｜送信 '+(d.sentEvents??'?')+'件/'+(d.sentCards??'?')+'語｜サーバー '+(d.serverEvents??'?')+'件/'+(d.serverCards??'?')+'語｜苦手 '+(d.weak??'?')+'語｜保存 '+(d.stored??'?')+' 有効 '+(d.valid??'?')+' 無効 '+(d.invalid??'?')+' 未知ID '+(d.unknown_word_ids??'?'))}catch(e){setStatus(msg(e))}};
    b.onclick=()=>{s.classList.add('open');render()};s.onclick=e=>{if(e.target===s)s.classList.remove('open')};s.querySelector('#sspClose').onclick=()=>s.classList.remove('open');s.querySelector('#sspLoad').onclick=()=>run(false);s.querySelector('#sspCreate').onclick=()=>run(true);s.querySelector('#sspOut').onclick=()=>{disconnect();pin.value='';setStatus('この端末の同期を切断しました')};
  }
  function setStatus(t){const e=document.getElementById('sspStatus');if(e)e.textContent=t}
  function render(){ensureUI();const c=creds();setStatus(c.sushi_id?(c.pin?'接続中：'+c.sushi_id:'ID保存済み：'+c.sushi_id+'（PINを入力すると同期）'):'未設定。この端末だけで遊んでいます。')}
  window.SushiProfileSync={syncNow,connect,disconnect,withWalletTransaction,applyWalletSnapshot,mergeRankPreferences};
  let syncTimer=null;const queueSync=event=>{if(event?.detail?.fromProfileSync)return;clearTimeout(syncTimer);syncTimer=setTimeout(()=>syncNow().catch(()=>{}),700)};const start=()=>{ensureUI();render();const onAvatarPage=/\/sushigacha\/sushi-avatar\.html$/i.test(location.pathname);if(onAvatarPage)setTimeout(()=>syncNow().catch(()=>{}),2500);else syncNow().catch(()=>{});window.addEventListener('sushi-gems-earned',queueSync);window.addEventListener('sushi-gems-spent',queueSync);window.addEventListener('sushi-avatar-changed',e=>{if(!e.__fromProfileSync)queueSync()});window.addEventListener('sushi-player-change',queueSync);window.addEventListener('sushi-daily-quest-change',queueSync);window.addEventListener('sushi-learning-answer',queueSync);window.addEventListener('sushi-achievement-change',queueSync);window.addEventListener('sushi-achievement-preference-change',queueSync);window.addEventListener('pagehide',()=>{if(creds().pin)syncNow().catch(()=>{})})};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
