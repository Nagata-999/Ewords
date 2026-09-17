const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root=path.join(__dirname,'..');
const server=http.createServer((req,res)=>{let file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(data);});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH || undefined});const context=await browser.newContext();context.setDefaultTimeout(15000);const page=await context.newPage();const errors=[];
 let knownAvatarErrors=0;page.on('pageerror',e=>errors.push(e.message));
 await context.addInitScript(()=>{window.addEventListener('error',e=>console.log('ERROR_LOCATION',e.message,e.filename,e.lineno,e.colno));});
 page.on('console',m=>{if(m.text().startsWith('ERROR_LOCATION')){console.log(m.text());if(m.text().includes('/sushigacha/avatar-modern.js')&&m.text().includes("Unexpected token 'function'"))knownAvatarErrors++;}});
 // External services are stubbed: these tests cannot submit scores/rewards to production.
 await context.route('**/*',async route=>{const url=route.request().url();if(url.startsWith(origin))return route.continue();if(url.includes('supabase-js'))return route.fulfill({contentType:'application/javascript',body:`window.supabase={createClient:()=>({rpc:async()=>({data:[],error:null}),from:()=>{const q=new Proxy({then:r=>Promise.resolve({data:[],error:null}).then(r)},{get:(t,k)=>k==='then'?t.then:()=>q});return q;}})};`});return route.abort();});
 await page.goto(origin+'/sushitan.html');await page.waitForFunction(()=>window.SushiLearning && typeof GAME!=='undefined');
 const result=await page.evaluate(async()=>{
  await WORD_DATA_READY;await startGame(MODE_SUSHI);const w=GAME.currentQuestion;
  const wrong=document.querySelector('.balloon[data-type="wrong"]')||[...document.querySelectorAll('.balloon')].find(b=>b.dataset.type!=='correct');
  handleTap(wrong);handleTap(document.querySelector('.balloon[data-type="correct"]'));
  const p=SushiLearning.getWordProgress(w);backToMenu();
  await startGame(MODE_SUSHI,'all',true);
  const pool=availableReviewWords();handleTap(document.querySelector('.balloon[data-type="correct"]'));
  return {p,pool:pool.length,after:SushiLearning.getWordProgress(w),score:GAME.score,review:GAME.reviewMode};
 });
 assert.equal(result.p.wrong_count,1);assert.equal(result.p.correct_count,0);assert.equal(result.pool,1);assert.equal(result.after.correct_count,1);assert.equal(result.score,0);assert.equal(result.review,true);
 console.log('PASS browser Phase 2: normal wrong answer, corrected guess not mastery, one-word review, shared answer, score unchanged');
 if(process.argv.includes('run')){
  await page.goto(origin+'/sushi_run.html?review=weak');
  const run=await page.evaluate(()=>{startGame();const asked=learningQuestion.en;const next=currentWord.en;const correct=activeChoices.find(o=>o.correct);const n=activeChoices.length;success(correct);const p=SushiLearning.getWordProgress(asked);gameRunning=false;cancelAnimationFrame(animationFrame);return {asked,next,n,p,active:SushiReview.active};});
  assert.equal(run.n,3);assert.equal(run.active,true);assert.equal(run.p.games.run.correct_count,1);
  await page.evaluate(()=>{SushiLearning.recordAnswer('follow',false,'sushian');});
  await page.goto(origin+'/sushi_run.html');
  const normal=await page.evaluate(()=>{startGame();const asked=learningQuestion.en;fail(activeChoices.find(o=>!o.correct));gameRunning=false;cancelAnimationFrame(animationFrame);return {p:SushiLearning.getWordProgress(asked),active:SushiReview.active};});
  assert.equal(normal.active,false);assert.equal(normal.p.games.run.wrong_count,1);
  console.log('PASS browser RUN: one-word pool retains 3 lanes; active question recorded; normal/review modes');
 }
 if(process.argv.includes('sushian')){
  await page.goto(origin+'/sushian.html?review=weak');
  const word=await page.locator('#promptWord').textContent();await page.locator('#unknownBtn').click();
  const p=await page.evaluate(w=>SushiLearning.getWordProgress(w),word);assert.equal(p.games.sushian.wrong_count,1);
  await page.reload();assert.equal(await page.locator('#promptWord').textContent(),word);
  const meaning=await page.evaluate(w=>SushiLearning.getWord(w).jp,word);
  await page.locator('.choice').filter({hasText:meaning}).first().click();
  const q=await page.evaluate(w=>SushiLearning.getWordProgress(w),word);assert.equal(q.games.sushian.correct_count,1);
  await page.goto(origin+'/sushian.html');await page.locator('#startQuiz').click();await page.locator('#unknownBtn').click();
  console.log('PASS browser sushian: cross-game review, reload, wrong/unknown and correct, ordinary range mode');
 }
 if(process.argv.includes('flow')){
  for(const file of ['sushiflow.html','SushiFlow.html']){
   await page.goto(origin+'/'+file+'?review=weak');await page.locator('#startBtn').click();
   await page.waitForFunction(()=>typeof assessmentWord!=='undefined'&&assessmentWord);
   const info=await page.evaluate(()=>({word:assessmentWord.english,p:SushiLearning.getWordProgress(assessmentWord)}));
   await page.locator('#flowAssessment button').first().click();
   const p=await page.evaluate(w=>SushiLearning.getWordProgress(w),info.word);assert.equal(p.correct_count,info.p.correct_count+1);
   assert.equal(await page.locator('#flowAssessment button:disabled').count(),2);
   await page.locator('#exitBtn').click();
  }
  await page.goto(origin+'/sushiflow.html');await page.locator('#startBtn').click();await page.waitForFunction(()=>assessmentWord);
  const ordinary=await page.evaluate(()=>assessmentWord.english);await page.locator('#flowAssessment button').last().click();
  assert.equal((await page.evaluate(w=>SushiLearning.getWordProgress(w),ordinary)).games.flow.wrong_count,1);
  console.log('PASS browser flow: both aliases, cross-game review, explicit self-assessment only, once/card, normal mode');
 }
 if(process.argv.includes('giri')){
  await page.goto(origin+'/sushigiri.html?review=weak');await page.locator('#startBtn').click();await page.waitForFunction(()=>running);
  const first=await page.evaluate(()=>({word:current,p:SushiLearning.getWordProgress(current)}));
  await page.keyboard.press('1');await page.keyboard.press('1');
  const bad=await page.evaluate(()=>SushiLearning.getWordProgress(current));assert.equal(bad.wrong_count,first.p.wrong_count+1);
  await page.keyboard.type(first.word);
  assert.equal((await page.evaluate(w=>SushiLearning.getWordProgress(w),first.word)).correct_count,first.p.correct_count);
  await page.waitForTimeout(250);
  const second=await page.evaluate(()=>({word:current,p:SushiLearning.getWordProgress(current)}));await page.keyboard.type(second.word);
  assert.equal((await page.evaluate(w=>SushiLearning.getWordProgress(w),second.word)).games.sushigiri.correct_count,1);
  const transition=await page.evaluate(()=>{
   // Force the actual fever/critical timing: next word at 70ms, hit-stop ends at 72ms.
   running=true;time=30;newWord();feverMode=true;enemyLife=0;
   SushiLearning.recordAnswer('available',false,'sushigiri');current='available';jp=SushiLearning.getWord(current).jp;
   const word=current,before=SushiLearning.getWordProgress(word),beforeCritical=criticals;pos=current.length;
   hitComplete();const after=SushiLearning.getWordProgress(word);
   enemyAttack();const late=SushiLearning.getWordProgress(word);
   // A pending spawn must work while hit-stop has running=false.
   running=false;newWord();
   return {before,after,late,pos,answered:learningAnswered,critical:criticals-beforeCritical};
  });
  assert.equal(transition.after.correct_count,transition.before.correct_count+1);
  assert.equal(transition.late.wrong_count,transition.after.wrong_count);
  assert.equal(transition.pos,0);assert.equal(transition.answered,false);
  assert.equal(transition.critical,1);
  const ended=await page.evaluate(async()=>{running=true;hitStop(30);end();await new Promise(r=>setTimeout(r,60));return running;});
  assert.equal(ended,false,'hit-stop must not restart an ended review round');
  await page.goto(origin+'/sushigiri.html');await page.locator('#startBtn').click();await page.waitForFunction(()=>running);
  const normal=await page.evaluate(()=>{const w=current;enemyAttack();return SushiLearning.getWordProgress(w);});assert.equal(normal.games.sushigiri.wrong_count,1);
  console.log('PASS browser sushigiri: real typing, one error per word, corrected spelling not clean success, clean completion, normal timeout');
 }
 if(process.argv.includes('3d')){
  await page.goto(origin+'/sushi-run3D.html?review=weak');await page.locator('#start').click();
  const result=await page.evaluate(()=>{const word=state.current.en;const before=SushiLearning.getWordProgress(word);state.x=laneX[state.answers.findIndex(w=>w.en===word)];resolveAnswer();resolveAnswer();const after=SushiLearning.getWordProgress(word);finish();return {before,after,best:localStorage.getItem('sushi_run_3d_best'),n:state.answers.length};});
  assert.equal(result.n,3);assert.equal(result.after.correct_count,result.before.correct_count+1);assert.equal(result.best,null);assert(await page.locator('#saveRank').isDisabled());
  await page.goto(origin+'/sushi-run3D.html');await page.locator('#start').click();
  const p=await page.evaluate(()=>{const w=state.current.en;state.x=laneX[state.answers.findIndex(a=>a.en!==w)];resolveAnswer();return SushiLearning.getWordProgress(w);});assert.equal(p.games['3d'].wrong_count,1);
  console.log('PASS browser 3D: WebGL running, single-word review, 3 lanes, once/question, normal incorrect, review BEST/ranking excluded');
 }
 if(process.argv.includes('home')){
  await page.goto(origin+'/index.html');
  const stats=await page.evaluate(()=>SushiLearning.getStats());assert.equal(Number(await page.locator('[data-learning="weak"]').textContent()),stats.weak);
  await page.locator('#sharedLearning summary').click();assert.equal(await page.locator('#sharedLearning a').count(),6);
  const other=await context.newPage();await other.goto(origin+'/sushian.html');await other.evaluate(()=>SushiLearning.recordAnswer('available',false,'sushian'));
  await page.waitForFunction(()=>document.querySelector('[data-learning="weak"]').textContent===String(SushiLearning.getStats().weak));
  await other.close();
  await page.locator('#sharedLearning a').filter({hasText:'すし単'}).click();await page.waitForFunction(()=>typeof GAME!=='undefined'&&GAME.reviewMode);
  await page.goto(origin+'/index.html');await page.setViewportSize({width:390,height:844});
  if(process.env.SCREENSHOT_PATH)await page.locator('#sharedLearning').screenshot({path:process.env.SCREENSHOT_PATH});
  await page.evaluate(()=>navigator.serviceWorker.register('/sw.js'));await page.waitForFunction(async()=>{const c=await caches.open('sushitan-v2');return !!await c.match('/shared/learning.js');});
  console.log('PASS browser home: counts, 6 review links, cross-tab refresh, sushi review deep link, mobile, PWA shared asset cache');
 }
 // Existing upstream avatar-modern.js has a syntax error; unchanged by this feature.
 console.log('Page errors (known upstream avatar syntax only):',errors);assert(errors.every(e=>e==="Unexpected token 'function'"));assert.equal(errors.length,knownAvatarErrors);
 await browser.close();server.close();
})().catch(e=>{console.error(e);server.close();process.exit(1);});
