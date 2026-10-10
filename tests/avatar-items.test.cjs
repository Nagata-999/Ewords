const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const context=vm.createContext({window:{}});
for(const file of ['avatar.js','avatar-engine.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../sushigacha',file),'utf8'),context);
const A=context.window.SushiAvatarV2;
test('animal and sports items remain equipable and valid in all poses',()=>{
  assert.equal(new Set(A.catalog.map(i=>i.id)).size,A.catalog.length);
  const added=A.catalog.filter(i=>/^(bunny-|cat-|panda-|basketball-|soccer-|tennis-|running-shoes)/.test(i.id));
  assert.equal(added.length,22);
  for(const i of added){
    assert(['N','R','SR'].includes(i.rarity));
    assert.equal(A.normalize({[i.slot]:i.id})[i.slot],i.id);
    for(const direction of ['front','back','left','right'])for(const action of ['idle','walk','wave','sit','celebrate']){
      const svg=A.render({[i.slot]:i.id},{direction,action,time:.3});
      assert(!/NaN|undefined/.test(svg),`${i.id}: ${direction}/${action}`);
    }
  }
});
test('all shoe types have distinct artwork, including seated feet',()=>{
  const shoes=A.catalog.filter(i=>i.slot==='shoes');
  for(const action of ['idle','walk','sit'])for(const direction of ['front','back','left','right']){
    const artwork=shoes.map(i=>{
      const svg=A.render({shoes:i.id},{direction,action,time:.3});
      const matches=[...svg.matchAll(/<g data-part="shoe" data-shoe-kind="([^"]+)">([\s\S]*?)<\/g>/g)];
      assert.equal(matches.length,2,`${i.id}/${action}`);
      assert.equal(matches[0][1],i.kind);
      return matches[0][2];
    });
    assert.equal(new Set(artwork).size,shoes.length);
  }
});
