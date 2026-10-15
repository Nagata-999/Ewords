const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');const root=path.join(__dirname,'..');const read=p=>fs.readFileSync(path.join(root,p),'utf8');
for(const file of ['index.html','sushian.html','sushitan.html','shinotan.html','antonitan.html'])for(const m of read(file).matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(!/type=["'](?:module|application\/)/i.test(m[1]))new vm.Script(m[2],{filename:file});}
new vm.Script(read('shared/shino-review.js'));
const master=JSON.parse(read('data/words_master_v2_reviewed.json'));for(const [word,syn]of [['consider','think about'],['increase','rise'],['attempt','try']])assert(master.some(w=>w.en===word&&w.synonyms.includes(syn)),word+' pair must be in real game');
for(const slug of ['first-20-words','recall-and-use','synonyms']){assert(read('sitemap.xml').includes(`/learning-guides/${slug}</loc>`));assert(read('index.html').includes(`/`)?read('index.html').includes(`learning-guides/${slug}.html`):false);assert(read(`learning-guides/${slug}.html`).includes('<details>'));}
for(const file of ['sushitan.html','shinotan.html','antonitan.html','sushian.html'])assert(!read(file).includes('pagead2.googlesyndication.com'));
assert(read('index.html').includes('google-adsense-account'));
let saved=null;const document={readyState:'loading',addEventListener(){},querySelectorAll(){return []}};
const context={window:{},document,localStorage:{getItem(){return saved},setItem(k,v){saved=v}}};vm.runInNewContext(read('shared/shino-review.js'),context);
context.window.SushiShinoReview.remember('consider','think about');context.window.SushiShinoReview.remember('consider','think about');assert.equal(JSON.parse(saved).length,1);
for(let i=0;i<105;i++)context.window.SushiShinoReview.remember('word'+i,'pair'+i);assert.equal(JSON.parse(saved).length,100);
context.localStorage.setItem=()=>{throw Error('storage unavailable')};assert.doesNotThrow(()=>context.window.SushiShinoReview.remember('attempt','try'));
console.log('PASS: game syntax, actual example pairs, guide navigation, ad exclusions, review deduplication/limit/storage failure');
