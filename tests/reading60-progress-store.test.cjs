'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {KEY,blank,load,save,record,due}=require('../reading60/progress-store.cjs');
const ids=new Set(['a','b','c','d','e','f']);
function storage(){const map=new Map();return {getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,v),map};}
test('durable history and first/review accuracy classification',()=>{
 const s=storage(),p=blank(),now=new Date('2026-11-14T00:00:00Z');
 p.presentations=1;record(p,'a',true,22,now);assert.equal(p.history[0].first,true);
 assert.equal(due(p,new Date('2026-11-14T23:00:00Z')),null);
 assert.equal(due(p,new Date('2026-11-15T00:00:00Z')),'a');
 assert.equal(save(s,p),true);const restored=load(s,ids);assert.equal(restored.readOnly,false);
 record(restored.state,'a',true,31,new Date('2026-11-15T00:00:00Z'));
 assert.equal(restored.state.history[1].first,false);
 assert.equal(restored.state.items.a.nextReviewAt,'2026-11-18T00:00:00.000Z');
});
test('wrong answer waits for five intervening presentations',()=>{
 const p=blank();p.presentations=1;record(p,'a',false,12,new Date('2026-11-14T00:00:00Z'));
 for(let n=1;n<=5;n++){p.presentations=1+n;assert.equal(due(p,new Date('2026-11-30T00:00:00Z')),null);}
 p.presentations=7;assert.equal(due(p),'a');
 record(p,'a',false,10);assert.equal(p.queue.length,1);assert.equal(p.queue[0].notBeforePresentation,13);
});
test('corrupt and future records remain untouched',()=>{
 for(const value of ['{broken','{"version":2,"history":[]}']){
  const s=storage();s.setItem(KEY,value);const result=load(s,ids);
  assert.equal(result.readOnly,true);assert.equal(s.getItem(KEY),value);
 }
});
test('unavailable storage does not throw or claim success',()=>{
 const s={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};
 assert.equal(load(s,ids).readOnly,true);assert.equal(save(s,blank()),false);
});
test('unknown IDs are excluded and duplicate pending entries collapse',()=>{
 const s=storage(),p=blank();p.history=[{id:'unknown',correct:true,first:true,seconds:4,date:'2026-11-14T00:00:00Z'}];
 p.queue=[{id:'a',notBeforePresentation:6},{id:'a',notBeforePresentation:6},{id:'unknown',notBeforePresentation:7}];
 s.setItem(KEY,JSON.stringify(p));const out=load(s,ids).state;
 assert.equal(out.history.length,0);assert.deepEqual(out.queue,[{id:'a',notBeforePresentation:6}]);
});

test('fourth consecutive correct review schedules 14 days, including after reload',()=>{
 const s=storage(),p=blank();
 const dates=['2026-11-14','2026-11-15','2026-11-18','2026-11-25'];
 for(const day of dates)record(p,'a',true,20,new Date(day+'T00:00:00Z'));
 assert.equal(p.items.a.streak,4);
 assert.equal(p.items.a.nextReviewAt,'2026-12-09T00:00:00.000Z');
 assert.equal(save(s,p),true);
 const restored=load(s,ids).state;
 assert.equal(restored.items.a.streak,4);
 assert.equal(due(restored,new Date('2026-12-08T23:59:59Z')),null);
 assert.equal(due(restored,new Date('2026-12-09T00:00:00Z')),'a');
});

test('a lapse resets spaced-review streak and a later correct answer clears the retry queue',()=>{
 const p=blank(),t=new Date('2026-11-14T00:00:00Z');
 p.presentations=1;record(p,'a',true,15,t);
 record(p,'a',true,16,new Date('2026-11-15T00:00:00Z'));
 assert.equal(p.items.a.streak,2);
 p.presentations=3;record(p,'a',false,18,new Date('2026-11-18T00:00:00Z'));
 assert.equal(p.items.a.streak,0);
 assert.equal(p.items.a.lapses,1);
 assert.equal(p.queue.length,1);
 assert.equal(p.queue[0].notBeforePresentation,9);
 p.presentations=9;record(p,'a',true,21,new Date('2026-11-18T01:00:00Z'));
 assert.equal(p.queue.length,0);
 assert.equal(p.items.a.streak,1);
 assert.equal(p.items.a.nextReviewAt,'2026-11-19T01:00:00.000Z');
 assert.deepEqual(p.history.map(x=>x.first),[true,false,false,false]);
});

test('calendar reviews prioritize the oldest overdue item regardless of insertion order',()=>{
 const p=blank();p.items.a={nextReviewAt:'2026-11-20T00:00:00.000Z'};
 p.items.b={nextReviewAt:'2026-11-15T00:00:00.000Z'};
 p.items.c={nextReviewAt:'2026-11-17T00:00:00.000Z'};
 assert.equal(due(p,new Date('2026-11-21T00:00:00Z')),'b');
 p.queue.push({id:'b',notBeforePresentation:10});
 assert.equal(due(p,new Date('2026-11-21T00:00:00Z')),'c');
 p.presentations=10;
 assert.equal(due(p,new Date('2026-11-21T00:00:00Z')),'b');
});

test('invalid answer duration cannot create history that disappears after reload',()=>{
 const p=blank(),s=storage();
 for(const seconds of [NaN,Infinity,-1,86401]){
  assert.throws(()=>record(p,'a',true,seconds),/invalid seconds/);
 }
 assert.equal(p.history.length,0);
 assert.equal(Object.keys(p.items).length,0);
 record(p,'a',true,86400,new Date('2026-11-14T00:00:00Z'));
 assert.equal(save(s,p),true);
 assert.equal(load(s,ids).state.history.length,1);
});
