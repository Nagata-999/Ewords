const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),http=require('node:http');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
for(const name of ['sushitan.html','sushian.html','index.html'])for(const m of read(name).matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!/type=["'](?:module|application\/)/.test(m[1]))new vm.Script(m[2]);
const ctx={window:{}};vm.runInNewContext(read('shared/word-notes.js'),ctx);const notes=ctx.window.SushiWordNotes;
assert.equal(notes.entries().length,2000);assert.equal(notes.get(' AVAILABLE ').word,'available');assert.equal(notes.get('missing'),null);assert(!notes.html('<img src=x>').includes('<img'));
assert.equal(notes.get(' muslim ').word,'Muslim');assert.equal(notes.get('ＭＵＳＬＩＭ').word,'Muslim');assert.equal(notes.get(' per capita ').word,'per capita');
const vocab=JSON.parse(read('sushian.html').match(/const VOCAB=(\[[^\n]+\]);/)[1]);
const entries=Array.from(notes.entries());
assert.equal(new Set(entries.map(e=>e.word.toLowerCase())).size,2000);
assert.deepEqual(entries.map(e=>e.word),vocab.slice(0,2000).map(e=>e.word),'lesson numbers must match the game');
for(const e of entries)for(const key of ['example','translation','note'])assert(e[key]?.trim(),e.word+' '+key);
require('node:child_process').execFileSync(process.execPath,[path.join(root,'scripts/build-word-notes.cjs'),'--check']);
const source=read('sushitan.html');
const renderer=source.slice(source.indexOf('    function renderMistakeList()'),source.indexOf('    function createBurstEffect'));
const box={innerHTML:''},c={GAME:{mistakes:[{prompt:'利用できる',correct:'available',picked:'possible',noteWord:'available'}]},mistakeList:{classList:{remove(){}}},mistakeListBody:box,window:{SushiWordNotes:notes},currentMode:'core',MODE_SUSHI:'core',escapeHtml:s=>s};
vm.runInNewContext(renderer+';renderMistakeList();',c);assert(box.innerHTML.includes('This room is available tomorrow.'));assert(box.innerHTML.includes('sushian.html?review=weak'));
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const server=http.createServer((req,res)=>{const file=path.join(root,new URL(req.url,'http://local').pathname);if(!file.startsWith(root)||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined});try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**',r=>r.abort());
 await page.goto('http://127.0.0.1:'+server.address().port+'/sushian.html');await page.locator('#rangeEnd').fill('1');await page.locator('#startQuiz').click();await page.locator('#unknownBtn').click();
 await page.locator('#feedback .word-note > summary').click();assert(await page.locator('#feedback').innerText().then(s=>s.includes('Follow the instructions carefully.')));
 const before=await page.evaluate(()=>SushiLearning.getWordProgress('follow'));assert.equal(before.wrong_count,1);
 await page.locator('#feedback .word-note details summary').click();const after=await page.evaluate(()=>SushiLearning.getWordProgress('follow'));assert.deepEqual(after,before);
 await page.locator('#nextBtn').click();assert.equal(await page.locator('#unknownScore').innerText(),'1');await page.locator('#resultWeakBtn').click();await page.locator('#reviewWeak').click();assert.equal(await page.locator('#promptWord').innerText(),'follow');
 await page.locator('.choice').filter({hasText:'～の後に続く、～に従う'}).click();assert.equal((await page.evaluate(()=>SushiLearning.getWordProgress('follow'))).correct_count,1);
 const boundaries=[...new Set([101,259,330,1341,1679,1740,1870,1900,...Array.from({length:20},(_,i)=>i*100+1),...Array.from({length:20},(_,i)=>(i+1)*100)])];
 for(const number of boundaries){
  await page.goto('http://127.0.0.1:'+server.address().port+'/sushian.html');await page.locator('#rangeStart').fill(String(number));await page.locator('#rangeEnd').fill(String(number));await page.locator('#startQuiz').click();await page.locator('#unknownBtn').click();await page.locator('#feedback .word-note > summary').click();
  assert((await page.locator('#feedback').innerText()).includes(notes.get(vocab[number-1].word).example));
 }
 await page.goto('http://127.0.0.1:'+server.address().port+'/word-notes.html');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.getByRole('link',{name:'1〜100番：follow 〜 associate',exact:true}).click();assert.equal(await page.locator('article').count(),100);
 await page.getByRole('link',{name:'81〜100番',exact:true}).click();assert.equal(await page.locator('#range-81').innerText(),'81〜100番');
 await page.getByRole('link',{name:'associate',exact:true}).click();assert.equal(await page.locator('#associate h3').innerText(),'100. associate');
 for(let start=1;start<=2000;start+=100){
  const file=String(start).padStart(4,'0')+'-'+String(start+99).padStart(4,'0')+'.html';
  await page.goto('http://127.0.0.1:'+server.address().port+'/word-notes/'+file);
  assert.equal(await page.locator('article').count(),100);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(await page.locator('article h3').allTextContents(),vocab.slice(start-1,start+99).map(w=>w.id+'. '+w.word));
  for(const href of await page.locator('a[href]').evaluateAll(a=>a.map(e=>e.getAttribute('href')))){
   const url=new URL(href,'http://local/word-notes/'+file),relative=decodeURIComponent(url.pathname).slice(1);
   // Informational footer pages are unchanged repository files, outside this test fixture.
   if(['contact.html','about.html','privacy.html'].includes(relative))continue;
   assert(fs.existsSync(path.join(root,relative)),relative);
   if(url.hash)assert(read(relative).includes('id="'+url.hash.slice(1)+'"'),url.href);
  }
 }
 assert.deepEqual(errors,[]);
 if(process.env.SCREENSHOT_PATH)await page.screenshot({path:process.env.SCREENSHOT_PATH});console.log('PASS: 2000 notes, normalized lookup, source numbering, generated lesson parity, scripts, fallback/XSS, result renderer, review flow, boundary words, 20 mobile pages and internal links');
 }finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
