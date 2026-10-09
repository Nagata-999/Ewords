'use strict';
/* Optional unlock chime. Never starts an AudioContext until a user action
 * has already unlocked browser audio. No external sound assets required. */
(function(root,factory){
 const api=factory(root);
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.SushiAchievementSound=api;
})(typeof window==='undefined'?null:window,function(root){
 let context=null;
 let muted=false;
 function setMuted(value){muted=!!value;return muted}
 function play(){
   if(muted||!root)return false;
   const AudioContext=root.AudioContext||root.webkitAudioContext;
   if(!AudioContext)return false;
   try{
     context=context||new AudioContext();
     if(context.state==='running')return schedule(context);
     if(context.state==='suspended'&&typeof context.resume==='function'){
       context.resume().then(()=>{if(!muted&&context.state==='running')schedule(context)}).catch(()=>{});
     }
     return false;
   }catch{return false}
 }
 function schedule(ctx){
   try{
     const now=ctx.currentTime;
     [659.25,783.99,987.77].forEach((frequency,i)=>{
       const oscillator=ctx.createOscillator(),gain=ctx.createGain();
       oscillator.type='sine';oscillator.frequency.value=frequency;
       gain.gain.setValueAtTime(0.0001,now+i*.11);
       gain.gain.exponentialRampToValueAtTime(.065,now+i*.11+.015);
       gain.gain.exponentialRampToValueAtTime(.0001,now+i*.11+.23);
       oscillator.connect(gain);gain.connect(ctx.destination);
       oscillator.start(now+i*.11);oscillator.stop(now+i*.11+.24);
     });
     return true;
   }catch{return false}
 }
 return Object.freeze({play,setMuted,isMuted:()=>muted});
});
