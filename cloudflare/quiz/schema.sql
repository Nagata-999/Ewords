-- Additive schema: existing ranking and PIN tables are unchanged.
CREATE TABLE IF NOT EXISTS quiz_rooms (
 code TEXT PRIMARY KEY,
 host_token TEXT NOT NULL,
 data TEXT NOT NULL CHECK(json_valid(data)),
 winner_id TEXT,
 expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS quiz_rooms_expiry ON quiz_rooms(expires_at);
CREATE TABLE IF NOT EXISTS quiz_players (
 id TEXT PRIMARY KEY,
 room_code TEXT NOT NULL REFERENCES quiz_rooms(code) ON DELETE CASCADE,
 player_token TEXT NOT NULL,
 data TEXT NOT NULL CHECK(json_valid(data))
);
CREATE INDEX IF NOT EXISTS quiz_players_room ON quiz_players(room_code);
