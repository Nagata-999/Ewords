const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const context={window:{},document:{readyState:'loading',addEventListener(){}}};vm.runInNewContext(read('shared/shino-thinking.js'),context);
const core=context.window.SushiShinoThinkingCore,raw=JSON.parse(read('data/shino-thinking.json')),bank=core.validate(raw);
assert(bank.length>=20,'At least twenty distinct pairs must ship');
assert.equal(new Set(bank.map(q=>q.id)).size,bank.length);
const round=core.session(bank.slice(0,3));assert.equal(round.next(),false);assert.equal(round.answer('invalid'),null);
assert.equal(round.answer(bank[0].answer).correct,true);assert.equal(round.answer(bank[0].answer),null);assert.equal(round.next(),true);
assert.equal(round.answer(bank[1].choices.find(x=>x!==bank[1].answer)).correct,false);round.next();round.answer(bank[2].answer);round.next();assert(round.done);assert.equal(round.score,2);assert.equal(round.wrong.length,1);
assert.equal(core.session(round.wrong,true).answer(round.wrong[0].answer).review,true);
for(const field of ['question','explanation','reflection','category']){const bad=structuredClone(raw);delete bad.questions[0][field];assert.throws(()=>core.validate(bad));}
const bad=structuredClone(raw);bad.questions[0].answer='other';assert.throws(()=>core.validate(bad));
const duplicate=structuredClone(raw);duplicate.questions.push(duplicate.questions[0]);assert.throws(()=>core.validate(duplicate));
for(const p of ['english-thinking.html','shared/shino-thinking.js','shared/shino-thinking.css','data/shino-thinking.json'])assert(!read(p).includes('\uFF0D\uFF0D'),p);
assert(read('index.html').includes('href="english-thinking.html"'));assert(read('english-thinking.html').includes('/shinotan?practice=article'));assert(read('shinotan.html').includes('/english-thinking'));
// Execute the existing daily tracker with the added answer hook, checking one award and review exclusion.
const html=read('shinotan.html'),tracker=html.match(/<body[^>]*><script>([\s\S]*?)<\/script>/)[1];
const now=new Date();now.setHours(now.getHours()-6);const day=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
const store=new Map([['sushitan_daily_active_v1',JSON.stringify({day,active:['shino','sushitan','quiz','talk']})]]),listeners={};
const node={style:{},remove(){}};const w={addEventListener(n,fn){listeners[n]=fn},dispatchEvent(){}};
vm.runInNewContext(tracker,{window:w,document:{addEventListener(){},getElementById(){return node},createElement(){return node},body:{appendChild(){}}},localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},CustomEvent:class{},Date,setTimeout(){},clearTimeout(){}});
const hit=listeners['sushi-shino-thinking-correct'];hit({detail:{id:'one'}});hit({detail:{id:'one'}});assert.equal(JSON.parse(store.get('sushitan_login_bonus_v1')).dailyQuests.progress.shino,1);
for(let i=0;i<30;i++)hit({detail:{id:'q'+i}});const saved=JSON.parse(store.get('sushitan_login_bonus_v1'));assert.equal(saved.dailyQuests.progress.shino,20);assert.equal(saved.gems,10);
assert(read('shared/shino-thinking.js').includes('if(correct&&!review)'));assert(!read('shared/shino-thinking.js').includes('localStorage'));assert(!read('shared/shino-thinking.js').includes('SushiScores.save'));
console.log('PASS: '+bank.length+' pairs, state transitions, duplicate answers, review, data validation, navigation, daily deduplication and one-time reward');
