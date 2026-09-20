const fs=require('fs'),http=require('http'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const hooks=`window.__crossTest={begin,end,clearStage,stats:()=>({score,answerCount,correctCount,maxCombo,stage}),answer(correct){const lane=laneFor(7);startQuiz(lane);lane.quiz.answered=false;player.row=7;player.x=lane.quiz.choices.find(x=>x.correct===correct).x;answerCheck();answerCheck();}};`;
const server=http.createServer((req,res)=>{const file=req.url.split('?')[0]==='/sushicross-ranking.js'?'sushicross-ranking.js':'sushicross.html';let data=fs.readFileSync(path.join(__dirname,'..',file),'utf8');if(file.endsWith('.html'))data=data.replace('})();',hooks+'})();');res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':'text/html');res.end(data);});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined});
 const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let fail=false,failRead=false,calls=[],reads=0;const records=new Map();
 await page.route('https://rxyoyveykxdfrpomkltl.supabase.co/**',async route=>{
  const req=route.request();assert(req.headers().apikey.startsWith('sb_publishable_'));
  if(req.method()==='POST'){
   assert(req.url().endsWith('/rpc/save_high_score'));const body=req.postDataJSON();calls.push(body);assert.equal(body.p_mode,'sushi_cross');
   if(fail)return route.fulfill({status:503,body:'{}'});
   const old=records.get(body.p_player_name);if(!old||body.p_score>old.score)records.set(body.p_player_name,{player_name:body.p_player_name,score:body.p_score,accuracy:body.p_accuracy,max_combo:body.p_max_combo});
   return route.fulfill({status:204});
  }
  reads++;assert(req.url().includes('mode=eq.sushi_cross'));
  return route.fulfill({status:failRead?503:200,contentType:'application/json',body:JSON.stringify([...records.values(),{player_name:'<img src=x onerror=alert(1)>',score:1,accuracy:0}])});
 });
 await page.goto(origin+'/sushicross.html');assert.equal(await page.locator('#crossSaveForm').isVisible(),false);
 await page.locator('#crossShowRanking').click();await page.waitForFunction(()=>document.querySelector('#crossRankingRows').children.length===1);
 assert.equal(await page.locator('#crossRankingRows img').count(),0);await page.locator('#crossCloseRanking').click();
 await page.locator('#start').click();await page.evaluate(()=>{__crossTest.answer(true);__crossTest.answer(false);__crossTest.clearStage();});
 assert.deepEqual(await page.evaluate(()=>__crossTest.stats()),{score:5,answerCount:2,correctCount:1,maxCombo:1,stage:1});
 await page.locator('#crossSave').click();assert.equal(calls.length,0);
 await page.locator('#crossPlayerName').pressSequentially('wasd');assert.equal(await page.locator('#crossPlayerName').inputValue(),'wasd');
 fail=true;await page.locator('#crossSave').click();await page.waitForFunction(()=>document.querySelector('#crossSaveStatus').textContent.includes('保存できません'));
 assert(await page.locator('#crossSave').isEnabled());fail=false;
 await page.locator('#crossSave').click();await page.waitForFunction(()=>document.querySelector('#crossSaveStatus').textContent.includes('送信しました'));
 assert.equal(calls.length,2);assert.equal(calls[1].p_score,5);assert.equal(calls[1].p_accuracy,50);assert.equal(calls[1].p_max_combo,1);
 assert.equal(await page.locator('#crossSave').isDisabled(),true);
 await page.locator('#start').click();assert.equal((await page.evaluate(()=>__crossTest.stats())).stage,2);assert.equal(await page.locator('#crossSaveForm').isVisible(),false);
 await page.evaluate(()=>{__crossTest.answer(true);__crossTest.end('test');});await page.locator('#crossSave').click();await page.waitForFunction(()=>document.querySelector('#crossSaveStatus').textContent.includes('送信しました'));
 assert.equal(calls[2].p_score,10);assert.equal(calls[2].p_accuracy,67);
 await page.locator('#crossShowRanking').click();await page.waitForFunction(()=>document.querySelector('#crossRankingRows').children.length===2);
 if(process.env.SCREENSHOT_PATH)await page.screenshot({path:process.env.SCREENSHOT_PATH});
 failRead=true;await page.locator('#crossReloadRanking').click();await page.waitForFunction(()=>document.querySelector('#crossRankingStatus').textContent.includes('取得できません'));
 failRead=false;await page.locator('#crossReloadRanking').click();await page.waitForFunction(()=>document.querySelector('#crossRankingRows').children.length===2);
 await page.locator('#crossCloseRanking').click();await page.locator('#start').click();assert.equal((await page.evaluate(()=>__crossTest.stats())).answerCount,0);
 await page.evaluate(()=>__crossTest.end('zero'));await page.waitForTimeout(1000);assert(await page.locator('#crossSave').isDisabled());
 assert.equal(errors.length,0,errors.join('\n'));assert(reads>=4);
 console.log('PASS: title/result rankings, scoring/accuracy, stage continuation, restart reset, keyboard names, duplicate prevention, save/read retries, mode isolation, XSS-safe rows, zero score, mobile layout');
 await browser.close();server.close();
})().catch(e=>{console.error(e);server.close();process.exit(1);});
