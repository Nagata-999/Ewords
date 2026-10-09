'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {compute}=require('../sushigacha/achievement-metrics.js');
test('unattributed historical answers count for global rank but not vocabulary',()=>{
 const m=compute({historicalTotal:9000,ledgerTotal:9010,byGame:{sushitan:10}});
 assert.equal(m.correct_total,9010);assert.equal(m.correct_vocabulary,10);
});
test('non-vocabulary games do not unlock vocabulary milestones',()=>{
 const m=compute({ledgerTotal:300,byGame:{sushitan:4,sushigiri:200,blast:96}});
 assert.equal(m.correct_total,300);assert.equal(m.correct_vocabulary,4);
});
test('recognized vocabulary games sum without non-vocabulary entries',()=>{
 const m=compute({byGame:{sushitan:2,shinotan:3,antonitan:4,idiom:5,sushi_idiom:6,toeic:100}});
 assert.equal(m.correct_vocabulary,20);
});
test('invalid metrics cannot inflate ranks',()=>{
 const m=compute({historicalTotal:Infinity,ledgerTotal:-1,loginStreak:'365',byGame:{sushitan:-3,idiom:'999'}});
 assert.equal(m.correct_total,0);assert.equal(m.correct_vocabulary,0);assert.equal(m.login_streak,0);
});

test('TOEIC answers are tracked separately from vocabulary',()=>{
 const metrics=compute({byGame:{toeic:12,sushitan:4},ledgerTotal:16});
 assert.equal(metrics.toeic_correct,12);
 assert.equal(metrics.correct_vocabulary,4);
 assert.equal(metrics.correct_total,16);
});
