'use strict';
(() => {
  if(window.__sushitanLuckyGemsLoaded)return;
  window.__sushitanLuckyGemsLoaded=true;
  const feedback=document.getElementById('feedbackText');
  if(!feedback)return;
  const session=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  let seq=0,audioCtx=null,lastText='';
  const style=document.createElement('style');
  style.textContent=`.sushitan-lucky-gem{position:fixed;left:50%;top:44%;z-index:99999;pointer-events:none;font:1000 28px/1 system-ui;color:#67e8f9;text-shadow:0 0 12px #22d3ee,0 2px 0 #0e7490;animation:luckyGemPop 1s ease-out forwards}.sushitan-lucky-gem.rainbow{color:#f5d0fe;text-shadow:0 0 10px #fff,0 0 22px #f472b6,0 0 30px #22d3ee}@keyframes luckyGemPop{0%{opacity:0;transform:translate(-50%,-30%) scale(.5)}18%{opacity:1;transform:translate(-50%,-45%) scale(1.25)}100%{opacity:0;transform:translate(-50%,-145%) scale(.9)}}`;
  document.head.appendChild(style);
  function ensureAudio(){try{if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume()}catch{}}
  function chime(rainbow){ensureAudio();if(!audioCtx)return;const now=audioCtx.currentTime,notes=rainbow?[[1047,0],[1319,.06],[1568,.12],[2093,.18]]:[[988,0],[1319,.08],[1760,.16]];notes.forEach(([f,d])=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.setValueAtTime(f,now+d);g.gain.setValueAtTime(.001,now+d);g.gain.exponentialRampToValueAtTime(.075,now+d+.01);g.gain.exponentialRampToValueAtTime(.001,now+d+.12);o.connect(g);g.connect(audioCtx.destination);o.start(now+d);o.stop(now+d+.14)})}
  function award(amount,rainbow){if(!window.SushiGem)return;window.SushiGem.awardScore('sushitan-lucky',amount,`sushitan-lucky:${session}:${++seq}`,1);const el=document.createElement('div');el.className='sushitan-lucky-gem'+(rainbow?' rainbow':'');el.textContent=rainbow?`🌈 LUCKY! +${amount} 💎`:`LUCKY! +${amount} 💎`;document.body.appendChild(el);setTimeout(()=>el.remove(),1050);chime(rainbow);navigator.vibrate?.(rainbow?[20,25,20,25,60]:[20,30,20])}
  function check(){const t=(feedback.textContent||'').trim();if(!t||t===lastText)return;lastText=t;if(!/^Nice!/i.test(t))return;const r=Math.random();if(r<.005)award(5,true);else if(r<.055)award(1,false)}
  new MutationObserver(check).observe(feedback,{childList:true,subtree:true,characterData:true});
  window.addEventListener('pointerdown',ensureAudio,{once:true});
})();
