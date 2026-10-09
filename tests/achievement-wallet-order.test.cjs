const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const key='sushitan_login_bonus_v1';
function setup(){
  const values=new Map([[key,JSON.stringify({gems:100,gemEvents:[]})],['sushitan_sync_id_v1','testuser'],['sushitan_sync_pin_v1','1234']]);
  let balance=100,claimed=false,held=null;
  const calls=[];
  const window={addEventListener(){},dispatchEvent(){},SushiAchievementLedger:{exportAllPages(){}},SushiAchievementTransport:{synchronize:async()=>({})}};
  const context=vm.createContext({window,console,Event:class {},CustomEvent:class {},localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),get length(){return values.size},key:i=>[...values.keys()][i]},sessionStorage:{getItem:()=>null,setItem(){}},document:{readyState:'loading',addEventListener(){}},setTimeout(){},clearTimeout(){},queueMicrotask,fetch:async(url,options)=>{
    const body=JSON.parse(options.body);calls.push(body.action);
    if(body.action==='sync'){
      const snapshot={sushi_id:'testuser',ledger:{gems:balance,gemEvents:claimed?[{id:'avatar30',type:'earn',amount:150}]:[]}};
      if(held){const wait=held;held=null;await wait.promise;}
      return {ok:true,json:async()=>snapshot};
    }
    if(body.action==='achievement_claim'){
      const already=claimed;claimed=true;if(!already)balance+=150;
      return {ok:true,json:async()=>({ok:true,already_claimed:already,claim_id:'avatar30',gems:150,wallet:{gems:balance,gemEvents:[{id:'avatar30',type:'earn',amount:150}]}})};
    }
    return {ok:true,json:async()=>({ok:true,outcomes:{events:body.outcomes?.events||[],nextOffset:null}})};
  }});
  for(const file of ['shared/sushi-profile.js','sushigacha/achievement-sync-bridge.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
  return {window,calls,wallet:()=>JSON.parse(values.get(key)),hold(){let release;held={promise:new Promise(r=>release=r)};return release}};
}
const tick=()=>new Promise(r=>setImmediate(r));
test('delayed pre-claim profile cannot overwrite the 150 gem reward',async()=>{
  const s=setup(),release=s.hold();
  const sync=s.window.SushiProfileSync.syncNow();await tick();
  const claim=s.window.SushiAchievementSyncBridge.claim(30,'avatar');await tick();
  assert.equal(s.calls.includes('achievement_claim'),false);
  release();await Promise.all([sync,claim]);
  assert.equal(s.wallet().gems,250);
  await s.window.SushiAchievementSyncBridge.claim(30,'avatar');
  assert.equal(s.wallet().gems,250);
});
test('profile waits for wallet transaction and queue recovers from errors',async()=>{
  const s=setup();let release;
  const transaction=s.window.SushiProfileSync.withWalletTransaction(()=>new Promise(r=>release=r));await tick();
  const sync=s.window.SushiProfileSync.syncNow();await tick();assert.deepEqual(s.calls,[]);
  release();await Promise.all([transaction,sync]);assert.equal(s.calls[0],'sync');
  await assert.rejects(s.window.SushiProfileSync.withWalletTransaction(()=>{throw new Error('offline')}),/offline/);
  await s.window.SushiProfileSync.syncNow();assert.equal(s.calls.length,2);
});
test('four-digit PIN uploads and imports achievement outcomes',async()=>{
  const s=setup();let imports=0;
  s.window.SushiAchievementLedger.exportOutcomes=()=>[{id:'answer:1'}];
  s.window.SushiAchievementLedger.importOutcomes=()=>imports++;
  await s.window.SushiProfileSync.syncNow();
  assert.ok(s.calls.includes('outcome_sync'));
  assert.ok(imports>0);
});
