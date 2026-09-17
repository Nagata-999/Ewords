(function(){
 'use strict';
 const learning=window.SushiLearning;if(!learning)return;
 function render(){
  const box=document.getElementById('sharedLearning');if(!box)return;
  const stats=learning.getStats();
  box.querySelector('[data-learning="weak"]').textContent=stats.weak;
  box.querySelector('[data-learning="today"]').textContent=stats.today_review;
  box.querySelector('[data-learning="mastered"]').textContent=stats.mastered_today;
 }
 document.addEventListener('DOMContentLoaded',render);
 for(const event of ['sushi-learning-answer','sushi-learning-change','pageshow','focus'])window.addEventListener(event,render);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});
 // Keep the Japanese calendar-day counters current when the home tab stays open.
 setInterval(render,60000);
})();
