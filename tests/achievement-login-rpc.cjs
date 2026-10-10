// Disposable Postgres. Only the clock is substituted to test JST boundaries.
const {PGlite}=require(process.env.PGLITE_MODULE||'@electric-sql/pglite');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{const db=new PGlite();try{
  await db.exec(`create role anon;create role authenticated;create role service_role;
    create table public.sushi_id_profiles(sushi_id text primary key,ledger jsonb not null default '{}',updated_at timestamptz not null default now());
    create table public.sushi_achievement_claims(sushi_id text,claim_id text,gems integer not null,primary key(sushi_id,claim_id));
    create table public.test_time(value timestamptz);insert into public.test_time values('2026-10-10 02:59:59+09');
    create function public.test_clock() returns timestamptz language sql as 'select value from public.test_time';`);
  const sql=fs.readFileSync(path.join(__dirname,'../supabase/review/login-achievements.sql'),'utf8');
  await db.exec(sql.replace(/statement_timestamp\(\)|clock_timestamp\(\)/g,'public.test_clock()'));
  await db.query('insert into sushi_id_profiles values($1,$2::jsonb,now())',['student',JSON.stringify({gems:100,gacha:{owned:['keep']},gemEvents:[]})]);
  const clock=async date=>db.query('update test_time set value=$1',[date]);
  const visit=async()=>(await db.query("select sushi_record_login_visit('student') as result")).rows[0].result.login;
  const claim=async(category,threshold)=>(await db.query('select sushi_claim_login_achievement($1,$2,$3) as result',['student',category,threshold])).rows[0].result;
  assert.equal((await claim('login_03',1)).error,'not_reached');
  assert.equal((await visit()).hour03,false);assert.equal((await visit()).streak,1);
  for(const [time,key] of [['03:00:00','hour03'],['05:59:59','hour05'],['23:59:59','hour23']]){await clock('2026-10-10 '+time+'+09');assert.equal((await visit())[key],true);assert.equal((await visit()).streak,1);}
  await clock('2026-10-11 00:00:00+09');assert.equal((await visit()).streak,2);
  for(let day=2;day<49;day++){await clock(new Date(Date.parse('2026-10-10T00:00:00+09:00')+day*86400000).toISOString());assert.equal((await visit()).streak,day+1);}
  await clock('2026-12-01 00:00:00+09');const reset=await visit();assert.equal(reset.streak,1);assert.equal(reset.bestStreak,49);assert(reset.hour03&&reset.hour05&&reset.hour23);
  for(const category of ['login_03','login_05','login_23']){assert.equal((await claim(category,1)).gems,10);assert.equal((await claim(category,1)).gems,0);}
  for(const [n,gems] of [[7,10],[14,25],[21,50],[28,75],[35,100],[42,200],[49,300]]){const results=await Promise.all([claim('practice',n),claim('practice',n)]);assert.equal(results.reduce((sum,r)=>sum+r.gems,0),gems);assert.equal(results.filter(r=>r.already_claimed).length,1);}
  assert.equal((await claim('practice',50)).error,'unknown_stage');
  const ledger=(await db.query("select ledger from sushi_id_profiles where sushi_id='student'")).rows[0].ledger;assert.equal(ledger.gems,890);assert.equal(ledger.gemEvents.length,10);assert.deepEqual(ledger.gacha.owned,['keep']);
  for(const signature of ['sushi_record_login_visit(text)','sushi_claim_login_achievement(text,text,integer)']){
    const r=(await db.query("select has_function_privilege('anon',$1,'execute') as anon,has_function_privilege('authenticated',$1,'execute') as authenticated,has_function_privilege('service_role',$1,'execute') as service",['public.'+signature])).rows[0];assert.deepEqual(r,{anon:false,authenticated:false,service:true});
  }
  assert.equal((await db.query("select relrowsecurity from pg_class where oid='public.sushi_login_activity'::regclass")).rows[0].relrowsecurity,true);
  console.log('PASS: server JST clock, day deduplication, 49-day streak/reset, 10 single-credit stages, preserved wallet/items, private RPC permissions');
}finally{await db.close()}})().catch(error=>{console.error(error);process.exitCode=1});
