# Reading60 guest persistence and spaced-review implementation specification (2026-11-14)

Status: design only; **not implemented**. Based on `reading60/index.html` main blob `964fba56d644da48502b385707e8b68d543f7b71`, and PR #114. The current guest store is `sessionStorage['sushitan-reading60-session-v2']`; the existing code has no next-day review schedule.

## Storage boundary
- New key: `localStorage['sushitan-reading60-progress-v1']`, separate from all PIN, wallet, ranking, and other game keys. Do not write to PIN APIs or D1.
- Schema: `{version:1,updatedAt,history:[{id,correct,first,seconds,date}],items:{[id]:{attempts,lapses,lastAnsweredAt,nextReviewAt}},queue:[{id,notBeforePresentation}],presentations:number}`.
- Keep current-session state in memory even if storage is unavailable. Show a nonblocking storage warning, never claim persistence when a write fails.
- Migration: read/validate durable v1 first; if absent, read legacy session v2; import only valid question IDs and bounded finite time values. Write durable record and verify it can be parsed before retiring any legacy record. Never overwrite newer durable data with older session data.
- Malformed JSON, quota errors, private-mode exceptions, unknown IDs, or future schema versions must not crash the game or silently erase a valid existing record. A future version should be left untouched.

## Scheduling invariants
1. Initial unseen question order is randomized. Repeated questions should not appear in the unseen deck.
2. An incorrect answer enters the tail of a review queue with `notBeforePresentation = currentPresentation + 6`. This means at least five *other* question presentations must occur before reappearance. A skipped item must not count as a correct answer.
3. When a review item becomes eligible, do not violate its minimum spacing to satisfy a calendar deadline; calendar due and presentation due are independent conditions.
4. Correct first attempts also receive a next-day review date; after correct review, use an increasing interval (e.g. 1, 3, 7, 14 days), reset to one day after an error. Store ISO timestamps and compare against actual clock, not the browser tab lifetime.
5. If the bank is too small to supply five other distinct questions, do not replay the failed item early; explain that more questions or a later session are needed.
6. The same question ID should have at most one pending queue entry. Reloading should preserve its due boundary. If a question is already due for calendar review, avoid adding a second copy.
7. `history.first` is true only for the first recorded attempt for that ID, including across reloads and days. First-attempt and review accuracy use separate denominators. Track seconds as finite nonnegative values; 60 seconds is advisory, never auto-submit.

## Acceptance tests before release
- New visitor: answer incorrectly, inspect next five *distinct* presentations, assert failed ID is absent; then allow it at presentation six or later.
- Reload after two intervening presentations: the gap is not reset and history is not duplicated.
- Close/reopen browser on next day: history and due items remain; the start screen reports due review accurately.
- Correct on first attempt: due tomorrow; correct on review: interval increases; incorrect on review: interval resets.
- Multiple incorrect attempts: exactly one pending queue entry for each ID, and no early replay.
- Storage disabled/quota exhausted/malformed legacy/future-version data: game remains playable, warns appropriately, preserves other keys.
- Verify reset clears only Reading60 keys, not PIN, wallet, ranking or other game data.
- Verify mobile layout, 60-second timer rollover, skip behavior, evidence highlight, vocabulary tap, and feedback.
- Run static QA plus browser tests against PR branch before requesting merge.

## Current release status
- 78/100 questions per last recorded audit; no questions added by this document.
- No runtime code, DB, PIN sync or production deployment changed. PR #114 remains subject to user approval before merge.
