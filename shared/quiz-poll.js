(function(){
'use strict';
// Scheduling only: no credentials, persistence or rewards live here.
window.SushiQuizPoll=function(fn,options){
 let stopped=false,running=false,timer=null,wakePending=false;
 const clear=()=>{if(timer!==null)clearTimeout(timer);timer=null};
 const paused=()=>navigator.onLine===false||(document.hidden&&!options.isHost());
 const schedule=ms=>{clear();if(!stopped)timer=setTimeout(run,ms)};
 async function run(){
  clear();if(stopped||running)return;
  if(paused())return;
  running=true;
  try{await fn()}catch(error){console.error('quiz poll failed',error)}
  finally{
   running=false;
   if(stopped)return;
   const delay=options.delay();
   if(delay===null){stop();return;}
   if(wakePending){wakePending=false;schedule(0)}else schedule(delay);
  }
 }
 function wake(){if(stopped||paused())return;if(running){wakePending=true;return;}schedule(0)}
 function stop(){stopped=true;clear();document.removeEventListener('visibilitychange',wake);window.removeEventListener('online',wake);window.removeEventListener('pagehide',stop)}
 document.addEventListener('visibilitychange',wake);
 window.addEventListener('online',wake);
 window.addEventListener('pagehide',stop);
 run();return stop;
};
})();
