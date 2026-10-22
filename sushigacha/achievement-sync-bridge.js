'use strict';
/* PIN-authenticated automatic achievement sync. */
(function(root){
 if(root.SushiAchievementSyncBridge)return;
 const request=payload=>{if(!root.SushiProfileSync?.requestJSON)throw new Error('profile_transport_missing');return root.SushiProfileSync.requestJSON(payload)};
 function assertAccount(id,pin){if((localStorage.getItem(ID)||'').trim().toLowerCase()!==id||localStorage.getItem(PIN)!==pin)throw new Error('achievement_account_changed')}
 const ID='sushitan_sync_id_v1',PIN='sushitan_sync_pin_v1';
 let running=null,syncTimer=null,receiptsRunning=null,paused=false;const claims=new Map();
 const RECEIPTS='sushitan_verified_achievement_receipts_v1:';
 function cachedReceipts(){
   const sushi_id=(localStorage.getItem(ID)||'').trim().toLowerCase();
   try{const data=JSON.parse(localStorage.getItem(RECEIPTS+sushi_id)||'null');return data?.sushi_id===sushi_id&&Array.isArray(data.receipts?.ids)&&root.SushiAchievementReceipts?.parse(data)?data:null}catch{return null}
 }
 function rememberReceipts(data,sushi_id){
   if((localStorage.getItem(ID)||'').trim().toLowerCase()!==sushi_id||!Array.isArray(data.receipts?.ids)||!root.SushiAchievementReceipts?.parse(data))return;
   const previous=cachedReceipts();
   const result={ok:true,sushi_id,receipts:{ids:[...new Set([...(previous?.receipts.ids||[]),...data.receipts.ids])]}};
   localStorage.setItem(RECEIPTS+sushi_id,JSON.stringify(result));
   root.dispatchEvent(new CustomEvent('sushi-achievement-receipts',{detail:{...result,sushiId:sushi_id}}));
 }
 function supported(){return !!(root.SushiAchievementTransport?.synchronize&&root.SushiAchievementLedger?.exportAllPages)}
 async function run(){
   if(running)return running;
   if(!supported())throw new Error('achievement_modules_missing');
   const sushi_id=(localStorage.getItem(ID)||'').trim().toLowerCase();
   const pin=localStorage.getItem(PIN)||'';
   if(!/^[a-z0-9_-]{4,24}$/.test(sushi_id)||!/^\d{4}$/.test(pin))throw new Error('achievement_pin_not_connected');
   // A completed PIN profile sync triggers this, and the initial delayed
   // run covers pages where profile sync happened before this module loaded.
   running=root.SushiAchievementTransport.synchronize(root.SushiAchievementLedger,async payload=>{
     assertAccount(sushi_id,pin);
     const body=await request({...payload,sushi_id,pin});
     assertAccount(sushi_id,pin);
     return body;
   });
   try{
     const result=await running;paused=false;
     root.dispatchEvent(new CustomEvent('sushi-achievement-sync',{detail:{supported:true,...result}}));
     return result;
   }catch(error){
     paused=true;root.dispatchEvent(new CustomEvent('sushi-achievement-sync',{detail:{supported:false,error:error.message}}));
     throw error;
   }finally{running=null}
 }
 async function fetchReceipts(){
   const sushi_id=(localStorage.getItem(ID)||'').trim().toLowerCase(),pin=localStorage.getItem(PIN)||'';
   if(!/^[a-z0-9_-]{4,24}$/.test(sushi_id)||!/^[0-9]{4}$/.test(pin))return null;
   const data=await request({action:'achievement_claims',sushi_id,pin});
   assertAccount(sushi_id,pin);
   if(!root.SushiAchievementReceipts?.parse(data))throw new Error('invalid_achievement_receipts');
   rememberReceipts(data,sushi_id);
   return data;
 }
 function receipts(){if(receiptsRunning)return receiptsRunning;receiptsRunning=fetchReceipts().finally(()=>{receiptsRunning=null});return receiptsRunning}
 function claim(threshold,category='all_correct'){
   const key=[localStorage.getItem(ID),category,threshold].join(':');
   if(claims.has(key))return claims.get(key);
   const promise=claimOnce(threshold,category).finally(()=>claims.delete(key));claims.set(key,promise);return promise;
 }
 async function claimOnce(threshold,category='all_correct'){
   const sushi_id=(localStorage.getItem(ID)||'').trim().toLowerCase(),pin=localStorage.getItem(PIN)||'';
   if(!/^[a-z0-9_-]{4,24}$/.test(sushi_id)||!/^[0-9]{4}$/.test(pin))throw new Error('achievement_pin_not_connected');
   if(!Number.isSafeInteger(threshold))throw new Error('invalid_threshold');
   const stageId=`achievement:${category}:${threshold}`;
   if(cachedReceipts()?.receipts.ids.includes(stageId))return {ok:true,already_claimed:true,claim_id:stageId,gems:0};
   const transaction=root.SushiProfileSync?.withWalletTransaction;
   if(!transaction)throw new Error('achievement_wallet_sync_missing');
   const requestClaim=()=>transaction(async()=>{
   if(localStorage.getItem(ID)?.trim().toLowerCase()!==sushi_id||localStorage.getItem(PIN)!==pin)throw new Error('achievement_account_changed');
   const before=JSON.parse(localStorage.getItem('sushitan_login_bonus_v1')||'{}');
   const data=await request({action:'achievement_claim',sushi_id,pin,threshold,category,wallet_event_ids:(before.gemEvents||[]).map(e=>e?.id).filter(Boolean)});
   if(!data.wallet||!Number.isSafeInteger(data.wallet.gems)||data.wallet.gems<0||!Array.isArray(data.wallet.gemEvents)||data.claim_id!==stageId)throw new Error('invalid_claim_wallet');
   if(localStorage.getItem(ID)?.trim().toLowerCase()!==sushi_id||localStorage.getItem(PIN)!==pin)throw new Error('achievement_account_changed');
   // Use the server's authoritative wallet snapshot, including for a previously
   // claimed reward. Do not add gems a second time on the client.
   if(data.wallet&&Number.isSafeInteger(data.wallet.gems)&&Array.isArray(data.wallet.gemEvents)){
     const key='sushitan_login_bonus_v1';
     const ledger=JSON.parse(localStorage.getItem(key)||'{}');
     // Retained history is not an acknowledgment: older accepted IDs may have
     // been pruned. Preserve only events that the server has not acknowledged.
     const wallet=root.SushiProfileSync.applyWalletSnapshot(ledger,data.wallet,before.gemAcknowledgedIds||[]);
     localStorage.setItem(key,JSON.stringify({...ledger,...wallet}));
     root.dispatchEvent(new CustomEvent('sushi-gem-change'));
   }
   return data;
   });
   let data;
   try{data=await requestClaim()}catch(error){
     if(error.code!=='not_reached')throw error;
     // Only upload progress when the authoritative server needs fresh data.
     if(['all_correct','vocabulary','toeic','all_games_day'].includes(category))await run();
     if(['practice','login_03','login_05','login_23'].includes(category))await root.SushiLoginAchievements?.record?.(true);
     else await root.SushiProfileSync?.syncNow?.();
     data=await requestClaim();
   }
   root.dispatchEvent(new CustomEvent('sushi-gems-updated',{detail:{source:'achievement',claim_id:data.claim_id}}));
   root.dispatchEvent(new CustomEvent('sushi-achievement-claimed',{detail:data}));
   if(data.claim_id===stageId)rememberReceipts({ok:true,sushi_id,receipts:{ids:[stageId]}},sushi_id);
   receipts().catch(()=>null);
   return data;
 }
 root.SushiAchievementSyncBridge=Object.freeze({supported,run,claim,receipts,cachedReceipts});
 // Initial sync on page load, then follow established profile sync.
 // Full profile synchronization explicitly awaits run(), including all pages.
 root.addEventListener('sushi-achievement-change',event=>{
   if(event?.detail?.imported||event?.detail?.importedOutcomes)return;
   if(!localStorage.getItem(PIN))return;
   if(paused)return;
   clearTimeout(syncTimer);
   syncTimer=setTimeout(()=>run().catch(error=>console.warn('Achievement sync deferred:',error.message)),2500);
 });
 root.addEventListener('online',()=>{paused=false});
 if(localStorage.getItem(ID)&&localStorage.getItem(PIN))setTimeout(()=>{run().catch(error=>console.warn('Achievement sync deferred:',error.message));receipts().catch(()=>null)},1500);
})(window);
