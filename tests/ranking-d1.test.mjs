import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {DatabaseSync} from 'node:sqlite';
import worker from '../cloudflare/rankings/worker.mjs';
import {importStatement,normalize} from '../cloudflare/rankings/migrate.mjs';
function setup(){
 const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync(new URL('../cloudflare/rankings/schema.sql',import.meta.url),'utf8'));
 const DB={prepare(sql){return {bind(...args){return {async all(){return {results:db.prepare(sql).all(...args)}},async run(){return db.prepare(sql).run(...args)}}}}} ,async batch(ss){db.exec('BEGIN');try{const r=[];for(const s of ss)r.push(await s.run());db.exec('COMMIT');return r}catch(e){db.exec('ROLLBACK');throw e}}};
 const env={DB,RANKINGS_READY:'true',BLAST_SIGNING_KEY:'test-only-signing-key-01234567890123456789',READ_LIMIT:{limit:async()=>({success:true})},WRITE_LIMIT:{limit:async()=>({success:true})}};
 const call=(path,body)=>worker.fetch(new Request('https://sushitan.net/api/rankings/'+path,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),env);
 return {db,env,call};
}
const score=(score=100,max_combo=2,accuracy=90)=>({p_player_name:'Test',p_mode:'core',p_score:score,p_max_combo:max_combo,p_accuracy:accuracy});
test('main best, ties, typing independent combo and ranking retrieval',async()=>{
 const {db,call}=setup();for(const body of [score(),score(100,9,99),score(90,20,100)])assert.equal((await call('main/rest/v1/rpc/save_high_score',body)).status,200);
 assert.deepEqual({...db.prepare('SELECT score,max_combo,accuracy FROM scores').get()},{score:100,max_combo:2,accuracy:90});
 await call('main/rest/v1/rpc/save_high_score',score(101,1,80));
 const rows=await (await call('main/rest/v1/scores?mode=eq.core&order=score.desc&limit=50')).json();assert.equal(rows[0].score,101);
 for(const b of [score(),score(90,20,100)])await call('typing/rest/v1/rpc/save_high_score',{...b,p_mode:'typing_game'});
 assert.deepEqual({...db.prepare("SELECT score,max_combo,accuracy FROM scores WHERE source='typing'").get()},{score:100,max_combo:20,accuracy:90});
});
test('daily tie ordering and atomic failure',async()=>{
 const {db,call}=setup();await call('main/rest/v1/rpc/save_score_with_daily',score());await call('main/rest/v1/rpc/save_score_with_daily',score(100,3,95));
 const rows=await (await call('main/rest/v1/rpc/get_daily_high_scores',{p_mode:'core',p_limit:50})).json();assert.equal(rows[0].max_combo,3);
 db.exec("CREATE TRIGGER fail_daily BEFORE UPDATE ON daily_high_scores BEGIN SELECT RAISE(ABORT,'test disk failure'); END");
 assert.equal((await call('main/rest/v1/rpc/save_score_with_daily',score(200))).status,503);
 assert.equal(db.prepare('SELECT score FROM scores').get().score,100);
});
test('legacy tower and direct inserts preserve duplicate rejection',async()=>{
 const {call,db}=setup();
 assert.equal((await call('main/rest/v1/rpc/save_typing_tower_score',score(100,2,89.6))).status,200);
 const duplicate=await call('main/rest/v1/rpc/save_typing_tower_score',score(200));
 assert.equal(duplicate.status,409);assert.equal((await duplicate.json()).code,'23505');
 assert.equal(db.prepare('SELECT score,accuracy FROM scores').get().score,100);
 assert.equal(db.prepare('SELECT accuracy FROM scores').get().accuracy,90);
 const row={player_name:'Direct',score:20,mode:'core'};
 assert.equal((await call('main/rest/v1/scores',row)).status,200);
 assert.equal((await call('main/rest/v1/scores',{...row,score:30})).status,409);
 const response=await call('main/rest/v1/scores',[{...row,player_name:'Atomic'},row]);assert.equal(response.status,409);
 assert.equal(db.prepare("SELECT count(*) AS total FROM scores WHERE player_name='Atomic'").get().total,0);
});
test('collection PATCH uses natural identity and never decrements on retry',async()=>{
 const {call,env,db}=setup(),row={id:crypto.randomUUID(),player_id:'p',player_name:'Test',word:'test',parts:['test'],discovered_count:3};
 await call('main/rest/v1/sushi_parts_collection',row);
 const patch=async body=>worker.fetch(new Request('https://sushitan.net/api/rankings/main/rest/v1/sushi_parts_collection?id=eq.'+crypto.randomUUID(),{method:'PATCH',body:JSON.stringify(body)}),env);
 assert.equal((await patch({player_id:'p',word:'test',discovered_count:5})).status,200);
 assert.equal((await patch({player_id:'p',word:'test',discovered_count:4})).status,200);
 assert.equal(db.prepare('SELECT discovered_count FROM sushi_parts_collection').get().discovered_count,5);
});
test('invalid input, limits and readiness fail closed',async()=>{
 const {call,env,db}=setup();for(const b of [score(-1),score(2**31),score(1,1,101),{...score(),p_mode:'bad'}])assert.equal((await call('main/rest/v1/rpc/save_high_score',b)).status,400);
 assert.equal((await call('main/rest/v1/scores?order=score;DROP')).status,400);
 assert.equal((await call('main/rest/v1/scores?limit=10001')).status,400);
 env.WRITE_LIMIT.limit=async()=>({success:false});assert.equal((await call('main/rest/v1/rpc/save_high_score',score())).status,429);
 env.RANKINGS_READY='false';assert.equal((await call('main/rest/v1/scores')).status,503);assert.equal(db.prepare('SELECT COUNT(*) n FROM scores').get().n,0);
});
test('blast signed replay is idempotent and rejects tampering',async()=>{
 const {call,db}=setup();const start=await (await call('blast',{action:'start',mode:'normal',version:'blast-5',seed:123})).json();assert.ok(start.token);
 const body={action:'submit',name:'Test',version:'blast-5',token:start.token,events:[{k:'p',i:0,x:0,y:0}]};
 for(let i=0;i<2;i++)assert.equal((await call('blast',body)).status,200);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM sushi_blast_scores_v2').get().n,1);
 assert.equal((await call('blast',{...body,token:'invalid.invalid'})).status,400);
 assert.equal((await (await call('blast',{action:'list',mode:'normal',scope:'all'})).json()).rows.length,1);
});
test('parts writes and imports can be replayed without duplicate rows',async()=>{
 const {call,db}=setup();const row={id:crypto.randomUUID(),player_id:'p',player_name:'Test',word:'test',parts:['test'],discovered_count:3};
 for(let i=0;i<2;i++)assert.equal((await call('main/rest/v1/sushi_parts_collection',row)).status,200);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM sushi_parts_collection').get().n,1);
 const run={id:crypto.randomUUID(),player_id:'p',player_name:'Test',score:200};for(let i=0;i<2;i++)await call('main/rest/v1/sushi_parts_runs',run);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM sushi_parts_runs').get().n,1);
 const old={id:1,player_name:'Legacy',score:40,max_combo:3,accuracy:80,mode:'core',created_at:'2026-10-01T00:00:00Z'};
 for(let i=0;i<2;i++){const s=importStatement('main','scores',old);db.prepare(s.sql).run(...s.params)}
 const got={...db.prepare('SELECT * FROM scores').get()};delete got.source;assert.deepEqual(got,normalize(old));
});
test('Supabase 402: ranking stays on D1; PIN request remains unchanged',async()=>{
 const {env}=setup(),calls=[],data=new Map();const native=async(input,init)=>{const r=new Request(input,init);calls.push(r.url);if(new URL(r.url).hostname.endsWith('supabase.co'))return new Response('{}',{status:402});return worker.fetch(r,env)};
 const window={fetch:native,addEventListener(){}};
 const context={window,Request,URL,crypto,location:{origin:'https://sushitan.net'},document:{readyState:'loading',addEventListener(){}},localStorage:{get length(){return data.size},key:i=>[...data.keys()][i],setItem:(k,v)=>data.set(k,v),getItem:k=>data.get(k),removeItem:k=>data.delete(k)}};
 vm.runInNewContext(fs.readFileSync(new URL('../shared/ranking-d1.js',import.meta.url),'utf8').replace('const ENABLED=false','const ENABLED=true'),context);
 const base='https://rxyoyveykxdfrpomkltl.supabase.co';
 assert.equal((await window.fetch(base+'/rest/v1/rpc/save_high_score',{method:'POST',body:JSON.stringify(score())})).status,200);
 assert.equal((await window.fetch(base+'/rest/v1/scores?mode=eq.core')).status,200);
 assert.ok(calls.every(u=>u.startsWith('https://sushitan.net/api/rankings/')));assert.equal(data.size,0);
 const pin=base+'/functions/v1/sushi-id-sync';assert.equal((await window.fetch(pin,{method:'POST',body:'{}'})).status,402);assert.equal(calls.at(-1),pin);
 env.WRITE_LIMIT.limit=async()=>({success:false});assert.equal((await window.fetch(base+'/rest/v1/rpc/save_high_score',{method:'POST',body:JSON.stringify(score(200))})).status,429);assert.equal(data.size,1);
});
test('optional full source snapshot: repeat import and compare every column',()=>{
 if(!process.env.RANKING_SNAPSHOT)return;
 const {db}=setup(),snapshot=JSON.parse(fs.readFileSync(process.env.RANKING_SNAPSHOT,'utf8'));let count=0;
 for(let pass=0;pass<2;pass++)for(const [source,tables] of Object.entries(snapshot))for(const [table,rows] of Object.entries(tables))for(const row of rows){const s=importStatement(source,table,row);db.prepare(s.sql).run(...s.params)}
 for(const [source,tables] of Object.entries(snapshot))for(const [table,rows] of Object.entries(tables)){
  const actual=db.prepare(`SELECT * FROM ${table}${table==='scores'?' WHERE source=?':''}`).all(...(table==='scores'?[source]:[]));assert.equal(actual.length,rows.length);
  const key=r=>table==='daily_high_scores'?JSON.stringify([r.mode,r.score_date,r.player_key]):r.id;
  const byId=new Map(actual.map(r=>[key(r),r]));for(const row of rows){const got=byId.get(key(row));assert.ok(got);for(const [k,v] of Object.entries(normalize(row)))assert.equal(got[k],v,`${source}/${table}/${k}`);count++}
 }console.log('Snapshot rows verified:',count);
});

