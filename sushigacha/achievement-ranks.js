'use strict';
/* Sushi achievement rank rules. No gem or sync mutations here. */
(function(global){
  const RANKS=Object.freeze([
    {id:'white',name:'WHITE',min:0,bg:'#fffdf8',fg:'#263238'},
    {id:'yellow',name:'YELLOW',min:500,bg:'#ffd54f',fg:'#302800'},
    {id:'orange',name:'ORANGE',min:2000,bg:'#fb8c00',fg:'#201300'},
    {id:'green',name:'GREEN',min:5000,bg:'#43a047',fg:'#ffffff'},
    {id:'blue',name:'BLUE',min:15000,bg:'#1976d2',fg:'#ffffff'},
    {id:'purple',name:'PURPLE',min:50000,bg:'#7b1fa2',fg:'#ffffff'},
    {id:'black',name:'BLACK',min:150000,bg:'#202124',fg:'#ffffff'}
  ]);
  const validCount=n=>Number.isSafeInteger(n)&&n>=0?n:0;
  function rankFor(count){const n=validCount(count);return [...RANKS].reverse().find(r=>n>=r.min)}
  function unlocked(count){const n=validCount(count);return RANKS.filter(r=>n>=r.min)}
  function select(count,preferred){return unlocked(count).find(r=>r.id===preferred)||rankFor(count)}
  function progress(count){const n=validCount(count),current=rankFor(n),i=RANKS.indexOf(current),next=RANKS[i+1]||null;return {current,next,remaining:next?next.min-n:0,ratio:next?Math.min(1,(n-current.min)/(next.min-current.min)):1}}
  function applyToTaskbar(count,preferred,element){
    const bar=element||global.document?.getElementById('sushiTaskbar');
    const rank=select(count,preferred);
    if(!bar)return rank;
    bar.style.setProperty('background',rank.bg,'important');
    bar.style.setProperty('--sushi-rank-foreground',rank.fg);
    bar.style.setProperty('--sushi-rank-divider',rank.id==='white'?'#eadfce':'#ffffff55');
    bar.dataset.sushiRank=rank.id;
    return rank;
  }
  global.SushiAchievementRanks=Object.freeze({RANKS,rankFor,unlocked,select,progress,applyToTaskbar});
})(window);
