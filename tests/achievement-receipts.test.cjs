'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {parse,status}=require('../sushigacha/achievement-receipts.js');
test('valid server receipt lists claimed stage',()=>{
 const receipts=parse({version:1,claims:[{stage_id:'achievement:vocabulary:10',gems_awarded:10}]});
 assert.deepEqual(receipts.ids,['achievement:vocabulary:10']);
 assert.equal(status('achievement:vocabulary:10',receipts),'claimed');
 assert.equal(status('achievement:vocabulary:100',receipts),'unclaimed');
});
test('invalid and duplicated receipts are rejected',()=>{
 for(const claims of [
  [{stage_id:'achievement:vocabulary:10',gems_awarded:-1}],
  [{stage_id:'achievement:vocabulary:10',gems_awarded:10},{stage_id:'achievement:vocabulary:10',gems_awarded:10}],
  [{stage_id:'achievement:vocabulary:010',gems_awarded:10}],
  [{stage_id:'achievement:vocabulary:10',gems_awarded:'10'}]
 ])assert.equal(parse({version:1,claims}),null);
});
test('missing server receipt cannot authorize a claim',()=>{
 assert.equal(status('achievement:vocabulary:10',null),'unavailable');
 assert.equal(parse({version:1,claims:'claimed'}),null);
});
