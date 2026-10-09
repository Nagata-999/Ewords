'use strict';
/* Read-only reward receipt validation. Gem credits must originate from a
 * verified server transaction, never from a browser-side balance mutation. */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.SushiAchievementReceipts=api;
})(typeof window==='undefined'?null:window,function(){
 function parse(response){
   if(response?.ok===true&&Array.isArray(response.receipts?.ids)){
     const ids=response.receipts.ids;
     if(ids.length>1000||new Set(ids).size!==ids.length||ids.some(id=>typeof id!=='string'||!/^achievement:[a-z0-9_]+:[1-9][0-9]*$/.test(id)||id.length>120))return null;
     return Object.freeze({ids:Object.freeze([...ids]),rows:Object.freeze(ids.map(id=>({id,gems:null})))});
   }
   if(!response||response.version!==1||!Array.isArray(response.claims)||response.claims.length>1000)return null;
   const ids=new Set(),rows=[];
   for(const row of response.claims){
     if(!row||typeof row.stage_id!=='string'||
       !/^achievement:[a-z0-9_]+:[1-9][0-9]*$/.test(row.stage_id)||row.stage_id.length>120||
       !Number.isSafeInteger(row.gems_awarded)||row.gems_awarded<0||row.gems_awarded>10000)return null;
     if(ids.has(row.stage_id))return null;
     ids.add(row.stage_id);rows.push({id:row.stage_id,gems:row.gems_awarded});
   }
   return Object.freeze({ids:Object.freeze([...ids]),rows:Object.freeze(rows)});
 }
 function status(id,receipts){
   if(!receipts)return 'unavailable';
   return receipts.ids.includes(id)?'claimed':'unclaimed';
 }
 return Object.freeze({parse,status});
});
