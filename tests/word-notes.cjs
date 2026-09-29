const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),http=require('node:http');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
for(const name of ['sushitan.html','sushian.html','index.html'])for(const m of read(name).matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!/type=["'](?:module|application\/)/.test(m[1]))new vm.Script(m[2]);
const ctx={window:{}};vm.runInNewContext(read('shared/word-notes.js'),ctx);const notes=ctx.window.SushiWordNotes;
assert.equal(notes.entries().length,21);assert.equal(notes.get(' AVAILABLE ').word,'available');assert.equal(notes.get('missing'),null);assert(!notes.html('<img src=x>').includes('<img'));
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
 await page.goto('http://127.0.0.1:'+server.address().port+'/word-notes.html');assert.equal(await page.locator('article').count(),21);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
 if(process.env.SCREENSHOT_PATH)await page.screenshot({path:process.env.SCREENSHOT_PATH});console.log('PASS: scripts, 21 notes, fallback/XSS, result renderer, unknown → notes → review → correct, no extra learning writes, mobile layout');
 }finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

