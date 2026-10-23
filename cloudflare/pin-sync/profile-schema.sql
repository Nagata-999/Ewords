CREATE TABLE pin_sync_profiles (
 account TEXT PRIMARY KEY,
 player_name TEXT,
 ledger TEXT NOT NULL CHECK(json_valid(ledger)),
 learning TEXT NOT NULL CHECK(json_valid(learning)),
 failed_attempts INTEGER NOT NULL DEFAULT 0,
 locked_until TEXT,
 created_at TEXT NOT NULL DEFAULT '',
 registration_id TEXT UNIQUE,
 revision INTEGER NOT NULL DEFAULT 0 CHECK(revision>=0),
 learning_indexed INTEGER NOT NULL DEFAULT 0 CHECK(learning_indexed IN (0,1)),
 learning_registry_version NUMERIC,
 learning_event_count INTEGER NOT NULL DEFAULT 0,
 learning_card_count INTEGER NOT NULL DEFAULT 0,
 learning_operation TEXT,
 updated_at TEXT NOT NULL
);
CREATE TABLE pin_sync_learning_events(account TEXT NOT NULL REFERENCES pin_sync_profiles(account),event_id TEXT NOT NULL,sort_order INTEGER NOT NULL,document TEXT NOT NULL CHECK(json_valid(document)),PRIMARY KEY(account,event_id));
CREATE INDEX pin_sync_learning_event_order ON pin_sync_learning_events(account,sort_order);
CREATE TABLE pin_sync_learning_cards(account TEXT NOT NULL REFERENCES pin_sync_profiles(account),word_id TEXT NOT NULL,sort_order INTEGER NOT NULL,document TEXT NOT NULL CHECK(json_valid(document)),PRIMARY KEY(account,word_id));
CREATE INDEX pin_sync_learning_card_order ON pin_sync_learning_cards(account,sort_order);
CREATE TABLE pin_sync_credentials(account TEXT PRIMARY KEY REFERENCES pin_sync_profiles(account),salt TEXT NOT NULL,iterations INTEGER NOT NULL CHECK(iterations=150000),stored_key TEXT NOT NULL,server_key TEXT NOT NULL);
CREATE TABLE pin_sync_claims (
 account TEXT NOT NULL REFERENCES pin_sync_profiles(account),
 claim_id TEXT NOT NULL,
 gems INTEGER NOT NULL CHECK(gems>0),
 claimed_at TEXT NOT NULL,
 operation_id TEXT NOT NULL,
 PRIMARY KEY(account,claim_id)
);
CREATE TABLE pin_sync_baselines(account TEXT PRIMARY KEY REFERENCES pin_sync_profiles(account),baseline_total INTEGER NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE pin_sync_events(account TEXT NOT NULL REFERENCES pin_sync_profiles(account),event_id TEXT NOT NULL,game_id TEXT NOT NULL,correct_count INTEGER NOT NULL,occurred_at TEXT NOT NULL,received_at TEXT NOT NULL,PRIMARY KEY(account,event_id));
CREATE TABLE pin_sync_outcomes(account TEXT NOT NULL REFERENCES pin_sync_profiles(account),event_id TEXT NOT NULL,game_id TEXT NOT NULL,question_id TEXT NOT NULL,correct INTEGER NOT NULL CHECK(correct IN (0,1)),review INTEGER NOT NULL CHECK(review IN (0,1)),occurred_at TEXT NOT NULL,occurred_order TEXT NOT NULL DEFAULT '',received_at TEXT NOT NULL,PRIMARY KEY(account,event_id));
CREATE INDEX pin_sync_outcome_order ON pin_sync_outcomes(account,occurred_order,event_id);
CREATE TABLE pin_sync_login_activity(account TEXT PRIMARY KEY REFERENCES pin_sync_profiles(account),last_day TEXT,streak INTEGER NOT NULL,best_streak INTEGER NOT NULL,hour_03 INTEGER NOT NULL CHECK(hour_03 IN (0,1)),hour_05 INTEGER NOT NULL CHECK(hour_05 IN (0,1)),hour_23 INTEGER NOT NULL CHECK(hour_23 IN (0,1)),updated_at TEXT NOT NULL);
