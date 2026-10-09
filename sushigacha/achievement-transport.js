'use strict';
/* Transport-independent protocol. Caller must supply an authenticated request(payload)
 * implemented by the PIN-verified server endpoint. Not enabled in production. */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.SushiAchievementTransport=api;
})(typeof window==='undefined'?null:window,function(){
 async function synchronize(ledger,request,{pageSize=500,maxPages=10000}={}){
   if(!ledger||typeof ledger.exportAllPages!=='function'||typeof ledger.importEvents!=='function')throw new TypeError('invalid_ledger');
   if(typeof request!=='function')throw new TypeError('invalid_request');
   const pages=ledger.exportAllPages(pageSize);
   if(pages.length>maxPages)throw new Error('too_many_local_pages');
   let sent=0,received=0,conflicts=0,rejected=0,rounds=0;
   let cursor=null,uploadIndex=0;
   const visited=new Set();
   do{
     if(rounds++>=maxPages)throw new Error('too_many_server_pages');
     const events=uploadIndex<pages.length?pages[uploadIndex].events:[];
     const response=await request({action:'achievement_sync',achievements:{version:2,events,cursor,limit:Math.min(500,Math.max(1,pageSize))}});
     if(response?.achievements?.synced!==true||!Array.isArray(response.achievements.events)||!Array.isArray(response.achievements.accepted))
       throw new Error('achievement_server_not_ready');
     if(response.achievements.events.length>500)throw new Error('oversized_server_page');
     const accepted=new Set(response.achievements.accepted);
     if(events.some(e=>!accepted.has(e.id)))throw new Error('achievement_batch_not_acknowledged');
     sent+=events.length;
     uploadIndex++;
     const imported=ledger.importEvents(response.achievements.events);
     if(imported.conflicts||imported.rejected)throw new Error('invalid_server_events');
     received+=imported.added;conflicts+=imported.conflicts;rejected+=imported.rejected;
     const next=response.achievements.nextCursor;
     if(next!==null&&next!==undefined){
       if(typeof next!=='string'||!/^[A-Za-z0-9:_-]{1,159}$/.test(next)||visited.has(next))throw new Error('invalid_server_cursor');
       visited.add(next);
     }
     cursor=next??null;
   }while(uploadIndex<pages.length||cursor!==null);
   return {sent,received,conflicts,rejected,rounds};
 }
 return Object.freeze({synchronize});
});
