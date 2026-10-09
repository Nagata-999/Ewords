# PIN sync audit for achievements (2026-10-09)

## Existing sync route
- Browser client: `shared/sushi-profile.js`.
- Backend endpoint: Supabase Edge Function `sushi-id-sync`.
- Current payload contains `action`, `sushi_id`, `pin`, `player_name`, `ledger` (login/gems/avatar/daily), and `learning` (word learning events/cards).
- Current apply logic merges login claim IDs, avatar ownership, and learning event IDs.
- The repository does not contain the deployed `sushi-id-sync` Edge Function implementation. Its data schema and merge behavior must be inspected before adding achievement payload fields.
- Achievement event ledger `sushitan_achievement_v2:event:` is **not** included in the current sync payload. Do not label achievement counts or color selection as synced.

## Required server contract
1. Accept `achievements: {version:2,events:[{id,game,correct,at}],selectedRank,claimedIds}` with bounded sizes and validated event IDs.
2. Store events keyed by `(sushi_id,event_id)` with an idempotent uniqueness constraint. Ignore duplicate event IDs; reject mismatched duplicates.
3. Return the canonical union of events. Never sum whole-device aggregate totals.
4. Keep rank selection only if it is unlocked by canonical count. Resolve concurrent selection updates by a revision/timestamp contract.
5. Claim gems on the server atomically using a unique `(sushi_id,achievement_stage_id)` constraint. A client should only request claim; never independently add gems on retry.
6. Support paginated/delta sync if event volume grows. Define migration baseline separately to prevent counting old `SushiLearning` events twice.
7. Keep the existing avatar/gem/daily/learning merge code unchanged until regression tests pass.

## Blocking QA cases
- Same answer event sent twice from the same device and from two devices: one credit.
- Offline answers on A and B: all unique events survive both sync orders.
- A rank selected on A and a lower rank selected on B: deterministic selection, no locked colors.
- Two devices claim the same achievement at once: one gem award.
- Network error/retry during claim: exactly one award.
- Existing avatar appearance, gems, daily claims, and learning weak-word union unchanged.

## Current implementation warning
The feature branch is a **prototype**, not ready to merge. It uses a local-only ledger, and a heuristic combining historical `SushiLearning` and new events. This may overcount in overlapping event streams. Historical baseline reconciliation and backend work are required before production.
