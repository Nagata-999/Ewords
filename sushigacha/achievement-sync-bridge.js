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
 async function claim(threshold){
   const sushi_id=(localStorage.getItem(ID)||'').trim().toLowerCase(),pin=localStorage.getItem(PIN)||'';
   if(!/^[a-z0-9_-]{4,24}$/.test(sushi_id)||!/^[0-9]{4}$/.test(pin))throw new Error('achievement_pin_not_connected');
   if(!Number.isSafeInteger(threshold))throw new Error('invalid_threshold');
   await run();
   const response=await fetch(URL,{method:'POST',headers:{'Content-Type':'application/json',apikey:KEY},body:JSON.stringify({action:'achievement_claim',sushi_id,pin,threshold})});
   const data=await response.json().catch(()=>({error:'invalid_json'}));
   if(!response.ok||data.ok!==true)throw new Error(data.error||'achievement_claim_failed');
   // Refresh existing gem ledger through its established merge logic.
   await root.SushiProfileSync?.syncNow?.();
   root.dispatchEvent(new CustomEvent('sushi-achievement-claimed',{detail:data}));
   return data;
 }
 root.SushiAchievementSyncBridge=Object.freeze({supported,run,claim});
 // Initial sync on page load, then follow established profile sync.
 root.addEventListener('sushi-profile-synced',()=>{run().catch(error=>console.warn('Achievement sync deferred:',error.message))});
 root.addEventListener('sushi-achievement-change',()=>{
   if(!localStorage.getItem(PIN))return;
   clearTimeout(syncTimer);
   syncTimer=setTimeout(()=>run().catch(error=>console.warn('Achievement sync deferred:',error.message)),2500);
 });
 if(localStorage.getItem(ID)&&localStorage.getItem(PIN))setTimeout(()=>run().catch(error=>console.warn('Achievement sync deferred:',error.message)),1500);
})(window);
