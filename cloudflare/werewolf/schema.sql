CREATE TABLE IF NOT EXISTS werewolf_rooms (
  code TEXT PRIMARY KEY,
  host TEXT NOT NULL UNIQUE,
  expires INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 0,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS werewolf_rooms_expiry ON werewolf_rooms(expires);