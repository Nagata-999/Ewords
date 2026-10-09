const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/achievement-fixture'){
    res.setHeader('Content-Type','text/html;charset=utf-8');
    return res.end('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script src="/sushigacha/achievement-ledger.js"></script><script src="/sushigacha/achievement-events.js"></script><script src="/sushigacha/site-taskbar.js" defer></script></head><body><main><h1>すしたん実績</h1></main></body></html>');
  }
  const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);return res.end()}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.json')?'application/json':'text/html;charset=utf-8');res.end(data)});
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
  try{
    for(const width of [1200,390]){
      const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
      const errors=[];await context.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
      await context.addInitScript(()=>{if(!localStorage.getItem('sushitan_achievement_progress_v1'))localStorage.setItem('sushitan_achievement_progress_v1',JSON.stringify({total:15000,unlockedTotal:15000,selected:'yellow',selectionRevision:1,selectionDevice:'test'}))});
      const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
      await page.goto(origin+'/achievement-fixture');await page.waitForFunction(()=>window.SushiAchievements&&window.SushiProfileSync);
      await page.locator('#sushiAchievementOpen').click();
      assert.equal(await page.locator('#sushiTaskbar').getAttribute('data-sushi-rank'),'yellow');
      assert.equal(await page.locator('[data-rank="black"]').isDisabled(),true);
      assert.equal(await page.locator('[data-rank="blue"]').isDisabled(),false);
      await page.locator('[data-rank="white"]').click();
      assert.equal(await page.locator('#sushiTaskbar').getAttribute('data-sushi-rank'),'white');
      const catalog=await page.locator('#sushiAchievementList').innerText();assert.ok(catalog.includes('???'));assert.equal(catalog.includes('繰り返し間違えた問題'),false);
      assert.equal(await page.locator('#sushiAchievementList button:enabled').count(),0);
      const bounds=await page.locator('#sushiAchievementPanel section').boundingBox();assert(bounds.x>=0&&bounds.x+bounds.width<=width+1);
      const bar=await page.locator('#sushiTaskbar').boundingBox();assert(bounds.y+bounds.height<=bar.y+1);
      const output=process.env.ACHIEVEMENT_SCREENSHOT_DIR;if(output){fs.mkdirSync(output,{recursive:true});await page.screenshot({path:path.join(output,`achievement-${width}.png`)})}
      await page.reload();await page.waitForFunction(()=>window.SushiAchievements);assert.equal(await page.locator('#sushiTaskbar').getAttribute('data-sushi-rank'),'white');
      await page.goto(origin+'/toeic/index.html');await page.waitForFunction(()=>typeof pool!=='undefined'&&pool.length&&window.SushiAchievementEvents);
      const correctIndex=await page.evaluate(()=>pool[i].q[2]);await page.locator('#choices button').nth(correctIndex).click();
      assert.equal(await page.evaluate(()=>SushiAchievementLedger.summary().games.toeic),1);
      assert.equal(await page.evaluate(()=>SushiAchievementLedger.outcomeSummary().correct_streak),1);
      await page.locator('#next').click();const wrongIndex=await page.evaluate(()=>(pool[i].q[2]+1)%4);await page.locator('#choices button').nth(wrongIndex).click();
      assert.equal(await page.evaluate(()=>SushiAchievementLedger.summary().games.toeic),1);
      assert.equal(await page.evaluate(()=>SushiAchievementLedger.outcomeSummary().eventCount),2);
      assert.deepEqual(errors,[]);await context.close();
    }
    console.log('PASS: desktop/mobile panel fit, manual rank selection/reload, locked colors, secret masking, disconnected reward state, native TOEIC correct/wrong outcomes');
  }finally{await browser.close();server.close()}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
