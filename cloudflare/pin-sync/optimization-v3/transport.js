'use strict';
/* Transport-independent protocol. Caller must supply an authenticated request(payload)
 * implemented by the PIN-verified server endpoint. Not enabled in production. */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.SushiAchievementTransport=api;
})(typeof window==='undefined'?null:window,function(){
 async function synchronize(ledger,request,{pageSize=500,maxPages=10000,acknowledged={},onAcknowledged=()=>{},after=0,onCursor=()=>{}}={}){
   if(!ledger||typeof ledger.exportAllPages!=='function'||typeof ledger.importEvents!=='function')throw new TypeError('invalid_ledger');
   if(typeof request!=='function')throw new TypeError('invalid_request');
   if(!Number.isSafeInteger(pageSize)||pageSize<1||pageSize>500||!Number.isSafeInteger(maxPages)||maxPages<1||maxPages>10000)throw new RangeError('invalid_sync_limits');
   const signature=e=>JSON.stringify([e.id,e.version,e.game,e.correct,e.at]);
   const pending=ledger.exportAllPages(pageSize).flatMap(page=>page.events).filter(e=>acknowledged[e.id]!==signature(e));
   const pages=[];for(let i=0;i<pending.length;i+=pageSize)pages.push({events:pending.slice(i,i+pageSize)});
   if(pages.length>maxPages)throw new Error('too_many_local_pages');
   let sent=0,received=0,conflicts=0,rejected=0,rounds=0;
   if(!Number.isSafeInteger(after)||after<0)throw new Error('invalid_delta_cursor');
   let cursor=null,uploadIndex=0,delta=true,more=false;
   const visited=new Set();
   do{
     if(rounds++>=maxPages)throw new Error('too_many_server_pages');
     const events=uploadIndex<pages.length?pages[uploadIndex].events:[];
     const response=await request({action:'achievement_sync',achievements:{version:2,...(delta?{protocol:3,after}:{}),events,cursor,limit:Math.min(500,Math.max(1,pageSize)),baseline:ledger.baselineForSync()}});
     if(response?.achievements?.synced!==true||!Array.isArray(response.achievements.events)||!Array.isArray(response.achievements.accepted))
       throw new Error('achievement_server_not_ready');
     if(response.achievements.events.length>500)throw new Error('oversized_server_page');
     if(!Number.isSafeInteger(response.achievements.baseline)||response.achievements.baseline<0||response.achievements.baseline>1000000000)throw new Error('invalid_server_baseline');
     ledger.mergeBaseline(response.achievements.baseline);
     const ackIds=response.achievements.accepted;
     if(ackIds.some(id=>typeof id!=='string'||!/^[A-Za-z0-9:_-]{1,159}$/.test(id)))throw new Error('invalid_server_acknowledgment');
     const accepted=new Set(ackIds);
     if(accepted.size!==ackIds.length)throw new Error('invalid_server_acknowledgment');
     if(events.some(e=>!accepted.has(e.id)))throw new Error('achievement_batch_not_acknowledged');
     const v3=delta&&response.achievements.protocol===3;
     if(v3&&(!Number.isSafeInteger(response.achievements.after)||response.achievements.after<after||typeof response.achievements.hasMore!=='boolean'||(response.achievements.hasMore&&response.achievements.after===after)))throw new Error('invalid_delta_response');
     if(!v3)delta=false;
     const next=response.achievements.nextCursor;
     if(next!==null&&next!==undefined){
       if(typeof next!=='string'||!/^[A-Za-z0-9:_-]{1,159}$/.test(next)||visited.has(next))throw new Error('invalid_server_cursor');
     }
     sent+=events.length;
     uploadIndex++;
     // Reject malformed remote records before importing any of the page.
     if(response.achievements.events.some(e=>!e||e.version!==2||typeof e.id!=='string'||!/^[A-Za-z0-9:_-]{1,159}$/.test(e.id)||typeof e.game!=='string'||!/^[a-z0-9_-]{1,40}$/.test(e.game)||!Number.isSafeInteger(e.correct)||e.correct<1||e.correct>1000||!Number.isFinite(e.at)||e.at<0||e.at>8640000000000000))throw new Error('invalid_server_events');
     const imported=ledger.importEvents(response.achievements.events);
     if(imported.conflicts||imported.rejected)throw new Error('invalid_server_events');
     // Persist acknowledgments only after the complete server page passed validation.
     const confirmed={};for(const e of [...events,...response.achievements.events])confirmed[e.id]=signature(e);
     onAcknowledged(confirmed);
     more=v3&&response.achievements.hasMore;
     if(v3){after=response.achievements.after;onCursor(after);}
     received+=imported.added;conflicts+=imported.conflicts;rejected+=imported.rejected;
     if(next!==null&&next!==undefined)visited.add(next);
     cursor=next??null;
   }while(uploadIndex<pages.length||cursor!==null||more);
   return {sent,received,conflicts,rejected,rounds};
 }
 return Object.freeze({synchronize});
});
