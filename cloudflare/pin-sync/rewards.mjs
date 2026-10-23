const schedules={
 all_correct:{10:10,500:25,2000:50,5000:75,15000:100,50000:200,150000:300},
 vocabulary:{10:10,100:25,1000:50,5000:75,10000:100,50000:200,100000:300},
 toeic:{10:10,100:25,1000:300},practice:{7:10,14:25,21:50,28:75,35:100,42:200,49:300},
 login_03:{1:10},login_05:{1:10},login_23:{1:10},
 streak:{3:10,7:25,30:50,100:100,365:300},
 review:{10:10,100:25,1000:50,5000:100},combo:{10:10,50:50,100:200},resilience:{1:100},comeback:{1:100},
 daily:{1:10,10:25,100:100},gems:{100:10,1000:25,10000:100},avatar:{1:10,10:50,30:150},
 first_purchase:{1:10},first_outfit:{1:10},all_games_day:{5:100},
 giri:{10000:25,30000:100,50000:300},blast:{1000:10,5000:25,10000:100,20000:200}
};
const array=value=>Array.isArray(value)?value:[];
const number=value=>Number.isFinite(Number(value))?Number(value):0;
const distinctCount=value=>new Set(array(value).map(entry=>typeof entry==='string'?entry:JSON.stringify(entry))).size;
const dayJst=value=>new Date(new Date(value).getTime()+9*3600000).toISOString().slice(0,10);
function timestampMicros(value){
 const text=String(value),millis=Date.parse(text);
 if(!Number.isFinite(millis))throw Error('invalid_outcome_timestamp');
 const fraction=text.match(/\.(\d+)(?:Z|[+-]\d\d(?::?\d\d)?)$/)?.[1]||'';
 return BigInt(millis)*1000n+BigInt(fraction.padEnd(6,'0').slice(3,6)||'0');
}
export function outcomeValues(rows){
 const ordered=[...rows].sort((left,right)=>{const first=timestampMicros(left.occurred_at),second=timestampMicros(right.occurred_at);return first<second?-1:first>second?1:left.event_id<right.event_id?-1:left.event_id>right.event_id?1:0});
 let review=0,streak=0,combo=0,resilience=0,comeback=0,broken=false;const misses=new Map();
 for(const row of ordered){
  const key=row.game_id+':'+row.question_id;
  if(row.correct){
   streak++;combo=Math.max(combo,streak);if(row.review)review++;
   if((misses.get(key)||0)>=2){resilience++;misses.set(key,0)}
   if(broken&&streak>=10){comeback=1;broken=false}
  }else{misses.set(key,(misses.get(key)||0)+1);if(streak>=10)broken=true;streak=0}
 }
 return {review,combo,resilience,comeback};
}
export function rewardEligibility(category,threshold,context){
 const schedule=Object.hasOwn(schedules,category)?schedules[category]:null;
 if(!Number.isSafeInteger(threshold)||!schedule||!Object.hasOwn(schedule,threshold))return {ok:false,error:'unknown_stage'};
 const ledger=context.ledger||{},events=array(context.events),activity=context.activity||{},claimId='achievement:'+category+':'+threshold;
 let value=0;
 if(category==='all_correct')value=number(context.baseline)+events.reduce((total,row)=>total+number(row.correct_count),0);
 else if(category==='vocabulary'||category==='toeic')value=events.filter(row=>category==='toeic'?row.game_id==='toeic':['sushitan','shinotan','antonitan','idiom','sushi_idiom'].includes(row.game_id)).reduce((total,row)=>total+number(row.correct_count),0);
 else if(category==='practice')value=number(activity.best_streak);
 else if(category.startsWith('login_'))value=activity['hour_'+category.slice(6)]?1:0;
 else if(category==='streak')value=Math.max(number(ledger.loginBonusBestStreak),number(ledger.loginBonusStreak),number(ledger.streak));
 else if(['review','combo','resilience','comeback'].includes(category))value=outcomeValues(array(context.outcomes))[category];
 else if(category==='daily')value=distinctCount(ledger.dailyGemClaims);
 else if(category==='avatar')value=distinctCount(ledger.gacha?.owned);
 else if(category==='gems'){
  const stored=String(ledger.gemsEarnedTotal??'');
  value=Math.max(/^\d{1,16}$/.test(stored)?Math.min(Number.MAX_SAFE_INTEGER,Number(stored)):0,array(ledger.gemEvents).reduce((total,event)=>total+(event.type==='earn'&&/^\d+$/.test(String(event.amount))?Math.min(1000000,Number(event.amount)):0),0));
 }else if(category==='first_purchase')value=array(ledger.gemEvents).some(event=>event.type==='spend'&&/^[1-9][0-9]*$/.test(String(event.amount)))?1:0;
 else if(category==='first_outfit')value=number(ledger.gacha?.avatarRevision)>0?1:0;
 else if(category==='giri'||category==='blast')value=array(ledger.achievementUnlocks).includes(claimId)?threshold:0;
 else if(category==='all_games_day'){
  const games=new Map();for(const row of events){if(number(row.correct_count)<=0)continue;const day=dayJst(row.occurred_at);if(!games.has(day))games.set(day,new Set());games.get(day).add(row.game_id)}
  value=Math.max(0,...[...games.values()].map(group=>group.size));
 }
 if(value<threshold)return {ok:false,error:category==='giri'||category==='blast'?'not_unlocked':'not_reached'};
 return {ok:true,claimId,gems:schedule[threshold]};
}
