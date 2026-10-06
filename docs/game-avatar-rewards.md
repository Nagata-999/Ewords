# Game avatar rewards

| Game | Final score condition | Reward | Equipment slot |
| --- | --- | --- | --- |
| すし斬り | >= 35,000 | すし斬り | hand |
| すし単 (ALL / Lv.1–Lv.4) | > 1,500 (integer minimum 1,501) | 烈火のオーラ | auraEffect |

The score is the final displayed score, including the game's result bonuses. すし単 awards from both time-up and perfect-clear results. Review sessions and other game modes do not qualify. Historical rankings are not imported.

Catalog `reward` metadata defines the game and minimum score. `SushiAvatarStore.awardGameResult` grants IDs under the existing ledger lock, preserves existing fields, and does not charge gems, grant duplicate compensation, or change current equipment. REWARD items are excluded from the N/R/SR gacha pools. These achievements use the existing browser-local save model.

`game-avatar-rewards.js` shows the item in its catalog slot, provides storage retries, and links to the editor. The editor's normal save action equips it. `auraEffect` is an optional owned slot independent of `hand`, so the katana and aura can coexist. The old numeric `aura` field remains compatible. Selecting a basic aura clears `auraEffect`; a selected reward aura takes visual precedence. Owned reward auras are available in both the aura selector and the closet.

The flame SVG is drawn behind the character. Gentle movement respects reduced-motion settings. The shared renderer covers the editor, saved looks, home walker, and game widget.

Tests: `tests/game-avatar-rewards.cjs` (katana regression), `tests/sushitan-aura.cjs` (all levels, boundaries, both completion paths, ownership, persistence, combined equipment, home display, reduced motion, mobile widths). Requires Playwright; optional `PLAYWRIGHT_MODULE`, `CHROME_PATH`, and `AVATAR_SCREENSHOT_DIR` environment variables select local tooling/output.
