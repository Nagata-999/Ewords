'use strict';
(function(){
  let ctx=null;
  function volume(){try{return Number(JSON.parse(localStorage.getItem('sushiDungeonAudioV1')||'{}').seVolume??0.65)}catch{return 0.65}}
  function enabled(){try{return JSON.parse(localStorage.getItem('sushiDungeonAudioV1')||'{}').enabled!==false}catch{return true}}
  function context(){if(!ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;ctx=new C()}if(ctx.state==='suspended')ctx.resume();return ctx}
  function tone(freq,duration,type='sine',level=0.12,delay=0,endFreq=freq){const c=context();if(!c||!enabled())return;const t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(30,endFreq),t+duration);g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(level*volume(),t+0.008);g.gain.exponentialRampToValueAtTime(0.0001,t+duration);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+duration+0.02)}
  const fx={
    attack(){tone(320,0.08,'sawtooth',0.12,0,120)},
    hit(){tone(105,0.13,'square',0.14,0,60)},
    hurt(){tone(180,0.16,'sawtooth',0.14,0,75)},
    item(){tone(660,0.08,'sine',0.12);tone(880,0.12,'sine',0.11,0.07)},
    chest(){tone(523,0.1,'triangle',0.12);tone(659,0.1,'triangle',0.12,0.09);tone(784,0.2,'triangle',0.13,0.18)},
    stairs(){tone(440,0.12,'sine',0.1);tone(330,0.14,'sine',0.1,0.1);tone(220,0.22,'sine',0.12,0.2)},
    explosion(){tone(90,0.4,'sawtooth',0.18,0,40);tone(55,0.42,'square',0.1,0.04,35)},
    level(){[523,659,784,1047].forEach((f,i)=>tone(f,0.14,'triangle',0.12,i*0.09))},
    error(){tone(180,0.12,'square',0.1);tone(130,0.16,'square',0.1,0.11)}
  };
  function play(name){fx[name]?.()}
  function observeMessages(){const el=document.getElementById('message');if(!el)return;let previous=el.textContent;new MutationObserver(()=>{const s=el.textContent||'';if(s===previous)return;previous=s;if(/レベル|Lv/.test(s))play('level');else if(/爆発/.test(s))play('explosion');else if(/正解|宝箱.*開|手に入れた/.test(s))play('chest');else if(/拾った|入手/.test(s))play('item');else if(/階段|次の階/.test(s))play('stairs');else if(/あなた.*ダメージ|ダメージを受け/.test(s))play('hurt');else if(/ダメージ/.test(s))play('hit');else if(/空振り|できない|不正解/.test(s))play('error')}).observe(el,{childList:true,subtree:true,characterData:true})}
  window.addEventListener('DOMContentLoaded',()=>{observeMessages();document.addEventListener('click',e=>{if(e.target.closest('#attackBtn'))play('attack');if(e.target.closest('#stairsYes'))play('stairs');if(e.target.closest('#inventoryList button'))play('item')})});
  window.addEventListener('sushi-explosion',()=>play('explosion'));
  window.sushiSfx={play};
})();
