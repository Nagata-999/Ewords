(function(root){'use strict';
const STAGES=[
 ['風待ちの草原','BREEZE MEADOW','草原の守り手','#a1cfa1','#e6f2dd','meadow'],
 ['木漏れ日の森','WHISPER WOODS','古木の精霊','#4c8772','#c0dec6','forest'],
 ['珊瑚の海岸','CORAL COAST','潮騒の甲殻王','#66bfc5','#d8f1ee','coast'],
 ['琥珀の砂丘','AMBER DUNES','砂漠の番人','#d59a63','#f3dfb4','desert'],
 ['星灯りの遺跡','STARLIT RUINS','月影の騎士','#697eaa','#b2bbd9','ruins'],
 ['霜花の峠','FROST PASS','氷晶の巨人','#8baec5','#e5eef1','snow'],
 ['朱色の火山','EMBER PEAK','熔岩の竜','#ad655c','#e6af8d','volcano'],
 ['雲上の庭園','CLOUD GARDEN','天空の獅子','#83a4bc','#e3e9ee','cloud'],
 ['宵闇の城','TWILIGHT KEEP','宵の魔導士','#605775','#b5a3b6','castle'],
 ['黎明の聖域','DAWN SANCTUARY','黎明の竜王','#b6a17a','#f5ebcf','sanctuary']
].map((a,i)=>({id:i,name:a[0],english:a[1],boss:a[2],color:a[3],sky:a[4],theme:a[5],hp:Math.round(32*1.48**i),attack:Math.round(10*1.3**i),bossHp:Math.round(170*1.65**i),bossAttack:Math.round(16*1.32**i)}));
const RARITIES=[{name:'コモン',color:'#aebbc0',mult:1},{name:'レア',color:'#64beb0',mult:1.65},{name:'エピック',color:'#b398e0',mult:2.6},{name:'レジェンド',color:'#e7b760',mult:4}];
const PETS=[{id:'cat',name:'こねこ',power:1,skill:'攻撃に参加',kind:'cat',rarity:0},{id:'sushi',name:'すし丸',power:1,skill:'毎秒HPを0.3回復',kind:'sushi',rarity:0},{id:'slime',name:'ぷるり',power:2,skill:'防御 +1',kind:'slime',rarity:1},{id:'dino',name:'こりゅう',power:3,skill:'クリティカル +5%',kind:'dino',rarity:1},{id:'fox',name:'月のきつね',power:5,skill:'獲得経験値 +20%',kind:'fox',rarity:2},{id:'phoenix',name:'暁のフェニックス',power:8,skill:'毎秒HPを1回復',kind:'phoenix',rarity:3}];
const ALLIES=[{id:'archer',name:'森の射手 ミナ',unlock:2,description:'追撃ダメージ +4',kind:'archer'},{id:'healer',name:'旅の癒し手 リオ',unlock:5,description:'毎秒HPを1回復',kind:'healer'},{id:'mage',name:'星詠み ノア',unlock:8,description:'追撃ダメージ +10',kind:'mage'}];
const SLOTS=['sword','shield','head','body','feet','accessory'];
const SLOT_NAMES={sword:'剣',shield:'盾',head:'頭',body:'胴',feet:'足',accessory:'アクセサリ'};
const SLOT_BASE={sword:{power:4},shield:{defense:1},head:{health:0},body:{health:8},feet:{haste:0},accessory:{crit:0}};
const integer=(v,min,max,d=min)=>Number.isSafeInteger(v)&&v>=min&&v<=max?v:d;
const fields=['power','health','defense','crit','haste','regen','leech'];
function starter(slot,id){return {id,slot,name:{sword:'欠けた鉄の剣',shield:'古びた木の盾',head:'旅人の頭巾',body:'薄い布の服',feet:'すり減った靴',accessory:'素朴な紐飾り'}[slot],rarity:0,upgrade:0,...Object.fromEntries(fields.map(f=>[f,SLOT_BASE[slot][f]||0]))};}
function initial(total=0){return {version:2,stage:0,unlocked:0,level:1,xp:0,gold:0,kills:0,waves:0,deaths:0,cleared:[],inventory:SLOTS.map((slot,i)=>starter(slot,i+1)),equipped:Object.fromEntries(SLOTS.map((slot,i)=>[slot,i+1])),pets:['cat'],pet:'cat',petTokens:3,sequence:6,studyBaseline:Math.max(0,total),studyHighWater:Math.max(0,total),studyClaimed:0,practiceExtra:0,studyChests:0,bossWins:0};}
function restore(raw,total=0){const d=initial(total);if(!raw||raw.version!==2)return d;
 for(const k of ['stage','unlocked'])d[k]=integer(raw[k],0,9);
 for(const k of ['gold','xp','kills','waves','deaths','sequence','studyBaseline','studyHighWater','studyClaimed','practiceExtra','studyChests','bossWins'])d[k]=integer(raw[k],0,100000000,d[k]);
 d.level=integer(raw.level,1,80,1);d.petTokens=integer(raw.petTokens,0,100000,3);
 d.cleared=[...new Set((Array.isArray(raw.cleared)?raw.cleared:[]).filter(v=>Number.isInteger(v)&&v>=0&&v<=9))];
 d.pets=[...new Set(['cat',...(Array.isArray(raw.pets)?raw.pets:[]).filter(id=>PETS.some(p=>p.id===id))])];d.pet=d.pets.includes(raw.pet)?raw.pet:'cat';
 const ids=new Set(),gear=(Array.isArray(raw.inventory)?raw.inventory:[]).filter(g=>g&&SLOTS.includes(g.slot)&&Number.isSafeInteger(g.id)&&g.id>0&&typeof g.name==='string'&&!ids.has(g.id)&&ids.add(g.id)).slice(-96).map(g=>({...g,name:g.name.slice(0,40),rarity:integer(g.rarity,0,3),...Object.fromEntries(fields.map(f=>[f,integer(g[f],0,100000)])),upgrade:integer(g.upgrade,0,20)}));
 if(gear.length){d.inventory=gear;d.sequence=Math.max(d.sequence,...gear.map(g=>g.id));for(const slot of SLOTS){let item=gear.find(g=>g.slot===slot&&g.id===raw.equipped?.[slot])||gear.find(g=>g.slot===slot);if(!item){item=starter(slot,++d.sequence);gear.push(item);}d.equipped[slot]=item.id;}}
 d.stage=Math.min(d.stage,d.unlocked);return d;}
function stats(s){const worn=SLOTS.map(slot=>s.inventory.find(g=>g.id===s.equipped[slot])).filter(Boolean),sum=f=>worn.reduce((n,g)=>n+(g[f]||0),0),p=PETS.find(p=>p.id===s.pet)||PETS[0],allies=ALLIES.filter(a=>s.cleared.length>=a.unlock);return {attack:6+Math.floor((s.level-1)/3)+sum('power'),hp:50+(s.level-1)*2+sum('health'),defense:sum('defense')+(p.id==='slime'?1:0),crit:Math.min(.5,.03+sum('crit')/100+(p.id==='dino'?.05:0)),haste:Math.min(.45,sum('haste')/100),leech:Math.min(.2,sum('leech')/100),regen:sum('regen')/10+(p.id==='sushi'?.3:p.id==='phoenix'?1:0)+(allies.some(a=>a.id==='healer')?1:0),support:p.power+allies.reduce((n,a)=>n+(a.id==='archer'?4:a.id==='mage'?10:0),0),pet:p,allies};}
function score(g){return g.power*2+g.health/4+g.defense*4+g.crit+g.haste+g.regen+g.leech*2;}
function create(raw,total=0,rng=Math.random){let state=restore(raw,total),fight=null,paused=false,events=[],clock=0,heroHp=stats(state).hp,attackClock=0,enemyClock=0,enemySeq=0,recovery=0,guardUntil=0,target=null,potions=3;const cooldowns={slash:0,guard:0,potion:0};
 const emit=(kind,data={})=>events.push({kind,...data});
 function save(){return JSON.parse(JSON.stringify(state));}
 function addGear(g){if(state.inventory.length>=96){const junk=state.inventory.filter(i=>!Object.values(state.equipped).includes(i.id)).sort((a,b)=>score(a)-score(b))[0];if(junk){state.inventory=state.inventory.filter(i=>i.id!==junk.id);state.gold+=5+5*junk.rarity;emit('salvage',{item:junk});}}state.inventory.push(g);emit('loot',{item:g});return g;}
 function loot(source='enemy',forcedSlot){const r=rng(),rarity=source==='study'?(r<.55?1:r<.93?2:3):source==='boss'?(r<.65?1:r<.94?2:3):(r<.60?0:r<.88?1:r<.985?2:3),slot=SLOTS.includes(forcedSlot)?forcedSlot:SLOTS[Math.min(5,Math.floor(rng()*6))],tier=state.stage+1,m=RARITIES[rarity].mult,g={id:++state.sequence,slot,rarity,upgrade:0,...Object.fromEntries(fields.map(f=>[f,0]))};
 const sets=['野営の','翠鋼の','星刻の','黎明の'],names={sword:'長剣',shield:'ラウンドシールド',head:'兜',body:'胸甲',feet:'戦靴',accessory:'護符'};g.name=sets[rarity]+names[slot];
 if(slot==='sword')g.power=Math.round((7+tier*3)*m);
 if(slot==='shield'){g.defense=Math.round((2+tier)*m);g.health=Math.round(4*m);}
 if(slot==='head'){g.health=Math.round((12+tier*4)*m);g.defense=Math.round(m);}
 if(slot==='body'){g.health=Math.round((24+tier*6)*m);g.defense=Math.round((1+tier)*m);}
 if(slot==='feet'){g.health=Math.round(5*m);g.haste=Math.round((4+tier)*m);g.defense=Math.round(m);}
 if(slot==='accessory'){g.power=Math.round((1+tier)*m);g.crit=Math.round(3*m);}
 if(rarity>0){const affix=['power','health','defense','crit','haste','regen','leech'][Math.min(6,Math.floor(rng()*7))];g[affix]+=Math.round((affix==='health'?8:affix==='regen'?3:2)*m);g.affix=affix;}
 return addGear(g);}
 function study(total,extra=0){if(Number.isSafeInteger(total))state.studyHighWater=Math.max(state.studyHighWater,total);state.practiceExtra+=integer(extra,0,1000);const earned=Math.floor((Math.max(0,state.studyHighWater-state.studyBaseline)+state.practiceExtra)/20),n=Math.max(0,Math.min(100,earned-state.studyClaimed));if(n){state.studyClaimed+=n;state.studyChests+=n;state.petTokens+=n;emit('study',{count:n});}return n;}
 function chest(){if(state.studyChests<1)return null;state.studyChests--;return loot('study');}
 const mobSets=[[0,0,1],[1,0,1],[2,0,2],[3,5,3],[4,5,4],[5,4,5],[3,5,4],[1,4,5],[4,3,5],[5,1,4]],mobNames=['苔のスライム','棘のスプリガン','潮のカニ','砂のレイダー','幽影コウモリ','ルーンゴーレム'];
 function spawn(boss=false){const st=STAGES[state.stage],factor=1.48**state.stage,count=boss?3:Math.min(5,3+Math.floor(state.stage/4)),enemies=[];
  for(let i=0;i<count;i++){const isBoss=boss&&i===0,kind=mobSets[state.stage][i%3],hp=Math.round((isBoss?170:32)*(isBoss?1.65**state.stage:factor)),attack=Math.round((isBoss?16:10)*(isBoss?1.32**state.stage:1.3**state.stage));enemies.push({id:++enemySeq,boss:isBoss,hp,maxHp:hp,attack,kind,name:isBoss?st.boss:mobNames[kind],stun:0});}
  fight={boss,enemies,approach:1.2,age:0,turn:0};target=enemies[0].id;attackClock=enemyClock=0;emit('spawn',{boss,enemies:enemies.map(e=>({...e}))});}
 function experience(n){state.xp+=Math.round(n*(state.pet==='fox'?1.2:1));while(state.level<80&&state.xp>=12+state.level*8){state.xp-=12+state.level*8;state.level++;heroHp=Math.min(stats(state).hp,heroHp+12);emit('level',{level:state.level});}}
 function enemyDown(e){state.kills++;state.gold+=(e.boss?35:5)*(state.stage+1);experience((e.boss?10:2)*(state.stage+1));emit('enemy-down',{target:e.id,boss:e.boss});if(e.boss||state.kills===1||rng()<.8)loot(e.boss?'boss':'enemy');}
 function complete(){const boss=fight.boss;state.waves++;state.gold+=8*(state.stage+1);experience(3*(state.stage+1));emit('victory',{boss});potions=Math.min(3,potions+1);
  if(boss&&!state.cleared.includes(state.stage)){state.cleared.push(state.stage);state.unlocked=Math.min(9,Math.max(state.unlocked,state.stage+1));state.bossWins++;emit('stage-clear',{stage:state.stage});}
  heroHp=Math.min(stats(state).hp,heroHp+stats(state).hp*.18);fight=null;}
 function hit(e,damage,critical=false,skill=false){if(!e||e.hp<=0)return;e.hp=Math.max(0,e.hp-damage);heroHp=Math.min(stats(state).hp,heroHp+damage*stats(state).leech);emit('attack',{damage,target:e.id,critical,skill});if(!e.hp)enemyDown(e);}
 function step(dt){if(paused)return;dt=Math.min(.25,Math.max(0,Number(dt)||0));clock+=dt;for(const k of Object.keys(cooldowns))cooldowns[k]=Math.max(0,cooldowns[k]-dt);
  if(recovery>0){recovery=Math.max(0,recovery-dt);if(!recovery)heroHp=stats(state).hp;return;}if(!fight){spawn();return;}
  const st=stats(state);heroHp=Math.min(st.hp,heroHp+st.regen*dt);fight.age+=dt;for(const e of fight.enemies)e.stun=Math.max(0,e.stun-dt);
  if(fight.approach>0){fight.approach-=dt;return;}attackClock+=dt;enemyClock+=dt;
  if(attackClock>=.95*(1-st.haste)){attackClock=0;const enemy=fight.enemies.find(e=>e.id===target&&e.hp>0)||fight.enemies.find(e=>e.hp>0);target=enemy?.id;const critical=rng()<st.crit;hit(enemy,Math.round(st.attack*(critical?1.65:1)+st.support),critical);if(fight.enemies.every(e=>e.hp<=0)){complete();return;}}
  if(enemyClock>=1.55){enemyClock=0;fight.turn++;const alive=fight.enemies.filter(e=>e.hp>0&&e.stun<=0),guarded=clock<guardUntil,damage=alive.reduce((sum,e)=>sum+Math.max(1,e.attack-st.defense),0),taken=Math.max(0,Math.round(damage*(guarded?.25:1)));heroHp=Math.max(0,heroHp-taken);emit('hurt',{damage:taken,guarded,attackers:alive.map(e=>e.id)});if(!heroHp){const boss=fight.boss;state.deaths++;emit('defeat',{boss,turn: fight.turn});fight=null;recovery=2.2;potions=Math.min(3,potions+1);}}}
 function skill(kind){if(paused||!fight||fight.approach>0||recovery>0||cooldowns[kind]>0)return false;const st=stats(state);
  if(kind==='slash'){cooldowns.slash=6;emit('skill',{skill:kind});for(const e of fight.enemies){if(e.hp>0){e.stun=1.15;hit(e,Math.round(st.attack*1.4+st.support),false,true);}}if(fight.enemies.every(e=>e.hp<=0))complete();return true;}
  if(kind==='guard'){cooldowns.guard=5;guardUntil=clock+2.1;emit('skill',{skill:kind});return true;}
  if(kind==='potion'&&potions>0&&heroHp<st.hp){cooldowns.potion=8;potions--;heroHp=Math.min(st.hp,heroHp+st.hp*.45);emit('skill',{skill:kind});return true;}return false;}
 function selectTarget(id){if(!fight?.enemies.some(e=>e.id===id&&e.hp>0))return false;target=id;return true;}
 function boss(){if(fight?.boss||paused||recovery>0)return false;heroHp=stats(state).hp;spawn(true);return true;}
 function retreat(){if(!fight?.boss)return false;fight=null;heroHp=stats(state).hp;emit('retreat');return true;}
 function stage(id){if(!Number.isInteger(id)||id<0||id>state.unlocked)return false;state.stage=id;fight=null;recovery=0;heroHp=stats(state).hp;return true;}
 function equip(id){const g=state.inventory.find(g=>g.id===id);if(!g)return false;const before=stats(state).hp;state.equipped[g.slot]=id;const after=stats(state).hp;heroHp=Math.min(after,heroHp+Math.max(0,after-before));emit('equip',{slot:g.slot});return true;}
 function best(){for(const slot of SLOTS)equip(state.inventory.filter(g=>g.slot===slot).sort((a,b)=>score(b)-score(a))[0].id);}
 function forge(slot){if(!SLOTS.includes(slot))return false;const g=state.inventory.find(g=>g.id===state.equipped[slot]),cost=25*(g.upgrade+1)*(state.stage+1);if(g.upgrade>=20||state.gold<cost)return false;state.gold-=cost;g.upgrade++;if(slot==='sword'||slot==='accessory')g.power+=2+state.stage;else if(slot==='shield')g.defense++;else if(slot==='feet')g.haste++;else g.health+=8+state.stage*2;emit('upgrade');return true;}
 function summon(){if(state.petTokens<3)return null;state.petTokens-=3;const r=rng(),id=r<.3?'sushi':r<.6?'slime':r<.85?'dino':r<.98?'fox':'phoenix',duplicate=state.pets.includes(id);if(duplicate)state.gold+=60;else state.pets.push(id);emit('pet',{id,duplicate});return {id,duplicate};}
 function pet(id){if(!state.pets.includes(id))return false;state.pet=id;return true;}
 function snapshot(copy=true){return {state:copy?save():state,fight:fight?JSON.parse(JSON.stringify(fight)):null,hp:heroHp,stats:stats(state),paused,clock,cooldowns:{...cooldowns},guarded:clock<guardUntil,recovery,target,potions,enemyCharge:Math.min(1,enemyClock/1.55)};}
 return {save,snapshot,step,boss,retreat,stage,equip,best,forge,summon,pet,chest,study,skill,selectTarget,pause:()=>paused=!paused,drain:()=>events.splice(0),loot};}
const api={STAGES,RARITIES,PETS,ALLIES,SLOTS,SLOT_NAMES,initial,restore,stats,score,create};if(typeof module==='object'&&module.exports)module.exports=api;else root.SushiTrail=api;
})(typeof globalThis==='object'?globalThis:this);
