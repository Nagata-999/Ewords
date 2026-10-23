import {mergeLedger,mergeLearning} from './profile-merge.mjs';
import {rewardEligibility} from './rewards.mjs';

export async function learningHash(serialized){
 const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(serialized)));
 return Array.from(bytes,value=>value.toString(16).padStart(2,'0')).join('');
}

export class ProfileStore {
 constructor(database){this.database=database}
 async ensureLearningIndex(account){
  for(let attempt=0;attempt<5;attempt++){
   const row=await this.database.prepare(`SELECT learning_indexed,revision,
    CASE WHEN learning_indexed=0 THEN COALESCE(json_extract(learning,'$.registry_version'),0) END AS registry_version,
    CASE WHEN learning_indexed=0 THEN (SELECT COUNT(*) FROM json_each(learning,'$.events'))=(SELECT COUNT(DISTINCT CASE WHEN type='object' AND typeof(json_extract(value,'$.id'))='text' AND length(json_extract(value,'$.id'))>0 THEN json_extract(value,'$.id') END) FROM json_each(learning,'$.events')) ELSE 1 END AS events_canonical,
    CASE WHEN learning_indexed=0 THEN (SELECT COUNT(*) FROM json_each(learning,'$.cards'))=(SELECT COUNT(DISTINCT CASE WHEN type='object' AND typeof(json_extract(value,'$.word_id'))='text' THEN json_extract(value,'$.word_id') END) FROM json_each(learning,'$.cards')) ELSE 1 END AS cards_canonical
    FROM pin_sync_profiles WHERE account=?`).bind(account).first();
   if(!row)throw Error('profile_not_found');if(row.learning_indexed)return;
   if(!row.events_canonical||!row.cards_canonical)throw Object.assign(Error('learning_format_requires_review'),{status:409});
   const operation=crypto.randomUUID(),registry=Math.max(0,Number(row.registry_version)||0);
   const saved=await this.database.batch([
    this.database.prepare("UPDATE pin_sync_profiles SET learning_indexed=1,learning_registry_version=?,learning_event_count=COALESCE(json_array_length(learning,'$.events'),0),learning_card_count=COALESCE(json_array_length(learning,'$.cards'),0),learning_operation=?,revision=revision+1 WHERE account=? AND revision=? AND learning_indexed=0").bind(Number.isFinite(registry)?registry:null,operation,account,row.revision),
    this.database.prepare("INSERT INTO pin_sync_learning_events(account,event_id,sort_order,document) SELECT account,json_extract(entry.value,'$.id'),CAST(entry.key AS INTEGER),json(entry.value) FROM pin_sync_profiles,json_each(learning,'$.events') entry WHERE account=? AND learning_operation=?").bind(account,operation),
    this.database.prepare("INSERT INTO pin_sync_learning_cards(account,word_id,sort_order,document) SELECT account,json_extract(entry.value,'$.word_id'),CAST(entry.key AS INTEGER),json(entry.value) FROM pin_sync_profiles,json_each(learning,'$.cards') entry WHERE account=? AND learning_operation=?").bind(account,operation)
   ]);
   if(saved[0].meta.changes===1)return;
  }
  throw Object.assign(Error('profile_sync_conflict'),{status:409});
 }
 async learningPage(account,body){
  const offset=body.offset??0;
  if(!Number.isSafeInteger(offset)||offset<0||offset>1000000)throw Object.assign(Error('invalid_learning_page'),{status:400});
  await this.ensureLearningIndex(account);
  const row=await this.database.prepare(`SELECT revision,learning_registry_version AS registry_version,
   learning_event_count AS events_total,learning_card_count AS cards_total,
   (SELECT json_group_array(json(document)) FROM (SELECT document FROM pin_sync_learning_events WHERE account=? AND sort_order>=? ORDER BY sort_order LIMIT 128)) AS events,
   (SELECT json_group_array(json(document)) FROM (SELECT document FROM pin_sync_learning_cards WHERE account=? AND sort_order>=? ORDER BY sort_order LIMIT 128)) AS cards
   FROM pin_sync_profiles WHERE account=?`).bind(account,offset,account,offset,account).first();
  if(!row)throw Error('profile_not_found');
  if(body.revision!==undefined&&body.revision!==row.revision)throw Object.assign(Error('learning_snapshot_changed'),{status:409});
  const header={ok:true,sushi_id:account,revision:row.revision,events_total:row.events_total||0,cards_total:row.cards_total||0};
  return JSON.stringify(header).slice(0,-1)+',"learning":{"version":1,"registry_version":'+JSON.stringify(row.registry_version)+',"events":'+row.events+',"cards":'+row.cards+'}}';
 }
 async learningBatch(account,body){
  const incoming=body.learning;
  if(!incoming||!Array.isArray(incoming.events)||!Array.isArray(incoming.cards)||incoming.events.length>64||incoming.cards.length>32||new TextEncoder().encode(JSON.stringify(incoming)).length>32768)throw Object.assign(Error('invalid_learning_batch'),{status:400});
  await this.ensureLearningIndex(account);
  const normalized=mergeLearning({},incoming),eventIds=JSON.stringify(normalized.events.map(event=>event.id)),cardIds=JSON.stringify(normalized.cards.map(card=>card.word_id));
  for(let attempt=0;attempt<5;attempt++){
   const row=await this.database.prepare('SELECT revision,learning_registry_version AS registry_version,learning_event_count,learning_card_count FROM pin_sync_profiles WHERE account=?').bind(account).first();
   if(!row)throw Error('profile_not_found');
   const storedEvents=(await this.database.prepare('SELECT event_id AS id,sort_order,document FROM pin_sync_learning_events WHERE account=? AND event_id IN (SELECT value FROM json_each(?))').bind(account,eventIds).all()).results.sort((first,second)=>first.sort_order-second.sort_order);
   const storedCards=(await this.database.prepare('SELECT word_id AS id,sort_order,document FROM pin_sync_learning_cards WHERE account=? AND word_id IN (SELECT value FROM json_each(?))').bind(account,cardIds).all()).results.sort((first,second)=>first.sort_order-second.sort_order);
   const merged=mergeLearning({events:storedEvents.map(entry=>JSON.parse(entry.document)),cards:storedCards.map(entry=>JSON.parse(entry.document)),registry_version:row.registry_version},incoming);
   function patches(entries,stored,key,start){
    const known=new Map(stored.map(entry=>[entry.id,entry])),changes=[];let next=start;
    for(const entry of entries){const previous=known.get(entry[key]),serialized=JSON.stringify(entry);if(previous?.document===serialized)continue;changes.push({id:entry[key],sort_order:previous?.sort_order??next++,document:entry})}
    return {changes,count:next};
   }
   const events=patches(merged.events,storedEvents,'id',row.learning_event_count),cards=patches(merged.cards,storedCards,'word_id',row.learning_card_count),operation=crypto.randomUUID();
   const insert=(table,key,changes)=>this.database.prepare(`INSERT INTO ${table}(account,${key},sort_order,document) SELECT ?,json_extract(value,'$.id'),json_extract(value,'$.sort_order'),json(json_extract(value,'$.document')) FROM json_each(?) WHERE EXISTS(SELECT 1 FROM pin_sync_profiles WHERE account=? AND learning_operation=?) ON CONFLICT(account,${key}) DO UPDATE SET document=excluded.document`).bind(account,JSON.stringify(changes),account,operation);
   const saved=await this.database.batch([
    this.database.prepare('UPDATE pin_sync_profiles SET learning_registry_version=?,learning_event_count=?,learning_card_count=?,learning_operation=?,revision=revision+1,updated_at=? WHERE account=? AND revision=? AND learning_indexed=1').bind(Number.isFinite(merged.registry_version)?merged.registry_version:null,events.count,cards.count,operation,new Date().toISOString(),account,row.revision),
    insert('pin_sync_learning_events','event_id',events.changes),insert('pin_sync_learning_cards','word_id',cards.changes)
   ]);
   if(saved[0].meta.changes===1)return {ok:true,sushi_id:account,revision:row.revision+1,event_ids:normalized.events.map(event=>event.id),card_ids:normalized.cards.map(card=>card.word_id)};
  }
  throw Object.assign(Error('profile_sync_conflict'),{status:409});
 }
 async syncWallet(account,incoming){
  if(Object.hasOwn(incoming,'learning')||!Number.isSafeInteger(incoming.learning_revision))throw Object.assign(Error('invalid_wallet_snapshot'),{status:400});
  const snapshot=await this.read(account,false);
  if(snapshot.revision!==incoming.learning_revision)throw Object.assign(Error('learning_snapshot_changed'),{status:409});
  const claims=await this.claimIds(account),ledger=mergeLedger(snapshot.ledger,incoming.ledger,claims),name=snapshot.player_name||((typeof incoming.player_name==='string'?incoming.player_name.normalize('NFKC').trim().slice(0,20):null));
  const saved=await this.database.prepare('UPDATE pin_sync_profiles SET ledger=?,player_name=?,revision=revision+1,updated_at=? WHERE account=? AND revision=?').bind(JSON.stringify(ledger),name,new Date().toISOString(),account,snapshot.revision).run();
  if(saved.meta.changes!==1)throw Object.assign(Error('learning_snapshot_changed'),{status:409});
  const {gemEventIds:archive,...publicLedger}=ledger,known=new Set(archive);
  publicLedger.gemAcknowledgedIds=(Array.isArray(incoming.ledger?.gemEvents)?incoming.ledger.gemEvents:[]).map(event=>event?.id).filter(id=>typeof id==='string'&&known.has(id));
  return {ok:true,sushi_id:account,player_name:name,ledger:publicLedger,revision:snapshot.revision+1};
 }
 async learningSnapshot(account){
  const row=await this.database.prepare('SELECT learning,learning_indexed FROM pin_sync_profiles WHERE account=?').bind(account).first();
  if(!row)throw Error('profile_not_found');
  if(row.learning_indexed)throw Object.assign(Error('learning_batch_required'),{status:409});
  return '{"ok":true,"sushi_id":'+JSON.stringify(account)+',"learning_hash":'+JSON.stringify(await learningHash(row.learning))+',"learning":'+row.learning+'}';
 }
 async read(account,includeLearning=true){
  const fields=includeLearning?'*':'account,player_name,ledger,revision,updated_at';
  const row=await this.database.prepare('SELECT '+fields+' FROM pin_sync_profiles WHERE account=?').bind(account).first();
  if(!row)throw Error('profile_not_found');
  if(includeLearning&&row.learning_indexed)throw Object.assign(Error('learning_batch_required'),{status:409});
  return {...row,ledger:JSON.parse(row.ledger),...(includeLearning?{learning:JSON.parse(row.learning)}:{})};
 }
 async claimIds(account){return (await this.database.prepare('SELECT claim_id FROM pin_sync_claims WHERE account=?').bind(account).all()).results.map(row=>row.claim_id)}
 async sync(account,incoming,serialized=false){
  for(let attempt=0;attempt<5;attempt++){
   let snapshot,learning,learningJSON;
   if(incoming.learning_unchanged){
    const row=await this.database.prepare('SELECT * FROM pin_sync_profiles WHERE account=?').bind(account).first();
    if(!row)throw Error('profile_not_found');
    if(row.learning_indexed)throw Object.assign(Error('learning_batch_required'),{status:409});
    if(Object.hasOwn(incoming,'learning')||incoming.learning_unchanged!==await learningHash(row.learning))throw Object.assign(Error('learning_snapshot_changed'),{status:409});
    snapshot={...row,ledger:JSON.parse(row.ledger)};learningJSON=row.learning;
   }else{
    snapshot=await this.read(account);learning=mergeLearning(snapshot.learning,incoming.learning);learningJSON=JSON.stringify(learning);
   }
   const claimIds=await this.claimIds(account),ledger=mergeLedger(snapshot.ledger,incoming.ledger,claimIds);
   const name=snapshot.player_name||((typeof incoming.player_name==='string'?incoming.player_name.normalize('NFKC').trim().slice(0,20):null));
   const saved=incoming.learning_unchanged
    ?await this.database.prepare('UPDATE pin_sync_profiles SET ledger=?,player_name=?,revision=revision+1,updated_at=? WHERE account=? AND revision=? AND learning_indexed=0').bind(JSON.stringify(ledger),name,new Date().toISOString(),account,snapshot.revision).run()
    :await this.database.prepare('UPDATE pin_sync_profiles SET ledger=?,learning=?,player_name=?,revision=revision+1,updated_at=? WHERE account=? AND revision=? AND learning_indexed=0').bind(JSON.stringify(ledger),learningJSON,name,new Date().toISOString(),account,snapshot.revision).run();
   if(saved.meta.changes===1){
    const {gemEventIds:archive,...publicLedger}=ledger,known=new Set(archive);
    publicLedger.gemAcknowledgedIds=(Array.isArray(incoming.ledger?.gemEvents)?incoming.ledger.gemEvents:[]).map(event=>event?.id).filter(id=>typeof id==='string'&&known.has(id));
    const result={ok:true,sushi_id:account,player_name:name,ledger:publicLedger,learning:serialized?undefined:learning??JSON.parse(learningJSON)};
    return serialized?serializeProfile(result,learningJSON):result;
   }
  }
  throw Error('profile_sync_conflict');
 }
 async claim(account,category,threshold){
  const rule=rewardEligibility(category,threshold,{});
  if(rule.error==='unknown_stage')return rule;
  const claimId='achievement:'+category+':'+threshold;
  const evaluate=async snapshot=>{
   const context={ledger:snapshot.ledger};
   if(category==='all_correct')context.baseline=(await this.database.prepare('SELECT baseline_total FROM pin_sync_baselines WHERE account=?').bind(account).first())?.baseline_total||0;
   if(['all_correct','vocabulary','toeic','all_games_day'].includes(category))context.events=(await this.database.prepare('SELECT event_id,game_id,correct_count,occurred_at FROM pin_sync_events WHERE account=?').bind(account).all()).results;
   if(['review','combo','resilience','comeback'].includes(category))context.outcomes=(await this.database.prepare('SELECT event_id,game_id,question_id,correct,review,occurred_at FROM pin_sync_outcomes WHERE account=?').bind(account).all()).results;
   if(category==='practice'||category.startsWith('login_'))context.activity=await this.database.prepare('SELECT * FROM pin_sync_login_activity WHERE account=?').bind(account).first();
   const eligible=rewardEligibility(category,threshold,context);
   if(!eligible.ok)throw Object.assign(Error(eligible.error),{status:409});
   return eligible.gems;
  };
  const receipt=await this.database.prepare('SELECT gems FROM pin_sync_claims WHERE account=? AND claim_id=?').bind(account,claimId).first();
  if(receipt)return {ok:true,already_claimed:true,claim_id:claimId,gems:0};
  const result=await this.creditVerifiedClaim(account,claimId,null,evaluate);
  return {...result,claim_id:claimId,gems:result.already_claimed?0:result.credited};
 }
 async creditVerifiedClaim(account,claimId,gems,evaluate){
  if(typeof claimId!=='string'||!/^achievement:[A-Za-z0-9:_-]{1,180}$/.test(claimId)||(!evaluate&&(!Number.isSafeInteger(gems)||gems<=0)))throw Error('invalid_verified_claim');
  for(let attempt=0;attempt<5;attempt++){
   const existing=await this.database.prepare('SELECT gems FROM pin_sync_claims WHERE account=? AND claim_id=?').bind(account,claimId).first();
   if(existing){if(!evaluate&&existing.gems!==gems)throw Error('claim_conflict');return {ok:true,already_claimed:true}}
   const snapshot=await this.read(account,false),ledger=structuredClone(snapshot.ledger),operation=crypto.randomUUID(),now=new Date().toISOString();
   const reward=evaluate?await evaluate(snapshot):gems;
   if(!Number.isSafeInteger(reward)||reward<=0)throw Error('invalid_verified_claim');
   ledger.gems=Math.max(0,Math.floor(Number(ledger.gems)||0))+reward;
   if(!Number.isSafeInteger(ledger.gems))throw Error('invalid_gem_total');
   const events=Array.isArray(ledger.gemEvents)?ledger.gemEvents:[];
   if(events.some(event=>event?.id===claimId)||(Array.isArray(ledger.gemEventIds)&&ledger.gemEventIds.includes(claimId)))throw Error('duplicate_legacy_event');
   ledger.gemEvents=[...events,{id:claimId,type:'earn',amount:reward,source:'achievement',at:Date.now()}];
   ledger.gemSyncBase=ledger.gems;
   const results=await this.database.batch([
    this.database.prepare('INSERT INTO pin_sync_claims(account,claim_id,gems,claimed_at,operation_id) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM pin_sync_profiles WHERE account=? AND revision=?) ON CONFLICT(account,claim_id) DO NOTHING').bind(account,claimId,reward,now,operation,account,snapshot.revision),
    this.database.prepare('UPDATE pin_sync_profiles SET ledger=?,revision=revision+1,updated_at=? WHERE account=? AND revision=? AND EXISTS(SELECT 1 FROM pin_sync_claims WHERE account=? AND claim_id=? AND operation_id=?)').bind(JSON.stringify(ledger),now,account,snapshot.revision,account,claimId,operation)
   ]);
   if(results[0].meta.changes===1&&results[1].meta.changes===1)return {ok:true,already_claimed:false,credited:reward};
  }
  throw Error('profile_claim_conflict');
 }
}
export function serializeProfile(profile,learningJSON){
 const {learning,...header}=profile;
 return JSON.stringify(header).slice(0,-1)+',"learning":'+learningJSON+'}';
}
