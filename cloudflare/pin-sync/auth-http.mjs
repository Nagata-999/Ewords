const ORIGIN='https://sushitan.net';
function response(body,status=200,cookie){const headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};if(cookie)headers['Set-Cookie']=cookie;return new Response(JSON.stringify(body),{status,headers})}
function cookieToken(request){const values=(request.headers.get('cookie')||'').split(';').map(value=>value.trim()).filter(value=>value.startsWith('__Host-ewords-sync='));return values.length===1?values[0].slice('__Host-ewords-sync='.length):''}
export function authHandler(auth,registration){return async request=>{
 const url=new URL(request.url);if(url.origin!==ORIGIN||request.headers.get('origin')!==ORIGIN)return response({error:'origin_not_allowed'},403);
 const fetchSite=request.headers.get('sec-fetch-site');if(fetchSite&&fetchSite!=='same-origin')return response({error:'origin_not_allowed'},403);
 if(request.method!=='POST')return response({error:'method_not_allowed'},405);
 if(request.headers.get('content-type')?.split(';')[0].trim()!=='application/json')return response({error:'invalid_request'},415);
 if(!['/auth/start','/auth/finish','/auth/session','/auth/logout','/auth/renew',...(registration?['/auth/register']:[])].includes(url.pathname))return response({error:'not_found'},404);
 try{
  const maximum=url.pathname==='/auth/register'?2*1024*1024:4096;
  const length=Number(request.headers.get('content-length')||0);if(!Number.isFinite(length)||length<0||length>maximum)return response({error:'invalid_request'},413);
  const reader=request.body?.getReader();if(!reader)return response({error:'invalid_request'},400);const decoder=new TextDecoder();let text='',bytes=0;
  for(;;){const chunk=await reader.read();if(chunk.done)break;bytes+=chunk.value.byteLength;if(bytes>maximum){await reader.cancel();return response({error:'invalid_request'},413)}text+=decoder.decode(chunk.value,{stream:true})}text+=decoder.decode();
  let body;try{body=JSON.parse(text)}catch{return response({error:'invalid_request'},400)}if(!body||typeof body!=='object'||Array.isArray(body))return response({error:'invalid_request'},400);
  if(url.pathname==='/auth/register'){await auth.budget('register-ip:'+(request.headers.get('CF-Connecting-IP')||'unknown'),Date.now(),600000,5);return response(await registration.register(body))}
  if(url.pathname==='/auth/start')return response(await auth.start(body.clientFirst,request.headers.get('CF-Connecting-IP')||'unknown'));
  if(url.pathname==='/auth/finish'){if(typeof body.id!=='string'||body.id.length>100||typeof body.account!=='string'||body.account.length>24||typeof body.clientFinal!=='string'||body.clientFinal.length>512)return response({error:'invalid_request'},400);const result=await auth.finish(body.id,body.account,body.clientFinal);return response({ok:true,serverFinal:result.serverFinal},200,result.cookie)}
  const token=cookieToken(request);if(url.pathname==='/auth/session')return response({ok:true,account:await auth.accountForToken(token)});
  if(url.pathname==='/auth/renew'){const result=await auth.renew(token);return response({ok:true,account:result.account},200,result.cookie)}
  await auth.logout(token);return response({ok:true},200,'__Host-ewords-sync=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0');
 }catch(error){if(error.status===401||error.status===429)return response({error:'auth_failed'},error.status);if(error.status===400||error.status===409)return response({error:error.message},error.status);if(error.message==='invalid_scram_message')return response({error:'invalid_request'},400);return response({error:'temporarily_unavailable'},503)}
}}
