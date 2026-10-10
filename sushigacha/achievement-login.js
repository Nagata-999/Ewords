'use strict';
/* Visits use JST calendar days. Connected rewards use server-confirmed facts,
 * kept separate from guest history and from login-bonus button claims. */
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root){root.SushiLoginAchievements=api;api.start(root);}
})(typeof window==='undefined'?null:window,function(){
  const PREFIX='sushitan_login_achievements_v1:';
  function parts(at=Date.now()){
    const d=new Date(at+9*3600000);
    return {day:d.toISOString().slice(0,10),hour:d.getUTCHours()};
  }
  function normalize(value={}){
    const count=n=>Number.isSafeInteger(n)&&n>=0?n:0;
    return {lastDay:/^\d{4}-\d{2}-\d{2}$/.test(value?.lastDay)?value.lastDay:'',streak:count(value?.streak),bestStreak:Math.max(count(value?.streak),count(value?.bestStreak)),hour03:value?.hour03===true,hour05:value?.hour05===true,hour23:value?.hour23===true};
  }
  function visit(previous,at){
    const p=parts(at),old=normalize(previous),yesterday=parts(at-86400000).day;
    const streak=old.lastDay===p.day?Math.max(1,old.streak):old.lastDay===yesterday?old.streak+1:1;
    if(old.lastDay>p.day)return old;
    return {...old,lastDay:p.day,streak,bestStreak:Math.max(old.bestStreak,streak),hour03:old.hour03||p.hour===3,hour05:old.hour05||p.hour===5,hour23:old.hour23||p.hour===23};
  }
  function metrics(login){const l=normalize(login);return {login_visit_streak:l.bestStreak,login_03:Number(l.hour03),login_05:Number(l.hour05),login_23:Number(l.hour23)};}
  let current=null;
  function start(root){
    const ID='sushitan_sync_id_v1',PIN='sushitan_sync_pin_v1';
    let busy=false,inflight=null,lastHour='',lastAttempt=0;
    const credentials=()=>({id:(root.localStorage.getItem(ID)||'').trim().toLowerCase(),pin:root.localStorage.getItem(PIN)||''});
    const connected=c=>/^[a-z0-9_-]{4,24}$/.test(c.id)&&/^\d{4}$/.test(c.pin);
    const key=()=>PREFIX+(connected(credentials())?credentials().id:'guest');
    current=()=>{try{return normalize(JSON.parse(root.localStorage.getItem(key())||'{}'));}catch{return normalize();}};
    const store=(login)=>{
      const before=current(),incoming=normalize(login),newer=incoming.lastDay>=before.lastDay?incoming:before;
      const next={...newer,bestStreak:Math.max(before.bestStreak,incoming.bestStreak),hour03:before.hour03||incoming.hour03,hour05:before.hour05||incoming.hour05,hour23:before.hour23||incoming.hour23};
      root.localStorage.setItem(key(),JSON.stringify(next));
      if(JSON.stringify(before)!==JSON.stringify(next))root.dispatchEvent(new root.CustomEvent('sushi-login-achievement-change'));
    };
    async function record(force=false){
      if(root.document.hidden)return;
      if(busy)return inflight;
      const c=credentials(),p=parts(),hour=`${c.id}:${c.pin}:${p.day}:${p.hour}`;
      if(!force&&lastHour===hour)return;
      if(!connected(c)){store(visit(current(),Date.now()));lastHour=hour;return;}
      if(!force&&Date.now()-lastAttempt<60000)return;
      busy=true;lastAttempt=Date.now();
      inflight=(async()=>{try{
        const response=await root.fetch('https://rxyoyveykxdfrpomkltl.supabase.co/functions/v1/sushi-id-sync',{
          method:'POST',signal:root.AbortSignal?.timeout?.(15000),headers:{'Content-Type':'application/json',apikey:'sb_publishable_RmWOSxRfsV5YRwCDnKPPAQ_m3VzsUM7'},
          body:JSON.stringify({action:'login_visit',sushi_id:c.id,pin:c.pin})
        });
        const data=await response.json();
        if(!response.ok||data.ok!==true||!data.login)throw Error(data.error||'login_visit_failed');
        const now=credentials();if(now.id!==c.id||now.pin!==c.pin)return;
        store(data.login);lastHour=hour;
      }catch(error){root.console?.warn('Login achievement check deferred:',error.message);}
      finally{busy=false;}})();
      return inflight;
    }
    for(const event of ['pageshow','focus','sushi-profile-synced'])root.addEventListener(event,()=>record());
    root.addEventListener('storage',e=>{if(e.key===ID||e.key===PIN){lastHour='';lastAttempt=0;record();}if(e.key===key())root.dispatchEvent(new root.CustomEvent('sushi-login-achievement-change'));});
    root.document.addEventListener('visibilitychange',()=>record());
    root.setInterval(()=>record(),60000);
    record();
    root.SushiLoginAchievements.record=record;
  }
  return {parts,normalize,visit,metrics,start,read:()=>current?current():normalize()};
});
