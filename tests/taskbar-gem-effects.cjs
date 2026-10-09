const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
// The ready button pulses forever; click its real hit area without waiting for
// the animation to become stable or bypassing hit testing with force:true.
async function clickClaim(page){const button=page.locator('.sdq-claim').first();let r;for(let attempt=0;attempt<5&&!r;attempt++){await button.waitFor({state:'visible'});await button.evaluate(el=>el.scrollIntoView({block:'nearest'}));r=await button.boundingBox();}assert(r);await page.mouse.click(r.x+r.width/2,r.y+r.height/2);}
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
      await page.waitForFunction(()=>window.__sushiSiteLayoutLoaded);
      if(mode!=='delayed-effects')await page.waitForFunction(()=>window.SushiGemFx);
      assert.equal(await page.evaluate(()=>!!window.SushiGem),mode==='with-gem-api');
      if(mode==='with-gem-api')await page.waitForFunction(()=>window.__sushiDailyQuestLinksLoaded);
      await page.evaluate(()=>{window.rewardEvents=[];addEventListener('sushi-gems-earned',e=>rewardEvents.push(e.detail));SushiDailyQuest.state().active.forEach(key=>SushiDailyQuest.set(key,100000));});
      await page.locator('#sushiDailyTab').click();
      assert(await page.evaluate(()=>{const bar=document.getElementById('sushiTaskbar'),r=document.getElementById('sushiBarGems').getBoundingClientRect();return bar.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2));}),'daily destination visible before claim');
      if(width===390&&mode==='with-gem-api')await page.locator('.sdq-claim').first().press('Enter');
      else await clickClaim(page);
      assert.equal(await page.locator('#sushiBarGems').textContent(),'10');
      if(mode==='delayed-effects'){
        await page.waitForFunction(()=>window.__sushiGemFxLoading);
        assert(heldRequest,'effects request must be in flight');
        await heldRequest.continue();await page.waitForFunction(()=>window.SushiGemFx);
      }
      await page.waitForFunction(()=>document.querySelectorAll('.sgf-flight').length>0);
      assert(page.url().endsWith('/'+(mode==='with-gem-api'?mode:'taskbar-only')),'reward click must not follow the game link');
      assert.equal(await page.locator('script[src*="gem-effects.js"]').count(),1);
      assert(await page.evaluate(()=>Number(getComputedStyle(document.getElementById('sushiTaskbar')).zIndex)>Number(getComputedStyle(document.getElementById('sushiDailySheet')).zIndex)));
      for(let i=0;i<3;i++)await clickClaim(page);
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
    for(const size of [{width:1200,height:900},{width:390,height:844},{width:320,height:568},{width:844,height:390}])for(const reducedMotion of ['no-preference','reduce']){
      const context=await browser.newContext({viewport:size,serviceWorkers:'block',reducedMotion,isMobile:size.width<600,hasTouch:size.width<600});
      await context.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
      const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(origin+'/with-gem-api',{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>window.SushiAchievements&&window.SushiGemFx&&window.__sushiSiteLayoutLoaded);
      // Use the real UI and a delayed mock receipt; never contact a live account.
      await page.evaluate(()=>{
        localStorage.setItem('sushitan_sync_id_v1','testuser');
        localStorage.setItem('sushitan_sync_pin_v1','1234');
        localStorage.setItem('sushitan_achievement_progress_v1',JSON.stringify({total:10}));
        window.claimCalls=0;window.earned=[];
        addEventListener('sushi-gems-earned',e=>earned.push(e.detail));
        window.SushiAchievementSyncBridge={claim:()=>{claimCalls++;return new Promise(resolve=>{window.resolveClaim=()=>{const key='sushitan_login_bonus_v1',l=JSON.parse(localStorage.getItem(key)||'{}');l.gems=(l.gems||0)+10;localStorage.setItem(key,JSON.stringify(l));resolve({gems:10,already_claimed:false});};});}};
      });
      await page.locator('#sushiAchievementOpen').click();
      const visibleDestination=()=>page.evaluate(()=>{const bar=document.getElementById('sushiTaskbar'),r=document.getElementById('sushiBarGems').getBoundingClientRect();return bar.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2));});
      assert(await visibleDestination(),'achievement destination visible before claim');
      const button=page.locator('#sushiAchievementList button').first();await button.scrollIntoViewIfNeeded();
      const r=await button.boundingBox();assert(r&&r.y>=0&&r.y+r.height<=size.height,'claim fits viewport');
      await button.click();await page.waitForFunction(()=>window.claimCalls===1);
      await page.waitForTimeout(1300);await page.mouse.move(5,5);await page.evaluate(()=>resolveClaim());
      await page.waitForFunction(()=>earned.length===1);
      const detail=await page.evaluate(()=>earned[0]);assert.equal(detail.source,'achievement');
      assert(Math.abs(detail.origin.x-(r.x+r.width/2))<1&&Math.abs(detail.origin.y-(r.y+r.height/2))<1,'origin survives async refresh');
      assert.equal(await page.locator('#sushiBarGems').textContent(),'10');assert(await visibleDestination());
      if(reducedMotion==='reduce'){
        assert.equal(await page.locator('.sgf-flight').count(),0);assert.match(await page.locator('#sushiGemFx').textContent(),/10/);
      }else{
        await page.waitForFunction(()=>document.querySelector('.sgf-flight'));
        const flight=await page.evaluate(()=>{const el=document.querySelector('.sgf-flight'),a=el.getAnimations()[0];a.pause();a.currentTime=400;const r=el.getBoundingClientRect();return {overPanel:document.elementsFromPoint(r.left+r.width/2,r.top+r.height/2).some(x=>x.id==='sushiAchievementPanel'||x.closest('#sushiAchievementPanel')),z:Number(getComputedStyle(el).zIndex),panelZ:Number(getComputedStyle(document.getElementById('sushiAchievementPanel')).zIndex)};});
        assert(flight.overPanel&&flight.z>flight.panelZ,'flight crosses panel above backdrop');
        await page.evaluate(()=>document.querySelectorAll('.sgf-flight').forEach(x=>x.getAnimations().forEach(a=>a.play())));
      }
      await page.waitForFunction(()=>!document.querySelector('.sgf-flight,.sgf-arrival,#sushiGemFx')&&!document.querySelector('#sushiTaskbar.sgf-receiving'));
      assert(await visibleDestination(),'destination stays visible after animation');
      assert(await page.evaluate(()=>{const p=document.querySelector('#sushiAchievementPanel section').getBoundingClientRect(),bar=document.getElementById('sushiTaskbar').getBoundingClientRect();return p.left>=0&&p.right<=innerWidth&&p.top>=0&&p.bottom<=bar.top;}),'dialog fits above taskbar');
      await page.locator('#sushiAchievementClose').scrollIntoViewIfNeeded();await page.locator('#sushiAchievementClose').click();
      assert.equal(await page.locator('#sushiAchievementPanel').count(),0);assert.deepEqual(errors,[]);
      await context.close();console.log(`PASS: ${size.width}x${size.height} ${reducedMotion}: delayed achievement claim, visible flight destination, dialog bounds, cleanup`);
    }
  }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
