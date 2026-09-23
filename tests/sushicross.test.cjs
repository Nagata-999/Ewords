const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const W=require('../sushicross-words.js');
const master=JSON.parse(fs.readFileSync(__dirname+'/../data/words_master_v2_reviewed.json','utf8'));
const words=W.normalize(master);assert.equal(words.length,master.length);assert(words.length>2000);
let seed=47;const rng=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
for(const w of words){const c=W.choices(w,words,rng);assert.equal(c.length,3);assert.equal(c.filter(x=>x.correct).length,1);assert.equal(new Set(c.map(x=>x.text)).size,3);assert(c.some(x=>x.correct&&x.fullText===w.jp));}
const deck=W.createDeck(words,rng),seen=new Set();let last;
for(let i=0;i<words.length;i++){last=deck.next();assert(!seen.has(last.id));seen.add(last.id)}assert.notEqual(deck.next().id,last.id);
const synonym=W.normalize([{en:'need',jp:'必要とする',synonyms:['require']},{en:'require',jp:'～を必要とする'},{en:'cat',jp:'猫'},{en:'dog',jp:'犬'}]);
assert(!W.compatible(synonym[0],synonym[1]));
const html=fs.readFileSync(__dirname+'/../sushicross.html','utf8');
const script=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];new vm.Script(script);
for(const file of ['sushicross-ranking.js','sushicross-words.js'])new vm.Script(fs.readFileSync(__dirname+'/../'+file,'utf8'));
function element(){return {textContent:'',value:'',hidden:false,disabled:false,open:false,style:{},dataset:{},children:[],handlers:{},classList:{add(){},remove(){}},addEventListener(k,f){this.handlers[k]=f},setAttribute(){},appendChild(x){this.children.push(x)},replaceChildren(){this.children=[]},showModal(){this.open=true},close(){this.open=false},focus(){},getContext(){return new Proxy({measureText:s=>({width:s.length*8})},{get:(o,k)=>o[k]||(()=>{})})},play(){return Promise.resolve()},pause(){}}}
async function main(){
 await assert.rejects(()=>W.load(async()=>({ok:false})));
 await assert.rejects(()=>W.load(async()=>({ok:true,json:async()=>[]})));
 assert.equal((await W.load(async()=>({ok:true,json:async()=>master}))).length,words.length);
 const els=new Map(),get=id=>{if(!els.has(id))els.set(id,element());return els.get(id)};
 const doc={hidden:false,querySelector:get,querySelectorAll:()=>[],addEventListener(){},createElement:element};
 const storage=new Map(),results=[],timers=[];
 const context={document:doc,window:{},SushiCrossWords:{...W,load:async()=>words},SushiCrossRanking:{init:()=>({isOpen:()=>false,reset(){},present:r=>results.push(r)})},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},innerWidth:390,innerHeight:844,devicePixelRatio:1,addEventListener(){},requestAnimationFrame(){},performance:{now:()=>1},setTimeout:f=>{timers.push(f)},clearTimeout(){},console,Math};
 const injected=script.replace(/\}\)\(\);\s*$/,`window.test={begin,clearStage,end,startQuiz,answerCheck,get:()=>({WORDS,wordDeck,stage,score,hearts,state}),set:(s)=>{if(s.score!==undefined)score=s.score;if(s.hearts!==undefined)hearts=s.hearts},answer:(correct)=>{const l=lanes.find(l=>l.type===TYPES.QUIZ&&!l.quiz?.answered);startQuiz(l);player.row=l.row;player.x=l.quiz.choices.find(c=>c.correct===correct).x;answerCheck()}};})();`);
 vm.runInNewContext(injected,context);await new Promise(setImmediate);
 const api=context.window.test;assert.equal(api.get().WORDS.length,words.length);api.begin();api.answer(true);assert.equal(api.get().score,5);
 api.clearStage();assert.equal(results[0].accuracy,100);api.begin();assert.equal(api.get().stage,2);assert.equal(api.get().score,5);api.answer(false);api.end('test');assert.equal(results[1].accuracy,50);
 api.begin();assert.equal(api.get().score,0);api.set({hearts:1});api.answer(false);assert.equal(api.get().state,'over');assert.equal(results.at(-1).accuracy,0);
 // Real ranking UI code with a controlled transport: duplicate clicks, retry and stale completion.
 let calls=[],transport=async()=>({ok:true,json:async()=>[]});
 const rankContext={window:{},document:doc,fetch:async(url,options)=>{calls.push({url,options});return transport(url,options)},AbortController,setTimeout,clearTimeout,console};
 vm.runInNewContext(fs.readFileSync(__dirname+'/../sushicross-ranking.js','utf8'),rankContext);
 const rank=rankContext.window.SushiCrossRanking.init({get:()=>'',set(){}}),form=get('#saveRanking'),button=get('#saveScore'),name=get('#playerName');name.value='テスト';
 rank.present({score:20,stage:2,accuracy:50});await form.handlers.submit({preventDefault(){}});const payload=JSON.parse(calls.at(-1).options.body);assert.equal(payload.p_mode,'sushi_cross');assert.equal(payload.p_score,20);assert.equal(payload.p_max_combo,2);assert(button.disabled);
 const count=calls.length;await form.handlers.submit({preventDefault(){}});assert.equal(calls.length,count);
 rank.present({score:21,stage:2,accuracy:60});transport=async()=>({ok:false});await form.handlers.submit({preventDefault(){}});assert(!button.disabled);assert(get('#saveStatus').textContent.includes('登録できません'));
 let resolve;transport=()=>new Promise(r=>resolve=r);const pending=form.handlers.submit({preventDefault(){}});rank.reset();rank.present({score:30,stage:3,accuracy:80});resolve({ok:true});await pending;assert(!button.disabled);assert.equal(button.textContent,'記録を登録');
 transport=async()=>({ok:true,json:async()=>[{player_name:'<img onerror=evil()>',score:30,max_combo:2},{player_name:'B',score:30,max_combo:3},{player_name:'C',score:10,max_combo:1}]});get('#openRanking').handlers.click();await new Promise(setImmediate);
 assert.equal(get('#rankingRows').children[0].children[1].textContent,'<img onerror=evil()>');assert.equal(get('#rankingRows').children[1].children[0].textContent,'1');assert.equal(get('#rankingRows').children[2].children[0].textContent,'3');assert(calls.at(-1).url.includes('mode=eq.sushi_cross'));
 console.log('PASS: 2026 dictionary entries, distractors, deck uniqueness, load failures, gameplay/results, ranking transport/retry/stale requests/ties/text safety');
}
main().catch(e=>{console.error(e);process.exitCode=1});
