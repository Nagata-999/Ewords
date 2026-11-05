const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.join(__dirname, '..');
const sizes = [[1366,768],[1024,600],[800,450],[640,360],[390,844],[320,568],[1536,864],[768,432],[512,288]];

(async () => {
  const browsers = (process.env.BROWSER_PATHS || '').split(';').filter(Boolean);
  for (const executablePath of browsers.length ? browsers : [undefined]) {
    const browser = await chromium.launch({ executablePath, headless: true });
    try {
      for (const name of ['sushitan','shinotan','antonitan']) {
        const source = fs.readFileSync(path.join(root, name + '.html'), 'utf8');
        assert(source.includes("button.style.visibility = 'hidden'"), name + ': wrong answer must preserve grid slot');
        const html = source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<link\b[^>]*>/gi, '');
        for (const withSharedLayout of [false, true]) {
          const page = await browser.newPage();
          await page.route('**/*', route => route.fulfill({ contentType: 'text/html', body: html }));
          await page.goto('http://layout.test/' + name);
          await page.addStyleTag({ content: fs.readFileSync(path.join(root, 'shared/learning-paths.css'), 'utf8') });
          await page.evaluate(() => {
            document.querySelectorAll('.overlay').forEach(e => e.remove());
            document.body.classList.add('sushi-taskbar-on');
            const arena = document.querySelector('.arena');
            for (let i = 0; i < 8; i++) {
              const b = document.createElement('button');
              b.className = 'balloon';
              b.textContent = i % 2 ? 'take responsibility for something' : 'international cooperation';
              arena.append(b);
            }
          });
          if (withSharedLayout) await page.addScriptTag({ content: fs.readFileSync(path.join(root, 'sushigacha/site-layout.js'), 'utf8') });
          for (const [width,height] of sizes) {
            await page.setViewportSize({width,height});
            const result = await page.evaluate(() => {
              const arena = document.querySelector('.arena');
              const app = document.querySelector('.app');
              const buttons = [...arena.querySelectorAll('.balloon')];
              const before = buttons.map(b => b.getBoundingClientRect());
              buttons[2].style.visibility = 'hidden';
              buttons[2].disabled = true;
              const after = buttons.map(b => b.getBoundingClientRect());
              const stable = before.every((r,i) => Math.abs(r.left-after[i].left)<1 && Math.abs(r.top-after[i].top)<1);
              const overlap = before.some((r,i) => before.some((s,j) => j>i && r.left<s.right-1 && s.left<r.right-1 && r.top<s.bottom-1 && s.top<r.bottom-1));
              return {
                grid: getComputedStyle(arena).display === 'grid',
                stable, overlap,
                clipped: buttons.some(b => b.scrollWidth>b.clientWidth+2 || b.scrollHeight>b.clientHeight+2),
                horizontal: app.scrollWidth>app.clientWidth+2,
                scroll: getComputedStyle(app).overflowY,
                hidden: getComputedStyle(buttons[2]).visibility === 'hidden',
                count: buttons.length
              };
            });
            const info = JSON.stringify({name,withSharedLayout,width,height,result});
            assert(result.grid && result.stable && !result.overlap && !result.clipped && !result.horizontal && result.scroll==='auto' && result.hidden && result.count===8,info);
          }
          await page.close();
        }
      }
    } finally { await browser.close(); }
    console.log('PASS grid slots remain stable:',executablePath||'default');
  }
})().catch(error => { console.error(error); process.exitCode=1; });
