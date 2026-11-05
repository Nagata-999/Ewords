import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {DatabaseSync} from 'node:sqlite';
import worker from '../cloudflare/quiz/worker.mjs';
function setup(){
 const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync(new URL('../cloudflare/quiz/schema.sql',import.meta.url),'utf8'));
 let queue=Promise.resolve(); const DB={prepare(sql){return {bind(...args){return {async all(){return {results:db.prepare(sql).all(...args)}},async run(){return {meta:db.prepare(sql).run(...args)}}}}}},batch(ss){const job=queue.then(async()=>{db.exec('BEGIN');try{const result=[];for(const s of ss)result.push(await s.run());db.exec('COMMIT');return result}catch(e){db.exec('ROLLBACK');throw e}});queue=job.catch(()=>{});return job}};
 const env={DB,QUIZ_READY:'true'};
 const call=async(code,body,key)=>{const r=await worker.fetch(new Request('https://sushitan.net/api/quiz/rooms'+(code?'/'+code:''),{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(key?{'X-Quiz-Token':key}:{})},body:body?JSON.stringify(body):undefined}),env);return {status:r.status,...await r.json()}};
 const create=async(buzzer=false)=>call('',{action:'create',value:{code:'1234',length:5,status:buzzer?'buzzer_lobby':'lobby'}});
 const join=async(name)=>call('1234',{action:'join',value:{name}});
 const question=async(key,buzzer=false,idx=0)=>call('1234',{action:'session',value:{status:buzzer?'buzzer_question':'question',q_index:idx,current_question:{q:'Question',choices:['A','B','C','D'],ans:1,started_at:1}}},key);
 return {db,call,create,join,question,env};
}
test('create, join, authenticated room state, normal answers and host score',async()=>{
 const {call,create,join,question}=setup();const host=await create(),p=await join('Player');assert.equal(host.status,200);assert.equal(p.status,200);
 assert.equal((await call('1234')).players.length,0);
 assert.equal((await question(p.token)).status,403);
 assert.equal((await question(host.token)).status,200);
 const response=await call('1234',{action:'player',id:p.data.id,value:{last_answer:1,answered_q_index:0,score:9999}},p.token);assert.equal(response.status,200);assert.equal(response.data.score,0);assert.ok(response.data.meta.answered_at>1);
 assert.equal((await call('1234',{action:'player',id:p.data.id,value:{last_answer:1,answered_q_index:0}},p.token)).status,409);
 assert.equal((await call('1234',{action:'player',id:p.data.id,value:{score:10,correct:1,meta:{current_streak:1}}},host.token)).status,200);
 const s=await call('1234',null,p.token);assert.equal(s.players[0].score,10);assert.ok(!JSON.stringify(s).includes(host.token));assert.ok(!JSON.stringify(s).includes(p.token));
});
test('buzzer concurrent correct answers have exactly one winner',async()=>{
 const {call,create,join,question}=setup();const host=await create(true),a=await join('A'),b=await join('B');await question(host.token,true);
 const results=await Promise.all([a,b].map(p=>call('1234',{action:'player',id:p.data.id,value:{last_answer:1,answered_q_index:0,score:9999}},p.token)));
 assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
 const s=await call('1234',null,host.token);assert.equal(s.session.status,'buzzer_result');assert.equal(s.players.filter(p=>p.score>0).length,1);assert.equal(s.players.filter(p=>p.meta.buzzer_winner_q===0).length,1);
 await question(host.token,true,1);const next=await call('1234',null,host.token);assert.ok(next.players.every(p=>!('buzzer_winner_q' in p.meta)));assert.ok(next.players.every(p=>p.answered_q_index===-1));
});
test('buzzer wrong answer freezes server-side; tokens, stale answers, expiry and readiness fail closed',async()=>{
 const {db,call,create,join,question,env}=setup();const host=await create(true),p=await join('P');await question(host.token,true);
 const wrong=await call('1234',{action:'player',id:p.data.id,value:{last_answer:0,answered_q_index:0}},p.token);assert.equal(wrong.status,200);assert.ok(wrong.data.meta.freeze_until>Date.now());
 assert.equal((await call('1234',{action:'player',id:p.data.id,value:{last_answer:1,answered_q_index:0}},p.token)).status,409);
 assert.equal((await call('1234',{action:'player',id:p.data.id,value:{last_answer:1,answered_q_index:0}},'wrong')).status,403);
 assert.equal((await join('late')).status,409);
 db.exec('UPDATE quiz_rooms SET expires_at=0');assert.equal((await call('1234')).status,404);
 env.QUIZ_READY='false';assert.equal((await create()).status,503);
});
test('D1 batch rollback keeps old question and answers',async()=>{
 const {db,call,create,join,question}=setup();const host=await create(),p=await join('P');db.exec("CREATE TRIGGER fail_reset BEFORE UPDATE ON quiz_players BEGIN SELECT RAISE(ABORT,'failure'); END");assert.equal((await question(host.token)).status,503);assert.equal((await call('1234',null,host.token)).session.status,'lobby');
});
test('normal result batch is atomic and replay does not add points twice',async()=>{
 const {db,call,create,join,question}=setup();const host=await create(),p=await join('P');await question(host.token);
 const body={action:'scores',value:{q_index:0,players:[{id:p.data.id,score:10,correct:1,meta:{current_streak:1}}]}};
 assert.equal((await call('1234',body,p.token)).status,403);
 assert.equal((await call('1234',body,host.token)).status,200);
 body.value.players[0].score=20;await call('1234',body,host.token);
 assert.equal((await call('1234',null,host.token)).players[0].score,10);
 await question(host.token,false,1);body.value.q_index=1;
 db.exec("CREATE TRIGGER fail_result BEFORE UPDATE ON quiz_rooms WHEN json_extract(NEW.data,'$.status')='result' BEGIN SELECT RAISE(ABORT,'failure'); END");
 assert.equal((await call('1234',body,host.token)).status,503);
 const s=await call('1234',null,host.token);assert.equal(s.session.status,'question');assert.equal(s.players[0].score,10);
});
test('browser client uses same-origin D1 without Supabase and coalesces polling reads',async()=>{
 const {env}=setup(),calls=[];function client(){const store=new Map(),window={};const context={window,URLSearchParams,Date,Map,JSON,setTimeout,clearTimeout,AbortController,sessionStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},fetch:async(path,options)=>{calls.push(path);return worker.fetch(new Request('https://sushitan.net'+path,options),env)}};vm.runInNewContext(fs.readFileSync(new URL('../shared/quiz-d1.js',import.meta.url),'utf8'),context);return window.SushiQuizD1}
 const host=client(),player=client();const c=await host.from('sushi_quiz_sessions').insert({code:'1234',status:'lobby',length:5}).select().maybeSingle();assert.equal(c.error,null);
 const p=await player.from('sushi_quiz_players').insert({session_code:'1234',name:'P'}).select().maybeSingle();assert.equal(p.error,null);
 const before=calls.length;await player.from('sushi_quiz_sessions').select('*').eq('code','1234').maybeSingle();const ps=await player.from('sushi_quiz_players').select('*').eq('session_code','1234');assert.equal(ps.data.length,1);assert.equal(calls.length-before,1);assert.ok(calls.every(p=>p.startsWith('/api/quiz/')));
});
test('both HTML entrypoints compile and load D1 client before game script',()=>{
 for(const file of ['sushi_quiz.html','sushi_quiz_core.html']){const s=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');assert.ok(s.includes('/shared/quiz-d1.js?v='));assert.ok(!s.includes('supabase.createClient'));assert.ok(s.includes('const sb = window.SushiQuizD1'));for(const m of s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!/src=|ld\+json/.test(m[1]))new vm.Script(m[2]);}
});

