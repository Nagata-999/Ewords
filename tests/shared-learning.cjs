const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..');
function boot(store=new Map(),broken=false,clock=Date){
 const emitted=[];const ctx={Date:clock,Math,console,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}},
  localStorage:{get length(){if(broken)throw Error('denied');return store.size;},key:i=>[...store.keys()][i],getItem:k=>{if(broken)throw Error('denied');return store.get(k)||null;},setItem:(k,v)=>{if(broken)throw Error('quota');store.set(k,v);}},
  dispatchEvent:e=>emitted.push(e),addEventListener:()=>{}};
 ctx.window=ctx;vm.createContext(ctx);
 for(const f of ['word-registry.js','learning.js'])vm.runInContext(fs.readFileSync(path.join(root,'shared',f),'utf8'),ctx);
 return {api:ctx.SushiLearning,emitted,store};
}
let {api:a,store,emitted}=boot();const id=a.resolveWordId(' available ');
assert(id);assert.equal(a.resolveWordId('ＡＶＡＩＬＡＢＬＥ'),id);assert.equal(a.resolveWordId({word:'available'}),id);
assert.equal(a.getReviewWords().length,0);assert.equal(a.recordAnswer('unknown-word',false,'run'),null);
a.recordAnswer(id,false,'sushigiri');assert.equal(a.getWordProgress(id).wrong_count,1);
a.recordAnswer(id,true,'sushian');assert.notEqual(a.getWordProgress(id).status,'mastered');
for(let i=0;i<3;i++)a.recordAnswer(id,true,'run');
assert.equal(a.getWordProgress(id).status,'mastered');assert.equal(a.getReviewWords().length,0);
assert.equal(a.getWordProgress(id).games.sushigiri.wrong_count,1);assert.equal(a.getStats().mastered_today,1);
a.recordAnswer(id,false,'3d');assert.equal(a.getWordProgress(id).status,'weak');
for(let i=0;i<5;i++)a.recordAnswer(id,true,'flow');assert.notEqual(a.getWordProgress(id).status,'mastered');
a.recordAnswer(id,true,'flow');assert.equal(a.getWordProgress(id).status,'mastered');
assert.equal(boot(store).api.getWordProgress(id).correct_count,10);
assert(emitted.some(e=>e.type==='sushi-learning-mastered'));
// Separate immutable event keys allow tab interleaving without overwrites.
const b=boot(store).api; a.recordAnswer(id,false,'run');b.recordAnswer(id,false,'3d');
assert.equal(a.getWordProgress(id).wrong_count,4);assert.equal(b.getWordProgress(id).wrong_count,4);
const legacy=JSON.stringify({'["available","利用できる"]':{en:'available',jp:'利用できる',misses:3,streak:1}});
const old=new Map([['sushitan_word_review_v1',legacy],['sushian:v2:learningState',JSON.stringify({schemaVersion:2,weakWords:{1:{word:'follow',misses:2}},masteredWords:{2:true}})]]);
const migrated=boot(old).api;assert.equal(migrated.getWordProgress(id).wrong_count,3);
assert.equal(migrated.getWordProgress('follow').wrong_count,2);assert.equal(migrated.getWordProgress('consider'),null);
assert.equal(boot(old).api.getWordProgress(id).wrong_count,3);assert.equal(old.get('sushitan_word_review_v1'),legacy);
assert.equal(migrated.getStats().reviewed_today,0);
const broken=boot(new Map(),true).api;broken.recordAnswer(id,false,'run');assert.equal(broken.getWordProgress(id).wrong_count,1);assert.equal(broken.getStorageStatus().ok,false);
const corrupt=new Map([['sushitan_learning_v1:event:bad','{bad']]);const c=boot(corrupt).api;c.recordAnswer(id,false,'run');assert.equal(corrupt.get('sushitan_learning_v1:event:bad'),'{bad');
assert.equal(c.getWordProgress(id).wrong_count,1);
// Stable IDs and extras: every original source word resolves, without altering its data.
for(const f of ['words_master.json','words_master_v2_reviewed.json'])for(const w of JSON.parse(fs.readFileSync(path.join(root,'data',f),'utf8')))assert(a.resolveWordId(w),JSON.stringify(w));
assert.equal(a.resolveWordId('follow'),'sushian:0001');
assert.equal(a.recordAnswer(id,true,3),null);
const edge=boot().api;edge.recordAnswer(id,false,'__proto__');assert.equal(edge.getWordProgress(id).games.__proto__.wrong_count,1);
let now=Date.parse('2026-09-17T14:59:00Z');class Clock extends Date{static now(){return now;}}
const timed=boot(new Map(),false,Clock).api;timed.recordAnswer(id,false,'run');assert.equal(timed.getStats().today_review,1);
timed.recordAnswer(id,true,'run');assert.equal(timed.getStats().today_review,0);assert.equal(timed.getStats().reviewed_today,1);
now+=120000;assert.equal(timed.getStats().today_review,1);assert.equal(timed.getStats().reviewed_today,0);
const score=timed.getWordProgress(id).weakness_score;now+=10*86400000;assert(timed.getWeakWords()[0].priority>score);assert.equal(timed.getWordProgress(id).weakness_score,score);
const duplicateLegacy=new Map([['sushitan_word_review_v1',JSON.stringify({a:{en:'available',jp:'A',misses:2},b:{en:'available',jp:'B',misses:3}})]]);
assert.equal(boot(duplicateLegacy).api.getWordProgress(id).wrong_count,5);
const future=new Map([['sushitan_learning_v1:event:future',JSON.stringify({version:2,id:'future'})]]);boot(future);assert.equal(JSON.parse(future.get('sushitan_learning_v1:event:future')).version,2);
console.log('PASS: stable IDs, cross-game learning, mastery/relapse, persistence, interleaved tabs, migration, corruption, storage failure, all source vocabularies');
