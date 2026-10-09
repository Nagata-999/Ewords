'use strict';
/* Explicit opt-in integration only. Never starts automatically.
 * Requires the existing PIN-authenticated sushi-id-sync Edge Function to implement
 * action=achievement_sync and return the acknowledged achievement page contract. */
(function(root){
 if(root.SushiAchievementSyncBridge)return;
 const URL='https://rxyoyveykxdfrpomkltl.supabase.co/functions/v1/sushi-id-sync';
 const KEY='sb_publishable_RmWOSxRfsV5YRwCDnKPPAQ_m3VzsUM7';
 const ID='sushitan_sync_id_v1',PIN='sushitan_sync_pin_v1';
 let running=null;
 function supported(){return !!(root.SushiAchievementTransport?.synchronize&&root.SushiAchievementLedger?.exportAllPages)}
 async function run(){
   if(running)return running;
   if(!supported())throw new Error('achievement_modules_missing');
   const sushi_id=(localStorage.getItem(ID)||'').trim().toLowerCase();
   const pin=localStorage.getItem(PIN)||'';
   if(!/^[a-z0-9_-]{4,24}$/.test(sushi_id)||!/^\d{4}$/.test(pin))throw new Error('achievement_pin_not_connected');
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
 root.SushiAchievementSyncBridge=Object.freeze({supported,run});
})(window);
