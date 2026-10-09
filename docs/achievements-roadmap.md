# Sushi Achievements — implementation roadmap

## Agreed product behavior
- Seven global rank colors based on lifetime correct answers: white 0, yellow 500, orange 2,000, green 5,000, blue 15,000, purple 50,000, black 150,000.
- Taskbar background displays the selected **unlocked** color; any previously unlocked color may be selected.
- Achievements should ultimately include every proposed category: vocabulary learning, games, daily learning and login streaks, gems, avatar collection, secret achievements, tiered badges, titles, manual gem claims, and celebratory unlock effects.
- The taskbar is the shared entry point for achievements; avoid adding a sixth full-width tab until responsive layout is validated.

## Current prototype limitations
- `sushigacha/achievement-ranks.js` provides rank calculations.
- `sushigacha/achievements-ui.js` offers a prototype taskbar trophy entry, color picker, and local-only counter.
- `sushitan.html` now reports correct answers from normal and review modes.
- This prototype **does not** yet import historical totals, sync via PIN, or credit any other game.
- Current local counter can diverge across devices. Do not ship as a cross-device achievement system until reconciliation is designed.
- Do not derive lifetime totals from daily quest progress, because those values are capped and reset.
- Never sum two device totals on merge; use durable unique answer event IDs or server-side per-device monotonic counters, and idempotent aggregation.
- Never reset rank due to a transient sync response. Award gem claims with stable achievement-stage IDs, only once on the authoritative store.

## Suggested phases
1. Verify current lifetime-stat sources and choose migration strategy for existing players.
2. Implement durable idempotent event counting across all games and safe PIN reconciliation.
3. Add achievement catalog: tiered correct answers, review mastery, combo, score, daily learning, login, collections, secret accomplishments.
4. Add claim ledger, gem awards, title selection, and unlocked badge display.
5. Add unlock animations, taskbar polish, mobile QA, and sync regression tests.

## QA acceptance
- One answer counts once, including refresh/retry and review mode.
- Switching devices never loses achievements and never double-counts the same event.
- Color selection persists, but cannot exceed unlocked rank.
- Gem claims remain exactly once across simultaneous devices.
- Existing avatar, daily quests, login bonus, and gem sync remain unchanged.
