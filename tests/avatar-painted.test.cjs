const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');const context=vm.createContext({window:{}});for(const f of ['avatar.js','avatar-engine.js'])vm.runInContext(fs.readFileSync('sushigacha/'+f,'utf8'),context);const A=context.window.SushiAvatarV2;
test('B materials retain catalog IDs, original silhouettes and save values',()=>{
 for(const item of A.catalog)for(const direction of ['front','right','back','left']){
  const avatar={[item.slot]:item.id},before=JSON.stringify(avatar),classic=A.render(avatar,{style:'classic',direction,reduced:true}),painted=A.render(avatar,{direction,reduced:true});
  assert.equal(JSON.stringify(avatar),before);assert.equal(A.normalize(avatar)[item.slot],item.id);
  const oldPaths=[...classic.matchAll(/<path d="([^"]+)"/g)].map(m=>m[1]);
  // Every original silhouette remains, including fill=none detail strokes.
  for(const d of oldPaths)assert(painted.includes('<path d="'+d+'"'),item.id+'/'+direction);
  assert(painted.includes('data-art-style="painted-b"'));assert(!/NaN|undefined/.test(painted));
  const ids=[...painted.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
  for(const m of painted.matchAll(/url\(#([^\)]+)\)/g))assert(ids.includes(m[1]),'unresolved paint reference');
 }
});
test('material references differ between outfits and reduced motion is stable',()=>{
 const a=A.render({top:'starter'},{reduced:true,time:0}),b=A.render({top:'cat-hoodie'},{reduced:true});
 const ids=s=>[...s.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);assert(!ids(a).some(id=>ids(b).includes(id)));
 assert.equal(a,A.render({top:'starter'},{reduced:true,time:80}));assert(!A.render({}, {style:'classic'}).includes('<defs>'));
});
