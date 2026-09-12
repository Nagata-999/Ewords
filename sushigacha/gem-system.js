'use strict';
(() => {
  if (window.SushiGem) return;
  const LEDGER='sushitan_login_bonus_v1';
  const MAX_AWARD_IDS=120;

  function read(){
    try{
      const raw=localStorage.getItem(LEDGER);
      const ledger=raw?JSON.parse(raw):{};
      if(!ledger||typeof ledger!=='object'||Array.isArray(ledger))return {gems:0};
      return ledger;
    }catch(_e){return {gems:0};}
  }
  function write(ledger){localStorage.setItem(LEDGER,JSON.stringify(ledger));}
  function rewards(ledger){
    if(!ledger.gemRewards||typeof ledger.gemRewards!=='object'||Array.isArray(ledger.gemRewards))ledger.gemRewards={};
    if(!ledger.gemRewards.sources||typeof ledger.gemRewards.sources!=='object')ledger.gemRewards.sources={};
    if(!Array.isArray(ledger.gemRewards.awardIds))ledger.gemRewards.awardIds=[];
    return ledger.gemRewards;
  }
  function balance(){const ledger=read();return Number.isSafeInteger(ledger.gems)&&ledger.gems>=0?ledger.gems:0;}
  function awardScore(source,score,awardId,pointsPerGem=100){
    source=String(source||'game');score=Math.max(0,Math.floor(Number(score)||0));pointsPerGem=Math.max(1,Math.floor(Number(pointsPerGem)||100));
    const ledger=read(),r=rewards(ledger),id=awardId?String(awardId):'';
    if(id&&r.awardIds.includes(id))return {gems:0,remainder:r.sources[source]?.remainder||0,balance:balance(),duplicate:true};
    const src=r.sources[source]&&typeof r.sources[source]==='object'?r.sources[source]:{remainder:0,totalScore:0,totalGems:0};
    const previous=Math.max(0,Math.floor(Number(src.remainder)||0));
    const total=previous+score,gems=Math.floor(total/pointsPerGem),remainder=total%pointsPerGem;
    src.remainder=remainder;src.totalScore=Math.max(0,Math.floor(Number(src.totalScore)||0))+score;src.totalGems=Math.max(0,Math.floor(Number(src.totalGems)||0))+gems;
    r.sources[source]=src;
    if(id){r.awardIds.push(id);if(r.awardIds.length>MAX_AWARD_IDS)r.awardIds.splice(0,r.awardIds.length-MAX_AWARD_IDS);}
    ledger.gems=(Number.isSafeInteger(ledger.gems)&&ledger.gems>=0?ledger.gems:0)+gems;
    write(ledger);
    window.dispatchEvent(new CustomEvent('sushi-gems-earned',{detail:{source,score,gems,remainder,balance:ledger.gems}}));
    if(gems>0)window.dispatchEvent(new CustomEvent('sushi-avatar-reaction',{detail:{kind:'combo',text:`+${gems} GEM${gems===1?'':'S'}!`}}));
    return {gems,remainder,balance:ledger.gems,duplicate:false};
  }
  window.SushiGem={awardScore,balance};
})();
