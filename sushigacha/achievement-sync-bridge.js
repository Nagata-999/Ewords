'use strict';
/* PIN-authenticated automatic achievement sync. */
(function(root){
 if(root.SushiAchievementSyncBridge)return;
 const URL='https://rxyoyveykxdfrpomkltl.supabase.co/functions/v1/sushi-id-sync';
 const KEY='sb_publishable_RmWOSxRfsV5YRwCDnKPPAQ_m3VzsUM7';
 const ID='sushitan_sync_id_v1',PIN='sushitan_sync_pin_v1';
 let running=null,syncTimer=null;
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
     const response=await fetch(URL,{method:'POST',headers:{'Content-Type':'application/json',apikey:KEY},body:JSON.stringify({...payload,sushi_id,pin})});
     const body=await response.json().catch(()=>({error:'invalid_json'}));
     if(!response.ok)throw new Error(body.error||'achievement_sync_failed');
     return body;
   });
   try{
     const result=await running;
     root.dispatchEvent(new CustomEvent('sushi-achievement-sync',{detail:{supported:true,...result}}));
     return result;
   }catch(error){
     root.dispatchEvent(new CustomEvent('sushi-achievement-sync',{detail:{supported:false,error:error.message}}));
     throw error;
   }finally{running=null}
 }
 async function receipts(){
   const sushi_id=(localStorage.getItem(ID)||'').trim().toLowerCase(),pin=localStorage.getItem(PIN)||'';
   if(!/^[a-z0-9_-]{4,24}$/.test(sushi_id)||!/^[0-9]{4}$/.test(pin))return null;
   const response=await fetch(URL,{method:'POST',headers:{'Content-Type':'application/json',apikey:KEY},body:JSON.stringify({action:'achievement_claims',sushi_id,pin})});
   if(!response.ok)throw new Error('achievement_receipts_failed');
   const data=await response.json();
   root.dispatchEvent(new CustomEvent('sushi-achievement-receipts',{detail:{...data,sushiId:sushi_id}}));
   return data;
 }
 async function claim(threshold,category='all_correct'){
   const sushi_id=(localStorage.getItem(ID)||'').trim().toLowerCase(),pin=localStorage.getItem(PIN)||'';
   if(!/^[a-z0-9_-]{4,24}$/.test(sushi_id)||!/^[0-9]{4}$/.test(pin))throw new Error('achievement_pin_not_connected');
   if(!Number.isSafeInteger(threshold))throw new Error('invalid_threshold');
   await run();
   const response=await fetch(URL,{method:'POST',headers:{'Content-Type':'application/json',apikey:KEY},body:JSON.stringify({action:'achievement_claim',sushi_id,pin,threshold,category})});
   const data=await response.json().catch(()=>({error:'invalid_json'}));
   if(!response.ok||data.ok!==true)throw new Error(data.error||'achievement_claim_failed');
   // The server already committed this reward. Update the visible local ledger
   // from the server receipt; NEVER invoke awardGems (which would pay again).
   if(!data.already_claimed&&Number.isSafeInteger(data.gems)&&data.gems>0){
     const key='sushitan_login_bonus_v1';
     const ledger=JSON.parse(localStorage.getItem(key)||'{}');
     const events=Array.isArray(ledger.gemEvents)?ledger.gemEvents:[];
     if(!events.some(e=>e?.id===data.claim_id)){
       events.push({id:data.claim_id,type:'earn',amount:data.gems,source:'achievement',at:Date.now()});
       ledger.gemEvents=events;
       ledger.gems=Math.max(0,Number(ledger.gems)||0)+data.gems;
       ledger.gemSyncBase=ledger.gems;
       ledger.gemSyncBaseAt=Date.now();
       localStorage.setItem(key,JSON.stringify(ledger));
       root.dispatchEvent(new CustomEvent('sushi-gem-change'));
     }
   }
   // Synchronize the receipt to the other devices using the existing merge.
   await root.SushiProfileSync?.syncNow?.().catch(error=>console.warn('Gem sync pending:',error.message));
   // Server-credited rewards may already exist in the profile ledger. Refresh
   // all wallet listeners after profile merge, not only after a local insert.
   root.dispatchEvent(new CustomEvent('sushi-gem-change'));
   root.dispatchEvent(new CustomEvent('sushi-gems-updated',{detail:{source:'achievement',claim_id:data.claim_id}}));
   await receipts().catch(()=>null);
   root.dispatchEvent(new CustomEvent('sushi-achievement-claimed',{detail:data}));
   return data;
 }
 root.SushiAchievementSyncBridge=Object.freeze({supported,run,claim,receipts});
 // Initial sync on page load, then follow established profile sync.
 root.addEventListener('sushi-profile-synced',()=>{run().catch(error=>console.warn('Achievement sync deferred:',error.message))});
 root.addEventListener('sushi-achievement-change',()=>{
   if(!localStorage.getItem(PIN))return;
   clearTimeout(syncTimer);
   syncTimer=setTimeout(()=>run().catch(error=>console.warn('Achievement sync deferred:',error.message)),2500);
 });
 if(localStorage.getItem(ID)&&localStorage.getItem(PIN))setTimeout(()=>{run().catch(error=>console.warn('Achievement sync deferred:',error.message));receipts().catch(()=>null)},1500);
})(window);
