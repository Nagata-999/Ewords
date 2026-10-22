'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {stripTypeScriptTypes}=require('node:module');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const copy=v=>JSON.parse(JSON.stringify(v));
const LEDGER='sushitan_login_bonus_v1',PENDING='sushitan_sync_pending_v1',JOURNAL='sushitan_sync_journal_v1',EVENT='sushitan_learning_v1:event:';
const serverVM=vm.createContext({ADMIN_USAGE_ENABLED:false,Deno:{serve(){}},Response,TextEncoder});
vm.runInContext(stripTypeScriptTypes(read('supabase/functions/sushi-id-sync/index.ts').replace(/^import [^\r\n]*\r?\n/gm,'')),serverVM);
const learningEvent=(id,correct=false)=>({version:1,id,word_id:'test:one',game_id:'sushitan',correct,count:1,at:100});
function server(){
 let wallet={gems:100,gemEvents:[],gacha:{owned:['starter']}},learning={events:[],cards:[]};const calls=[];
 return {calls,get wallet(){return wallet},get learning(){return learning},async respond(body){
   calls.push(copy(body));
   if(body.action==='sync'||body.action==='create'){
     wallet=copy(serverVM.mergeLedger(wallet,body.ledger));learning=copy(serverVM.mergeLearning(learning,body.learning));
     const publicWallet={...wallet,gemAcknowledgedIds:(body.ledger.gemEvents||[]).map(e=>e.id).filter(id=>wallet.gemEventIds.includes(id))};delete publicWallet.gemEventIds;
     return {ok:true,sushi_id:body.sushi_id,player_name:'remote',ledger:publicWallet,learning:copy(learning)};
   }
   if(body.action==='outcome_sync')return {ok:true,outcomes:{events:body.outcomes.events,nextOffset:null}};
   throw Error('unexpected_action:'+body.action);
 }};
}
function client(remote=server(),values=new Map()){
 if(!values.has(LEDGER))values.set(LEDGER,JSON.stringify({gems:100,gemEvents:[],gacha:{avatar:{hair:1},owned:['starter']}}));
 if(!values.has('sushitan_sync_id_v1'))values.set('sushitan_sync_id_v1','testuser');
 if(!values.has('sushitan_sync_pin_v1'))values.set('sushitan_sync_pin_v1','1234');
 const window=new EventTarget(),timers=new Map(),requests=[];let nextTimer=0,fetchOverride=null,fail=null;
 const storage={getItem:k=>values.get(k)??null,setItem(k,v){if(fail?.(k,v,'set'))throw Error('quota');values.set(k,String(v))},removeItem(k){if(fail?.(k,null,'remove'))throw Error('quota');values.delete(k)},key:i=>[...values.keys()][i]??null,get length(){return values.size}};
 const context=vm.createContext({window,localStorage:storage,sessionStorage:{getItem:()=>null,setItem(){}},console,Event,CustomEvent,AbortController,queueMicrotask,document:{readyState:'loading',addEventListener(){}},setTimeout(fn,ms){const id=++nextTimer;timers.set(id,{fn,ms});return id},clearTimeout:id=>timers.delete(id),fetch:async(url,options)=>{const body=JSON.parse(options.body);requests.push(body);if(fetchOverride)return fetchOverride(body,options);return {ok:true,json:async()=>remote.respond(body)}}});
 vm.runInContext(read('shared/sushi-profile.js'),context);
 return {window,context,storage,values,requests,timers,api:window.SushiProfileSync,remote,get wallet(){return JSON.parse(values.get(LEDGER))},setFetch(fn){fetchOverride=fn},failWrites(fn){fail=fn},load(file){vm.runInContext(read(file),context)},async expire(){for(const [id,t] of timers)if(t.ms===15000){timers.delete(id);t.fn()}await tick()},add(id,amount,type='earn'){const l=this.wallet,e={id,type,amount,at:100};l.gemEvents.push(e);(l.gemPendingEvents??=[]).push(e);l.gems+=(type==='earn'?1:-1)*amount;storage.setItem(LEDGER,JSON.stringify(l))},answer(id){storage.setItem(EVENT+id,JSON.stringify(learningEvent(id)))}};
}
const tick=()=>new Promise(r=>setImmediate(r));
const data=c=>[...c.values].filter(([k])=>k!==PENDING).sort(([a],[b])=>a.localeCompare(b));
for(const status of [402,429,500,503])test(`HTTP ${status}: local data and pending events survive, explicit recovery converges`,async()=>{
 const c=client();c.add('earn',20);c.answer('answer');const before=data(c);c.setFetch(async()=>({ok:false,status,json:async()=>null}));
 await assert.rejects(c.api.syncNow(),new RegExp('sync_http_'+status));assert.deepEqual(data(c),before);assert.equal(c.values.get(PENDING),'1');assert.equal(c.requests.length,1);
 await tick();assert.equal(c.requests.length,1);c.setFetch(null);await c.api.syncNow();assert.equal(c.wallet.gems,120);assert.equal(c.remote.wallet.gems,120);assert.equal(c.wallet.gemPendingEvents.length,0);assert.equal(c.values.has(PENDING),false);assert.ok(c.values.has(EVENT+'answer'));
});
test('offline and timeout (headers or body) retain data; late responses cannot apply',async()=>{
 for(const kind of ['offline','headers','body']){
   const c=client();c.add('earn',5);const before=data(c);let release;
   c.setFetch(async()=>{if(kind==='offline')throw TypeError('offline');const wait=new Promise(r=>release=r);return kind==='headers'?wait:{ok:true,json:()=>wait}});
   const attempt=c.api.syncNow(),rejected=assert.rejects(attempt,kind==='offline'?/offline/:/sync_timeout/);await tick();if(kind!=='offline')await c.expire();await rejected;
   assert.deepEqual(data(c),before);assert.equal(c.values.get(PENDING),'1');
   release?.(kind==='headers'?{ok:true,json:async()=>({ok:true})}:{ok:true});await tick();assert.deepEqual(data(c),before);
   c.setFetch(null);await c.api.syncNow();assert.equal(c.wallet.gems,105);
 }
});
test('null, malformed JSON, missing fields and unacknowledged data never apply',async()=>{
 for(const kind of ['null','json','empty','ledger','learning','ack','wrong-account']){
  const c=client();c.add('earn',5);c.answer('answer');const before=data(c);
  c.setFetch(async body=>({ok:true,json:async()=>{if(kind==='json')throw SyntaxError('bad');if(kind==='null')return null;if(kind==='empty')return {};const d=await c.remote.respond(body);if(kind==='ledger')d.ledger=null;if(kind==='learning')d.learning=null;if(kind==='ack')d.learning.events=[];if(kind==='wrong-account')d.sushi_id='someoneelse';return d}}));
  await assert.rejects(c.api.syncNow());assert.deepEqual(data(c),before);assert.equal(c.values.get(PENDING),'1');
 }
});
test('server committed upload, response lost: replay does not duplicate earn or spend',async()=>{
 const c=client();c.add('earn',35);c.add('spend',12,'spend');c.answer('a');const before=data(c);
 c.setFetch(async body=>{await c.remote.respond(body);throw TypeError('response_lost')});await assert.rejects(c.api.syncNow(),/response_lost/);assert.deepEqual(data(c),before);assert.equal(c.remote.wallet.gems,123);
 c.setFetch(null);await c.api.syncNow();await c.api.syncNow();assert.equal(c.wallet.gems,123);assert.equal(c.remote.wallet.gems,123);assert.equal(c.remote.learning.events.length,1);
});
test('storage failures at journal and midway roll back; retry keeps the pending data',async()=>{
 for(const target of [JOURNAL,LEDGER,EVENT+'remote','sushitan_shared_player_name_v1']){
  const c=client();c.add('earn',5);c.answer('local');await c.remote.respond({action:'sync',sushi_id:'testuser',ledger:{gemEvents:[]},learning:{events:[learningEvent('remote')]}});const before=data(c);let failed=false;
  c.failWrites(k=>{if(k===target&&!failed){failed=true;return true}return false});await assert.rejects(c.api.syncNow(),/quota/);assert.deepEqual(data(c),before);assert.equal(c.values.get(PENDING),'1');
  c.failWrites(null);await c.api.syncNow();assert.equal(c.wallet.gems,105);assert.ok(c.values.has(EVENT+'remote'));assert.ok(c.values.has(EVENT+'local'));
 }
});
test('reopen interrupted local commit recovers journal without undoing later edits',async()=>{
 const c=client();c.add('earn',5);const before=c.values.get(LEDGER),partial=JSON.stringify({...c.wallet,gems:999});c.values.set(LEDGER,partial);c.values.set(JOURNAL,JSON.stringify([[LEDGER,before,partial]]));c.values.set(PENDING,'1');
 const reopened=client(c.remote,c.values);await reopened.api.syncNow();assert.equal(reopened.wallet.gems,105);assert.equal(reopened.values.has(JOURNAL),false);
 const current=reopened.values.get(LEDGER);reopened.values.set(JOURNAL,JSON.stringify([[LEDGER,before,partial]]));await reopened.api.syncNow();assert.equal(reopened.wallet.gems,105);assert.notEqual(current,partial);
});
test('double sync shares one request; disconnect discards an in-flight response',async()=>{
 const c=client();let release;c.setFetch(async body=>{await new Promise(r=>release=r);return {ok:true,json:async()=>c.remote.respond(body)}});
 const first=c.api.syncNow(),second=c.api.syncNow();assert.equal(first,second);await tick();assert.equal(c.requests.length,1);const before=c.values.get(LEDGER);
 c.values.delete('sushitan_sync_pin_v1');release();await assert.rejects(first,/sync_account_changed/);assert.equal(c.values.get(LEDGER),before);assert.equal(c.values.get(PENDING),'1');
});
test('independent offline devices converge by union with authoritative wallet and unique deltas',async()=>{
 const remote=server(),a=client(remote),b=client(remote);a.add('a-earn',30);a.add('a-spend',10,'spend');a.answer('a');b.add('b-earn',40);b.add('b-spend',20,'spend');b.answer('b');
 for(const c of [a,b]){const l=c.wallet;l.gacha.owned.push(c===a?'hat-a':'hat-b');c.storage.setItem(LEDGER,JSON.stringify(l));c.setFetch(async()=>{throw Error('offline')});await assert.rejects(c.api.syncNow());c.setFetch(null)}
 await a.api.syncNow();await b.api.syncNow();await a.api.syncNow();await b.api.syncNow();
 for(const c of [a,b]){assert.equal(c.wallet.gems,140);assert.equal(c.wallet.gemPendingEvents.length,0);assert.ok(c.values.has(EVENT+'a'));assert.ok(c.values.has(EVENT+'b'));assert.deepEqual(new Set(c.wallet.gacha.owned),new Set(['starter','hat-a','hat-b']));assert.equal(c.wallet.gacha.avatar.hair,1)}
 assert.equal(remote.wallet.gems,140);assert.equal(remote.learning.events.length,2);
});
test('failed outcome fetch does not report full success or clear pending; recovery succeeds',async()=>{
 const c=client();c.load('sushigacha/achievement-ledger.js');let successes=0;c.window.addEventListener('sushi-profile-synced',()=>successes++);
 c.setFetch(async body=>body.action==='outcome_sync'?{ok:false,status:503,json:async()=>null}:{ok:true,json:async()=>c.remote.respond(body)});
 await assert.rejects(c.api.syncNow());assert.equal(successes,0);assert.equal(c.values.get(PENDING),'1');c.setFetch(null);await c.api.syncNow();assert.equal(successes,1);assert.equal(c.values.has(PENDING),false);
});
test('outcome persistence failure rejects instead of silently accepting a partial page',async()=>{
 const c=client();c.load('sushigacha/achievement-ledger.js');const e={version:1,id:'answer:one',game:'sushitan',questionId:'word',correct:true,review:false,at:100};
 c.setFetch(async body=>({ok:true,json:async()=>body.action==='outcome_sync'?{ok:true,outcomes:{events:[e],nextOffset:null}}:c.remote.respond(body)}));
 c.failWrites(k=>k.startsWith('sushitan_achievement_outcome_v1:'));await assert.rejects(c.api.syncNow(),/quota/);assert.equal(c.values.get(PENDING),'1');c.failWrites(null);await c.api.syncNow();assert.equal(c.window.SushiAchievementLedger.exportOutcomes().length,1);
});
test('non-advancing pagination and incomplete achievement sync fail closed',async()=>{
 const c=client();c.load('sushigacha/achievement-ledger.js');c.setFetch(async body=>({ok:true,json:async()=>body.action==='outcome_sync'?{ok:true,outcomes:{events:[],nextOffset:0}}:c.remote.respond(body)}));
 await assert.rejects(c.api.syncNow(),/invalid_outcome_page/);assert.equal(c.values.get(PENDING),'1');assert.equal(c.requests.length,2);
 c.setFetch(null);c.window.SushiAchievementSyncBridge={supported:()=>true,run:async()=>{throw Error('achievement_failure')}};await assert.rejects(c.api.syncNow(),/achievement_failure/);assert.equal(c.values.get(PENDING),'1');
});
test('page closed after server upload: a fresh page retries retained events without double credit',async()=>{
 const remote=server(),c=client(remote);c.add('before-close',15);c.answer('before-close');
 c.setFetch(async body=>{await remote.respond(body);return new Promise(()=>{})});
 c.api.syncNow();await tick();assert.equal(c.values.get(PENDING),'1');assert.equal(remote.wallet.gems,115);
 // Discard the old page context while retaining the browser's persisted keys.
 const reopened=client(remote,new Map(c.values));await reopened.api.syncNow();
 assert.equal(reopened.wallet.gems,115);assert.ok(reopened.values.has(EVENT+'before-close'));assert.equal(reopened.values.has(PENDING),false);
});
test('local corruption and a rejected acknowledgment cannot erase pending wallet events',async()=>{
 const c=client();c.values.set(LEDGER,'broken-json');await assert.rejects(c.api.syncNow(),/invalid_local_data/);assert.equal(c.values.get(LEDGER),'broken-json');assert.equal(c.requests.length,0);
 const d=client();d.add('pending',5);const before=d.values.get(LEDGER);d.setFetch(async body=>{const value=await d.remote.respond(body);value.ledger.gemEvents=[];value.ledger.gemAcknowledgedIds=[];return {ok:true,json:async()=>value}});
 await assert.rejects(d.api.syncNow(),/wallet_not_acknowledged/);assert.equal(d.values.get(LEDGER),before);
});
