export class D1AuthStore {
 constructor(database){this.database=database}
 async putChallenge(challenge){await this.database.prepare('INSERT INTO pin_auth_challenges(id,account,payload,expires) VALUES(?,?,?,?)').bind(challenge.id,challenge.account,JSON.stringify(challenge),challenge.expires).run()}
 async getChallenge(id,account,now){const row=await this.database.prepare('SELECT payload FROM pin_auth_challenges WHERE id=? AND account=? AND expires>? AND consumed=0').bind(id,account,now).first();return row?JSON.parse(row.payload):null}
 async rejectChallenge(id,account){await this.database.prepare('UPDATE pin_auth_challenges SET consumed=1 WHERE id=? AND account=? AND consumed=0').bind(id,account).run()}
 async completeChallenge(id,account,now,session){
  const results=await this.database.batch([
   this.database.prepare('UPDATE pin_auth_challenges SET consumed=1,session_hash=? WHERE id=? AND account=? AND consumed=0 AND expires>?').bind(session.hash,id,account,now),
   this.database.prepare('INSERT INTO pin_auth_sessions(token_hash,account,expires,created_at) SELECT ?,?,?,? WHERE EXISTS (SELECT 1 FROM pin_auth_challenges WHERE id=? AND account=? AND session_hash=?) ON CONFLICT(token_hash) DO NOTHING').bind(session.hash,account,session.expires,session.createdAt,id,account,session.hash)
  ]);
  return results[0].meta.changes===1&&results[1].meta.changes===1;
 }
 async accountForSession(hash,now){return (await this.database.prepare('SELECT account FROM pin_auth_sessions WHERE token_hash=? AND expires>? AND revoked=0').bind(hash,now).first())?.account}
 async renewSession(hash,now,expires){return this.database.prepare('UPDATE pin_auth_sessions SET expires=MAX(expires,MIN(?,created_at+2592000000)) WHERE token_hash=? AND expires>? AND revoked=0 AND created_at>0 AND created_at+2592000000>=? RETURNING account,expires').bind(expires,hash,now,now+1000).first()}
 async revokeSession(hash){await this.database.prepare('UPDATE pin_auth_sessions SET revoked=1 WHERE token_hash=?').bind(hash).run()}
 async consumeBudget(bucket,expires,maximum){const row=await this.database.prepare('INSERT INTO pin_auth_budgets(bucket,attempts,expires) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET attempts=attempts+1 WHERE attempts<? RETURNING attempts').bind(bucket,expires,maximum).first();return row!==null}
 async cleanup(now){await this.database.batch([
  this.database.prepare('DELETE FROM pin_auth_challenges WHERE id IN (SELECT id FROM pin_auth_challenges WHERE expires<=? LIMIT 100)').bind(now),
  this.database.prepare('DELETE FROM pin_auth_sessions WHERE token_hash IN (SELECT token_hash FROM pin_auth_sessions WHERE expires<=? LIMIT 100)').bind(now),
  this.database.prepare('DELETE FROM pin_auth_budgets WHERE bucket IN (SELECT bucket FROM pin_auth_budgets WHERE expires<=? LIMIT 100)').bind(now)
 ])}
}
