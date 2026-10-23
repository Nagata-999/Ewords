CREATE TABLE pin_auth_challenges (
 id TEXT PRIMARY KEY,
 account TEXT NOT NULL,
 payload TEXT NOT NULL,
 expires INTEGER NOT NULL,
 consumed INTEGER NOT NULL DEFAULT 0,
 session_hash TEXT
);
CREATE INDEX pin_auth_challenge_expiry ON pin_auth_challenges(expires);
CREATE TABLE pin_auth_sessions (
 token_hash TEXT PRIMARY KEY,
 account TEXT NOT NULL,
 expires INTEGER NOT NULL,
 created_at INTEGER NOT NULL DEFAULT 0,
 revoked INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX pin_auth_session_expiry ON pin_auth_sessions(expires);
CREATE TABLE pin_auth_budgets (
 bucket TEXT PRIMARY KEY,
 attempts INTEGER NOT NULL,
 expires INTEGER NOT NULL
);
CREATE INDEX pin_auth_budget_expiry ON pin_auth_budgets(expires);
