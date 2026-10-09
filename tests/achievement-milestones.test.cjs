'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {reachedBetween}=require('../sushigacha/achievement-milestones.js');
const defs=[{id:'vocabulary',title:'語彙',metric:'correct_vocabulary',stages:[{threshold:10,gems:10},{threshold:100,gems:25}]},
{id:'first',title:'初陣',metric:'giri_plays',threshold:1,gems:10}];
test('crossing a threshold triggers one milestone',()=>{
 const r=reachedBetween({correct_vocabulary:9,giri_plays:0},{correct_vocabulary:10,giri_plays:0},defs);
 assert.deepEqual(r.map(x=>x.id),['achievement:vocabulary:10']);
});
test('one answer can cross multiple thresholds',()=>{
 const r=reachedBetween({correct_vocabulary:9},{correct_vocabulary:110},defs);
 assert.deepEqual(r.map(x=>x.id),['achievement:vocabulary:10','achievement:vocabulary:100']);
});
test('no retroactive celebrations on first load or decreasing totals',()=>{
 assert.equal(reachedBetween(null,{correct_vocabulary:100},defs).length,0);
 assert.equal(reachedBetween({correct_vocabulary:100},{correct_vocabulary:10},defs).length,0);
});
test('one-time achievements are supported',()=>{
 assert.equal(reachedBetween({giri_plays:0},{giri_plays:1},defs)[0].id,'achievement:first:1');
});
