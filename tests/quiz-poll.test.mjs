import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function harness(){
 let now=0,serial=0,calls=0,status='lobby',index=0,host=false,failure=0;
 const timers=new Map(),listeners=new Map(),store=new Map();
 const document={hidden:false,addEventListener:(n,f)=>listeners.set(n,f),removeEventListener:n=>listeners.delete(n)};
 const window={addEventListener:document.addEventListener,removeEventListener:document.removeEventListener};
 const navigator={onLine:true};
 const context={window,document,navigator,console,URLSearchParams,AbortController,Date:{now:()=>now},Map,JSON,sessionStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},setTimeout:(f,ms)=>{timers.set(++serial,{f,at:now+ms});return serial},clearTimeout:id=>timers.delete(id),fetch:async()=>{calls++;return {ok:!failure,status:failure,json:async()=>failure?{message:'failure'}:{session:{code:'123456',status,q_index:index,length:5},players:[]}}}};
 for(const file of ['quiz-poll.js','quiz-d1.js'])vm.runInNewContext(fs.readFileSync(new URL('../shared/'+file,import.meta.url),'utf8'),context);
 const api=window.SushiQuizD1;
 const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve()};
 const read=async()=>{await api.from('sushi_quiz_sessions').select().eq('code','123456');await api.from('sushi_quiz_players').select().eq('session_code','123456')};
 return {api,document,navigator,flush,read,get calls(){return calls},setStatus:(s,i=0)=>{status=s;index=i},setFailure:s=>failure=s,setHost:()=>{host=true;store.set('quiz-d1:123456',JSON.stringify({host:'token'}))},start:()=>window.SushiQuizPoll(read,{isHost:()=>host,delay:()=>api.pollDelay('123456')}),event:n=>listeners.get(n)?.(),advance:async ms=>{const end=now+ms;while(true){const next=[...timers].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;now=next[1].at;timers.delete(next[0]);next[1].f();await flush()}now=end;await flush()}};
}
test('lobby polls every 5s; normal every 2s; buzzer remains 1s; final result stops',async()=>{
 const h=harness();h.start();await h.flush();await h.advance(60000);assert.equal(h.calls,13);
 h.setStatus('question');await h.advance(5000);const n=h.calls;await h.advance(10000);assert.equal(h.calls-n,5);
 h.setStatus('buzzer_question');await h.advance(2000);const b=h.calls;await h.advance(5000);assert.equal(h.calls-b,5);
 h.setStatus('buzzer_result',4);await h.advance(1000);const end=h.calls;await h.advance(60000);assert.equal(h.calls,end);
});
test('hidden participant and offline clients stop requests and resume once; stop removes listeners',async()=>{
 const h=harness(),stop=h.start();await h.flush();h.document.hidden=true;await h.advance(60000);assert.equal(h.calls,1);
 h.document.hidden=false;h.event('visibilitychange');await h.advance(0);assert.equal(h.calls,2);
 h.navigator.onLine=false;await h.advance(60000);assert.equal(h.calls,2);
 h.navigator.onLine=true;h.event('online');await h.advance(0);assert.equal(h.calls,3);
 stop();h.event('online');await h.advance(60000);assert.equal(h.calls,3);
});
test('hidden host keeps game running; result reads are reused until invalidation',async()=>{
 const h=harness();h.setHost();h.setStatus('question');h.document.hidden=true;h.start();await h.flush();await h.advance(6000);assert.equal(h.calls,4);
 h.setStatus('result');await h.advance(2000);const n=h.calls;await h.advance(60000);assert.equal(h.calls,n);
 h.api.invalidate('123456');h.setStatus('question',1);await h.advance(3000);assert.equal(h.calls,n+1);
});
test('failures coalesce and back off; missing rooms terminate polling',async()=>{
 const h=harness();h.setFailure(503);h.start();await h.flush();assert.equal(h.calls,1);await h.advance(60000);assert.ok(h.calls<=5);
 h.setFailure(404);await h.advance(60000);const n=h.calls;await h.advance(120000);assert.equal(h.calls,n);
});
test('visibility wake never overlaps a pending poll',async()=>{
 const h=harness();let release,count=0,active=0,max=0;
 h.start();await h.flush();h.event('pagehide');
 // A separately controlled request exercises the scheduler while it is awaiting I/O.
 const source=fs.readFileSync(new URL('../shared/quiz-poll.js',import.meta.url),'utf8');
 const events=new Map(),tasks=[];const window={addEventListener:(n,f)=>events.set(n,f),removeEventListener:n=>events.delete(n)};
 const document={hidden:false,...window};vm.runInNewContext(source,{window,document,navigator:{onLine:true},console,setTimeout:f=>{tasks.push(f);return 1},clearTimeout:()=>{tasks.length=0}});
 const stop=window.SushiQuizPoll(async()=>{count++;active++;max=Math.max(max,active);await new Promise(r=>release=r);active--},{isHost:()=>false,delay:()=>1000});
 events.get('visibilitychange')();events.get('visibilitychange')();assert.equal(count,1);release();await h.flush();tasks.shift()();assert.equal(count,2);assert.equal(max,1);stop();release();await h.flush();
});
