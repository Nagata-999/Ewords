const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
for(const file of ['sushi_quiz.html','sushi_quiz_core.html']){
const html=fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const declaration=html.match(/const sb = HAS_SUPABASE[\s\S]*? : null;/)[0];let options;
vm.runInNewContext(declaration,{HAS_SUPABASE:true,SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'public-test',window:{supabase:{createClient:(url,key,opts)=>{options=opts;return {};}}}});
assert.equal(options.auth.persistSession,false);assert.equal(options.auth.autoRefreshToken,false);assert.equal(options.auth.detectSessionInUrl,false);assert.equal(options.auth.storageKey,'sushi-quiz-public-room');
assert(html.includes('async function createSession()'));assert(html.includes('async function createBuzzerSession()'));
for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!/type=["'](?:module|application\/)/i.test(m[1]))new vm.Script(m[2],{filename:file});
}console.log('PASS: public room client isolation in both entry points; script syntax');
