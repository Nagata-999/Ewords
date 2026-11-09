// Explicit administrative operation only. Never call from a gameplay request.
// One call migrates at most 100 existing events. No network or automatic loop.
export async function backfillEventBatch(database,limit=100){
 if(!Number.isSafeInteger(limit)||limit<1||limit>100)throw Error('invalid_backfill_limit');
 const range='SELECT rowid FROM pin_sync_events WHERE rowid>(SELECT last_rowid FROM pin_sync_event_migration WHERE id=1) ORDER BY rowid LIMIT ?';
 const results=await database.batch([
  database.prepare(`INSERT INTO pin_sync_event_feed(account,event_id,game_id,correct_count,occurred_at)
   SELECT account,event_id,game_id,correct_count,occurred_at FROM pin_sync_events WHERE rowid IN (${range})
   ON CONFLICT(account,event_id) DO NOTHING`).bind(limit),
  database.prepare(`UPDATE pin_sync_event_migration SET last_rowid=COALESCE((SELECT MAX(rowid) FROM (${range})),last_rowid) WHERE id=1`).bind(limit),
  database.prepare('UPDATE pin_sync_event_migration SET complete=NOT EXISTS(SELECT 1 FROM pin_sync_events WHERE rowid>last_rowid) WHERE id=1').bind(),
  database.prepare('SELECT last_rowid,complete FROM pin_sync_event_migration WHERE id=1').bind()
 ]);
 return {progress:results[3].results[0],meta:results.map(result=>result.meta)};
}
