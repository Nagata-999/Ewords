# Collectible face and hair parts

Six unisex items join the existing gacha pools:

| ID | Name | Rarity | Slot |
| --- | --- | --- | --- |
| eyes-anime | アニメ風の大きな目 | R | eyeStyle |
| eyes-sharp | 鋭い目 | R | eyeStyle |
| eyes-star | 星の瞳 | SR | eyeStyle |
| eyes-red | 赤い瞳 | R | eyeStyle |
| hair-spiky | ツンツン髪 | R | hairStyle |
| hair-princess | お姫様巻き髪 | SR | hairStyle |

The gacha still costs 50 gems, refunds 30 for duplicates, and rolls N/R/SR at 60/30/10 percent. Items are uniform within their rarity pool. The displayed pool count is computed from N/R/SR items, excluding starters and game rewards.

Optional `eyeStyle` and `hairStyle` IDs override the existing numeric `eyes` and `hair` values. Basic values remain saved; selecting a basic part clears the matching collectible ID. The existing ownership checks cover both slots. Gender changes do not discard collectible parts. Presets, game rewards, hand equipment, and aura remain independent.

Owned parts appear in the editor's eye/hair selectors and closet tabs. Unowned parts cannot be saved. Eye prize previews use the neutral expression so the design is visible; equipping keeps the player's expression. Expressions, blinking, directions, hair colors, and hats are supported by the shared SVG renderer.

Run `tests/gacha-face-parts.cjs` with Playwright (`PLAYWRIGHT_MODULE` / `CHROME_PATH` optional). Tests select deterministic random samples through the real gacha roll, verify acquisition/refunds/demo, equip/reload, legacy state, presets, gender switching, basic reset, home/widget rendering, 384 render combinations, and mobile layouts.
