'use strict';
(function(root){
  const dates=value=>[...new Set((Array.isArray(value)?value:[]).filter(d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)))].sort();
  const count=n=>Math.max(0,Number.isSafeInteger(n)?n:0);
  function previous(day){return new Date(Date.parse(day+'T12:00:00Z')-86400000).toISOString().slice(0,10)}
  function normalize(input){const l={...input};l.loginManualClaims=dates(l.loginManualClaims);const manual=l.loginBonusLastDay!==undefined||l.loginButtonModeV1;l.loginBonusTotal=count(manual?l.loginBonusTotal:l.total);l.loginBonusStreak=count(manual?l.loginBonusStreak:l.streak);l.loginBonusLastDay=String(manual?l.loginBonusLastDay||'':l.lastDay||l.lastLoginDay||'');l.loginBonusBestStreak=Math.max(count(l.loginBonusBestStreak),l.loginBonusStreak);l.loginButtonModeV1=true;return l}
  function claim(input,day,at){const ledger=normalize(input),id='login:'+day;const known=[...(ledger.gemEvents||[]),...(ledger.gemPendingEvents||[])].some(e=>e?.id===id)||(ledger.gemAcknowledgedIds||[]).includes(id)||(ledger.gemEventIds||[]).includes(id);
    if(ledger.loginManualClaims.includes(day)||known){if(known)ledger.loginManualClaims=dates([...ledger.loginManualClaims,day]).slice(-400);return {ledger,gems:0,alreadyClaimed:true}}
    // A legacy page may already have advanced today's date. Do not reset its streak.
    const streak=ledger.loginBonusLastDay===previous(day)?ledger.loginBonusStreak+1:ledger.loginBonusLastDay===day?Math.max(1,ledger.loginBonusStreak):1;
    const total=ledger.loginBonusTotal+1,gems=10+(streak%7===0?100:0),event={id,type:'earn',amount:gems,source:'login-bonus',at};
    ledger.loginBonusStreak=ledger.streak=streak;ledger.loginBonusTotal=ledger.total=total;ledger.loginBonusLastDay=ledger.lastDay=ledger.lastLoginDay=day;ledger.loginBonusBestStreak=Math.max(streak,ledger.loginBonusBestStreak);ledger.loginManualClaims=dates([...ledger.loginManualClaims,day]).slice(-400);
    ledger.gems=count(ledger.gems)+gems;ledger.gemEvents=[...(ledger.gemEvents||[]),event].slice(-1000);ledger.gemPendingEvents=[...(ledger.gemPendingEvents||[]),event];
    return {ledger,gems,alreadyClaimed:false};
  }
  const api={normalize,claim};if(typeof module==='object'&&module.exports)module.exports=api;else root.SushiLoginBonusModel=api;
})(typeof window!=='undefined'?window:globalThis);
