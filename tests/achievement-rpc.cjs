// Run against a disposable in-memory Postgres; no live Supabase writes.
const {PGlite}=require(process.env.PGLITE_MODULE||'@electric-sql/pglite');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
  const db=new PGlite();
  try{
    await db.exec(`create role anon;create role authenticated;create role service_role;create table public.sushi_id_profiles(sushi_id text primary key,ledger jsonb not null default '{}',learning jsonb not null default '{}',player_name text,failed_attempts integer,locked_until timestamptz,updated_at timestamptz not null default now());create table public.sushi_achievement_claims(sushi_id text,claim_id text,gems integer,primary key(sushi_id,claim_id));`);
    for(const file of ['save-profile-if-current.sql','claim-profile-milestone.sql','claim-login-streak.sql'])await db.exec(fs.readFileSync(path.join(__dirname,'../supabase/review',file),'utf8'));
    const seed=async(id,ledger)=>db.query('insert into sushi_id_profiles(sushi_id,ledger) values($1,$2::jsonb)',[id,JSON.stringify(ledger)]);
    const claim=async(id,category,threshold)=>(await db.query('select public.sushi_claim_profile_milestone($1,$2,$3) as result',[id,category,threshold])).rows[0].result;
    await seed('avatar',{gems:100,gacha:{owned:Array.from({length:30},(_,i)=>'item:'+i)}});
    assert.equal((await claim('avatar','avatar',30)).gems,150);assert.equal((await claim('avatar','avatar',30)).already_claimed,true);
    assert.equal((await db.query("select ledger->>'gems' as balance from sushi_id_profiles where sushi_id='avatar'")).rows[0].balance,'250');
    await seed('earned',{gems:50,gemsEarnedTotal:12000,gemEvents:[{id:'new',type:'earn',amount:20}]});
    assert.equal((await claim('earned','gems',10000)).gems,100);assert.equal((await claim('earned','gems',10000)).already_claimed,true);
    await seed('legacy',{gems:0,gemEvents:[{id:'old',type:'earn',amount:1000}]});assert.equal((await claim('legacy','gems',1000)).gems,25);
    await seed('not-reached',{gems:50,gemsEarnedTotal:50,gemEvents:[]});assert.equal((await claim('not-reached','gems',100)).error,'not_reached');
    await seed('streak',{gems:100,loginBonusStreak:1,loginBonusBestStreak:30});const streak=(await db.query("select sushi_claim_login_streak('streak',30) as result")).rows[0].result;assert.equal(streak.gems,50);
    assert.equal((await db.query("select sushi_claim_login_streak('streak',30) as result")).rows[0].result.already_claimed,true);
    const count=(await db.query('select count(*)::integer as n from sushi_achievement_claims')).rows[0].n;assert.equal(count,4);
    const snapshot=(await db.query("select ledger,learning,updated_at from sushi_id_profiles where sushi_id='avatar'")).rows[0];
    await db.query("update sushi_id_profiles set ledger=jsonb_set(ledger,'{gems}','300'::jsonb) where sushi_id='avatar'");
    const stale=(await db.query('select sushi_save_profile_if_current($1,$2,$3::jsonb,$4::jsonb,$5::jsonb,$6::jsonb,$7,$8) as saved',['avatar',snapshot.updated_at,JSON.stringify(snapshot.ledger),JSON.stringify(snapshot.learning),JSON.stringify({gems:0}),JSON.stringify({}),null,new Date()])).rows[0].saved;
    assert.equal(stale,false);assert.equal((await db.query("select ledger->>'gems' as balance from sushi_id_profiles where sushi_id='avatar'")).rows[0].balance,'300');
    const privileges=(await db.query("select has_function_privilege('anon','public.sushi_save_profile_if_current(text,timestamptz,jsonb,jsonb,jsonb,jsonb,text,timestamptz)','execute') as anon, has_function_privilege('authenticated','public.sushi_save_profile_if_current(text,timestamptz,jsonb,jsonb,jsonb,jsonb,text,timestamptz)','execute') as authenticated, has_function_privilege('service_role','public.sushi_save_profile_if_current(text,timestamptz,jsonb,jsonb,jsonb,jsonb,text,timestamptz)','execute') as service_role")).rows[0];
    assert.deepEqual(privileges,{anon:false,authenticated:false,service_role:true});
    console.log('PASS: real Postgres reward transactions, avatar/30 single credit, pruned cumulative earned eligibility, legacy fallback, not-reached, preserved login best');
  }finally{await db.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
