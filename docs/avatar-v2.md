# Avatar v2

The avatar editor uses the same SVG renderer as the homepage walker and game avatar widget. The existing 30 item IDs remain valid; 10 additional gacha items and one starter shoe item are registered in `sushigacha/avatar.js`. Existing N/R/SR probabilities (60/30/10), draw cost (50 gems), and duplicate refund (30 gems) are unchanged.

## Data

- Canonical ledger: `sushitan_login_bonus_v1`.
- Equipped appearance: `gacha.avatar`; owned IDs: `gacha.owned`.
- Three saved looks and home display settings: top-level `avatarStudioV2`. Keeping these outside gacha avoids loss through old gacha normalization.
- Before the first successful v2 write, the complete previous ledger is copied to `sushitan_avatar_before_v2`. Backup failure aborts the write. Corrupt data is not replaced.
- Mutations use the existing `sushitan-ledger` Web Lock and reread the ledger inside the lock. Gems, login data, quests, unknown fields and unknown owned IDs are preserved. Browsers without Web Locks use synchronous read/modify/write, matching the existing fallback.
- Existing version-1 outfit IDs and corresponding legacy hats are recognized. Starter shoes are available without spending gems. Other added items require gacha ownership.
- Trying on an unowned item does not equip it or mutate the ledger. Both equip and saved-look writes check current ownership. Choosing **このコーデを保存** applies the draft; **着用中に戻す** discards the draft.

## Appearance and animation

The editor supports four face outlines, six expressions, hair/color/skin/eyes/mouth, existing pets/auras, seven equipment slots, five actions and four directions. Changing a face or trying on clothes updates both previews. OS reduced-motion, hidden-tab pause and home-avatar size/hide settings are supported.

`avatar-engine.js` exports `SushiAvatarV2.render` and `mount`. `avatar-render-bridge.js` adapts the legacy `avatarSVG` interface for gacha prize cards and the game widget. Homepage login-card behavior remains in `home-avatar-walker.js`; only its avatar section is replaced.

## Validation

`tests/avatar-v2.cjs` uses Playwright. Run `node tests/avatar-v2.cjs` from the repository, with Playwright installed. Optionally set `PLAYWRIGHT_MODULE` to its module path and `CHROME_PATH` to a browser executable.

Coverage: old-ledger import without load-time mutation; legacy hats; ownership checks; original-data backup; concurrent reward preservation; preset/settings persistence; new-item gacha acquisition and duplicate refund; equip after draw; home storage-event synchronization; game-widget rendering; 820 item/direction/action combinations; mobile layouts at 320 and 390px; corrupt data protection. Local browser tests block external requests and never submit results to production services.

The source update does not migrate any user's storage on the server. Each user's browser retains its own ledger; changes occur only through the normal local UI.
