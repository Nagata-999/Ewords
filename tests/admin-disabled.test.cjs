'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {stripTypeScriptTypes}=require('node:module');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const forbidden=()=>{throw Error('Disabled feature caused a side effect');};
test('admin entry scripts and collector cause zero network, timers, storage and DOM access',()=>{
  for(const p of [...fs.readdirSync(path.join(root,'admin')).filter(p=>p.endsWith('.js')).map(p=>'admin/'+p),'shared/usage-analytics.js']){
    if(p==='admin/feature.js')continue;
    const trap=new Proxy({}, {get:forbidden});
    const context={fetch:forbidden,WebSocket:forbidden,XMLHttpRequest:forbidden,setInterval:forbidden,setTimeout:forbidden,requestAnimationFrame:forbidden,localStorage:trap,document:trap,location:trap,addEventListener:forbidden};
    context.window=context;
    vm.createContext(context);vm.runInContext(read('admin/feature.js'),context);vm.runInContext(read(p),context,{filename:p});
  }
});
test('all direct admin pages keep original code inert and only load the disabled gate',()=>{
  for(const p of fs.readdirSync(path.join(root,'admin')).filter(p=>p.endsWith('.html'))){
    const html=read('admin/'+p),live=html.replace(/<template\b[^>]*>[\s\S]*?<\/template>/gi,'');
    assert.match(html,/<template id="admin-content">/);
    assert.match(live,/管理者機能は停止中/);
    assert.deepEqual([...live.matchAll(/<script\b[^>]*src="([^"?]+)/g)].map(m=>m[1]),['/admin/feature.js','/admin/bootstrap.js']);
    assert.doesNotMatch(live,/<iframe|<form/i);
  }
  assert.match(read('index.html'),/<a hidden inert aria-hidden="true" tabindex="-1" href="\/admin\/"/);
});
function handler(name){
  assert.match(read('supabase/functions/_shared/admin-feature.ts'), /ADMIN_USAGE_ENABLED: boolean = false/);
  let serve;
  let code=read('supabase/functions/'+name+'/index.ts').replace(/^import .*;\r?\n/gm,'');
  code=stripTypeScriptTypes(code,{mode:'transform'});
  const context={ADMIN_USAGE_ENABLED:false,createClient:forbidden,Deno:{serve:f=>serve=f,env:{get:forbidden}},Response,Request,Headers,console,crypto:globalThis.crypto,TextEncoder,TextDecoder,URL};
  vm.runInNewContext(code,context);return serve;
}
test('dedicated APIs reject requests before auth, environment lookup and DB creation',async()=>{
  for(const name of ['usage-admin','usage-record'])for(const method of ['GET','OPTIONS','POST']){
    const response=await handler(name)(new Request('https://example.test',{method,...(method==='POST'?{body:JSON.stringify({action:'report'})}:{})}));
    assert.equal(response.status,503);assert.equal((await response.json()).error,'admin_usage_disabled');
  }
});
test('legacy authenticated usage_record is blocked before PIN/profile DB access',async()=>{
  for(const credentials of [{},{sushi_id:'test-user',pin:'1234'}]){
    const response=await handler('sushi-id-sync')(new Request('https://example.test',{method:'POST',body:JSON.stringify({action:'usage_record',...credentials})}));
    assert.equal(response.status,503);assert.equal((await response.json()).error,'admin_usage_disabled');
  }
});
test('offline service worker never falls back to a cached pre-seal collector',async()=>{
  const handlers={};let response;
  vm.runInNewContext(read('sw.js'),{URL,Response,fetch:async()=>{throw Error('offline')},caches:new Proxy({},{get:forbidden}),self:{location:{origin:'https://sushitan.net'},addEventListener:(name,fn)=>handlers[name]=fn}});
  handlers.fetch({request:new Request('https://sushitan.net/shared/usage-analytics.js?v=old'),respondWith:p=>response=p});
  assert.match(await (await response).text(),/fail closed/);
});
