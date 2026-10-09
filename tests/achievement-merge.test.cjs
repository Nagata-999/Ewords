/* Run with: node --test tests/achievement-merge.test.cjs */
const test=require('node:test');
const assert=require('node:assert/strict');
const {mergeEvents,totals}=require('../sushigacha/achievement-merge.js');
const e=(id,game='sushitan',correct=1)=>({version:2,id,game,correct,at:1791500000000});
test('same event on two devices counts once',()=>{
 const m=mergeEvents([e('device:a')],[e('device:a')]);
 assert.equal(m.events.length,1);
 assert.equal(totals(m.events).total,1);
 assert.deepEqual(m.conflicts,[]);
});
test('offline unique events merge regardless of order',()=>{
 const a=[e('device:a'),e('device:b')],b=[e('other:a','sushigiri',2)];
 const x=mergeEvents(a,b),y=mergeEvents(b,a);
 assert.deepEqual(x.events,y.events);
 assert.equal(totals(x.events).total,4);
 assert.equal(totals(x.events).byGame.sushigiri,2);
});
test('conflicting duplicate event IDs are reported and never summed',()=>{
 const m=mergeEvents([e('device:a')],[e('device:a','sushitan',99)]);
 assert.equal(m.events.length,1);
 assert.deepEqual(m.conflicts,['device:a']);
 assert.equal(totals(m.events).total,1);
});
test('invalid payloads cannot inflate counts',()=>{
 const m=mergeEvents([e('valid:a'),{...e('bad:a'),correct:999999},{...e('bad:b'),game:'x;drop'}],[]);
 assert.equal(m.events.length,1);
 assert.equal(totals(m.events).total,1);
});
test('merge is idempotent',()=>{
 const once=mergeEvents([e('device:a')],[e('device:b')]);
 const twice=mergeEvents(once.events,[e('device:b')]);
 assert.deepEqual(twice.events,once.events);
});
