const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const login=require('../sushigacha/achievement-login.js'),metrics=require('../sushigacha/achievement-metrics.js');
const at=s=>Date.parse(s+'+09:00');
test('JST hour windows are exact and daily streaks increment only once',()=>{
  const windows=[['02:59:59',null],['03:00:00','hour03'],['03:59:59','hour03'],['04:00:00',null],['04:59:59',null],['05:00:00','hour05'],['05:59:59','hour05'],['06:00:00',null],['22:59:59',null],['23:00:00','hour23'],['23:59:59','hour23']];
  for(const [time,flag] of windows){const result=login.visit({},at('2026-10-10T'+time));for(const key of ['hour03','hour05','hour23'])assert.equal(result[key],key===flag,time);}
  let value={};for(let i=0;i<49;i++){const now=at('2026-10-01T12:00:00')+i*86400000;value=login.visit(value,now);value=login.visit(value,now+30000);assert.equal(value.streak,i+1);}
  value=login.visit(value,at('2026-11-21T00:00:00'));assert.equal(value.streak,1);assert.equal(value.bestStreak,49);
});
test('catalog exposes seven weekly ranks, time conditions and manual rewards',()=>{
  const context=vm.createContext({window:{}});vm.runInContext(fs.readFileSync(path.join(__dirname,'../sushigacha/achievement-catalog.js'),'utf8'),context);
  const catalog=context.window.SushiAchievementCatalog,def=catalog.definitions.find(d=>d.id==='practice');
  assert.deepEqual(Array.from(def.stages,s=>s.threshold),[7,14,21,28,35,42,49]);
  assert.deepEqual(Array.from(def.stages,s=>s.color),['white','yellow','orange','green','blue','purple','black']);
  const m=metrics.compute({loginActivity:{bestStreak:49,hour03:true,hour05:true,hour23:true}});
  assert.equal(catalog.evaluate(m).find(d=>d.id==='practice').reached,7);
  for(const id of ['login_03','login_05','login_23'])assert.equal(catalog.evaluate(m).find(d=>d.id===id).reached,1);
  assert(catalog.describe('login_03',1).includes('3:00〜3:59'));
});
test('server-confirmed login cache is isolated by account and rejects delayed account responses',async()=>{
  const values=new Map([['sushitan_sync_id_v1','firstuser'],['sushitan_sync_pin_v1','1234']]);
  let resolve,events=0;const handlers={};
  const root={document:{hidden:false,addEventListener(){}},localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)},console:{warn(){}},CustomEvent:class{},dispatchEvent(){events++},addEventListener:(name,fn)=>handlers[name]=fn,setInterval(){},fetch:async()=>new Promise(r=>resolve=r)};
  root.SushiLoginAchievements=login;login.start(root);
  values.set('sushitan_sync_id_v1','seconduser');resolve({ok:true,json:async()=>({ok:true,login:{lastDay:'2026-10-10',streak:49,bestStreak:49,hour03:true}})});
  await new Promise(r=>setImmediate(r));
  assert.equal(values.has('sushitan_login_achievements_v1:seconduser'),false);assert.equal(events,0);
  assert.equal(login.read().bestStreak,0);
});
