const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
for(const file of ['sushi_quiz.html','sushi_quiz_core.html']){
 const html=fs.readFileSync(path.join(__dirname,'..',file),'utf8');
 assert(html.includes('const sb = window.SushiQuizD1;'));
 assert(html.includes('/shared/quiz-d1.js'));
 assert(!html.includes('supabase.createClient'));
 assert(html.includes('async function createSession()'));
 assert(html.includes('async function createBuzzerSession()'));
 for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!/type=["'](?:module|application\/)/i.test(m[1]))new vm.Script(m[2],{filename:file});
}
console.log('PASS: D1 room client in both entry points; script syntax');
