const {test}=require('node:test'),assert=require('node:assert/strict');
const personality=require('../sushigacha/avatar-personality.js');
test('both personalities have bilingual greetings, distinct idle lines and supportive feedback',()=>{
  for(const kind of ['serious','casual'])for(const event of ['greeting','idle','correct','wrong','combo'])for(const hour of [3,5,12,23]){
    const message=personality.choose(kind,event,hour);assert(message.en&&message.ja);
  }
  assert.notDeepEqual(personality.choose('serious','greeting',12),personality.choose('casual','greeting',12));
  assert.notDeepEqual(personality.choose('serious','idle',12,0),personality.choose('serious','idle',12,1));
  assert.match(personality.choose('casual','greeting',3).ja,/休/);
  assert.equal(personality.normalize('unknown'),'serious');
});
test('newer personality wins in both merge orders; a stale device cannot reset it',()=>{
  const old={kind:'serious',updatedAt:10},fresh={kind:'casual',updatedAt:20};
  assert.deepEqual(personality.merge(old,fresh),fresh);assert.deepEqual(personality.merge(fresh,old),fresh);
  assert.deepEqual(personality.merge(fresh,{kind:'other',updatedAt:100}),fresh);
});

test('simultaneous personality updates converge deterministically',()=>{const a={kind:'serious',updatedAt:20},b={kind:'casual',updatedAt:20};assert.deepEqual(personality.merge(a,b),personality.merge(b,a));});
