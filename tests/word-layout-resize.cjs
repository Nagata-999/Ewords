const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.join(__dirname,'..');
(async()=>{for(const exe of process.env.BROWSER_PATHS.split(';')){
const browser=await chromium.launch({executablePath:exe,headless:true});
try{for(const name of ['sushitan','shinotan','antonitan']){
let html=fs.readFileSync(path.join(root,name+'.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'');
const page=await browser.newPage();
await page.route('**/*',r=>r.fulfill({contentType:'text/html',body:html}));
await page.goto('http://layout.test/'+name);
await page.addStyleTag({content:fs.readFileSync(path.join(root,'shared/learning-paths.css'),'utf8')});
await page.evaluate(()=>{document.querySelectorAll('.overlay').forEach(e=>e.remove());document.body.classList.add('sushi-taskbar-on');const arena=document.querySelector('.arena');for(let i=0;i<8;i++){let b=document.createElement('button');b.className='balloon';b.textContent=i%2?'take responsibility for something':'international cooperation';b.style.left='12px';b.style.top='12px';arena.append(b);}document.querySelector('.question-text').textContent='国際協力について責任を持って取り組む';});
// Shared layout intentionally unavailable: HTML must remain usable.
for(const [width,height]of [[1366,768],[1024,600],[800,450],[640,360],[390,844],[320,568],[1536,864],[768,432],[512,288],[1366,768]]){
await page.setViewportSize({width,height});
const result=await page.evaluate(()=>{const app=document.querySelector('.app'),a=[...document.querySelectorAll('.balloon')];const rects=a.map(b=>b.getBoundingClientRect());return {clipped:a.some(b=>b.scrollWidth>b.clientWidth+2||b.scrollHeight>b.clientHeight+2),overlap:rects.some((r,i)=>rects.some((s,j)=>j>i&&r.left<s.right&&s.left<r.right&&r.top<s.bottom&&s.top<r.bottom)),horizontal:app.scrollWidth>app.clientWidth+2,scroll:getComputedStyle(app).overflowY};});
assert(!result.clipped,JSON.stringify({exe,name,width,height,result}));assert(!result.overlap);assert(!result.horizontal);assert.equal(result.scroll,'auto');
}await page.close();}console.log('PASS layout matrix: '+exe);}finally{await browser.close();}}})().catch(e=>{console.error(e);process.exitCode=1});



