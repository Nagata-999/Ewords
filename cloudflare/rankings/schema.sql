CREATE TABLE IF NOT EXISTS scores (
 source TEXT NOT NULL, id INTEGER NOT NULL, player_name TEXT NOT NULL,
 score INTEGER NOT NULL, max_combo INTEGER DEFAULT 0, accuracy INTEGER DEFAULT 0,
 mode TEXT, created_at TEXT, PRIMARY KEY(source,id), UNIQUE(source,player_name,mode)
);
CREATE INDEX IF NOT EXISTS scores_rank ON scores(source,mode,score DESC,id);
CREATE TABLE IF NOT EXISTS daily_high_scores (
 mode TEXT NOT NULL, score_date TEXT NOT NULL, player_key TEXT NOT NULL, player_name TEXT NOT NULL,
 score INTEGER NOT NULL, max_combo INTEGER NOT NULL, accuracy INTEGER NOT NULL, achieved_at TEXT NOT NULL,
 PRIMARY KEY(mode,score_date,player_key)
);
CREATE INDEX IF NOT EXISTS daily_rank ON daily_high_scores(mode,score_date,score DESC,max_combo DESC,accuracy DESC,achieved_at,player_key);
CREATE TABLE IF NOT EXISTS sushi_blast_scores_v2 (
 id TEXT PRIMARY KEY,name TEXT NOT NULL,mode TEXT NOT NULL,played_day TEXT NOT NULL,
 score INTEGER NOT NULL,moves INTEGER NOT NULL,combo INTEGER NOT NULL,extra INTEGER NOT NULL,created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS blast_rank ON sushi_blast_scores_v2(mode,score DESC,created_at);
CREATE INDEX IF NOT EXISTS blast_player ON sushi_blast_scores_v2(name,mode,played_day);
CREATE TABLE IF NOT EXISTS sushi_parts_runs (
 id TEXT PRIMARY KEY,player_id TEXT NOT NULL,player_name TEXT NOT NULL,score INTEGER DEFAULT 0,
 stage INTEGER DEFAULT 1,cleared INTEGER DEFAULT 0,final_boss_defeated INTEGER DEFAULT 0,
 discovered_words INTEGER DEFAULT 0,unlocked_roots INTEGER DEFAULT 0,max_combo INTEGER DEFAULT 0,best_word TEXT,created_at TEXT
);
CREATE INDEX IF NOT EXISTS parts_runs_player ON sushi_parts_runs(player_id);
CREATE TABLE IF NOT EXISTS sushi_parts_collection (
 id TEXT PRIMARY KEY,player_id TEXT NOT NULL,player_name TEXT NOT NULL,word TEXT NOT NULL,meaning TEXT,
 parts TEXT,root TEXT,freq TEXT,discovered_count INTEGER DEFAULT 1,first_discovered_at TEXT,last_discovered_at TEXT,
 UNIQUE(player_id,word)
);
