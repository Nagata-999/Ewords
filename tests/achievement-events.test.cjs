const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function boot(store=new Map(),clock=Date){
  const listeners=new Map();let serial=0;
  const context={Date:clock,console,crypto:{randomUUID:()=>`event-${++serial}`},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail}},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k),key:i=>[...store.keys()][i],get length(){return store.size}},addEventListener:(name,fn)=>{if(!listeners.has(name))listeners.set(name,[]);listeners.get(name).push(fn)},dispatchEvent:event=>{for(const fn of listeners.get(event.type)||[])fn(event)},document:{getElementById:()=>null}};
  context.window=context;vm.createContext(context);
  for(const file of ['achievement-ledger.js','achievement-events.js','achievement-ranks.js','achievement-catalog.js','achievement-game-stats.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../sushigacha',file),'utf8'),context);
  return {context,store,answer:context.SushiAchievementEvents.answer,ledger:context.SushiAchievementLedger};
}
test('one answer ID deduplicates both the outcome and correct count',()=>{
  const s=boot();s.answer('toeic','part5:1',true,{eventId:'answer:1'});s.answer('toeic','part5:1',true,{eventId:'answer:1'});
  assert.equal(s.ledger.summary().total,1);assert.equal(s.ledger.outcomeSummary().eventCount,1);
  assert.equal(s.answer('toeic','part5:1',false,{eventId:'answer:1'}),null);
  assert.equal(boot(s.store).ledger.summary().total,1);
});
test('rapid answers retain ordering for combo, comeback, repeated mistakes and review',()=>{
  class Clock extends Date{static now(){return Date.parse('2026-10-09T00:00:00Z')}}
  const s=boot(new Map(),Clock);
  for(let i=0;i<10;i++)s.answer('toeic','q'+i,true);
  s.answer('toeic','retry',false);s.answer('toeic','retry',false);
  for(let i=0;i<10;i++)s.answer('toeic',i?'q'+i:'retry',true,{review:true});
  const result=s.ledger.outcomeSummary();
  assert.equal(result.correct_streak,10);assert.equal(result.comeback_streak,1);assert.equal(result.repeat_mistake_recovered,1);assert.equal(result.review_correct,10);
});
test('generic learning uses stable IDs and excludes games with native hooks',()=>{
  const s=boot(),dispatch=(game,id)=>s.context.dispatchEvent(new s.context.CustomEvent('sushi-learning-answer',{detail:{event:{id,game_id:game,word_id:'available',correct:true},was_review:true}}));
  dispatch('sushitan','same');assert.equal(s.ledger.summary().total,0);
  dispatch('sushian','same');dispatch('sushian','same');assert.equal(s.ledger.summary().total,1);assert.equal(s.ledger.outcomeSummary().review_correct,1);
});
test('five games on one Japan calendar day unlock the secret condition',()=>{
  const s=boot(),at=Date.parse('2026-10-08T15:00:00Z');
  s.ledger.importEvents(['sushitan','toeic','sushi_blast','sushicross','sushigiri'].map((game,i)=>({version:2,id:'day:'+i,game,correct:1,at:at+i*1000})));
  assert.equal(s.ledger.distinctGamesInDay(),5);
});
test('bad outcome imports are rejected before changing any local history',()=>{
  const s=boot(),event={version:1,id:'server:1',game:'toeic',questionId:'part5:1',correct:true,review:false,at:0};
  assert.throws(()=>s.ledger.importOutcomes([event,{...event,id:'server:2',questionId:''}]),/invalid_outcome/);
  assert.equal(s.ledger.exportOutcomes().length,0);
  s.ledger.importOutcomes([event]);assert.throws(()=>s.ledger.importOutcomes([{...event,correct:false}]),/outcome_id_conflict/);
});
test('rank colors remain an explicit choice and score progress retains exact highs',()=>{
  const s=boot();assert.equal(s.context.SushiAchievementRanks.select(150000,null).id,'white');assert.equal(s.context.SushiAchievementRanks.select(500,'black').id,'white');assert.equal(s.context.SushiAchievementRanks.select(15000,'yellow').id,'yellow');
  s.context.SushiAchievementGameStats.record('blast','run:1',{score:4200});s.context.SushiAchievementGameStats.record('blast','run:2',{score:3000});
  assert.equal(s.context.SushiAchievementGameStats.read().blast_high_score,4200);
  assert.equal(boot(s.store).context.SushiAchievementGameStats.read().blast_high_score,4200);
});
