const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
let checked = 0;
for (const file of fs.readdirSync(root, {recursive:true})) {
  if (file.endsWith('.js')) {
    const code = read(file);
    if (!/^\s*(import|export)\s/m.test(code)) { new vm.Script(code, {filename:file}); checked++; }
  }
  if (file.endsWith('.html')) {
    for (const m of read(file).matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      if (/type=["'](?:module|application\/ld\+json|application\/json)/i.test(m[1]) || !m[2].trim()) continue;
      new vm.Script(m[2], {filename:file}); checked++;
    }
  }
}
// Exercise the actual renderer for every hairstyle and outfit, not only syntax.
const ctx = {document:{getElementById:()=>null,documentElement:{}},MutationObserver:class {observe() {}}};
ctx.window = ctx; vm.createContext(ctx);
for (const file of ['avatar.js','avatar-modern.js','avatar-fun.js']) vm.runInContext(read('sushigacha/'+file), ctx);
vm.runInContext(`
  for (const gender of ['male','female']) for (let hair=0;hair<8;hair++) for (const item of ITEMS) {
    const svg=avatarSVG({...DEFAULT_AVATAR,gender,hair,[item.slot]:item.id,pet:1,aura:1});
    if (!svg.includes('<svg') || !svg.includes('</svg>') || svg.includes('undefined') || svg.includes('NaN')) throw Error('Invalid avatar');
  }
`, ctx);
for (const file of ['shinotan.html','sushi_quiz.html']) {
  const html=read(file);
  assert(!html.includes('document.write('), file+' must serve its game directly');
  assert(html.includes('<h1'), file+' must include its heading without a network bootstrap');
}
assert(!read('shinotan.html').includes('raw.githubusercontent.com'));
assert(!read('sushi_quiz.html').includes("REWARD=4"), 'obsolete duplicate daily tracker must not run');
assert(read('sushi_quiz.html').includes('sushi_quiz_latest_loader.js'), 'keep expansion loading');
assert(read('shinotan.html').includes('l.gems=(Number.isSafeInteger(l.gems)?l.gems:0)+10'), 'daily reward matches the taskbar');
console.log('PASS:',checked,'classic scripts; avatar variants; direct game documents; single quiz daily tracker; shino reward');
