const obj=(v        )=>v && typeof v==="object" && !Array.isArray(v) ? v                           : {};
const uniq=(a          )=>[...new Set(a.filter(x=>typeof x==="string"))].slice(-500);
function mergeLearning(a0        ,b0        ){
  const a=obj(a0),b=obj(b0),byId=new Map                ();
  for(const e of [...(Array.isArray(a.events)?a.events:[]),...(Array.isArray(b.events)?b.events:[])]){
    const x=obj(e),id=typeof x.id==="string"?x.id:"";
    if(!id)continue;
    const old=byId.get(id);
    if(!old){byId.set(id,e);continue}
    const prev=obj(old);
    // Legacy imports intentionally share an ID across devices. Preserve the
    // strongest observed snapshot instead of silently keeping whichever synced first.
    if(id.startsWith("import-")){
      const same=prev.word_id===x.word_id && prev.correct===x.correct && prev.game_id===x.game_id;
      if(same){
        byId.set(id,{...prev,...x,count:Math.max(Number(prev.count)||1,Number(x.count)||1),at:Math.max(Number(prev.at)||0,Number(x.at)||0)});
      }
    }
  }
  const cards=new Map                ();
  for(const card of [...(Array.isArray(a.cards)?a.cards:[]),...(Array.isArray(b.cards)?b.cards:[])]){
    const x=obj(card),id=typeof x.word_id==="string"?x.word_id:"";
    if(/^dictionary:sw-\d{5,}$/.test(id) && typeof x.en==="string" && x.en.trim() && typeof x.jp==="string" && x.jp.trim() && !cards.has(id)) cards.set(id,card);
  }
  return {version:1,registry_version:Math.max(Number(a.registry_version)||0,Number(b.registry_version)||0),events:[...byId.values()],cards:[...cards.values()]};
}
function mergeRankPreferences(a    ={},b    ={}){
    const normalize=(value    )=>({selected:['white','yellow','orange','green','blue','purple','black'].includes(value?.selected)?value.selected:null,selectionRevision:Number.isSafeInteger(value?.selectionRevision)&&value.selectionRevision>=0?value.selectionRevision:0,selectionDevice:typeof value?.selectionDevice==='string'?value.selectionDevice.slice(0,160):'',unlockedTotal:Number.isSafeInteger(value?.unlockedTotal)&&value.unlockedTotal>=0?value.unlockedTotal:0});
    const left=normalize(a),right=normalize(b);
    const rightWins=right.selectionRevision>left.selectionRevision||(right.selectionRevision===left.selectionRevision&&(right.selectionDevice>left.selectionDevice||(right.selectionDevice===left.selectionDevice&&String(right.selected)>String(left.selected))));
    const winner=rightWins?right:left;
    return {...winner,unlockedTotal:Math.max(left.unlockedTotal,right.unlockedTotal)};
  }
