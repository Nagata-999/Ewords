import { createClient } from "npm:@supabase/supabase-js@2.117.3";
const headers={"Access-Control-Allow-Origin":"https://sushitan.net","Access-Control-Allow-Headers":"apikey,content-type","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers});
 if(req.method!=='POST')return reply({error:'method_not_allowed'},405);
 if(req.headers.get('origin')&&req.headers.get('origin')!=='https://sushitan.net')return reply({error:'origin_denied'},403);
 try{const raw=await req.text();if(raw.length>2048)return reply({error:'too_large'},413);const b=JSON.parse(raw);if(b.sushi_id||b.pin)return reply({error:'use_authenticated_sync'},400);
 const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
 const {data,error}=await db.rpc('sushi_record_usage',{p_session:b.session,p_visitor:b.visitor,p_game:b.game,p_started:b.started,p_seconds:b.seconds,p_answers:b.answers,p_correct:b.correct,p_sushi_id:null});
 if(error)return reply({error:'invalid_usage'},400);return reply(data,data?.ok?200:data?.error==='usage_rate_limit'?429:409);
 }catch{return reply({error:'invalid_request'},400)}
});
