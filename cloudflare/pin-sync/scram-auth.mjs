import {parseClientFirst,serverStart,serverVerify,base64,hmac} from './scram.mjs';
import {encode,newSession,tokenHash,sessionCookie} from './crypto.mjs';

function denied(status=401){return Object.assign(Error('auth_failed'),{status})}
export class ScramAuth {
 constructor(store,lookup,fakeKey){if(!(fakeKey instanceof Uint8Array)||fakeKey.length!==32)throw Error('server_key_missing');this.store=store;this.lookup=lookup;this.fakeKey=fakeKey}
 async budget(label,now,period,maximum){const bucket=encode(await hmac(this.fakeKey,label+':'+Math.floor(now/period)));if(!await this.store.consumeBudget(bucket,(Math.floor(now/period)+1)*period,maximum))throw denied(429)}
 async start(clientFirst,ip,now=Date.now()){
  const client=parseClientFirst(clientFirst);await this.budget('ip:'+ip,now,60000,30);await this.budget('account:'+client.account,now,600000,5);
  if(this.store.cleanup)await this.store.cleanup(now);
  const fake=await hmac(this.fakeKey,'unknown-salt:'+client.account),fakeStored=await hmac(this.fakeKey,'unknown-stored:'+client.account),fakeServer=await hmac(this.fakeKey,'unknown-server:'+client.account);
  const existing=await this.lookup(client.account),verifier=existing||{account:client.account,salt:base64(fake.slice(0,16)),iterations:150000,storedKey:base64(fakeStored),serverKey:base64(fakeServer)};
  if(existing?.locked_until&&Date.parse(existing.locked_until)>now)throw denied(429);
  const exchange=serverStart(verifier,clientFirst),challenge={id:encode(crypto.getRandomValues(new Uint8Array(32))),account:client.account,expires:now+120000,exchange,unknown:!existing};
  await this.store.putChallenge(challenge);return {ok:true,id:challenge.id,serverFirst:exchange.serverFirst};
 }
 async finish(id,account,clientFinal,now=Date.now()){
  const challenge=await this.store.getChallenge(id,account,now);if(!challenge)throw denied();
  const verifier=await this.lookup(account);
  if(verifier?.locked_until&&Date.parse(verifier.locked_until)>now)throw denied(429);
  let serverFinal;try{if(challenge.unknown||!verifier)throw denied();serverFinal=await serverVerify(verifier,challenge.exchange,clientFinal)}catch{const result=await this.store.rejectChallenge(id,account,now);throw denied(result?.locked?429:401)}
  const session=await newSession(now);if(!await this.store.completeChallenge(id,account,now,session))throw denied();
  return {ok:true,serverFinal,cookie:sessionCookie(session.token)};
 }
 async accountForToken(token,now=Date.now()){let hash;try{hash=await tokenHash(token)}catch{throw denied()}const account=await this.store.accountForSession(hash,now);if(!account)throw denied();return account}
 async renew(token,now=Date.now()){
  let hash;try{hash=await tokenHash(token)}catch{throw denied()}
  const result=await this.store.renewSession(hash,now,now+7*86400000);if(!result)throw denied();
  return {ok:true,account:result.account,cookie:sessionCookie(token,Math.min(604800,Math.floor((result.expires-now)/1000)))};
 }
 async logout(token){let hash;try{hash=await tokenHash(token)}catch{throw denied()}await this.store.revokeSession(hash)}
}
