# Game avatar rewards

The first reward is `reward-sushigiri` (hand equipment), earned when a completed すし斬り round ends with a score of at least 35,000. The `REWARD` rarity excludes it from the N/R/SR gacha pools. No gems are charged or granted, and the current outfit is not changed automatically.

Reward requirements live in `avatar.js` catalog entries under `reward: {game, minScore, label}`. `SushiAvatarStore.awardGameResult(game, score)` checks these requirements and grants owned IDs under the existing `sushitan-ledger` Web Lock. Duplicate results are idempotent. Existing ledger fields and avatar selections are preserved; successful grants record the best qualifying score in `gameAvatarRewards`.

`sushigiri.html` calls the reward UI only from a running round's `end()`. The result screen offers a link to the avatar editor; the player uses the normal save button to equip. Failed storage writes offer a retry and do not claim success. Rewards follow the existing browser-local save model, not server-verified achievements. Historical rankings are not automatically imported.

New outfit rewards can use the same catalog metadata and result hook. New aura rewards additionally need an owned aura slot/ID model; existing numeric aura choices remain unchanged.

Run `tests/game-avatar-rewards.cjs` with Playwright installed (or `PLAYWRIGHT_MODULE`) and optionally `CHROME_PATH`. It covers exact threshold boundaries, real game end integration, concurrent duplicate grants, legacy state preservation, equipment reload, rendering, and corrupt data handling.
