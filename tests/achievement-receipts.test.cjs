const {test}=require('node:test'),assert=require('node:assert/strict');
const receipts=require('../sushigacha/achievement-receipts.js');
test('production authenticated receipt IDs mark already claimed rewards',()=>{
  const parsed=receipts.parse({ok:true,sushi_id:'testuser',receipts:{ids:['achievement:avatar:30','achievement:all_correct:10']}});
  assert.equal(receipts.status('achievement:avatar:30',parsed),'claimed');
  assert.equal(receipts.status('achievement:avatar:10',parsed),'unclaimed');
});
test('malformed, duplicate and unsuccessful receipts are rejected',()=>{
  for(const ids of [['avatar30'],['achievement:avatar:30','achievement:avatar:30'],[null]])assert.equal(receipts.parse({ok:true,receipts:{ids}}),null);
  assert.equal(receipts.parse({ok:false,receipts:{ids:[]}}),null);
});
