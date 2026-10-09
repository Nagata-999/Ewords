'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const titles=require('../sushigacha/achievement-titles.js');
const definitions=[{id:'vocabulary',title:'語彙の達人',metric:'correct_vocabulary',stages:[{threshold:10,color:'white'},{threshold:100,color:'yellow'}]},{id:'first_game',title:'初陣',metric:'giri_plays',threshold:1}];
function storage(){const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)}}
test('titles unlock at thresholds, including one-time achievements',()=>{
 const result=titles.unlocked({correct_vocabulary:10,giri_plays:1},definitions);
 assert.deepEqual(result.map(x=>x.id),['achievement:vocabulary:10','achievement:first_game:1']);
});
test('locked title cannot be selected',()=>{
 const s=storage(),metrics={correct_vocabulary:10};
 assert.equal(titles.set(s,'achievement:vocabulary:100',metrics,definitions),false);
 assert.equal(titles.selection(s,metrics,definitions),null);
 assert.equal(titles.set(s,'achievement:vocabulary:10',metrics,definitions),true);
 assert.equal(titles.selection(s,metrics,definitions).title,'語彙の達人');
});
test('previously selected title is hidden when no longer eligible',()=>{
 const s=storage();
 titles.set(s,'achievement:vocabulary:10',{correct_vocabulary:10},definitions);
 assert.equal(titles.selection(s,{correct_vocabulary:0},definitions),null);
 assert.equal(titles.set(s,null,{correct_vocabulary:0},definitions),true);
});
test('inherited or malformed metrics do not unlock titles',()=>{
 assert.deepEqual(titles.unlocked(Object.create({correct_vocabulary:1000}),definitions),[]);
 assert.deepEqual(titles.unlocked({correct_vocabulary:'1000'},definitions),[]);
});
