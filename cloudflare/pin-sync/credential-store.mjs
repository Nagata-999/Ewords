import {D1AuthStore} from './d1-store.mjs';
import {unbase64} from './scram.mjs';
import {mergeLearning} from './profile-merge.mjs';

export class CredentialStore extends D1AuthStore {
 async lookup(account){return this.database.prepare('SELECT c.account,c.salt,c.iterations,c.stored_key AS storedKey,c.server_key AS serverKey,p.failed_attempts,p.locked_until FROM pin_sync_credentials c JOIN pin_sync_profiles p ON p.account=c.account WHERE c.account=?').bind(account).first()}
 async register(body){
  const verifier=body.verifier;
  try{if(!verifier||typeof verifier.account!=='string'||!(/^[a-z0-9_-]{4,24}$/).test(verifier.account)||verifier.iterations!==150000||unbase64(verifier.salt).length!==16||unbase64(verifier.storedKey).length!==32||unbase64(verifier.serverKey).length!==32)throw Error()}catch{throw Object.assign(Error('invalid_registration'),{status:400})}
  const account=verifier.account,operation=crypto.randomUUID(),now=new Date().toISOString();
  const ledger=body.ledger&&typeof body.ledger==='object'&&!Array.isArray(body.ledger)?body.ledger:{};
  const learning=mergeLearning({},body.learning),name=typeof body.player_name==='string'?body.player_name.normalize('NFKC').trim().slice(0,20):null;
  const results=await this.database.batch([
   this.database.prepare('INSERT INTO pin_sync_profiles(account,player_name,ledger,learning,created_at,updated_at,registration_id) VALUES(?,?,?,?,?,?,?) ON CONFLICT(account) DO NOTHING').bind(account,name,JSON.stringify(ledger),JSON.stringify(learning),now,now,operation),
   this.database.prepare('INSERT INTO pin_sync_credentials(account,salt,iterations,stored_key,server_key) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM pin_sync_profiles WHERE account=? AND registration_id=?) ON CONFLICT(account) DO NOTHING').bind(account,verifier.salt,verifier.iterations,verifier.storedKey,verifier.serverKey,account,operation)
  ]);
  if(results[0].meta.changes!==1||results[1].meta.changes!==1)throw Object.assign(Error('id_taken'),{status:409});
  return {ok:true,sushi_id:account,player_name:name,ledger,learning};
 }
 async rejectChallenge(id,account,now=Date.now()){
  const operation='failed:'+crypto.randomUUID(),iso=new Date(now).toISOString(),until=new Date(now+600000).toISOString();
  await this.database.batch([
   this.database.prepare('UPDATE pin_auth_challenges SET consumed=1,session_hash=? WHERE id=? AND account=? AND consumed=0').bind(operation,id,account),
   this.database.prepare('UPDATE pin_sync_profiles SET failed_attempts=CASE WHEN failed_attempts+1>=5 THEN 0 ELSE failed_attempts+1 END,locked_until=CASE WHEN failed_attempts+1>=5 THEN ? ELSE locked_until END WHERE account=? AND (locked_until IS NULL OR julianday(locked_until)<=julianday(?)) AND EXISTS(SELECT 1 FROM pin_auth_challenges WHERE id=? AND account=? AND session_hash=?)').bind(until,account,iso,id,account,operation)
  ]);
  const row=await this.database.prepare('SELECT locked_until FROM pin_sync_profiles WHERE account=?').bind(account).first();return {locked:Boolean(row?.locked_until&&Date.parse(row.locked_until)>now)};
 }
 async completeChallenge(id,account,now,session){
  const results=await this.database.batch([
   this.database.prepare('UPDATE pin_auth_challenges SET consumed=1,session_hash=? WHERE id=? AND account=? AND consumed=0 AND expires>? AND EXISTS(SELECT 1 FROM pin_sync_profiles WHERE account=? AND (locked_until IS NULL OR julianday(locked_until)<=julianday(?)))').bind(session.hash,id,account,now,account,new Date(now).toISOString()),
   this.database.prepare('INSERT INTO pin_auth_sessions(token_hash,account,expires,created_at) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM pin_auth_challenges WHERE id=? AND account=? AND session_hash=?) ON CONFLICT(token_hash) DO NOTHING').bind(session.hash,account,session.expires,session.createdAt,id,account,session.hash),
   this.database.prepare('UPDATE pin_sync_profiles SET failed_attempts=0,locked_until=NULL WHERE account=? AND EXISTS(SELECT 1 FROM pin_auth_sessions WHERE token_hash=? AND account=?)').bind(account,session.hash,account)
  ]);
  return results[0].meta.changes===1&&results[1].meta.changes===1;
 }
}
