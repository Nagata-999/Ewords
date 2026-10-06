const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),KEY='sushitan_login_bonus_v1',ID='reward-sushigiri';
const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;const f=path.resolve(root,'.'+pathname);if(!f.startsWith(root+path.sep)){res.writeHead(403);return res.end();}fs.readFile(f,(e,b)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',path.extname(f)==='.html'?'text/html; charset=utf-8':path.extname(f)==='.js'?'application/javascript':'text/css');res.end(b);});});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});try{
const context=await browser.newContext(),page=await context.newPage();await context.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());
await page.goto(origin+'/sushigacha/sushi-avatar.html');
const original={gems:876,extra:{keep:true},gacha:{version:4,owned:['starter','basic-bottom','studio-sneakers','unknown'],pulls:12,avatar:{gender:'female',faceShape:1,expression:1,hand:null,future:7}},avatarStudioV2:{looks:[{top:'starter'}],settings:{reduced:true}}};
await page.evaluate(({KEY,original})=>localStorage.setItem(KEY,JSON.stringify(original)),{KEY,original});
for(const score of [0,34999]){assert.deepEqual(await page.evaluate(score=>SushiAvatarStore.awardGameResult('sushigiri',score),score),[]);assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY),original);}
assert.deepEqual(await page.evaluate(()=>SushiAvatarStore.awardGameResult('another-game',99999)),[]);
for(const score of [-1,35000.1,NaN,Infinity,'35000'])assert.equal(await page.evaluate(async score=>{try{await SushiAvatarStore.awardGameResult('sushigiri',score);return false;}catch{return true;}},score),true);
const results=await page.evaluate(()=>Promise.all([SushiAvatarStore.awardGameResult('sushigiri',35000),SushiAvatarStore.awardGameResult('sushigiri',45000)]));assert.equal(results.flat().filter(x=>x.fresh).length,1);
let saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);assert.equal(saved.gacha.owned.filter(x=>x===ID).length,1);assert.equal(saved.gems,876);assert.equal(saved.gacha.pulls,12);assert.deepEqual(saved.gacha.avatar,original.gacha.avatar);assert.deepEqual(saved.avatarStudioV2,original.avatarStudioV2);assert(saved.gacha.owned.includes('unknown'));assert.equal(saved.gameAvatarRewards.sushigiri.bestScore,45000);
await page.goto(origin+'/sushigacha/sushi-avatar.html?item='+ID);await page.locator('#equipLook').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('sushitan_login_bonus_v1')).gacha.avatar.hand==='reward-sushigiri');await page.reload();await page.locator('[data-slot="hand"]').click();assert.equal(await page.locator('[data-item="reward-sushigiri"]').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#hero [data-item-art="reward-sushigiri"]').count(),1);
assert.equal(await page.evaluate(()=>{for(const direction of ['front','back','left','right'])for(const action of ['idle','walk','wave','sit','celebrate']){const svg=SushiAvatarV2.render({hand:'reward-sushigiri'},{direction,action});if(!svg.includes('data-item-art="reward-sushigiri"')||/NaN|undefined/.test(svg))return false;}return true;}),true);
await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
if(process.env.AVATAR_SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.AVATAR_SCREENSHOT_DIR,'sushigiri-reward-avatar.png'),fullPage:true});
await page.evaluate(k=>localStorage.setItem(k,'{broken'),KEY);assert.equal(await page.evaluate(async()=>{try{await SushiAvatarStore.awardGameResult('sushigiri',35000);return false;}catch{return true;}}),true);assert.equal(await page.evaluate(k=>localStorage.getItem(k),KEY),'{broken');
await page.evaluate(k=>localStorage.removeItem(k),KEY);
await page.goto(origin+'/sushigiri.html');
// Drive the actual end-of-round function with a deterministic final score; network ranking is unrelated.
await page.evaluate(()=>{initRankingResult=()=>{};running=true;score=34999;end();});await page.getByText('すし斬りで35,000点以上で獲得（あと1点）',{exact:true}).waitFor();assert.equal(await page.evaluate(k=>localStorage.getItem(k),KEY),null);
await page.evaluate(()=>{running=true;score=35000;end();});await page.getByText('限定の刀「すし斬り」を獲得しました！',{exact:true}).waitFor();await page.getByRole('link',{name:'刀を装備する'}).click();await page.waitForURL('**/sushi-avatar.html?item=reward-sushigiri');assert.equal(await page.locator('#equipLook').isEnabled(),true);
await page.goto(origin+'/sushigiri.html');await page.evaluate(()=>{initRankingResult=()=>{};running=true;score=35001;end();});await page.getByText('限定の刀「すし斬り」は獲得済みです。',{exact:true}).waitFor();
console.log('PASS: 34999/35000/35001 thresholds, real game completion, one-time concurrent grant, data preservation, equipment persistence, 20 render poses, mobile layout, corrupt storage');
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
