const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'sushi_idiom (1).html'), 'utf8');
const script = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).find(s => s.includes('function answer('));
const bridge = fs.readFileSync(path.join(root, 'sushigacha/daily-quest-click-bridge.js'), 'utf8');
const KEY = 'sushitan_login_bonus_v1', ACTIVE = 'sushitan_daily_active_v1';
function boot(store = new Map(), active = true, pathname = '/Ewords/sushi_idiom%20(1).html') {
  let now = new Date(2026, 8, 22, 12).getTime();
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }
  const nodes = new Map(), listeners = new Map(), observers = [];
  function node() {
    const classes = new Set();
    return { value: '', textContent: '', style: {}, children: [], disabled: false,
      classList: { add: x => classes.add(x), remove: x => classes.delete(x), toggle: () => {}, contains: x => classes.has(x) },
      appendChild(child) { this.children.push(child); if (child.id) nodes.set(child.id, child); },
      set innerHTML(value) { this.children = []; }, get innerHTML() { return ''; }
    };
  }
  const ctx = { console, Date: Clock, Math, performance: { now: () => 0 },
    setTimeout: () => 1, clearTimeout() {}, requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    alert() {}, confirm: () => true, location: { pathname },
    localStorage: { getItem: k => store.get(k) || null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
    CustomEvent: class { constructor(type) { this.type = type; } },
    addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(fn); },
    dispatchEvent(event) { for (const fn of listeners.get(event.type) || []) fn(event); },
    MutationObserver: class { constructor(fn) { observers.push(fn); } observe() {} },
    document: { getElementById(id) { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); },
      createElement: node, body: node(), documentElement: node(),
      querySelectorAll: () => [...nodes.values()].flatMap(n => n.children).filter(n => n.classList.contains('good')) },
    supabase: { createClient: () => ({}) }
  };
  ctx.window = ctx;
  if (!store.has(ACTIVE)) store.set(ACTIVE, JSON.stringify({day:'2026-09-22',active:active?['idiom','quiz','talk','run']:['sushitan','quiz','talk','run']}));
  vm.createContext(ctx); vm.runInContext(script, ctx); vm.runInContext(bridge, ctx);
  const run = code => vm.runInContext(code, ctx);
  return { ctx, store, run, nextDay() { now += 86400000; },
    answer(correct, repeated = false) {
      run("state.playing=true;nextQ()");
      run(correct ? "answer(state.current.answer, $('choices').children.find(b=>b.textContent===state.current.answer))" : "answer('wrong', $('choices').children.find(b=>b.textContent!==state.current.answer))");
      if (repeated) run("answer(state.current.answer, $('choices').children[0])");
      for (const fn of observers) fn();
    },
    saved() { return JSON.parse(store.get(KEY) || '{}'); }
  };
}
for (const pathname of ['/sushi_idiom%20(1)', '/sushi_idiom%20(1)/', '/sushi_idiom%20(1).html', '/sushi_idiom', '/sushi_idiom.html']) {
  const routed = boot(new Map(), true, pathname);
  routed.answer(false);
  assert.equal(routed.saved().dailyQuests?.progress.idiom || 0, 0, pathname);
  routed.answer(true, true);
  assert.equal(routed.saved().dailyQuests?.progress.idiom, 1, pathname);
}
const game = boot();
game.answer(false);
assert.equal(game.saved().dailyQuests?.progress.idiom || 0, 0, 'revealed correct choice after a mistake is not progress');
game.answer(true, true);
assert.equal(game.saved().dailyQuests.progress.idiom, 1, 'locked repeated answer counts once');
game.run("state.playing=false;answer(state.current.answer, $('choices').children[0])");
assert.equal(game.saved().dailyQuests.progress.idiom, 1, 'ended game cannot add progress');
for (let i=0;i<8;i++) game.answer(true);
assert.equal(game.saved().dailyQuests.progress.idiom, 9);
assert.equal(game.saved().gems || 0, 0);
game.answer(true);
assert.equal(game.saved().dailyQuests.progress.idiom, 10);
assert.equal(game.saved().dailyQuests.claimed.idiom, true);
assert.equal(game.saved().gems, 10);
game.answer(true);
assert.equal(game.saved().gems, 10, 'reward is granted once');
const reload = boot(game.store);
reload.answer(true);
assert.equal(reload.saved().gems, 10, 'reload preserves claimed reward');
const inactive = boot(new Map(), false);
inactive.answer(true);
assert.equal(inactive.saved().dailyQuests, undefined, 'unselected daily quest earns no progress');
const review = boot();
review.run("state.mode='review';addWrong(QUESTIONS[0].key)");
review.answer(false); review.answer(true);
assert.equal(review.saved().dailyQuests.progress.idiom, 1, 'review counts only actual correct answers');
game.nextDay();
game.store.set(ACTIVE, JSON.stringify({day:'2026-09-23',active:['idiom','quiz','talk','run']}));
game.answer(true);
assert.equal(game.saved().dailyQuests.day, '2026-09-23');
assert.equal(game.saved().dailyQuests.progress.idiom, 1);
assert.equal(game.saved().dailyQuests.claimed.idiom, undefined);
assert.equal(game.saved().gems, 10);
assert(html.includes('daily-quest-click-bridge.js?v=20260922-2'));
console.log('PASS: wrong/revealed answer, correct, repeated click, ended game, 10-answer reward, cap, reload, inactive daily, review, next day');
