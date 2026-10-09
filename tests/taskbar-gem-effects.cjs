const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/taskbar-only'||url.pathname==='/with-gem-api'){
    res.setHeader('Content-Type','text/html; charset=utf-8');
    return res.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><script defer src="/sushigacha/site-taskbar.js"></script>${url.pathname==='/with-gem-api'?'<script defer src="/sushigacha/gem-system.js"></script>':''}</head><body><h1>共通タスクバーの報酬受け取り</h1></body></html>`);
  }
  const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':'text/html');res.end(data);});
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const origin='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
  try{
    for(const width of [1200,390])for(const mode of ['taskbar-only','with-gem-api','delayed-effects']){
      const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block',reducedMotion:'no-preference'});
      let heldRequest;await context.route('**/*',route=>{
        if(!route.request().url().startsWith(origin))return route.abort();
        if(mode==='delayed-effects'&&route.request().url().includes('/gem-effects.js')){heldRequest=route;return;}
        return route.continue();
      });
      const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(origin+'/'+(mode==='with-gem-api'?mode:'taskbar-only'),{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>window.SushiDailyQuest);
      if(mode!=='delayed-effects')await page.waitForFunction(()=>window.SushiGemFx);
      assert.equal(await page.evaluate(()=>!!window.SushiGem),mode==='with-gem-api');
      await page.evaluate(()=>{window.rewardEvents=[];addEventListener('sushi-gems-earned',e=>rewardEvents.push(e.detail));SushiDailyQuest.state().active.forEach(key=>SushiDailyQuest.set(key,100000));});
      await page.locator('#sushiDailyTab').click();
      await page.locator('.sdq-claim').first().click({force:true});
      assert.equal(await page.locator('#sushiBarGems').textContent(),'10');
      if(mode==='delayed-effects'){
        await page.waitForFunction(()=>window.__sushiGemFxLoading);
        assert(heldRequest,'effects request must be in flight');
        await heldRequest.continue();await page.waitForFunction(()=>window.SushiGemFx);
      }
      await page.waitForFunction(()=>document.querySelectorAll('.sgf-flight').length>0);
      assert.equal(await page.locator('script[src*="gem-effects.js"]').count(),1);
      assert(await page.evaluate(()=>Number(getComputedStyle(document.getElementById('sushiTaskbar')).zIndex)>Number(getComputedStyle(document.getElementById('sushiDailySheet')).zIndex)));
      for(let i=0;i<3;i++)await page.locator('.sdq-claim').first().click({force:true});
      await page.locator('#sdqChest').click();
      assert.equal(await page.locator('#sushiBarGems').textContent(),'90');
      assert(await page.locator('#sdqChest').isDisabled());
      assert.equal(await page.locator('.sdq-claim').count(),0);
      assert.equal(await page.evaluate(()=>rewardEvents.length),5);
      assert.equal(await page.evaluate(()=>rewardEvents.reduce((sum,e)=>sum+e.gems,0)),90);
      await page.waitForFunction(()=>!document.querySelector('.sgf-flight,.sgf-arrival')&&!document.querySelector('#sushiTaskbar.sgf-receiving'));
      assert.deepEqual(errors,[]);
      await context.close();console.log(`PASS: ${width}px ${mode}: claim buttons, 4 rewards + completion, visible destination, one effect loader, cleanup`);
    }
  }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
