'use strict';
(function(){
  let ctx=null;
  const sampleCache=new Map();
  const swordHits=[1,2,3,4,5].map(n=>`audio/sword/sword_hit_${n}.ogg`);
  const swordHeavy=[1,2,3].map(n=>`audio/sword/sword_heavy_${n}.ogg`);

  function settings(){try{return JSON.parse(localStorage.getItem('sushiDungeonAudioV1')||'{}')}catch{return {}}}
  function volume(){return Number(settings().seVolume??0.65)}
  function enabled(){return settings().enabled!==false}
  function context(){if(!ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;ctx=new C()}if(ctx.state==='suspended')ctx.resume();return ctx}
  function tone(freq,duration,type='sine',level=0.12,delay=0,endFreq=freq){const c=context();if(!c||!enabled())return;const t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(30,endFreq),t+duration);g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(level*volume(),t+0.008);g.gain.exponentialRampToValueAtTime(0.0001,t+duration);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+duration+0.02)}

  async function loadSample(url){
    const c=context();if(!c)return null;
    if(sampleCache.has(url))return sampleCache.get(url);
    const promise=fetch(url).then(r=>{if(!r.ok)throw new Error(url);return r.arrayBuffer()}).then(b=>c.decodeAudioData(b)).catch(()=>null);
    sampleCache.set(url,promise);
    return promise;
  }
  async function sample(url,level=0.48,rate=1){
    const c=context();if(!c||!enabled())return false;
    const buffer=await loadSample(url);if(!buffer)return false;
    const src=c.createBufferSource(),gain=c.createGain();
    src.buffer=buffer;src.playbackRate.value=rate;gain.gain.value=level*volume();src.connect(gain);gain.connect(c.destination);src.start();return true;
  }
  function randomOf(list){return list[Math.floor(Math.random()*list.length)]}
  async function swordHit(heavy=false){
    const list=heavy?swordHeavy:swordHits;
    const ok=await sample(randomOf(list),heavy?0.58:0.48,0.96+Math.random()*0.08);
    if(!ok)tone(105,0.13,'square',0.14,0,60);
  }

  const fx={
    attack(){tone(340,0.065,'sawtooth',0.055,0,145)},
    hit(){swordHit(false)},
    heavy(){swordHit(true)},
    hurt(){tone(180,0.16,'sawtooth',0.14,0,75)},
    item(){tone(660,0.08,'sine',0.12);tone(880,0.12,'sine',0.11,0.07)},
    chest(){tone(523,0.1,'triangle',0.12);tone(659,0.1,'triangle',0.12,0.09);tone(784,0.2,'triangle',0.13,0.18)},
    stairs(){tone(440,0.12,'sine',0.1);tone(330,0.14,'sine',0.1,0.1);tone(220,0.22,'sine',0.12,0.2)},
    explosion(){tone(90,0.4,'sawtooth',0.18,0,40);tone(55,0.42,'square',0.1,0.04,35)},
    level(){[523,659,784,1047].forEach((f,i)=>tone(f,0.14,'triangle',0.12,i*0.09))},
    error(){tone(180,0.12,'square',0.1);tone(130,0.16,'square',0.1,0.11)}
  };
  function play(name){fx[name]?.()}
  function observeMessages(){const el=document.getElementById('message');if(!el)return;let previous=el.textContent;new MutationObserver(()=>{const s=el.textContent||'';if(s===previous)return;previous=s;if(/レベル|Lv/.test(s))play('level');else if(/爆発/.test(s))play('explosion');else if(/会心|クリティカル|強烈/.test(s))play('heavy');else if(/正解|宝箱.*開|手に入れた/.test(s))play('chest');else if(/拾った|入手/.test(s))play('item');else if(/階段|次の階/.test(s))play('stairs');else if(/あなた.*ダメージ|ダメージを受け/.test(s))play('hurt');else if(/ダメージ/.test(s))play('hit');else if(/空振り|できない|不正解/.test(s))play('error')}).observe(el,{childList:true,subtree:true,characterData:true})}
  window.addEventListener('DOMContentLoaded',()=>{observeMessages();[...swordHits,...swordHeavy].forEach(loadSample);document.addEventListener('click',e=>{if(e.target.closest('#attackBtn'))play('attack');if(e.target.closest('#stairsYes'))play('stairs');if(e.target.closest('#inventoryList button'))play('item')})});
  window.addEventListener('sushi-explosion',()=>play('explosion'));
  window.sushiSfx={play};
})();
