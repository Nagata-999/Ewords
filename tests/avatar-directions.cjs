const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});try{
const page=await browser.newPage();
for(const name of ['avatar.js','avatar-engine.js'])await page.addScriptTag({content:fs.readFileSync(path.resolve(__dirname,'../sushigacha',name),'utf8')});
const result=await page.evaluate(()=>{
 const styles=['male','female'].flatMap(gender=>Array.from({length:8},(_,hair)=>({gender,hair})).concat(['hair-spiky','hair-princess'].map(hairStyle=>({gender,hairStyle,hair:4}))));
 let count=0;const errors=[];
 for(const a of styles)for(const direction of ['front','right','back','left'])for(const action of ['idle','walk','wave','sit','celebrate'])for(const time of [0,.2,.4,.6]){
  const text=SushiAvatarV2.render({...a,eyeStyle:'eyes-star'},{direction,action,time});
  const d=new DOMParser().parseFromString(text,'image/svg+xml');
  if(d.querySelector('parsererror')||/NaN|undefined/.test(text))errors.push('invalid SVG');
  if(d.querySelectorAll('[data-eye-style]').length!==(direction==='back'?0:direction==='front'?2:1))errors.push('eye count');
  if(d.querySelector('[data-part="hair-front"]').getAttribute('data-hair-view')!==(direction==='back'?'back':direction==='front'?'front':'side'))errors.push('hair view');
  if(direction==='back'&&d.querySelector('[data-part="face"]').getAttribute('d')!=='M68 83H94V98Q81 103 68 98Z')errors.push('rear face leak');
  count++;
 }
 for(const a of styles)for(const direction of ['front','right','back','left']){
  if(SushiAvatarV2.render(a,{direction,time:0,reduced:true})!==SushiAvatarV2.render(a,{direction,time:1,reduced:true}))errors.push('reduced motion changes');
 }
 return {count,errors};
});assert.deepEqual(result.errors,[]);console.log(`PASS: ${result.count} direction/action frames, rear face removal, eye counts, stable reduced motion`);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
