const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function boot(){
  const store=new Map([['sushitan_login_bonus_v1',JSON.stringify({gems:100,gemEvents:[]})]]),events=[];
  const context={console,crypto:require('node:crypto').webcrypto,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},location:{pathname:'/fixture'},document:{querySelector:()=>({})},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail}},dispatchEvent:event=>events.push(event),SushiGemFx:{}};
  context.window=context;vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../sushigacha/gem-system.js'),'utf8'),context);
  return {api:context.SushiGem,events,wallet:()=>JSON.parse(store.get('sushitan_login_bonus_v1'))};
}
test('spending returns successfully and the same transaction ID cannot spend twice',()=>{
  const s=boot();assert.equal(s.api.spendGems('shop',30,'purchase:1').spent,30);assert.equal(s.api.spendGems('shop',30,'purchase:1').duplicate,true);assert.equal(s.wallet().gems,70);assert.equal(s.events.filter(e=>e.type==='sushi-gems-spent').length,1);
});
test('offline rewards retain every pending event beyond the display history limit',()=>{
  const s=boot();for(let i=0;i<1005;i++)s.api.awardGems('game',1,'game:'+i);
  assert.equal(s.wallet().gemEvents.length,1000);assert.equal(s.wallet().gemPendingEvents.length,1005);assert.equal(s.wallet().gems,1105);
  assert.equal(s.api.awardGems('game',1,'game:0').duplicate,true);assert.equal(s.wallet().gems,1105);
});
test('daily quest claims progress the achievement once and remain manual',()=>{
  const s=boot();s.api.awardGems('daily-quest',10,'daily:2026-10-09:toeic');s.api.awardGems('daily-quest',10,'daily:2026-10-09:toeic');
  assert.equal(s.wallet().gems,110);assert.deepEqual(s.wallet().dailyGemClaims,['daily:2026-10-09:toeic']);
});
