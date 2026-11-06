const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const transport=require('../sushigacha/achievement-transport.js');
const event=(id,n=1)=>({id,version:2,game:'sushitan',correct:n,at:123});
function ledger(events){return {exportAllPages:n=>{const a=[];for(let i=0;i<events.length;i+=n)a.push({events:events.slice(i,i+n)});return a},baselineForSync:()=>0,mergeBaseline:()=>{},importEvents:()=>({added:0,conflicts:0,rejected:0})}}
const response=(events,accepted=events.map(e=>e.id))=>({achievements:{synced:true,events,accepted,nextCursor:null,baseline:0}});
test('confirmed history is not uploaded again; new and changed records are sent',async()=>{
 const ack={},events=[event('a'),event('b')],uploads=[];const request=async p=>{uploads.push(p.achievements.events);return response(p.achievements.events)};
 const options={acknowledged:ack,onAcknowledged:a=>Object.assign(ack,a)};
 await transport.synchronize(ledger(events),request,options);assert.equal(uploads[0].length,2);
 await transport.synchronize(ledger(events),request,options);assert.equal(uploads[1].length,0);
 events.push(event('c'));events[0]=event('a',2);await transport.synchronize(ledger(events),request,options);assert.deepEqual(uploads[2].map(e=>e.id),['a','c']);
});
test('failed or invalid acknowledgments do not drop pending records',async()=>{
 const ack={},l=ledger([event('a')]),options={acknowledged:ack,onAcknowledged:a=>Object.assign(ack,a)};
 await assert.rejects(transport.synchronize(l,async()=>response([],[]),options),/not_acknowledged/);assert.deepEqual(ack,{});
 await assert.rejects(transport.synchronize(l,async()=>{throw Error('offline')},options));assert.deepEqual(ack,{});
 await transport.synchronize(l,async p=>response(p.achievements.events),options);assert.ok(ack.a);
});
test('remote imports are acknowledged only after successful validation; all pages still download',async()=>{
 const ack={},seen=[];let round=0;await transport.synchronize(ledger([]),async p=>{seen.push(p.achievements.cursor);return {achievements:{...response([event(round?'z':'a')],[]).achievements,nextCursor:round++?null:'a'}}},{acknowledged:ack,onAcknowledged:a=>Object.assign(ack,a)});assert.deepEqual(seen,[null,'a']);assert.ok(ack.a&&ack.z);
});
function profileHarness(sharedStore){
 let now=1000000,serial=0,requests=0,fail=false,release=null;
 const store=sharedStore||new Map([['sushitan_sync_id_v1','tester'],['sushitan_sync_pin_v1','1234']]);const listeners=new Map(),timers=new Map();
 const storage={get length(){return store.size},key:i=>[...store.keys()][i],getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
 const target={addEventListener:(n,f)=>{const a=listeners.get(n)||[];a.push(f);listeners.set(n,a)},dispatchEvent:e=>{for(const f of listeners.get(e.type)||[])f(e)}};
 const document={...target,hidden:false,readyState:'loading',getElementById:()=>({textContent:''})};
 const navigator={onLine:true};const window={...target,navigator,SushiAchievementSyncBridge:{supported:()=>true,run:async()=>{}}};
 const network={request:async payload=>{requests++;if(release)await new Promise(r=>release=r);if(fail)throw Error('offline');return {sushi_id:payload.sushi_id,ledger:{gems:0,gemEvents:[]},learning:{events:[],cards:[]}}}};
 let source=fs.readFileSync(require('path').join(__dirname,'../cloudflare/pin-sync/assets/profile.txt'),'utf8').replace("import('/api/pin-sync/transport.mjs').then(module=>module.createSyncTransport())",'Promise.resolve(network)');
 vm.runInNewContext(source,{window,document,navigator,network,localStorage:storage,sessionStorage:storage,location:{pathname:'/sushitan'},console,Date:{now:()=>now},Event:class{constructor(type){this.type=type}},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail}},setTimeout:(f,ms)=>{timers.set(++serial,{f,at:now+ms});return serial},clearTimeout:id=>timers.delete(id)});
 const flush=async()=>{for(let i=0;i<80;i++)await Promise.resolve()};
 return {window,document,navigator,store,flush,get requests(){return requests},event:(type,detail)=>target.dispatchEvent({type,detail}),start:()=>target.dispatchEvent({type:'DOMContentLoaded'}),setFail:v=>fail=v,advance:async ms=>{const end=now+ms;while(true){const next=[...timers].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;now=next[1].at;timers.delete(next[0]);next[1].f();await flush()}now=end;await flush()}};
}
test('60 answer-related events batch into two automatic syncs; unchanged navigation skips sync',async()=>{
 const h=profileHarness();h.start();await h.advance(0);assert.equal(h.requests,1);
 for(let i=0;i<60;i++){h.event('sushi-daily-quest-change');await h.advance(1000)}assert.equal(h.requests,3);
 const next=profileHarness(h.store);next.start();await next.advance(0);assert.equal(next.requests,0);
 await h.advance(60000);assert.equal(h.requests,3);
});
test('offline and hidden preserve pending; manual wallet sync remains immediate',async()=>{
 const h=profileHarness();h.start();await h.advance(0);h.document.hidden=true;h.event('sushi-achievement-change');await h.advance(30000);assert.equal(h.requests,1);assert.equal(h.store.get('sushitan_sync_pending_v1'),'1');
 h.document.hidden=false;h.navigator.onLine=false;h.event('visibilitychange');await h.advance(0);assert.equal(h.requests,1);
 h.navigator.onLine=true;h.event('online');await h.advance(0);assert.equal(h.requests,2);
 await h.window.SushiProfileSync.syncWallet();assert.equal(h.requests,3);
});
test('failure keeps pending and pauses retries; online retries retained records',async()=>{
 const h=profileHarness();h.start();await h.advance(0);h.setFail(true);h.event('sushi-achievement-change');await h.advance(30000);assert.equal(h.requests,2);assert.equal(h.store.get('sushitan_sync_pending_v1'),'1');
 h.event('sushi-achievement-change');await h.advance(120000);assert.equal(h.requests,2);h.setFail(false);h.event('online');await h.advance(0);assert.equal(h.requests,3);assert.equal(h.store.get('sushitan_sync_pending_v1'),undefined);
});
test('sync-generated notifications never schedule another upload',async()=>{
 const h=profileHarness();h.start();await h.advance(0);h.event('sushi-achievement-change',{fromProfileSync:true});h.event('sushi-daily-quest-change',{imported:true});await h.advance(60000);assert.equal(h.requests,1);
});
test('bridge skips unchanged progress, scopes acknowledgments by account and permits forced refresh',async()=>{
 const store=new Map([['sushitan_sync_id_v1','tester'],['sushitan_sync_pin_v1','1234']]);let calls=0,now=1000000;const uploads=[];
 const root={SushiAchievementLedger:ledger([event('a')]),SushiAchievementTransport:transport,addEventListener:()=>{},dispatchEvent:()=>{},SushiProfileSync:{requestJSON:async p=>{calls++;uploads.push(p.achievements.events);return response(p.achievements.events)}}};
 const localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
 vm.runInNewContext(fs.readFileSync(require('path').join(__dirname,'../cloudflare/pin-sync/assets/bridge.txt'),'utf8'),{window:root,localStorage,console,Date:{now:()=>now},CustomEvent:class{},setTimeout:()=>1,clearTimeout:()=>{}});
 await root.SushiAchievementSyncBridge.run();await root.SushiAchievementSyncBridge.run();assert.equal(calls,1);
 await root.SushiAchievementSyncBridge.run({force:true});assert.equal(calls,2);assert.equal(uploads[1].length,0);
 store.set('sushitan_sync_id_v1','another');await root.SushiAchievementSyncBridge.run();assert.equal(uploads[2].length,1);
 now+=300001;await root.SushiAchievementSyncBridge.run();assert.equal(calls,4);
});
