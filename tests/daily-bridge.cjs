const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const code=read('sushigacha/daily-quest-click-bridge.js');
const key='sushitan_login_bonus_v1';
function boot(game,file){
 const store=new Map(),listeners={},observers=[],timers=[],nodes={};
 const day=new Date();day.setHours(day.getHours()-6);
 const stamp=`${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`;
 store.set('sushitan_daily_active_v1',JSON.stringify({day:stamp,active:[game,'idiom','shino','quiz']}));
 const node=()=>({textContent:'',style:{},appendChild(n){nodes[n.id]=n;}});
 for(const id of ['soloRes','judge','distance'])nodes[id]=node();
 const ctx={Date,Math,location:{pathname:'/'+file},localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},
  CustomEvent:class{constructor(type){this.type=type;}},setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout(){},
  addEventListener(type,fn){(listeners[type]??=[]).push(fn);},dispatchEvent(){},
  MutationObserver:class{constructor(fn){observers.push(fn);}observe(){}},
  document:{documentElement:node(),body:node(),createElement:node,getElementById:id=>nodes[id]||null,querySelector:()=>nodes.delta,
   addEventListener(type,fn){(listeners[type]??=[]).push(fn);}}};
 ctx.window=ctx;vm.createContext(ctx);vm.runInContext(code,ctx);vm.runInContext(code,ctx);
 return {nodes,change(id,text){nodes[id].textContent=text;observers.forEach(fn=>fn());},
  flush(){for(const fn of timers.splice(0))fn();},
  click(correct=true){const b={dataset:{},closest:s=>correct||!s.includes('correct')?b:null};for(const type of ['pointerdown','click'])for(const fn of listeners[type]||[])fn({target:b});},
  saved:()=>JSON.parse(store.get(key)||'{}')};
}
for(const [game,file,goal] of [['sushitan','sushitan',30],['antoni','antonitan',20]]){
 const b=boot(game,file);b.click(false);assert.equal(b.saved().dailyQuests,undefined);
 b.click();assert.equal(b.saved().dailyQuests.progress[game],1,'pointerdown and click count once');
 for(let i=1;i<goal;i++)b.click();assert.equal(b.saved().gems,10);b.click();assert.equal(b.saved().gems,10);
}
const run=boot('run','sushi_run');run.change('distance','100m');run.flush();assert.equal(run.saved().dailyQuests.progress.run,100);
run.change('distance','0m');run.change('distance','40m');run.flush();assert.equal(run.saved().dailyQuests.progress.run,140,'restart adds only the new distance');
run.change('distance','2000m');run.flush();assert.equal(run.saved().gems,10);assert.equal(run.saved().dailyQuests.progress.run,1500);
for(const [game,file,id,yes,no] of [['quiz','sushi_quiz','soloRes','✅ Correct!','❌ Incorrect'],['world','sukaishi_world_study_v03','judge','✓ CORRECT','INCORRECT']]){
 const b=boot(game,file);b.change(id,no);assert.equal(b.saved().dailyQuests,undefined);
 b.change(id,yes);b.change(id,yes);assert.equal(b.saved().dailyQuests.progress[game],1);
 b.change(id,'');b.change(id,yes);assert.equal(b.saved().dailyQuests.progress[game],2);
}
const talk=boot('talk','sushitalk');talk.nodes.delta={textContent:'-1'};talk.click();talk.flush();assert.equal(talk.saved().dailyQuests,undefined);
talk.nodes.delta.textContent='+2';talk.click();talk.flush();assert.equal(talk.saved().dailyQuests.progress.talk,1);
for(const file of ['sushitan.html','antonitan.html','sushi_run.html','sushitalk.html','sukaishi_world_study_v03.html','sushi_quiz.html']){
 assert(!read(file).includes('directDailyToast'),file+' must not also run a legacy daily tracker');
 assert(read(file).includes('gem-system.js?v=20260922-2'),file+' loads the current bridge loader');
}
console.log('PASS: extensionless game routes; pointer/click deduplication; run distances/restart/reward; quiz/world results; talk feedback; one tracker per game');
