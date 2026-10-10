const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {stripTypeScriptTypes}=require('node:module');
const source=stripTypeScriptTypes(fs.readFileSync(path.join(__dirname,'../supabase/functions/sushi-id-sync/index.ts'),'utf8').replace(/^import [^\r\n]*\r?\n/m,''));
const plain=value=>JSON.parse(JSON.stringify(value));
function boot(){
  let handler,row={sushi_id:'testuser',ledger:{gems:100,gemEvents:[]},learning:{events:[]},pin_hash:'testhash',updated_at:'2026-10-09T00:00:00.000Z'},beforeUpdate;
  let updates=0;const loginCalls=[];
  const db={async rpc(name,args){
    if(name==='sushi_record_login_visit'||name==='sushi_claim_login_achievement'){loginCalls.push({name,args:plain(args)});return {data:name==='sushi_record_login_visit'?{ok:true,login:{lastDay:'2026-10-10',streak:7,bestStreak:7,hour03:true}}:{ok:true,claim_id:'achievement:'+args.p_category+':'+args.p_threshold,gems:10},error:null};}
    assert.equal(name,'sushi_save_profile_if_current');updates++;beforeUpdate?.();
    if(args.p_expected_updated_at!==row.updated_at||JSON.stringify(args.p_expected_ledger)!==JSON.stringify(row.ledger)||JSON.stringify(args.p_expected_learning)!==JSON.stringify(row.learning))return {data:false,error:null};
    row={...row,ledger:plain(args.p_ledger),learning:plain(args.p_learning),player_name:args.p_player_name,updated_at:args.p_updated_at};return {data:true,error:null};
  },from(table){
    let mutation=null;const filters={};
    const query={select(){return query},eq(k,v){filters[k]=v;return query},limit(){return query},update(v){mutation=v;return query},single(){return query.maybeSingle()},async maybeSingle(){
      if(table==='sushi_achievement_claims')return {data:[],error:null};
      if(mutation){updates++;beforeUpdate?.();if(filters.updated_at&&filters.updated_at!==row.updated_at)return {data:null,error:null};row={...row,...plain(mutation)};}
      return {data:plain(row),error:null};
    },then(resolve,reject){return query.maybeSingle().then(resolve,reject)}};
    return query;
  }};
  const context=vm.createContext({console,Response,Request,TextEncoder,Uint8Array,crypto:require('node:crypto').webcrypto,btoa,atob,createClient:()=>db,Deno:{env:{get:()=>''},serve:fn=>handler=fn}});
  vm.runInContext(source,context);
  // PIN hashing is unchanged; keep these tests focused on the authenticated path.
  vm.runInContext("verifyPin=async(pin,hash)=>pin==='1234'&&hash==='testhash'",context);
  return {context,loginCalls,get row(){return row},set row(value){row=value},get updates(){return updates},onUpdate(fn){beforeUpdate=fn},async request(body){const response=await handler(new Request('https://example.test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'sync',sushi_id:'testuser',pin:'1234',ledger:{gemEvents:[]},...body})}));return {status:response.status,data:await response.json()}}};
}
test('pruned event IDs cannot be paid twice and earned total stays cumulative',()=>{
  const {context:c}=boot();
  const events=Array.from({length:1000},(_,i)=>({id:'earn:'+i,type:'earn',amount:1}));
  const first=plain(c.mergeLedger({gems:1000,gemEvents:events},{gemEvents:[{id:'new',type:'earn',amount:5}]}));
  assert.equal(first.gemEvents.length,1000);assert.equal(first.gemsEarnedTotal,1005);
  assert.equal(first.gemEvents.some(e=>e.id==='earn:0'),false);
  const second=plain(c.mergeLedger(first,{gemEvents:[events[0],{id:'spend',type:'spend',amount:7}]}));
  assert.equal(second.gems,998);assert.equal(second.gemsEarnedTotal,1005);
  assert.equal(c.mergeLedger(second,{gemEvents:[events[0]]}).gems,998);
});
test('durable claim receipt blocks replay without compensating its missing credit',()=>{
  const {context:c}=boot();const event={id:'achievement:avatar:30',type:'earn',amount:150};
  assert.equal(c.mergeLedger({gems:100,gemEvents:[]},{gemEvents:[event]},[event.id]).gems,100);
  assert.equal(c.mergeLedger({gems:100,gemEvents:[]},{gemEvents:[event]},[]).gems,100);
});
test('duplicate incoming event credits and earned total are counted only once',()=>{
  const {context:c}=boot(),event={id:'same',type:'earn',amount:8};
  const result=c.mergeLedger({gems:100,gemEvents:[]},{gemEvents:[event,event]});
  assert.equal(result.gems,108);assert.equal(result.gemsEarnedTotal,8);
});
test('concurrent reward during profile save is retained on retry',async()=>{
  const s=boot();let collided=false;
  s.onUpdate(()=>{if(collided)return;collided=true;s.row={...s.row,updated_at:'2026-10-09T00:00:00.001Z',ledger:{gems:250,gemEvents:[{id:'achievement:avatar:30',type:'earn',amount:150}]}}});
  const result=await s.request({ledger:{gemEvents:[{id:'local',type:'earn',amount:10}]}});
  assert.equal(result.status,200);assert.equal(result.data.ledger.gems,260);assert.equal(s.updates,2);
  assert.equal(s.row.ledger.gems,260);assert.ok(s.row.ledger.gemEventIds.includes('local'));
  assert.equal(result.data.ledger.gemEventIds,undefined);
  assert.deepEqual(result.data.ledger.gemAcknowledgedIds,['local']);
});
test('persistent conflict fails without an unconditional profile overwrite',async()=>{
  const s=boot();s.onUpdate(()=>{s.row={...s.row,updated_at:new Date(Date.parse(s.row.updated_at)+1).toISOString()}});
  const result=await s.request({ledger:{gemEvents:[{id:'local',type:'earn',amount:10}]}});
  assert.equal(result.status,409);assert.equal(result.data.error,'profile_sync_conflict');assert.equal(s.row.ledger.gems,100);assert.equal(s.updates,5);
});
test('a wallet change with the same timestamp still invalidates the old snapshot',async()=>{
  const s=boot();let collided=false;
  s.onUpdate(()=>{if(collided)return;collided=true;s.row={...s.row,ledger:{gems:250,gemEvents:[{id:'achievement:avatar:30',type:'earn',amount:150}]}}});
  const result=await s.request();assert.equal(result.status,200);assert.equal(result.data.ledger.gems,250);assert.equal(s.updates,2);
});
test('two devices keep both earnings and replays do not increase the balance',async()=>{
  const s=boot(),a={ledger:{gemEvents:[{id:'device-a',type:'earn',amount:10}]}},b={ledger:{gemEvents:[{id:'device-b',type:'earn',amount:20}]}};
  const results=await Promise.all([s.request(a),s.request(b)]);assert.ok(results.every(r=>r.status===200));assert.equal(s.row.ledger.gems,130);
  await s.request(a);await s.request(b);assert.equal(s.row.ledger.gems,130);
});
test('invalid PIN and unknown action never update the profile wallet',async()=>{
  const s=boot();assert.equal((await s.request({pin:'0000'})).status,401);
  const before=s.updates;assert.equal((await s.request({action:'typo'})).status,400);assert.equal(s.updates,before);
});
test('newer login day resets the current streak while preserving its best achievement',()=>{
  const {context:c}=boot();
  const result=c.mergeLedger({gems:100,gemEvents:[],loginBonusLastDay:'2026-10-01',loginBonusStreak:30},{loginBonusLastDay:'2026-10-09',loginBonusStreak:1,streak:30});
  assert.equal(result.loginBonusStreak,1);assert.equal(result.streak,1);assert.equal(result.loginBonusBestStreak,30);
});

test('new login actions authenticate PIN and route only fixed server RPC arguments',async()=>{
 const s=boot();const visit=await s.request({action:'login_visit',at:'2050-01-01',streak:49});assert.equal(visit.status,200);assert.equal(visit.data.login.bestStreak,7);assert.deepEqual(s.loginCalls[0],{name:'sushi_record_login_visit',args:{p_sushi_id:'testuser'}});
 for(const category of ['practice','login_03','login_05','login_23']){const result=await s.request({action:'achievement_claim',category,threshold:category==='practice'?7:1});assert.equal(result.status,200);assert.equal(s.loginCalls.at(-1).name,'sushi_claim_login_achievement');assert.equal(s.loginCalls.at(-1).args.p_category,category);}
 const before=s.loginCalls.length;assert.equal((await s.request({action:'login_visit',pin:'0000'})).status,401);assert.equal(s.loginCalls.length,before);
});
test('server personality merge retains a newer preference from either device',()=>{const c=boot().context,a={kind:'serious',updatedAt:10},b={kind:'casual',updatedAt:20};assert.deepEqual(plain(c.mergeLedger({avatarPersonality:a},{avatarPersonality:b}).avatarPersonality),b);assert.deepEqual(plain(c.mergeLedger({avatarPersonality:b},{avatarPersonality:a}).avatarPersonality),b);});
