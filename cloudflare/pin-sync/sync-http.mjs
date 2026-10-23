const ORIGIN='https://sushitan.net',MAX_BYTES=2*1024*1024;
function response(body,status=200,serialized=false){return new Response(serialized?body:JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
function tokenFrom(request){const cookies=(request.headers.get('cookie')||'').split(';').map(value=>value.trim()).filter(value=>value.startsWith('__Host-ewords-sync='));return cookies.length===1?cookies[0].slice('__Host-ewords-sync='.length):''}
export function syncHandler(auth,profiles,activity){return async request=>{
 const url=new URL(request.url),site=request.headers.get('sec-fetch-site');
 if(url.origin!==ORIGIN||request.headers.get('origin')!==ORIGIN||(site&&site!=='same-origin'))return response({error:'origin_not_allowed'},403);
 if(url.pathname!=='/sync')return response({error:'not_found'},404);
 if(request.method!=='POST')return response({error:'method_not_allowed'},405);
 if(request.headers.get('content-type')?.split(';')[0].trim()!=='application/json')return response({error:'invalid_request'},415);
 try{
  const account=await auth.accountForToken(tokenFrom(request));
  const length=Number(request.headers.get('content-length')||0);if(!Number.isFinite(length)||length<0||length>MAX_BYTES)return response({error:'invalid_request'},413);
  const reader=request.body?.getReader();if(!reader)return response({error:'invalid_request'},400);
  const decoder=new TextDecoder();let text='',bytes=0;
  for(;;){const chunk=await reader.read();if(chunk.done)break;bytes+=chunk.value.byteLength;if(bytes>MAX_BYTES){await reader.cancel();return response({error:'invalid_request'},413)}text+=decoder.decode(chunk.value,{stream:true})}text+=decoder.decode();
  let body;try{body=JSON.parse(text)}catch{return response({error:'invalid_request'},400)}
  if(!body||typeof body!=='object'||Array.isArray(body))return response({error:'invalid_request'},400);
  if(body.sushi_id!==undefined&&body.sushi_id!==account)return response({error:'account_mismatch'},403);
  if(body.action==='usage_record')return response({ok:false,error:'admin_usage_disabled'},503);
  if(body.action==='sync')return response(await profiles.sync(account,body,true),200,true);
  if(body.action==='learning_snapshot')return response(await profiles.learningSnapshot(account),200,true);
  if(body.action==='learning_page')return response(await profiles.learningPage(account,body),200,true);
  if(body.action==='learning_batch')return response(await profiles.learningBatch(account,body));
  if(body.action==='sync_wallet')return response(await profiles.syncWallet(account,body));
  if(activity&&body.action==='login_visit')return response(await activity.loginVisit(account));
  if(activity&&body.action==='achievement_sync')return response(await activity.achievementSync(account,body.achievements));
  if(activity&&body.action==='outcome_sync')return response(await activity.outcomeSync(account,body.outcomes));
  if(body.action==='achievement_claims')return response({ok:true,sushi_id:account,receipts:{ids:await profiles.claimIds(account)}});
  if(body.action==='achievement_claim'){
   const claim=await profiles.claim(account,typeof body.category==='string'?body.category:'all_correct',Number(body.threshold));
   if(!claim.ok)return response(claim,409);
   const {ledger}=await profiles.read(account,false),events=Array.isArray(ledger.gemEvents)?ledger.gemEvents:[];
   const known=new Set([...(Array.isArray(ledger.gemEventIds)?ledger.gemEventIds:[]),...events.map(event=>event?.id)]);
   return response({...claim,wallet:{gems:Math.max(0,Math.floor(Number(ledger.gems)||0)),gemEvents:events,gemAcknowledgedIds:(Array.isArray(body.wallet_event_ids)?body.wallet_event_ids:[]).slice(0,1000).filter(id=>typeof id==='string'&&known.has(id))}});
  }
  return response({error:'action_not_migrated'},503);
 }catch(error){
  if(error.status===400)return response({error:error.message},400);
  if(error.status===401||error.status===429)return response({error:'auth_failed'},error.status);
  if(error.status===409||['profile_sync_conflict','profile_claim_conflict','duplicate_legacy_event','invalid_gem_event','invalid_gem_total'].includes(error.message))return response({error:error.message},409);
  return response({error:'temporarily_unavailable'},503);
 }
}}
