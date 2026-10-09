'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {eligibility,available,stageFor}=require('../sushigacha/achievement-rewards.js');
const definitions=[
 {id:'vocabulary',metric:'correct_vocabulary',stages:[{threshold:10,gems:10,points:10},{threshold:100,gems:25,points:25}]},
 {id:'streak',metric:'login_streak',stages:[{threshold:3,gems:10,points:10}]}
];
test('only exact catalog stage IDs are accepted',()=>{
 assert.equal(stageFor('achievement:vocabulary:10',definitions).stage.gems,10);
 for(const id of ['achievement:vocabulary:11','achievement:unknown:10','achievement:vocabulary:010','achievement:vocabulary:10;drop','achievement:__proto__:10']){
   assert.equal(stageFor(id,definitions),null);
 }
});
test('eligible only when authoritative metric reaches threshold',()=>{
 assert.equal(eligibility('achievement:vocabulary:10',{correct_vocabulary:9},definitions).reason,'not_reached');
 assert.equal(eligibility('achievement:vocabulary:10',{correct_vocabulary:10},definitions).eligible,true);
 assert.equal(eligibility('achievement:vocabulary:100',{correct_vocabulary:10},definitions).eligible,false);
});
test('already claimed reward cannot be claimed again',()=>{
 const id='achievement:vocabulary:10';
 assert.equal(eligibility(id,{correct_vocabulary:100},definitions,[id]).reason,'already_claimed');
});
test('rejects forged client metrics and invalid values',()=>{
 const id='achievement:vocabulary:10';
 for(const n of [undefined,NaN,-1,9.9,'100',Infinity])assert.equal(eligibility(id,{correct_vocabulary:n},definitions).eligible,false);
});
test('available rewards return only unclaimed reached stages',()=>{
 const list=available({correct_vocabulary:110,login_streak:2},definitions,['achievement:vocabulary:10']);
 assert.deepEqual(list.map(x=>x.id),['achievement:vocabulary:100']);
});
test('reward values come from catalog, never request payload',()=>{
 const result=eligibility('achievement:vocabulary:10',{correct_vocabulary:10},definitions);
 assert.equal(result.gems,10);
});

test('inherited metrics cannot unlock rewards',()=>{
 const forged=Object.create({correct_vocabulary:100000});
 assert.equal(eligibility('achievement:vocabulary:10',forged,definitions).eligible,false);
});
