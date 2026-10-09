'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {synchronize}=require('../sushigacha/achievement-transport.js');
const e=id=>({version:2,id,game:'sushitan',correct:1,at:100});
function ledger(events){
 const m=new Map(events.map(x=>[x.id,x]));
 return {
   exportAllPages(size){const a=[...m.values()],p=[];for(let i=0;i<a.length;i+=size)p.push({events:a.slice(i,i+size)});return p.length?p:[{events:[]}]},
   importEvents(a){let added=0;for(const x of a)if(!m.has(x.id)){m.set(x.id,x);added++}return {added,conflicts:0,rejected:0}},
   values:()=>[...m.values()]
 };
}
test('sends all local pages and receives remote pages',async()=>{
 const local=ledger(Array.from({length:1203},(_,i)=>e('local:'+i)));
 const remote=Array.from({length:1101},(_,i)=>e('remote:'+i));
 const uploads=new Set();
 const result=await synchronize(local,async req=>{
   for(const x of req.achievements.events)uploads.add(x.id);
   const i=req.achievements.cursor===null?0:Number(req.achievements.cursor);
   const part=remote.slice(i,i+500);
   return {achievements:{synced:true,accepted:req.achievements.events.map(x=>x.id),events:part,nextCursor:i+500<remote.length?String(i+500):null}};
 },{pageSize:500});
 assert.equal(uploads.size,1203);
 assert.equal(local.values().length,2304);
 assert.equal(result.sent,1203);
 assert.equal(result.received,1101);
});
test('refuses unsupported server without deleting local records',async()=>{
 const local=ledger([e('local:1')]);
 await assert.rejects(synchronize(local,async()=>({})),/not_ready/);
 assert.equal(local.values().length,1);
});
test('requires explicit server acknowledgment',async()=>{
 const local=ledger([e('local:1')]);
 await assert.rejects(synchronize(local,async()=>({achievements:{synced:true,accepted:[],events:[],nextCursor:null}})),/not_acknowledged/);
});
test('rejects looping server cursors',async()=>{
 const local=ledger([]);
 await assert.rejects(synchronize(local,async()=>({achievements:{synced:true,accepted:[],events:[],nextCursor:'repeat'}})),/invalid_server_cursor/);
});

test('rejects oversized server response',async()=>{
 const local=ledger([]);
 await assert.rejects(synchronize(local,async()=>({achievements:{synced:true,accepted:[],events:Array.from({length:501},(_,i)=>e('remote:'+i)),nextCursor:null}})),/oversized_server_page/);
});
test('rejects malformed cursor',async()=>{
 const local=ledger([]);
 await assert.rejects(synchronize(local,async()=>({achievements:{synced:true,accepted:[],events:[],nextCursor:'../unsafe'}})),/invalid_server_cursor/);
});

test('rejects duplicate server acknowledgments',async()=>{
 const local=ledger([e('local:1')]);
 await assert.rejects(synchronize(local,async()=>({achievements:{synced:true,accepted:['local:1','local:1'],events:[],nextCursor:null}})),/invalid_server_acknowledgment/);
});
test('rejects malformed server acknowledgment IDs',async()=>{
 const local=ledger([e('local:1')]);
 await assert.rejects(synchronize(local,async()=>({achievements:{synced:true,accepted:['../bad'],events:[],nextCursor:null}})),/invalid_server_acknowledgment/);
});
test('rejects conflicting server records without reporting success',async()=>{
 const local=ledger([e('local:1')]);
 local.importEvents=()=>({added:0,conflicts:1,rejected:0});
 await assert.rejects(synchronize(local,async()=>({achievements:{synced:true,accepted:['local:1'],events:[e('local:1')],nextCursor:null}})),/invalid_server_events/);
});
