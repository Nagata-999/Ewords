import {clientStart,clientProof,verifyServerFinal,registrationVerifier} from './scram.mjs';

const BASE='/api/pin-sync',LOGOUT='sushitan_d1_logout_pending_v1',RENEWAL='sushitan_d1_session_checked_v1';
export function createSyncTransport({fetcher=globalThis.fetch.bind(globalThis),timeoutMs=15000}={}){
 let account=null,checkedAt=0,queue=Promise.resolve();
 function invalidate(){account=null;checkedAt=0;try{sessionStorage.removeItem(RENEWAL)}catch{}}
 function serialize(operation){
  const run=()=>globalThis.navigator?.locks?.request?globalThis.navigator.locks.request('ewords-pin-session',operation):operation();
  const pending=queue.then(run);queue=pending.catch(()=>{});return pending;
 }
 async function post(path,body={}){
  const controller=new AbortController();let timer;
  const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('sync_timeout'))},timeoutMs)});
  try{return await Promise.race([timeout,(async()=>{
   const response=await fetcher(BASE+path,{method:'POST',credentials:'same-origin',signal:controller.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   let result;try{result=await response.json()}catch{throw Error('invalid_server_json')}
   if(!response.ok)throw Object.assign(Error(result?.error||'sync_http_'+response.status),{status:response.status,code:result?.error});
   if(!result||typeof result!=='object'||Array.isArray(result)||result.ok!==true)throw Error('invalid_server_response');
   return result;
  })()])}finally{clearTimeout(timer)}
 }
 function credentials(id,pin){if(typeof id!=='string'||!(/^[a-z0-9_-]{4,24}$/).test(id)||typeof pin!=='string'||!(/^\d{4}$/).test(pin))throw Error('invalid_credentials')}
 function remember(id){account=id;checkedAt=Date.now();try{sessionStorage.setItem(RENEWAL,JSON.stringify({account:id,at:checkedAt}))}catch{}}
 async function flushLogout(){
  if(localStorage.getItem(LOGOUT)!=='1')return;
  invalidate();try{await post('/auth/logout')}catch(error){if(error.status!==401)throw error}
  localStorage.removeItem(LOGOUT);
 }
 async function authenticateUnlocked(id,pin){
  credentials(id,pin);invalidate();
  const started=clientStart(id),challenge=await post('/auth/start',{clientFirst:started.clientFirst});
  const proof=await clientProof(pin,started,challenge.serverFirst);
  const response=await post('/auth/finish',{id:challenge.id,account:id,clientFinal:proof.clientFinal});
  verifyServerFinal(proof,response.serverFinal);remember(id);
 }
 async function authenticate(id,pin){return serialize(async()=>{await flushLogout();await authenticateUnlocked(id,pin)})}
 async function ensure(id,pin){return serialize(async()=>{
  credentials(id,pin);await flushLogout();
  if(account===id&&Date.now()-checkedAt>=0&&Date.now()-checkedAt<86400000)return;
  let current;try{current=await post('/auth/session')}catch(error){if(error.status!==401)throw error}
  if(current?.account!==id){await authenticateUnlocked(id,pin);return}
  let renewal;try{renewal=JSON.parse(sessionStorage.getItem(RENEWAL)||'null')}catch{}
  if(renewal?.account===id&&Number.isSafeInteger(renewal.at)&&Date.now()-renewal.at>=0&&Date.now()-renewal.at<86400000){account=id;checkedAt=renewal.at;return}
  try{const renewed=await post('/auth/renew');if(renewed.account!==id)throw Error('account_mismatch');remember(id)}catch(error){if(error.status!==401)throw error;await authenticateUnlocked(id,pin)}
 })}
 async function request(payload){
  const {pin,sushi_id:id,...body}=payload;credentials(id,pin);
  if(body.action==='create'){
   await serialize(async()=>{
    await flushLogout();const verifier=await registrationVerifier(id,pin);
    try{await post('/auth/register',{verifier,ledger:body.ledger,learning:{},player_name:body.player_name})}catch(error){if(error.status!==409||error.code!=='id_taken')throw error}
    await authenticateUnlocked(id,pin);
   });
   body.action='sync';
  }else await ensure(id,pin);
  const send=async()=>{
   if(body.action!=='sync')return post('/sync',{...body,sushi_id:id});
   async function download(){
    let snapshot;
    for(let offset=0;;offset+=128){
     const page=await post('/sync',{action:'learning_page',sushi_id:id,offset,...(snapshot?{revision:snapshot.revision}:{})});
     if(page.sushi_id!==id||!Number.isSafeInteger(page.revision)||!Number.isSafeInteger(page.events_total)||!Number.isSafeInteger(page.cards_total)||page.events_total<0||page.cards_total<0||Math.max(page.events_total,page.cards_total)>1000000||!Array.isArray(page.learning?.events)||!Array.isArray(page.learning?.cards)||page.learning.events.length!==Math.min(128,Math.max(0,page.events_total-offset))||page.learning.cards.length!==Math.min(128,Math.max(0,page.cards_total-offset)))throw Error('invalid_learning_snapshot');
     if(!snapshot)snapshot=page;
     else{
      if(page.revision!==snapshot.revision||page.events_total!==snapshot.events_total||page.cards_total!==snapshot.cards_total)throw Error('invalid_learning_snapshot');
      snapshot.learning.events.push(...page.learning.events);snapshot.learning.cards.push(...page.learning.cards);
     }
     if(offset+128>=Math.max(snapshot.events_total,snapshot.cards_total))return snapshot;
    }
   }
   let snapshot=await download();
   const remoteEvents=new Map();
   for(const event of Array.isArray(snapshot.learning.events)?snapshot.learning.events:[]){
    if(typeof event?.id!=='string')continue;
    const known=remoteEvents.get(event.id)||[];known.push(event);remoteEvents.set(event.id,known);
   }
   const learning=body.learning||{},events=(Array.isArray(learning.events)?learning.events:[]).filter(event=>{
    const known=remoteEvents.get(event?.id);
    return !known||known.length!==1||JSON.stringify(known[0])!==JSON.stringify(event);
   });
   const remoteCards=Array.isArray(snapshot.learning.cards)?snapshot.learning.cards:[];
   const cards=(Array.isArray(learning.cards)?learning.cards:[]).filter(card=>!remoteCards.some(remote=>JSON.stringify(remote)===JSON.stringify(card)));
   let eventOffset=0,cardOffset=0,changed=false;
   while(eventOffset<events.length||cardOffset<cards.length||(!changed&&(Number(learning.registry_version)||0)>(Number(snapshot.learning.registry_version)||0))){
    const chunk={registry_version:learning.registry_version,events:events.slice(eventOffset,eventOffset+64),cards:cards.slice(cardOffset,cardOffset+32)};
    while(new TextEncoder().encode(JSON.stringify(chunk)).length>32768){
     if(chunk.events.length>1)chunk.events.pop();else if(chunk.cards.length)chunk.cards.pop();else throw Error('learning_event_too_large');
    }
    if(chunk.events.length===0&&chunk.cards.length===0&&(eventOffset<events.length||cardOffset<cards.length))throw Error('learning_event_too_large');
    const acknowledgement=await post('/sync',{action:'learning_batch',sushi_id:id,learning:chunk});
    if(acknowledgement.sushi_id!==id||!Number.isSafeInteger(acknowledgement.revision)||!Array.isArray(acknowledgement.event_ids)||!Array.isArray(acknowledgement.card_ids)||chunk.events.some(event=>typeof event?.id==='string'&&event.id&&!acknowledgement.event_ids.includes(event.id))||chunk.cards.some(card=>/^dictionary:sw-\d{5,}$/.test(card?.word_id)&&typeof card.en==='string'&&card.en.trim()&&typeof card.jp==='string'&&card.jp.trim()&&!acknowledgement.card_ids.includes(card.word_id)))throw Error('invalid_learning_acknowledgement');
    eventOffset+=chunk.events.length;cardOffset+=chunk.cards.length;changed=true;
   }
   if(changed)snapshot=await download();
   const {learning:unused,...wallet}=body;
   const result=await post('/sync',{...wallet,action:'sync_wallet',sushi_id:id,learning_revision:snapshot.revision});
   if(result.sushi_id!==id||!result.ledger||typeof result.ledger!=='object'||result.revision!==snapshot.revision+1)throw Error('invalid_server_response');
   return {...result,learning:snapshot.learning};
  };
  try{return await send()}catch(error){
   if(error.status===401){invalidate();await ensure(id,pin);return send()}
   if(error.code==='account_mismatch')invalidate();throw error;
  }
 }
 async function disconnect(){invalidate();localStorage.setItem(LOGOUT,'1');return serialize(flushLogout)}
 globalThis.addEventListener?.('online',()=>{serialize(flushLogout).catch(()=>{})});
 if(localStorage.getItem(LOGOUT)==='1')serialize(flushLogout).catch(()=>{});
 return Object.freeze({request,authenticate,disconnect});
}
