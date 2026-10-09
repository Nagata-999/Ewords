// Staging-only server claim eligibility. Never trust client-reported totals,
// metrics, reward amounts, or a client-provided claim receipt.
// PIN authorization must precede this helper; no DB writes are performed.
export type ClaimStage={
  id:string;metric:string;threshold:number;gems:number
};
export type ClaimEligibility={
  eligible:boolean;reason:string;gems:number
};
const ID=/^achievement:[a-z0-9_]+:[1-9][0-9]*$/;
const VOCAB=new Set(["sushitan","shinotan","antonitan","idiom","sushi_idiom"]);
export function canonicalEventMetrics(rows:Array<{game_id:string;correct_count:number}>){
  let total=0,vocabulary=0,toeic=0;
  for(const row of rows){
    if(!row||!Number.isSafeInteger(row.correct_count)||row.correct_count<1||row.correct_count>1000)
      throw new Error("invalid_canonical_event");
    total+=row.correct_count;
    if(VOCAB.has(row.game_id))vocabulary+=row.correct_count;
    if(row.game_id==="toeic")toeic+=row.correct_count;
  }
  return {correct_total:total,correct_vocabulary:vocabulary,toeic_correct:toeic};
}
export function checkServerClaim(stageId:string,stages:ClaimStage[],
  metrics:Record<string,number>,claimedIds:ReadonlySet<string>):ClaimEligibility{
  const denied=(reason:string):ClaimEligibility=>({eligible:false,reason,gems:0});
  if(typeof stageId!=="string"||stageId.length>120||!ID.test(stageId))return denied("invalid_stage");
  const stage=stages.find(s=>s.id===stageId);
  if(!stage||!Number.isSafeInteger(stage.gems)||stage.gems<0||stage.gems>10000||
     !Number.isSafeInteger(stage.threshold)||stage.threshold<1)return denied("unknown_stage");
  // Only event-backed metrics may be evaluated here. Streak, gems earned,
  // avatar ownership and other metrics require separate trusted providers.
  if(!["correct_total","correct_vocabulary","toeic_correct"].includes(stage.metric))
    return denied("unsupported_metric");
  if(claimedIds.has(stageId))return denied("already_claimed");
  const count=Object.prototype.hasOwnProperty.call(metrics,stage.metric)?metrics[stage.metric]:null;
  if(!Number.isSafeInteger(count)||count<stage.threshold)return denied("not_reached");
  return {eligible:true,reason:"eligible",gems:stage.gems};
}
// Production claim flow must be a single SQL transaction containing both the
// unique claim insert and the existing canonical gem ledger credit.
