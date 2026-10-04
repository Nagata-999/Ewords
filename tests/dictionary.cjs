const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const entries=fs.readdirSync(path.join(root,'data/dictionary')).filter(p=>/^dictionary-.*\.json$/.test(p)).flatMap(p=>JSON.parse(read('data/dictionary/'+p)));
const slug=s=>Array.from(s.toLowerCase(),c=>/[a-z0-9-]/.test(c)?c:'~'+c.codePointAt(0).toString(16)+'~').join('');
const maps=fs.readdirSync(path.join(root,'dictionary')).filter(p=>/^sitemap-\d+\.xml$/.test(p)).map(p=>read('dictionary/'+p)).join('');
const urls=new Set([...maps.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]));
// The Python check validates all pages; these are JS consumer boundary samples.
for(const e of [entries[0],entries.at(-1),...entries.filter(e=>['follow','break','abandon'].includes(e.word))]){const url='https://sushitan.net/dictionary/'+slug(e.word)+'/',html=read('dictionary/'+slug(e.word)+'/index.html');assert(html.includes('href="'+url+'"'),e.word);assert(html.includes('property="og:url" content="'+url+'"'));assert(urls.has(url));assert(html.includes('name="description"'));const card=JSON.parse(html.match(/id="dictionary-card" type="application\/json">(.*?)<\/script>/s)[1]);assert.equal(card.en,e.word);assert(card.jp);const structured=JSON.parse(html.match(/type="application\/ld\+json">(.*?)<\/script>/s)[1]);assert.equal(structured.name,e.word);for(const m of html.matchAll(/href="(\/dictionary\/[^"?]+)"/g)){assert(fs.existsSync(path.join(root,m[1],'index.html')),m[1]);}}
assert.equal(JSON.parse(read('dictionary/search-index.json')).length,entries.length);
assert(read('robots.txt').includes('Sitemap: https://sushitan.net/dictionary/sitemap.xml'));
assert(read('404.html').includes('noindex,follow'));
function boot(store){const ctx={console,Date,Math,CustomEvent:class{},dispatchEvent(){},addEventListener(){},localStorage:{get length(){return store.size},key:i=>[...store.keys()][i],getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)}};ctx.window=ctx;vm.createContext(ctx);for(const p of ['word-registry.js','learning.js'])vm.runInContext(read('shared/'+p),ctx);return ctx.SushiLearning;}
const store=new Map(),a=boot(store),card={word_id:'dictionary:sw-11531',en:'aardvark',jp:'ツチブタ'};
assert.equal(a.registerDictionaryWord(card),card.word_id);assert.equal(a.getStats().weak,0);assert.equal(a.getWeakWords().length,0); // Opening a study card is not a wrong answer.
a.recordAnswer(card.word_id,false,'sushian');assert.equal(a.getWeakWords()[0].en,card.en);
const b=boot(store);assert.equal(b.resolveWordId(card.en),card.word_id);assert.equal(b.getWordProgress(card.word_id).wrong_count,1);
b.recordAnswer(card.word_id,true,'sushian');assert.equal(boot(store).getWordProgress(card.word_id).correct_count,1);
assert.equal(b.registerDictionaryWord({...card,word_id:'dictionary:sw-99999',en:'follow'}),'sushian:0001');
assert.equal(b.registerDictionaryWord({...card,word_id:'bad'}),null);
console.log('PASS dictionary: metadata samples, search index count, durable study cards, no fabricated mistakes, persistence and existing IDs');
