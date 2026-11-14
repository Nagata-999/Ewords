# Reading60 runtime review — 2026-11-14

Scope: source inspection of `reading60/index.html` on main at blob `964fba56d644da48502b385707e8b68d543f7b71`, and open PR #114's static QA. No browser execution or production writes.

## Confirmed implementation facts
- Guest progress is written to `sessionStorage` under `sushitan-reading60-session-v2`. It is not persistent across independent browser sessions, so next-day review is **not implemented**.
- `state.history` records `id`, `correct`, `first`, `seconds`, `date`. The start screen calculates initial and review accuracy and mean time.
- `deck` is shuffled on page load. Incorrect responses are queued at `due: served+6`; the scheduler uses `due<=served`. This appears intended to leave five other presentations between an incorrect answer and its next attempt, but needs a browser test with skips and reloads.
- When a question is answered correctly on review, the queued item is removed and there is no scheduled later review. Correct first attempts likewise have no next-day schedule.
- No PIN sync or D1 code is called by the Reading60 game in the inspected source. This does not establish that unrelated shared code is regression-free.

## Concrete browser test cases (not yet executed)
1. Fresh guest session: first question, wrong answer, then five distinct questions, then the wrong question reappears no earlier than the sixth subsequent presentation.
2. Reload same tab mid-queue; verify queue order and history survive, and the five-question gap remains valid.
3. Close the tab and return next day: currently expect **lost guest progress** due to sessionStorage; this is a known missing feature, not a passing test.
4. Answer correctly on review and return next day: currently no scheduled repetition.
5. Skip a question, answer after 60 seconds, and leave the game screen; verify timers, stored duration, and queue behavior.
6. Compare PIN login/logout and existing game progress before/after any future storage change.

## Recommended next implementation
Keep Reading60's guest data in a dedicated namespaced `localStorage` record (or another explicitly approved durable client store), with schema version and migration from the existing session key. Add a `nextReviewAt` date per item, do not let clock-based due items violate the minimum five-question gap, and preserve PIN synchronization untouched until separately designed and tested. Handle storage quota and malformed JSON without destroying the current session. Add browser tests before changing production.

## Progress and release discipline
- Live question count remains 78/100; this review adds 0 questions and 0 runtime fixes.
- PR #114 remains an unmerged QA-only change. Do not merge without approval.
