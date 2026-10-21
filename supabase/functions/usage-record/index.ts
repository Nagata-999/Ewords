import { ADMIN_USAGE_ENABLED } from "../_shared/admin-feature.ts";
import { createClient } from "npm:@supabase/supabase-js@2.117.3";
const headers={"Access-Control-Allow-Origin":"https://sushitan.net","Access-Control-Allow-Headers":"apikey,content-type","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
Deno.serve(async req=>{
 if (!ADMIN_USAGE_ENABLED) return reply({ok:false,error:"admin_usage_disabled"},503);
 if(req.method==='OPTIONS')return new Response('ok',{headers});
 if(req.method!=='POST')return reply({error:'method_not_allowed'},405);
 if(req.headers.get('apikey')!=='sb_publishable_RmWOSxRfsV5YRwCDnKPPAQ_m3VzsUM7')return reply({error:'invalid_api_key'},401);
 if(req.headers.get('origin')&&req.headers.get('origin')!=='https://sushitan.net')return reply({error:'origin_denied'},403);
 try{const raw=await req.text();if(raw.length>2048)return reply({error:'too_large'},413);const b=JSON.parse(raw);if(b.sushi_id||b.pin)return reply({error:'use_authenticated_sync'},400);
 const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
 const {data,error}=await db.rpc('sushi_record_usage',{p_session:b.session,p_visitor:b.visitor,p_game:b.game,p_started:b.started,p_seconds:b.seconds,p_answers:b.answers,p_correct:b.correct,p_sushi_id:null,p_player_name:typeof b.player_name==='string'?b.player_name.replace(/[\x00-\x1f\x7f]/g,'').trim().slice(0,20):''});
 if(error)return reply({error:'invalid_usage'},400);return reply(data,data?.ok?200:data?.error==='usage_rate_limit'?429:409);
 }catch{return reply({error:'invalid_request'},400)}
});

