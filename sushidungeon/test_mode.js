'use strict';
(function(){
  const FLOORS=[1,10,11,20,21,30];
  const TEST_GEAR={
    1:{level:1,hp:20,weapon:null,shield:null},
    10:{level:7,hp:44,weapon:{name:'ロングソード',type:'weapon',power:5,icon:'🗡️'},shield:{name:'鉄の盾',type:'shield',power:4,icon:'🛡️'}},
    11:{level:8,hp:48,weapon:{name:'ロングソード',type:'weapon',power:5,icon:'🗡️'},shield:{name:'堅いまな板',type:'shield',power:5,icon:'🪵'}},
    20:{level:13,hp:68,weapon:{name:'銀の出刃包丁',type:'weapon',power:7,icon:'🔪'},shield:{name:'騎士の盾',type:'shield',power:6,icon:'🛡️'}},
    21:{level:14,hp:72,weapon:{name:'銀の出刃包丁',type:'weapon',power:7,icon:'🔪'},shield:{name:'黒檀のまな板',type:'shield',power:8,icon:'🪵'}},
    30:{level:20,hp:96,weapon:{name:'すし斬り',type:'weapon',power:10,icon:'⚔️'},shield:{name:'鉄板',type:'shield',power:10,icon:'🛡️'}}
  };
  function copy(x){return x?{...x}:null}
  function startAt(floor){
    startGame();
    const s=TEST_GEAR[floor]||TEST_GEAR[1];
    game.testMode=true;game.floor=floor;game.level=s.level;game.exp=0;game.nextExp=Math.floor(7*Math.pow(1.45,Math.max(0,s.level-1)))+3;
    game.maxHp=s.hp;game.hp=s.hp;game.hunger=100;game.maxHunger=100;game.turn=0;
    game.weapon=copy(s.weapon);game.shield=copy(s.shield);game.accessory=null;game.inventory=[];game.foundGear=[];
    if(game.weapon){game.inventory.push(game.weapon);game.foundGear.push({...game.weapon})}
    if(game.shield){game.inventory.push(game.shield);game.foundGear.push({...game.shield})}
    game.inventory.push({name:'大トロ',type:'sushi',value:70,icon:'🍣',weight:7},{name:'玉露',type:'tea',value:50,icon:'🍵',weight:4},{name:'砥石',type:'whetstone',value:1,icon:'🪨',weight:8},{name:'補強材',type:'reinforce',value:1,icon:'🔩',weight:8});
    generateFloor();log(`🛠 TEST MODE：${floor}Fから開始。ランキング対象外。`);render();
    window.sushiTitleScreen?.close?.();
  }
  function showPicker(p,show){
    if(!p)return;
    p.hidden=!show;
    p.style.display=show?'flex':'none';
  }
  function buildPicker(){
    if(document.getElementById('dungeonTestPicker'))return;
    const p=document.createElement('div');p.id='dungeonTestPicker';
    p.style.cssText='position:fixed;inset:0;z-index:10050;background:rgba(0,0,0,.78);display:none;align-items:center;justify-content:center;padding:20px';
    p.innerHTML='<section style="width:min(360px,100%);background:#111820;border:1px solid #43515c;border-radius:16px;padding:18px;box-shadow:0 18px 60px #000"><h2 style="margin:0 0 6px">🛠 TEST MODE</h2><p style="margin:0 0 14px;color:#aebbc4;font-size:13px">開始階を選択。階層相当のLv・HP・装備で開始します。ランキングには登録されません。</p><div data-test-floors style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px"></div><button data-test-close type="button" style="width:100%;margin-top:12px;padding:10px;border-radius:10px">閉じる</button></section>';
    document.body.appendChild(p);showPicker(p,false);
    const box=p.querySelector('[data-test-floors]');
    for(const f of FLOORS){const b=document.createElement('button');b.type='button';b.textContent=`${f}F`;b.style.cssText='padding:12px 8px;border-radius:10px;font-weight:800';b.onclick=()=>{showPicker(p,false);startAt(f)};box.appendChild(b)}
    p.querySelector('[data-test-close]').onclick=e=>{e.preventDefault();e.stopPropagation();showPicker(p,false)};
    p.addEventListener('click',e=>{if(e.target===p)showPicker(p,false)});
  }
  function addButton(){
    const buttons=document.querySelector('#titleScreen .titleButtons');if(!buttons||buttons.querySelector('.testModeBtn'))return;
    buildPicker();const b=document.createElement('button');b.type='button';b.className='titleBtn testModeBtn';b.textContent='🛠 TEST';b.style.opacity='.72';b.onclick=()=>showPicker(document.getElementById('dungeonTestPicker'),true);buttons.appendChild(b);
  }
  function init(){addButton();setTimeout(addButton,350)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.sushiDungeonTest={startAt};
})();