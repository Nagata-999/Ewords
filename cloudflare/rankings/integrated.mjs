import ranking from './worker.mjs';
import legacy from './legacy-worker.mjs';
import clientSource from './ranking-client.txt';

export const pages=new Set(['/','/index.html','/antonitan.html','/shinotan.html','/sushi-run3D.html','/sushicross.html','/sushigiri.html','/sushikobun.html','/sushitan.html','/sushitype.html','/sushi_blast.html','/sushi_clock.html','/sushi_hayaoshi.html','/sushi_idiom (1).html','/sushi_parts.html','/sushi_quiz.html','/sushi_quiz_core.html','/sushi_run.html','/sushidungeon/','/sushidungeon/index.html']);
for(const page of [...pages])if(page.endsWith('.html'))pages.add(page.slice(0,-5));
export default {async fetch(request,env,context){
 const url=new URL(request.url);
 if(url.pathname.startsWith('/api/rankings/'))return ranking.fetch(request,env,context);
 if(url.pathname==='/shared/ranking-d1.js')return new Response(clientSource,{headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-store'}});
 if(url.hostname!=='sushitan.net')return legacy.fetch(request,env,context);
 const response=await fetch(request);
 if(!pages.has(decodeURIComponent(url.pathname))||!response.ok||!response.headers.get('content-type')?.includes('text/html'))return response;
 const headers=new Headers(response.headers);headers.set('Cache-Control','no-store');headers.delete('etag');headers.delete('content-length');
 return new HTMLRewriter().on('head',{element(element){element.prepend('<script src="/shared/ranking-d1.js?v=20261022-d1"></script>',{html:true})}}).transform(new Response(response.body,{status:response.status,statusText:response.statusText,headers}));
}};
