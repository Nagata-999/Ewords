# Achievement sync deployment gates

## Production is unchanged
Do not deploy a schema or replace `sushi-id-sync` until this checklist passes in a staging project. The existing Edge Function uses PIN validation and read/modify/write JSONB merges for gems, avatars, learning and daily quests. Replacing it without staging tests risks losing player progress.

## Recommended API
Add an authenticated action `achievement_sync` to the existing PIN-verified function, or an isolated Edge Function reusing the same credential verifier and lockout rules.

1. Validate `sushi_id` and PIN exactly as existing sync, including lockout.
2. Accept up to 500 achievement events per request, validate event ID, game, positive correct count and timestamp.
3. Write rows to `sushi_achievement_events` with `ON CONFLICT (sushi_id,event_id) DO NOTHING`. Reject conflicting payloads if an existing event ID has different data.
4. Fetch canonical events in pages, or return acknowledgments and authoritative per-game totals. Never merge whole totals from clients.
5. Do not let `create` or `sync` silently claim rewards; claims require a separate atomic transaction.
6. Only return a `synced:true` acknowledgment after persistence succeeds.

## Data model
See `supabase/achievement-schema-draft.sql`. The tables are service-role-only with RLS enabled and no anon/authenticated grants.

## Claim transaction
- Validate the stage ID and eligibility using **server-authoritative** achievement metrics.
- Insert unique claim row and a unique gem earning event, and update the canonical balance **in one transaction**.
- Return existing claim result on retry; never credit gems twice.
- Existing `sushi-id-sync` gem merge must recognize the server award event and must not overwrite or re-credit it.

## Required tests
- Run `node --test tests/achievement-merge.test.cjs`.
- Two devices offline then online; reverse sync order; no lost events.
- Duplicate event IDs with different values; reject rather than mutate original.
- Two simultaneous claims; exactly one gem credit.
- Failed transaction midway; no partial award.
- Repeated claim after timeout; no extra gems.
- Existing PIN lockout, avatar revision, weak-word union, daily claim and gem spend regression.

## Known caveat
Current client sends only a bounded first batch. A real sync protocol needs server acknowledgments/cursors and pagination so records beyond the first 500 are never stranded. The historical learning-event and achievement-event overlap also needs a single authoritative counting policy before ranks are published.
