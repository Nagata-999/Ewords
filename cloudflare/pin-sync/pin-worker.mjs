import {CredentialStore} from './credential-store.mjs';
import {ScramAuth} from './scram-auth.mjs';
import {authHandler} from './auth-http.mjs';
import {syncHandler} from './sync-http.mjs';
import {ProfileStore} from './profile-store.mjs';
import {ActivityStore} from './activity-store.mjs';
import {unbase64} from './scram.mjs';

const ORIGIN='https://sushitan.net',PREFIX='/api/pin-sync/';
const endpoints=new Set(['sync','auth/start','auth/finish','auth/session','auth/renew','auth/logout','auth/register']);
function unavailable(){return new Response(JSON.stringify({error:'pin_sync_not_ready'}),{status:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
export function createIntegratedWorker(fallback,assets){
 const sources=new Map([
  ['/shared/sushi-profile.js',assets.profile],['/sushigacha/achievement-login.js',assets.login],
  ['/api/pin-sync/transport.mjs',assets.transport],['/api/pin-sync/scram.mjs',assets.scram]
 ]);
 return {async fetch(request,env,context){
  const url=new URL(request.url),api=url.pathname.startsWith(PREFIX),asset=sources.has(url.pathname);
  if(!api&&!asset)return fallback.fetch(request,env,context);
  if(url.origin!==ORIGIN){if(api)return new Response('Not found',{status:404});return fallback.fetch(request,env,context)}
  if(env.PIN_SYNC_READY!=='true')return api?unavailable():fallback.fetch(request,env,context);
  if(asset){
   if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
   return new Response(request.method==='HEAD'?null:sources.get(url.pathname),{headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  }
  const endpoint=url.pathname.slice(PREFIX.length);if(!endpoints.has(endpoint))return new Response('Not found',{status:404});
  let key;try{key=unbase64(env.PIN_AUTH_FAKE_KEY);if(key.length!==32||!env.DB)throw Error()}catch{return unavailable()}
  const store=new CredentialStore(env.DB),auth=new ScramAuth(store,account=>store.lookup(account),key);
  const handler=endpoint==='sync'?syncHandler(auth,new ProfileStore(env.DB),new ActivityStore(env.DB)):authHandler(auth,store);
  const target=new URL('/'+endpoint,ORIGIN);target.search=url.search;
  return handler(new Request(target.toString(),request));
 }};
}
