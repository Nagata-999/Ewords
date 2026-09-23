const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
function storage(initial={}){const data=new Map(Object.entries(initial));return {data,get length(){return data.size},key:i=>[...data.keys()][i],getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)}}
function setup(store=storage(),fetch=async()=>({ok:true}),now=Date.parse('2026-09-23T03:00:00Z')){
 const events={},docEvents={},timers=new Map();let serial=0;
 const doc={readyState:'loading',hidden:false,activeElement:null,querySelectorAll:()=>[],addEventListener:(n,fn)=>docEvents[n]=fn};
 class Clock extends Date{constructor(...a){super(...(a.length?a:[now]))}static now(){return now}}
 const c={localStorage:store,document:doc,fetch,Date:Clock,crypto:{randomUUID:()=>`job-${++serial}`,getRandomValues:a=>{a[0]=123;a[1]=456;return a}},Uint32Array,Map,Set,Promise,Math,JSON,String,Number,Array,AbortController,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail}},setTimeout:(f,ms)=>{const id=++serial;timers.set(id,{f,ms});return id},clearTimeout:id=>timers.delete(id),addEventListener:(n,f)=>events[n]=f,dispatchEvent:event=>events[event.type]?.(event),console};
 c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync(root+'/shared/player.js','utf8'),c);vm.runInContext(fs.readFileSync(root+'/shared/scores.js','utf8'),c);return {c,events,docEvents,timers};
}
const status=()=>({textContent:'',dataset:{}});
async function main(){
 const st=storage(),a=setup(st),generated=a.c.SushiPlayer.getName();assert.match(generated,/^名無し\d{12}$/);assert.equal(setup(st).c.SushiPlayer.getName(),generated);
 a.c.SushiPlayer.setName('  Ａｌｉｃｅ   すし  ');assert.equal(a.c.SushiPlayer.getName(),'Alice すし');assert.equal(setup(st).c.SushiPlayer.getName(),'Alice すし');assert.equal(st.getItem('sushiIdiomName'),'Alice すし');assert.equal(st.getItem('sushiCrossPlayerName'),'Alice すし');
 for(const key of ['sushiIdiomName','sushiCrossPlayerName','sushiSlashName','sushidungeon_player_name_v1','sushi_run_3d_name'])assert.equal(setup(storage({[key]:'既存の名前'})).c.SushiPlayer.getName(),'既存の名前');
 assert.match(setup(storage({sushitan_player_name:'NO NAME',sushiIdiomName:'GUEST'})).c.SushiPlayer.getName(),/^名無し/);
 const parts=storage({sushitan_player_name:'共通名',sushi_parts_player_name:'旧名',sushi_parts_words_旧名:'["accept","provide"]',sushi_parts_words_共通名:'["create"]',sushi_parts_rogue_state_v2:JSON.stringify({player:'旧名',score:420,round:3})});setup(parts);assert.deepEqual(JSON.parse(parts.getItem('sushi_parts_words_共通名')),['create','accept','provide']);assert.equal(JSON.parse(parts.getItem('sushi_parts_rogue_state_v2')).score,420);assert.equal(JSON.parse(parts.getItem('sushi_parts_rogue_state_v2')).player,'共通名');assert(parts.getItem('sushi_parts_words_旧名'));
 const denied={getItem(){throw Error('denied')},setItem(){throw Error('denied')},get length(){throw Error('denied')}};const privateTab=setup(denied);assert.equal(privateTab.c.SushiPlayer.getName(),privateTab.c.SushiPlayer.getName());
 const calls=[],shared=storage({sushitan_player_name:'保存名'});let offline=true;
 const sender=setup(shared,async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});if(offline)throw Error('offline');return {ok:true}});
 const el=status(),params={p_score:125,p_max_combo:7,p_accuracy:83,p_mode:'sushi_cross'};
 const result=await sender.c.SushiScores.save(params,{status:el});assert(result.queued);assert(el.textContent.includes('端末に記録'));params.p_score=9999;sender.c.SushiPlayer.setName('変更後');
 const keys=[...shared.data.keys()].filter(k=>k.startsWith('sushitan_pending_score_v1:'));assert.equal(keys.length,1);assert.equal(JSON.parse(shared.getItem(keys[0])).params.p_score,125);
 offline=false;const fresh=setup(shared,async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return {ok:true}});await fresh.c.SushiScores.flush();assert.equal(calls.at(-1).body.p_player_name,'保存名');assert.equal(calls.at(-1).body.p_score,125);assert(!shared.getItem(keys[0]));
 const days=storage(),queued=setup(days,async()=>{throw Error('offline')});await queued.c.SushiScores.save({p_mode:'sushi_idiom',p_score:100},{daily:true});const late=[];const tomorrow=setup(days,async(url)=>{late.push(url);return {ok:true}},Date.parse('2026-09-24T03:00:00Z'));await tomorrow.c.SushiScores.flush();assert(late[0].endsWith('/save_high_score'));
 const routed=[];const targets=setup(storage(),async(url)=>{routed.push(url);return {ok:true}});await targets.c.SushiScores.save({p_mode:'core',p_score:12},{daily:true});await targets.c.SushiScores.save({p_mode:'typing_game_timeAttack',p_score:23},{target:'typing'});assert(routed[0].endsWith('/save_score_with_daily'));assert(routed[1].includes('ykrjocftuflnkubaxrza'));
 // A previous completion cannot overwrite the status of a more recent result.
 const completions=[];const delayed=setup(storage(),()=>new Promise(resolve=>completions.push(resolve)));const sharedStatus=status();const first=delayed.c.SushiScores.save({p_mode:'core',p_score:1},{status:sharedStatus}),second=delayed.c.SushiScores.save({p_mode:'core',p_score:2},{status:sharedStatus});completions[0]({ok:true});await first;assert.equal(sharedStatus.textContent,'ランキングに自動保存中…');completions[1]({ok:true});await second;assert(sharedStatus.textContent.includes('自動保存しました'));
 // All entry points load the common profile before their game code.
 const pages=['index.html','sushitan.html','shinotan.html','antonitan.html','sushi_run.html','sushi-run3D.html','sushigiri.html','sushikobun.html','sushi_clock.html','sushi_hayaoshi.html','sushi_idiom (1).html','sushi_quiz.html','sushi_quiz_core.html','sushitype.html','sushi_parts.html','sushicross.html','sushidungeon/index.html'];
 let scripts=0;
 for(const file of pages){const html=fs.readFileSync(path.join(root,file),'utf8');assert(html.includes('shared/player.js'),file);assert(html.includes('shared/scores.js'),file);assert(!/prompt\(["'][^"']*名前/.test(html),file);for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(/application\/|type=["']module/.test(m[1]))continue;new vm.Script(m[2],{filename:file});scripts++}}
 console.log(`PASS: profile migration and sharing, guest assignment, Parts history, storage denial, queued immutable results, retry across pages, daily date rollover, typing backend, stale UI; ${scripts} scripts parsed`);
}
main().catch(e=>{console.error(e);process.exitCode=1});
