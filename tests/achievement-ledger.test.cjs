'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const code=fs.readFileSync(require('node:path').join(__dirname,'../sushigacha/achievement-ledger.js'),'utf8');
function setup(initial={}){
 const store=new Map(Object.entries(initial));
 const localStorage={
   get length(){return store.size;},
   key(i){return [...store.keys()][i]??null;},
   getItem(k){return store.get(k)??null;},
   setItem(k,v){store.set(k,String(v));},
   removeItem(k){store.delete(k);}
 };
 let seq=0;
 const window={crypto:{randomUUID:()=>`uuid-${++seq}`},dispatchEvent(){}};
 vm.runInNewContext(code,{window,localStorage,CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts?.detail}}});
 return {ledger:window.SushiAchievementLedger,store};
}
const event=(id,correct=1)=>({version:2,id,game:'sushitan',correct,at:123});
test('record is idempotent for explicit event ID',()=>{
 const {ledger}=setup();ledger.record('sushitan',2,'device:1');ledger.record('sushitan',2,'device:1');
 assert.equal(ledger.summary().total,2);assert.equal(ledger.summary().eventCount,1);
});
test('exportAllPages contains all records once, including more than 500',()=>{
 const {ledger}=setup();
 for(let i=0;i<1003;i++)ledger.record('sushitan',1,`d:${i}`);
 const pages=ledger.exportAllPages(500);
 assert.equal(pages.length,3);
 assert.deepEqual(Array.from(pages,p=>p.events.length),[500,500,3]);
 assert.equal(new Set(pages.flatMap(p=>p.events.map(e=>e.id))).size,1003);
});
test('import does not overwrite conflicting event',()=>{
 const {ledger}=setup();ledger.importEvents([event('d:1',1)]);
 const outcome=ledger.importEvents([event('d:1',5),event('d:2',3)]);
 assert.equal(outcome.conflicts,1);assert.equal(outcome.added,1);assert.equal(ledger.summary().total,4);
});
test('invalid IDs cannot enter ledger',()=>{
 const {ledger}=setup();assert.equal(ledger.record('sushitan',1,'bad.id'),null);
 assert.equal(ledger.importEvents([event('bad.id')]).rejected,1);
});
test('migration baseline stays fixed after new events',()=>{
 const {ledger}=setup({'sushitan_achievement_progress_v1':JSON.stringify({total:25})});
 ledger.record('sushitan',1,'d:1');ledger.record('sushitan',1,'d:2');
 assert.equal(ledger.migrationBaseline(),25);
 assert.equal(ledger.reconciledTotal(),27);
});
