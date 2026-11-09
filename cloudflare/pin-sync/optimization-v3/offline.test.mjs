// In-memory SQLite only. No network, D1 binding or Cloudflare credentials.
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {ActivityStore} from './pin-sync/activity-store.mjs';
import {rewardEligibility} from './pin-sync/rewards.mjs';
import {backfillEventBatch} from './pin-sync/backfill-events.mjs';
const {synchronize}=createRequire(import.meta.url)('./transport.js');
const file=p=>readFileSync(new URL(p,import.meta.url),'utf8');
function setup(){
 const sql=new DatabaseSync(':memory:');
 sql.exec(file('./pin-sync/profile-schema.sql'));
 sql.exec("INSERT INTO pin_sync_profiles(account,ledger,learning,updated_at) VALUES('user','{}','{}',''),('other','{}','{}','')");
 const reads=[];
 const db={prepare(text){
  const stmt=sql.prepare(text);
  return {bind(...args){return {
   async all(){reads.push(text);return {results:stmt.all(...args)}},
   async first(){reads.push(text);return stmt.get(...args)},
   async run(){return {meta:stmt.run(...args)}},
   execute(){return stmt.columns().length?{results:stmt.all(...args)}:{meta:stmt.run(...args)}}
  }}};
 }};
 db.batch=async statements=>{sql.exec('BEGIN');try{const results=statements.map(s=>s.execute());sql.exec('COMMIT');return results}catch(error){sql.exec('ROLLBACK');throw error}};
 return {sql,db,reads,migrate:()=>sql.exec(file('./pin-sync/event-optimization.sql'))};
}
const event=(id,game='sushitan',correct=1,at=Date.parse('2026-11-09T00:00:00Z'))=>({id,version:2,game,correct,at});
const payload=(events,after=0)=>({protocol:3,after,events,baseline:0,limit:2});
test('atomic conflict rejection, retries and aggregate correctness',async()=>{
 const {sql,db,reads,migrate}=setup();migrate();const store=new ActivityStore(db,{optimized:true});
 await store.achievementSync('user',payload([event('a','sushitan',10),event('b','toeic',3)]));
 await store.achievementSync('user',payload([event('a','sushitan',10)]));
 assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM pin_sync_event_feed').get().n,2);
 assert.equal(reads.some(q=>q.startsWith('SELECT * FROM pin_sync_events')),false);
 await assert.rejects(store.achievementSync('user',payload([event('new'),event('a','sushitan',11)])),/event_id_conflict/);
 assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM pin_sync_events WHERE event_id='new'").get().n,0);
 const summary=sql.prepare("SELECT * FROM pin_sync_event_totals WHERE account='user'").get();
 assert.equal(summary.all_correct,13);assert.equal(summary.vocabulary,10);assert.equal(summary.toeic,3);assert.equal(summary.all_games_day,2);
 assert.equal(rewardEligibility('all_correct',10,{summary}).ok,true);
 sql.close();
});
test('backfill, old clients, late arrivals, JST boundary and account isolation',async()=>{
 const {sql,db,migrate}=setup();const legacy=new ActivityStore(db);
 await legacy.achievementSync('user',payload([event('z','sushitan',1,Date.parse('2026-11-08T15:00:00Z'))]));
 migrate();assert.equal((await backfillEventBatch(db)).progress.complete,1);const optimized=new ActivityStore(db,{optimized:true});
 const first=await optimized.achievementSync('user',payload([]));
 await legacy.achievementSync('user',{events:[event('a','toeic')],baseline:0});
 await optimized.achievementSync('other',payload([event('foreign')]));
 const next=await optimized.achievementSync('user',payload([],first.achievements.after));
 assert.deepEqual(next.achievements.events.map(e=>e.id),['a']);
 assert.equal(sql.prepare("SELECT all_games_day FROM pin_sync_event_totals WHERE account='user'").get().all_games_day,2);
 const old=await optimized.achievementSync('user',{events:[],baseline:0});
 assert.deepEqual(old.achievements.events.map(e=>e.id),['a','z']);sql.close();
});
test('incremental transport imports before advancing durable cursor and resumes',async()=>{
 const {sql,db,migrate}=setup();migrate();const store=new ActivityStore(db,{optimized:true});
 const imported=new Map();let cursor=0;const local=[event('a'),event('b'),event('c')];
 const ledger={exportAllPages:()=>[{events:local}],baselineForSync:()=>0,mergeBaseline(){},importEvents(events){for(const e of events)imported.set(e.id,e);return {added:events.length,conflicts:0,rejected:0}}};
 const ack={};const options={pageSize:2,acknowledged:ack,onAcknowledged:x=>Object.assign(ack,x),onCursor:x=>{assert.ok(imported.size);cursor=x}};
 await synchronize(ledger,p=>store.achievementSync('user',p.achievements),options);
 assert.equal(imported.size,3);assert.ok(cursor>0);
 const result=await synchronize(ledger,p=>store.achievementSync('user',p.achievements),{...options,after:cursor});
 assert.equal(result.sent,0);assert.equal(result.received,0);assert.equal(result.rounds,1);
 await assert.rejects(synchronize(ledger,async()=>{throw Error('offline')},{...options,after:cursor}),/offline/);
 sql.close();
});
test('new transport falls back to legacy server without losing pages',async()=>{
 const {sql,db}=setup();const store=new ActivityStore(db);const events=[event('a'),event('b'),event('c')],received=[];
 const ledger={exportAllPages:()=>[{events}],baselineForSync:()=>0,mergeBaseline(){},importEvents(es){received.push(...es);return {added:es.length}}};
 await synchronize(ledger,p=>store.achievementSync('user',p.achievements),{pageSize:2,after:999,onCursor:()=>assert.fail('legacy must not save cursor')});
 assert.deepEqual(new Set(received.map(e=>e.id)),new Set(events.map(e=>e.id)));sql.close();
});
test('bounded backfill resumes without double counting concurrent old-client writes',async()=>{
 const {sql,db,migrate}=setup();const legacy=new ActivityStore(db);
 await legacy.achievementSync('user',payload([event('a'),event('b'),event('c')]));migrate();
 assert.equal((await backfillEventBatch(db,1)).progress.complete,0);
 await legacy.achievementSync('user',payload([event('d')]));
 for(let i=0;i<3;i++)await backfillEventBatch(db,1);
 const done=await backfillEventBatch(db,1);assert.equal(done.progress.complete,1);
 assert.equal(sql.prepare("SELECT all_correct FROM pin_sync_event_totals WHERE account='user'").get().all_correct,4);
 assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM pin_sync_event_feed').get().n,4);sql.close();
});
test('failed local import never advances cursor or acknowledgment',async()=>{
 const e=event('a');let acknowledgments=0,cursors=0;
 const ledger={exportAllPages:()=>[],baselineForSync:()=>0,mergeBaseline(){},importEvents:()=>({rejected:1})};
 await assert.rejects(synchronize(ledger,async()=>({achievements:{protocol:3,synced:true,accepted:[],events:[e],baseline:0,after:1,hasMore:false,nextCursor:null}}),{onAcknowledged:()=>acknowledgments++,onCursor:()=>cursors++}),/invalid_server_events/);
 assert.equal(acknowledgments,0);assert.equal(cursors,0);
});
