import { createClient } from "npm:@supabase/supabase-js@2";
const headers={"Access-Control-Allow-Origin":"https://sushitan.net","Access-Control-Allow-Headers":"authorization,apikey,content-type","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json","Cache-Control":"private,no-store","Vary":"Authorization,Origin"};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers});if(req.method!=='POST')return reply({error:'method_not_allowed'},405);
 try{
 const token=req.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];if(!token)return reply({error:'unauthorized'},401);
 const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
 const {data:identity,error:authError}=await db.auth.getUser(token);if(authError||!identity.user)return reply({error:'unauthorized'},401);
 const {data:admin,error:adminError}=await db.from('sushi_admin_users').select('user_id').eq('user_id',identity.user.id).maybeSingle();if(adminError)throw adminError;if(!admin)return reply({error:'forbidden'},403);
 const raw=await req.text();if(raw.length>2048)return reply({error:'too_large'},413);const b=JSON.parse(raw);
 if(b.action==='login_diagnostic'){
  if(typeof b.sushi_id!=='string'||!/^[a-z0-9_-]{4,24}$/.test(b.sushi_id))return reply({error:'invalid_id'},400);
  const {data:profile,error}=await db.from('sushi_id_profiles').select('ledger').eq('sushi_id',b.sushi_id).maybeSingle();if(error)throw error;if(!profile)return reply({error:'not_found'},404);
  const l=profile.ledger||{},claims=Array.isArray(l.loginManualClaims)?l.loginManualClaims:[];
  const ids=new Set([...(Array.isArray(l.gemEventIds)?l.gemEventIds:[]),...(Array.isArray(l.gemEvents)?l.gemEvents:[]).map((e:any)=>e?.id)]);
  return reply({ok:true,diagnostic:{streak:l.loginBonusStreak||0,bestStreak:l.loginBonusBestStreak||0,total:l.loginBonusTotal||0,lastDay:l.loginBonusLastDay||'',claims:claims.slice(-14).sort().map((day:string)=>({day,eventRecorded:ids.has('login:'+day)}))}});
 }
 if(b.action!=='report')return reply({error:'invalid_action'},400);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(b.from)||!/^\d{4}-\d{2}-\d{2}$/.test(b.to)||typeof b.game!=='string'||!/^[a-z0-9_-]{0,40}$/.test(b.game)||typeof b.search!=='string'||b.search.length>80||!Number.isInteger(b.offset)||b.offset<0||b.offset>100000)return reply({error:'invalid_filter'},400);
 const {data,error}=await db.rpc('sushi_usage_report',{p_from:b.from,p_to:b.to,p_game:b.game,p_search:b.search,p_offset:b.offset});if(error)return reply({error:'report_failed'},400);return reply({ok:true,...data});
 }catch{return reply({error:'server_error'},500)}
});