function mergeLedger(a0        ,b0        ,claimIds         =[]){
  const a=obj(a0),b=obj(b0),out={...a,...b}                          ;
  delete out.gemPendingEvents;
  out.achievementPreferences=mergeRankPreferences(obj(a.achievementPreferences),obj(b.achievementPreferences));
  const scores                      ={};
  for(const game of ["giri","blast"]){const previous=obj(a.achievementGameScores)[game],incoming=obj(b.achievementGameScores)[game];scores[game]=Math.max(Number.isSafeInteger(previous)?previous          :0,Number.isSafeInteger(incoming)?incoming          :0,0)}
  out.achievementGameScores=scores;
  const ae=Array.isArray(a.gemEvents)?a.gemEvents:[],be=Array.isArray(b.gemEvents)?b.gemEvents:[];
  const gemById=new Map                               ();
  // Keep processed IDs after the visible 1,000-event history is pruned.
  // Only server state and authenticated claim receipts seed this archive.
  const serverIds=new Set        ([...(Array.isArray(a.gemEventIds)?a.gemEventIds:[]),...claimIds].filter((id)             =>typeof id==="string"&&id.length>0&&id.length<=200));
  const archivedIds=new Set(Array.isArray(a.gemEventIds)?a.gemEventIds:[]);
  let earned=Math.max(0,Number(a.gemsEarnedTotal)||0);
  for(const event of ae){const e=obj(event);if(e.type==="earn"&&(!Number.isSafeInteger(a.gemsEarnedTotal)||!archivedIds.has(e.id)))earned+=Math.max(0,Number(e.amount)||0);}
  for(const ev of ae){const x=obj(ev),id=typeof x.id==="string"?x.id:"";if(id){serverIds.add(id);if(!gemById.has(id))gemById.set(id,x)}}
  let balance=Math.max(0,Math.floor(Number(a.gems)||0));
  for(const ev of be){
    const x=obj(ev),id=typeof x.id==="string"?x.id:"";
    if(!id)continue;
    if(serverIds.has(id))continue;
    // Achievement credits are minted only by the claim RPC, never client events.
    if(id.startsWith("achievement:"))continue;
    if((x.type!=="earn"&&x.type!=="spend")||!Number.isSafeInteger(x.amount)||(x.amount          )<=0)throw new Error("invalid_gem_event");
    gemById.set(id,x);
    const amount=Math.max(0,Math.floor(Number(x.amount)||0));
    if(x.type==="earn"){balance+=amount;earned+=amount;}
    else if(x.type==="spend")balance-=amount;
    serverIds.add(id);
  }
  const events=[...gemById.values()].slice(-1000);
  // Event IDs, not client timestamps, are the source of truth. Client clocks can
  // differ from the server and previously caused fresh rewards to be discarded.
  out.gemEvents=events;out.gems=Math.max(0,balance);
  out.gemEventIds=[...serverIds];
  out.gemsEarnedTotal=earned;
  if(!Number.isSafeInteger(balance)||!Number.isSafeInteger(earned))throw new Error("invalid_gem_total");
  out.gemSyncBase=out.gems;out.gemSyncBaseAt=Date.now();
  const ag=obj(a.gacha),bg=obj(b.gacha);
  const serverRev=Math.max(0,Number(ag.avatarRevision)||0),clientRev=Math.max(0,Number(bg.avatarRevision)||0);
  const serverAt=Math.max(0,Number(ag.avatarUpdatedAt)||0),clientAt=Math.max(0,Number(bg.avatarUpdatedAt)||0);
  const clientWins=clientRev>serverRev||(clientRev===serverRev&&clientRev>0&&clientAt>serverAt);
  const avatarSource=clientWins?bg:ag;
  out.gacha={...ag,...bg,avatar:avatarSource.avatar,avatarRevision:Math.max(serverRev,clientRev),avatarUpdatedAt:clientWins?clientAt:serverAt,owned:uniq([...(Array.isArray(ag.owned)?ag.owned:[]),...(Array.isArray(bg.owned)?bg.owned:[])])};
  const personalityValid=(v    )=>["serious","casual"].includes(v?.kind)&&Number.isSafeInteger(v.updatedAt)&&v.updatedAt>=0;
  const pa=obj(a.avatarPersonality),pb=obj(b.avatarPersonality);
  out.avatarPersonality=personalityValid(pb)&&(!personalityValid(pa)||(pb.updatedAt>pa.updatedAt||(pb.updatedAt===pa.updatedAt&&pb.kind>pa.kind)))?pb:personalityValid(pa)?pa:{kind:"serious",updatedAt:0};
  const ad=obj(a.dailyQuests),bd=obj(b.dailyQuests);
  const aday=String(ad.day||""),bday=String(bd.day||"");
  if(aday&&bday&&aday===bday){
    const ap=obj(ad.progress),bp=obj(bd.progress),ac=obj(ad.claimed),bc=obj(bd.claimed);
    const progress                      ={},claimed                       ={};
    for(const k of new Set([...Object.keys(ap),...Object.keys(bp)])) progress[k]=Math.max(0,Number(ap[k])||0,Number(bp[k])||0);
    for(const k of new Set([...Object.keys(ac),...Object.keys(bc)])) claimed[k]=Boolean(ac[k]||bc[k]);
    const active=Array.isArray(bd.active)&&bd.active.length?bd.active:(Array.isArray(ad.active)?ad.active:[]);
    out.dailyQuests={...ad,...bd,day:bday,active,progress,claimed,chestClaimed:Boolean(ad.chestClaimed||bd.chestClaimed),chestReward:Math.max(Number(ad.chestReward)||0,Number(bd.chestReward)||0)};
  }else if(bday && (!aday || bday>aday)) out.dailyQuests=bd;
  else if(aday) out.dailyQuests=ad;
  // Merge only known game score-tier unlock IDs. Never trust these for gem awards.
  const allowed=new Set(["giri:10000","giri:30000","giri:50000","blast:1000","blast:5000","blast:10000","blast:20000"]);
  const unlocks=[...(Array.isArray(a.achievementUnlocks)?a.achievementUnlocks:[]),...(Array.isArray(b.achievementUnlocks)?b.achievementUnlocks:[])];
  out.achievementUnlocks=[...new Set(unlocks.filter(x=>typeof x==="string"&&x.startsWith("achievement:")&&allowed.has(x.slice(12))))];
  for(const k of ["loginManualClaims","dailyGemClaims"]){
    out[k]=uniq([...(Array.isArray(a[k])?a[k]             :[]),...(Array.isArray(b[k])?b[k]             :[])]);
  }
  const total=Math.max(Number(a.loginBonusTotal)||0,Number(b.loginBonusTotal)||0,Number(a.total)||0,Number(b.total)||0,(out.dailyGemClaims             ).length);
  const aStreak=Math.max(0,Number(a.loginBonusStreak??a.streak)||0),bStreak=Math.max(0,Number(b.loginBonusStreak??b.streak)||0);
  const aDay=String(a.loginBonusLastDay||a.lastDay||a.lastLoginDay||""),bDay=String(b.loginBonusLastDay||b.lastDay||b.lastLoginDay||"");
  const streak=aDay>bDay?aStreak:bDay>aDay?bStreak:Math.max(aStreak,bStreak);
  out.loginBonusBestStreak=Math.max(Number(a.loginBonusBestStreak)||0,Number(b.loginBonusBestStreak)||0,aStreak,bStreak);
  const days=[a.loginBonusLastDay,b.loginBonusLastDay,a.lastDay,b.lastDay,a.lastLoginDay,b.lastLoginDay].map(x=>String(x||"")).sort();
  const lastDay=days[days.length-1]||"";
  out.loginBonusTotal=total; out.total=total;
  out.loginBonusStreak=streak; out.streak=streak;
  out.loginBonusLastDay=lastDay; out.lastDay=lastDay; out.lastLoginDay=lastDay;
  return out;
}

export {mergeLearning,mergeLedger};
