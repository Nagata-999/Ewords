'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {blank,record,presented,due}=require('./progress-store.cjs');

test('a missed question waits for five other presentations',()=>{
 const s=blank(),now=new Date('2026-11-14T00:00:00Z');
 presented(s,'missed');
 record(s,'missed',false,42,now);
 assert.equal(due(s,now),null);
 for(let i=0;i<5;i++){
   presented(s,'other-'+i);
   if(i<4)assert.equal(due(s,now),null);
 }
 assert.equal(due(s,now),'missed');
});
test('checking the queue does not advance the presentation counter',()=>{
 const s=blank();
 for(let i=0;i<3;i++)due(s);
 assert.equal(s.presentations,0);
 assert.throws(()=>presented(s,''),/invalid id/);
});
