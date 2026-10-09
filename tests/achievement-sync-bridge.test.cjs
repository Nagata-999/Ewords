'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../sushigacha/achievement-sync-bridge.js'),'utf8');
function setup({connected=true,serverReady=true}={}){
 const calls=[],events=[];
 const storage=new Map(connected?[['sushitan_sync_id_v1','example'],['sushitan_sync_pin_v1','1234']]:[]);
 const ledger={exportAllPages:()=>[{events:[{version:2,id:'d:1',game:'sushitan',correct:1,at:100}]}],importEvents:()=>({added:0,conflicts:0,rejected:0})};
 const transport=require('../sushigacha/achievement-transport.js');
 const window={SushiAchievementTransport:transport,SushiAchievementLedger:ledger,dispatchEvent:e=>events.push(e.detail)};
 const fetch=async(url,options)=>{const payload=JSON.parse(options.body);calls.push(payload);return {ok:true,json:async()=>serverReady?{achievements:{synced:true,accepted:['d:1'],events:[],nextCursor:null}}:{ledger:{}}}};
 vm.runInNewContext(code,{window,localStorage:{getItem:key=>storage.get(key)||null},fetch,CustomEvent:class{constructor(type,opts){this.detail=opts.detail}}});
 return {bridge:window.SushiAchievementSyncBridge,calls,events};
}
test('manual sync sends authenticated payload and requires acknowledgment',async()=>{
 const x=setup();const result=await x.bridge.run();
 assert.equal(result.sent,1);assert.equal(x.calls[0].sushi_id,'example');
 assert.equal(x.calls[0].pin,'1234');assert.equal(x.events.at(-1).supported,true);
});
test('does not contact server without connected PIN',async()=>{
 const x=setup({connected:false});
 await assert.rejects(x.bridge.run(),/pin_not_connected/);
 assert.equal(x.calls.length,0);
});
test('legacy server response is not interpreted as successful achievement sync',async()=>{
 const x=setup({serverReady:false});
 await assert.rejects(x.bridge.run(),/server_not_ready/);
 assert.equal(x.events.at(-1).supported,false);
});
