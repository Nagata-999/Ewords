-- Apply once, before enabling PIN_SYNC_OPTIMIZED. No source history is deleted.
-- No backfill here. Use backfill-events.mjs in bounded batches outside lessons.
CREATE TABLE pin_sync_event_migration (id INTEGER PRIMARY KEY CHECK(id=1),last_rowid INTEGER NOT NULL,complete INTEGER NOT NULL DEFAULT 0);
INSERT INTO pin_sync_event_migration(id,last_rowid) VALUES(1,0);
CREATE TABLE pin_sync_event_feed (
 seq INTEGER PRIMARY KEY AUTOINCREMENT,
 account TEXT NOT NULL,
 event_id TEXT NOT NULL,
 game_id TEXT NOT NULL,
 correct_count INTEGER NOT NULL,
 occurred_at TEXT NOT NULL,
 UNIQUE(account,event_id)
);
CREATE INDEX pin_sync_event_feed_account_seq ON pin_sync_event_feed(account,seq);
CREATE TABLE pin_sync_event_totals (
 account TEXT PRIMARY KEY,
 all_correct INTEGER NOT NULL DEFAULT 0,
 vocabulary INTEGER NOT NULL DEFAULT 0,
 toeic INTEGER NOT NULL DEFAULT 0,
 all_games_day INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE pin_sync_event_day_games (
 account TEXT NOT NULL, day TEXT NOT NULL, game_id TEXT NOT NULL,
 PRIMARY KEY(account,day,game_id)
);
CREATE TABLE pin_sync_event_days (
 account TEXT NOT NULL, day TEXT NOT NULL, games INTEGER NOT NULL,
 PRIMARY KEY(account,day)
);
CREATE TRIGGER pin_sync_day_game_added AFTER INSERT ON pin_sync_event_day_games BEGIN
 INSERT INTO pin_sync_event_days(account,day,games) VALUES(NEW.account,NEW.day,1)
 ON CONFLICT(account,day) DO UPDATE SET games=games+1;
 UPDATE pin_sync_event_totals SET all_games_day=MAX(all_games_day,
 (SELECT games FROM pin_sync_event_days WHERE account=NEW.account AND day=NEW.day)) WHERE account=NEW.account;
END;
CREATE TRIGGER pin_sync_feed_added AFTER INSERT ON pin_sync_event_feed BEGIN
 INSERT INTO pin_sync_event_totals(account,all_correct,vocabulary,toeic)
 VALUES(NEW.account,NEW.correct_count,
 CASE WHEN NEW.game_id IN ('sushitan','shinotan','antonitan','idiom','sushi_idiom') THEN NEW.correct_count ELSE 0 END,
 CASE WHEN NEW.game_id='toeic' THEN NEW.correct_count ELSE 0 END)
 ON CONFLICT(account) DO UPDATE SET all_correct=all_correct+excluded.all_correct,
 vocabulary=vocabulary+excluded.vocabulary,toeic=toeic+excluded.toeic;
 INSERT INTO pin_sync_event_day_games(account,day,game_id)
 VALUES(NEW.account,COALESCE(date(NEW.occurred_at,'+9 hours'),substr(NEW.occurred_at,1,instr(NEW.occurred_at,'T')-1)),NEW.game_id)
 ON CONFLICT(account,day,game_id) DO NOTHING;
END;
CREATE TRIGGER pin_sync_event_added AFTER INSERT ON pin_sync_events BEGIN
 INSERT INTO pin_sync_event_feed(account,event_id,game_id,correct_count,occurred_at)
 VALUES(NEW.account,NEW.event_id,NEW.game_id,NEW.correct_count,NEW.occurred_at);
END;
-- A single statement either inserts the complete batch or aborts it on conflict.
CREATE TRIGGER pin_sync_event_conflict BEFORE INSERT ON pin_sync_events
 WHEN EXISTS(SELECT 1 FROM pin_sync_events WHERE account=NEW.account AND event_id=NEW.event_id
 AND (game_id<>NEW.game_id OR correct_count<>NEW.correct_count OR occurred_at<>NEW.occurred_at))
 BEGIN SELECT RAISE(ABORT,'event_id_conflict'); END;
-- Event IDs are immutable in the existing protocol. Protect the derived tables.
CREATE TRIGGER pin_sync_event_immutable BEFORE UPDATE ON pin_sync_events
 BEGIN SELECT RAISE(ABORT,'immutable_sync_event'); END;
CREATE TRIGGER pin_sync_event_no_delete BEFORE DELETE ON pin_sync_events
 BEGIN SELECT RAISE(ABORT,'immutable_sync_event'); END;
