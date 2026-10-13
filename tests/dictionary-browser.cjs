const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.join(__dirname,'..');
const server=http.createServer((req,res)=>{let file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');if(!fs.existsSync(file)){res.statusCode=404;file=path.join(root,'404.html');}res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'application/javascript','.json':'application/json','.css':'text/css'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
(async()=>{let browser;try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined});const context=await browser.newContext({viewport:{width:390,height:844}});
 await context.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());
 const page=await context.newPage();page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const pilotFile=path.join(root,'data/dictionary/new-entry-manifest.json');
 if(fs.existsSync(pilotFile)){
  const pilot=JSON.parse(fs.readFileSync(pilotFile,'utf8'));
  const entries=fs.readdirSync(path.join(root,'data/dictionary')).filter(f=>/^dictionary-.*\.json$/.test(f)).flatMap(f=>JSON.parse(fs.readFileSync(path.join(root,'data/dictionary',f),'utf8')));
  for(const width of [320,390,1280]){
   await page.setViewportSize({width,height:844});
   for(const record of pilot.entries){
    const e=entries.find(e=>e.id===record.id);
    await page.goto(origin+'/dictionary/');await page.locator('#dictionary-query').fill(e.word);await page.locator('#dictionary-query').press('Enter');await page.waitForURL('**/dictionary/'+e.word+'/');
    const body=await page.locator('article').innerText();
    for(const part of e.parts_of_speech)for(const meaning of part.meanings){assert(body.includes(meaning.ja),e.word);assert(body.includes(meaning.definition),e.word);for(const ex of meaning.examples){assert(body.includes(ex.en),e.word);assert(body.includes(ex.ja),e.word);}}
    for(const c of e.collocations)assert(body.includes(c.text||c.en||c.phrase||c),e.word);
    assert(body.includes(e.usage_note));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),e.word+' overflow');
    assert.equal(await page.locator('#dictionary-card').evaluate(el=>JSON.parse(el.textContent).word_id),'dictionary:'+e.id);
    if(process.env.PILOT_SCREENSHOT&&width===390&&e.word==='debrief')await page.screenshot({path:process.env.PILOT_SCREENSHOT,fullPage:true});
   }
  }
  console.log('PASS pilot: all 30 entries searched and displayed with definitions, bilingual examples, collocations, usage and IDs at 320/390/1280px');
  await page.setViewportSize({width:390,height:844});
 }
 await page.goto(origin+'/dictionary/');await page.locator('#dictionary-query').fill('environ');await page.locator('#search-results a', {hasText:'environment'}).first().waitFor();
 await page.locator('#dictionary-query').fill('abandon');await page.locator('#dictionary-query').press('Enter');await page.waitForURL('**/dictionary/abandon/');await page.reload();assert.equal(await page.locator('h1').textContent(),'abandon');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.goto(origin+'/dictionary/break/');const related=page.locator('article a[href^="/dictionary/"]');assert(await related.count());await related.first().click();await page.locator('h1').waitFor();
 await page.goto(origin+'/dictionary/aardvark/');await page.locator('.learn').click();await page.locator('#promptWord').filter({hasText:'aardvark'}).waitFor();
 assert.equal(await page.evaluate(()=>SushiLearning.getWeakWords().length),0);
 await page.locator('#unknownBtn').click();assert.equal(await page.evaluate(()=>SushiLearning.getWordProgress('aardvark').wrong_count),1);
 await page.reload();await page.locator('#promptWord').filter({hasText:'aardvark'}).waitFor();assert.equal(await page.evaluate(()=>SushiLearning.getWordProgress('aardvark').wrong_count),1);
 await page.locator('.choice[data-meaning="ツチブタ"]').click();await page.locator('#nextBtn').click();await page.locator('#retryBtn').click();assert.equal(await page.locator('#promptWord').textContent(),'aardvark');
 await page.goto(origin+'/sushian.html?review=weak');await page.locator('#promptWord').filter({hasText:'aardvark'}).waitFor();
 await page.goto(origin+'/dictionary/follow/');await page.locator('.learn').click();await page.locator('#promptWord').filter({hasText:'follow'}).waitFor();assert.equal(await page.evaluate(()=>SushiLearning.resolveWordId('follow')),'sushian:0001');
 const response=await page.goto(origin+'/dictionary/abndon/');assert.equal(response.status(),404);assert((await page.locator('h1').textContent()).includes('まだすし辞書'));await page.locator('#search-results a',{hasText:'abandon'}).first().waitFor();
 await page.goto(origin+'/dictionary/environment/');await page.screenshot({path:process.env.DICTIONARY_SCREENSHOT||path.join(root,'dictionary-mobile.png'),fullPage:true});
 await page.setViewportSize({width:320,height:700});await page.goto(origin+'/dictionary/');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);
 const noJS=await browser.newContext({javaScriptEnabled:false});const plain=await noJS.newPage();await plain.goto(origin+'/dictionary/significant/');assert.equal(await plain.locator('h1').textContent(),'significant');assert(await plain.locator('.meaning').count());
 console.log('PASS browser: search, exact navigation, reload, 390px layout, related links, dictionary and existing study IDs, persistence, retry, weak review, true 404 and spelling suggestions, no-JS content');
}finally{await browser?.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
