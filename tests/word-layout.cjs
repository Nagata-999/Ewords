const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.join(__dirname, '..');
const sizes = [[1366, 768], [1024, 600], [800, 450], [640, 360], [390, 844], [320, 568], [1536, 864], [768, 432], [512, 288], [1366, 768]];

(async () => {
  for (const executablePath of (process.env.BROWSER_PATHS || '').split(';').filter(Boolean).length
    ? process.env.BROWSER_PATHS.split(';').filter(Boolean) : [undefined]) {
    const browser = await chromium.launch({ executablePath, headless: true });
    try {
      for (const name of ['sushitan', 'shinotan', 'antonitan']) {
        const source = fs.readFileSync(path.join(root, name + '.html'), 'utf8');
        const match = source.match(/    function layoutBalloons\(\) \{[\s\S]*?\n    \}\n\n    function createBalloon\(/);
        assert(match, name + ': expected layoutBalloons() function');
        const layoutSource = match[0].replace(/\n\n    function createBalloon\($/, '');
        const html = source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<link\b[^>]*>/gi, '');

        for (const withSharedLayout of [false, true]) {
          const page = await browser.newPage();
          await page.route('**/*', route => route.fulfill({ contentType: 'text/html', body: html }));
          await page.goto('http://layout.test/' + name);
          await page.addStyleTag({ content: fs.readFileSync(path.join(root, 'shared/learning-paths.css'), 'utf8') });
          await page.evaluate(() => {
            document.querySelectorAll('.overlay').forEach(el => el.remove());
            document.body.classList.add('sushi-taskbar-on');
            const arena = document.querySelector('.arena');
            for (let i = 0; i < 8; i++) {
              const btn = document.createElement('button');
              btn.className = 'balloon';
              btn.textContent = i % 2 ? 'take responsibility for something' : 'international cooperation';
              arena.append(btn);
            }
            document.querySelector('.question-text').textContent = '国際協力について責任を持って取り組む';
          });
          if (withSharedLayout) {
            await page.addScriptTag({ content: fs.readFileSync(path.join(root, 'sushigacha/site-layout.js'), 'utf8') });
          }
          await page.addScriptTag({ content: `(() => {
            const arena = document.querySelector('.arena');
            const GAME = { balloons: [...arena.querySelectorAll('.balloon')].map(el => ({el,x:0,y:0,w:0,h:0})) };
            ${layoutSource}
            window.__wordLayout = { layoutBalloons, GAME };
          })();` });

          for (const [width, height] of sizes) {
            await page.setViewportSize({ width, height });
            const result = await page.evaluate(() => {
              window.__wordLayout.layoutBalloons();
              const app = document.querySelector('.app');
              const arena = document.querySelector('.arena');
              const buttons = [...arena.querySelectorAll('.balloon')];
              const rects = buttons.map(b => b.getBoundingClientRect());
              const a = arena.getBoundingClientRect();
              const overlap = rects.some((r,i) => rects.some((s,j) => j > i && r.left < s.right - 1 && s.left < r.right - 1 && r.top < s.bottom - 1 && s.top < r.bottom - 1));
              return {
                count: buttons.length,
                overlap,
                clipped: buttons.some(b => b.scrollWidth > b.clientWidth + 2 || b.scrollHeight > b.clientHeight + 2),
                outsideArena: rects.some(r => r.left < a.left - 1 || r.right > a.right + 1 || r.top < a.top - 1 || r.bottom > a.bottom + 1),
                horizontal: app.scrollWidth > app.clientWidth + 2,
                positioning: buttons.every(b => getComputedStyle(b).position === 'absolute'),
                scroll: getComputedStyle(app).overflowY
              };
            });
            const context = JSON.stringify({ name, withSharedLayout, width, height, result });
            assert.equal(result.count, 8, context);
            assert.equal(result.overlap, false, context);
            assert.equal(result.clipped, false, context);
            assert.equal(result.outsideArena, false, context);
            assert.equal(result.horizontal, false, context);
            assert.equal(result.positioning, true, context);
            assert.equal(result.scroll, 'auto', context);
          }

          // Wrong answers disappear without rearranging surviving choices.
          const stationary = await page.evaluate(() => {
            const { GAME } = window.__wordLayout;
            const positions = () => GAME.balloons.map(b => { const r = b.el.getBoundingClientRect(); return [b.el.textContent, r.left, r.top, b.el.style.getPropertyValue('--word-choice-x'), b.el.style.getPropertyValue('--word-choice-y')]; });
            const wrong = GAME.balloons.splice(2, 1)[0];
            const before = positions();
            wrong.el.remove();
            return { before, after: positions() };
          });
          assert.deepEqual(stationary.after, stationary.before, name + ': removing choice moved survivors');
          await page.close();
        }
      }
    } finally {
      await browser.close();
    }
    console.log('PASS scattered word choices across browsers and viewport sizes:', executablePath || 'default');
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
