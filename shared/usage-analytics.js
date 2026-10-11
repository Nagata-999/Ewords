'use strict';
(function(root){
 const paths=[[/sushitanjunior/,'sushitanjunior'],[/sushi-run3D/,'sushi_run3d'],[/sushiflow/i,'sushiflow'],[/sushian/,'sushian'],[/sushitype/,'sushitype'],[/sushishun/,'sushishun'],[/sushikome/,'sushikome'],[/sushikobun/,'sushikobun'],[/sharitan/,'sharitan'],[/spetan/,'spetan'],[/sushi_clock/,'sushi_clock'],[/sushi_hayaoshi/,'sushi_hayaoshi'],[/sushi_parts_learning/,'sushi_parts_learning'],[/sushi_parts/,'sushi_parts'],[/sushi-ondoku/,'sushi_ondoku']].concat([[/^\/$|^\/index\.html$/,'home'],[/sushitan(?:\.html)?$/,'sushitan'],[/shinotan/,'shinotan'],[/antonitan/,'antonitan'],[/sushi_idiom/,'sushi_idiom'],[/sushi_quiz/,'sushi_quiz'],[/sushitalk/,'sushitalk'],[/sukaishi/,'sukaishi'],[/sushi_run/,'sushi_run'],[/sushicross/,'sushicross'],[/sushi_blast/,'sushi_blast'],[/\/toeic(?:\/|$)/,'toeic'],[/sushigiri/,'sushigiri'],[/sushidungeon/,'sushidungeon']]);
 function gameFor(path){if(/^\/admin(?:\/|$)/.test(path))return null;return paths.find(([pattern])=>pattern.test(path))?.[1]||null}
 if(typeof module==='object'&&module.exports){module.exports={gameFor};return}
 if(root.__sushiUsageLoaded)return;root.__sushiUsageLoaded=true;const game=gameFor(location.pathname);if(!game)return;
 const base='https://rxyoyveykxdfrpomkltl.supabase.co/functions/v1/',apikey='sb_publishable_RmWOSxRfsV5YRwCDnKPPAQ_m3VzsUM7',key='sushitan_usage_queue_v1',visitorKey='sushitan_usage_visitor_v1';
 try{
 let visitor=localStorage.getItem(visitorKey);if(!/^[0-9a-f-]{36}$/.test(visitor||'')){visitor=crypto.randomUUID();localStorage.setItem(visitorKey,visitor)}
 const account=()=>localStorage.getItem('sushitan_sync_id_v1')||'';
 const read=()=>{try{const records=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(records)?records.filter(r=>r?.session&&Date.parse(r.started)>Date.now()-7*86400000).slice(-20):[]}catch{return []}};
 let identity=account(),session={session:crypto.randomUUID(),visitor,game,started:new Date().toISOString(),seconds:0,answers:0,correct:0,account:identity},elapsed=0,lastTick=performance.now(),lastAction=lastTick,lastSend=0,sending=false;
 const seen=new Set(),acknowledged=new Map(),signature=r=>[r.seconds,r.answers,r.correct].join(':');
 function persist(){try{if(acknowledged.get(session.session)===signature(session))return;const q=read().filter(r=>r.session!==session.session);q.push({...session});localStorage.setItem(key,JSON.stringify(q.slice(-20)))}catch{}}
 function tick(){const now=performance.now();if(!document.hidden&&now-lastAction<60000)elapsed+=Math.max(0,Math.min(10000,now-lastTick));lastTick=now;session.seconds=Math.min(14400,Math.floor(elapsed/1000));if(account()!==identity){persist();identity=account();session={session:crypto.randomUUID(),visitor,game,started:new Date().toISOString(),seconds:0,answers:0,correct:0,account:identity};elapsed=0;lastAction=now;seen.clear()}}
 async function flush(){if(sending)return;sending=true;try{tick();persist();for(const record of read()){
 const id=account(),pin=localStorage.getItem('sushitan_sync_pin_v1');if(record.account&&(record.account!==id||!/^\d{4}$/.test(pin||'')))continue;
 const {account:_account,...usage}=record;const endpoint=record.account?'sushi-id-sync':'usage-record',body=record.account?{action:'usage_record',sushi_id:id,pin,usage}:usage;
 const r=await fetch(base+endpoint,{method:'POST',headers:{apikey,'Content-Type':'application/json'},body:JSON.stringify(body),keepalive:true});const data=await r.json();if(!r.ok||!data.ok)continue;
 acknowledged.set(record.session,signature(record));const q=read().filter(old=>old.session!==record.session||old.seconds>record.seconds||old.answers>record.answers);localStorage.setItem(key,JSON.stringify(q));
 }}catch{}finally{sending=false;lastSend=performance.now()}}
 root.addEventListener('sushi-achievement-answer',e=>{tick();const a=e.detail;if(!a?.id||seen.has(a.id))return;seen.add(a.id);session.answers=Math.min(50000,session.answers+1);if(a.correct)session.correct=Math.min(session.answers,session.correct+1);lastAction=performance.now();persist()});
 ['pointerdown','keydown'].forEach(name=>root.addEventListener(name,()=>lastAction=performance.now(),{passive:true}));
 document.addEventListener('visibilitychange',()=>{tick();lastTick=performance.now();if(document.hidden)flush();else lastAction=lastTick});
 root.addEventListener('pagehide',flush);setInterval(()=>{tick();if(performance.now()-lastSend>=120000)flush()},10000);flush();
 }catch{}
})(typeof window!=='undefined'?window:globalThis);
