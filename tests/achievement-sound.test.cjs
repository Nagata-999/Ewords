'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const code=fs.readFileSync(require('node:path').join(__dirname,'../sushigacha/achievement-sound.js'),'utf8');
function setup(audio){
 const window=audio?{AudioContext:audio}:{};
 vm.runInNewContext(code,{window});return window.SushiAchievementSound;
}
test('unsupported audio devices fail silently',()=>{
 const sound=setup();assert.equal(sound.play(),false);
});
test('mute prevents AudioContext construction',()=>{
 let called=0;const sound=setup(class{constructor(){called++}});
 sound.setMuted(true);assert.equal(sound.play(),false);assert.equal(called,0);
 sound.setMuted(false);assert.equal(sound.isMuted(),false);
});
test('suspended browser audio does not schedule tones',()=>{
 let tones=0;const sound=setup(class{state='suspended';createOscillator(){tones++}});
 assert.equal(sound.play(),false);assert.equal(tones,0);
});
test('running audio schedules three short tones',()=>{
 let starts=0;
 const gain={gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};
 const sound=setup(class{
   state='running';currentTime=10;destination={};
   createGain(){return gain}
   createOscillator(){return {frequency:{value:0},connect(){},start(){starts++},stop(){}}}
 });
 assert.equal(sound.play(),true);assert.equal(starts,3);
});
