'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.join(__dirname,'..');
(async()=>{
 const server=http.createServer((req,res)=>{
   let p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(p.endsWith('/'))p+='index.html';
   const file=path.join(root,p);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
   try{res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin='http://127.0.0.1:'+server.address().port;
 let browser;
 try{
  browser=await chromium.launch({headless:true,channel:'msedge'});
  for(const route of ['/admin/','/admin/index.html?enabled=true','/admin/set-password.html#token_hash=test','/admin/avatar-preview.html','/admin/test-lab-frame.html']){
   const page=await browser.newPage(),external=[],errors=[];
   page.on('request',r=>{if(!r.url().startsWith(origin))external.push(r.url());});page.on('pageerror',e=>errors.push(e.message));
   await page.goto(origin+route);assert.equal(await page.locator('#admin-disabled').isVisible(),true);
   await page.evaluate(()=>{window.dispatchEvent(new Event('pagehide'));document.dispatchEvent(new Event('visibilitychange'));});
   assert.equal(await page.locator('form').count(),0);assert.equal(await page.locator('iframe').count(),0);
   assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
   console.log('PASS direct URL: '+route+'; external requests = 0');await page.close();
  }
  for(const registered of [false,true]){
   const page=await browser.newPage(),external=[];
   await page.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
   page.on('request',r=>{if(!r.url().startsWith(origin))external.push(r.url());});
   await page.goto(origin+'/admin/');await page.clock.install();
   await page.evaluate(registered=>{
    if(registered){localStorage.setItem('sushitan_sync_id_v1','test-user');localStorage.setItem('sushitan_sync_pin_v1','1234');}
    localStorage.setItem('sushitan_usage_queue_v1',JSON.stringify([{session:crypto.randomUUID(),started:new Date().toISOString(),game:'sushitan',seconds:12,answers:3,correct:2,account:registered?'test-user':''}]));
    history.replaceState(null,'','/sushitan.html');
   },registered);
   await page.addScriptTag({content:fs.readFileSync(path.join(root,'shared/usage-analytics.js'),'utf8')});
   await page.clock.runFor(16*60*1000);
   await page.evaluate(()=>{window.dispatchEvent(new CustomEvent('sushi-achievement-answer',{detail:{id:'test-answer',correct:true}}));window.dispatchEvent(new Event('pagehide'));document.dispatchEvent(new Event('visibilitychange'));});
   assert.deepEqual(external,[]);
   console.log('PASS collector '+(registered?'PIN account':'guest')+': queued records + 16 minutes + pagehide; external requests = 0');await page.close();
  }
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
