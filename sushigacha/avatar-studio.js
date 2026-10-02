'use strict';
(() => {
  const A=SushiAvatarV2,Store=SushiAvatarStore,$=id=>document.getElementById(id);
  let state,storageBlocked=false,saving=false,equipped;
  const status=(text,error=false)=>{$('status').textContent=text;$('status').classList.toggle('error',error);};
  try{state=Store.load();}catch(e){storageBlocked=true;state={avatar:A.normalize(),looks:[null,null,null],settings:{size:96,reduced:false,hidden:false}};status(e.message,true);}
  equipped={...state.avatar};
  let action='idle',direction='front',slot='top';
  const hero=A.mount($('hero'),state.avatar),walker=A.mount($('walkerArt'),state.avatar,{action:'walk',direction:'right'});
  function refreshBalance(){const current=Store.load();state.owned=current.owned;state.gems=current.gems;$('gemBalance').textContent=state.gems.toLocaleString();return current;}
  async function persist(message){try{await Store.saveSettings(state.settings);if(message)status(message);}catch(e){status(e.message,true);}}
  function setAvatar(value){state.avatar=A.normalize(value);hero.setAvatar(state.avatar);walker.setAvatar(state.avatar);renderWardrobe();status('');}
  $('equipLook').onclick=async()=>{if(saving||storageBlocked)return;saving=true;renderWardrobe();try{await Store.equip(state.avatar);const current=refreshBalance();equipped={...current.avatar};setAvatar(equipped);status('コーデを保存しました。');}catch(e){status(e.message,true);}finally{saving=false;renderWardrobe();}};
  $('cancelLook').onclick=()=>{try{const current=refreshBalance();equipped={...current.avatar};setAvatar(equipped);}catch(e){status(e.message,true);}};
  function setMotion(next){action=next;hero.setOptions({action});document.querySelectorAll('[data-action]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.action===action)));}
  $('motionControls').addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b)setMotion(b.dataset.action);});
  $('directionControls').addEventListener('click',e=>{const b=e.target.closest('[data-direction]');if(!b)return;direction=b.dataset.direction;hero.setOptions({direction});document.querySelectorAll('[data-direction]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
  function renderWardrobe(){
    const missing=Store.missing(state.avatar,state.owned||[]);$('equipLook').disabled=saving||storageBlocked||missing.length>0;$('equipHelp').textContent=missing.length?'未所持のアイテムを試着中です。所持品だけのコーデを保存できます。':'顔・衣装を選び、「このコーデを保存」で反映します。';$('collectionCount').textContent=(state.owned||[]).filter(id=>A.item(id)).length+' / '+A.catalog.length+' 点 所持';
    $('wearing').textContent=Object.keys(A.slots).map(k=>A.item(state.avatar[k])?.name).filter(Boolean).join(' ・ ');
    $('itemGrid').replaceChildren();
    let items=A.catalog.filter(i=>i.slot===slot&&(state.owned||[]).includes(i.id));
    items.sort((a,b)=>Number((state.owned||[]).includes(b.id))-Number((state.owned||[]).includes(a.id)));
    if(!['top','bottom'].includes(slot))items=[{id:null,name:'つけない',slot},...items];
    if(!items.length){const p=document.createElement('p');p.textContent='この種類のアイテムはまだ持っていません。ガチャなどで入手すると表示されます。';$('itemGrid').append(p);}
    for(const i of items){
      const b=document.createElement('button');b.className='item-card';b.dataset.item=i.id||'none';b.setAttribute('aria-pressed',String(state.avatar[slot]===i.id));b.setAttribute('aria-label',i.name);
      const art=document.createElement('span');art.className='item-art';art.innerHTML=A.render({...state.avatar,[slot]:i.id});
      const name=document.createElement('strong');name.textContent=i.name;
      const hint=document.createElement('small');const owned=!i.id||(state.owned||[]).includes(i.id);b.classList.toggle('unowned',!owned);hint.textContent=!owned?'未所持・試着':state.avatar[slot]===i.id?'選択中':i.id?'所持':'取り外す';
      b.append(art,name,hint);b.addEventListener('click',()=>setAvatar({...state.avatar,[slot]:i.id}));$('itemGrid').append(b);
    }
    renderAppearance();
  }
  for(const [key,label] of Object.entries(A.slots)){const b=document.createElement('button');b.textContent=label;b.dataset.slot=key;b.setAttribute('aria-pressed',String(key===slot));b.onclick=()=>{slot=key;for(const x of $('slotTabs').children)x.setAttribute('aria-pressed',String(x===b));renderWardrobe();};$('slotTabs').append(b);}
  $('resetLook').onclick=()=>setAvatar({...state.avatar,...A.sets.basic});
  $('genderControls').onclick=e=>{const button=e.target.closest('[data-gender]');if(button)setAvatar({...state.avatar,gender:button.dataset.gender});};
  function renderAppearance(){
    $('genderControls').querySelectorAll('[data-gender]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.gender===state.avatar.gender))); $('hair').replaceChildren();
    HAIR_NAMES[state.avatar.gender].forEach((label,i)=>{const o=document.createElement('option');o.value=i;o.textContent=label;$('hair').append(o);});
    for(const k of ['hair','hairColor','skin','eyes','mouth','faceShape','expression','pet','aura'])$(k).value=state.avatar[k];
    if($('eyes').selectedIndex<0){const o=document.createElement('option');o.value=state.avatar.eyes;o.textContent='引き継いだ目';$('eyes').append(o);$('eyes').value=state.avatar.eyes;}
  }
  $('appearanceToggle').onclick=()=>{const hidden=!$('appearancePanel').hidden;$('appearancePanel').hidden=hidden;$('appearanceToggle').setAttribute('aria-expanded',String(!hidden));$('appearanceToggle').querySelector('span').textContent=hidden?'＋':'−';};
  for(const key of ['hair','hairColor','skin','eyes','mouth','faceShape','expression','pet','aura'])$(key).onchange=e=>setAvatar({...state.avatar,[key]:Number(e.target.value)});
  function renderLooks(){
    $('savedLooks').replaceChildren();state.looks.forEach((look,i)=>{
      const cell=document.createElement('div');cell.className='saved-slot';
      const preview=document.createElement('button');preview.className='save-preview';preview.setAttribute('aria-label',look?`コーデ${i+1}を着る`:`コーデ${i+1}に保存`);
      preview.innerHTML=look?A.render(look):'<span class="empty-save">＋</span>';
      preview.onclick=()=>{if(look)setAvatar(look);else saveLook(i);};
      const label=document.createElement('small');label.textContent=`コーデ ${i+1}`;
      const save=document.createElement('button');save.className='save-button';save.textContent=look?'上書き保存':'保存';save.onclick=()=>saveLook(i);
      cell.append(preview,label,save);$('savedLooks').append(cell);
    });
  }
  async function saveLook(i){try{await Store.saveLook(i,state.avatar);state.looks=Store.load().looks;renderLooks();status(`コーデ ${i+1} を保存しました。`);}catch(e){status(e.message,true);}}
  let x=22,dir='right',mode='walk',clock=0,deadline=6,raf=0,last=0,greetingUntil=0,walkTime=0;
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const reduce=()=>state.settings.reduced||media.matches;
  function maxX(){return Math.max(0,$('walkArea').clientWidth-$('walker').offsetWidth-8);}
  function position(){x=Math.max(8,Math.min(maxX(),x));$('walker').style.transform=`translateX(${x.toFixed(1)}px)`;$('greeting').style.left=Math.max(4,Math.min($('walkArea').clientWidth-112,x-12))+'px';}
  function walkerMode(next){mode=next;walker.setOptions({action:next==='turn'?'idle':next,direction:next==='walk'?dir:'front',reduced:reduce(),paused:state.settings.hidden});}
  function tick(t){
    raf=0;if(document.hidden||reduce()||state.settings.hidden)return;
    raf=requestAnimationFrame(tick);const dt=last?Math.min(.05,(t-last)/1000):0;last=t;clock+=dt;
    if(mode==='walk'){
      walkTime+=dt;const edge=dir==='right'?maxX()-x:x-8;
      const speed=27*Math.min(1,Math.max(.2,edge/22),Math.max(.2,walkTime/.4));
      x+=(dir==='right'?1:-1)*speed*dt;
      if(x<=8||x>=maxX()){x=Math.max(8,Math.min(maxX(),x));walkerMode('turn');deadline=clock+.65;}
    }
    if(clock>=deadline){
      if(mode==='turn'){dir=dir==='right'?'left':'right';walkTime=0;walkerMode('walk');deadline=clock+6;}
      else if(mode==='walk'){walkerMode(Math.random()<.5?'idle':'sit');deadline=clock+2.8;}
      else{walkTime=0;walkerMode('walk');deadline=clock+6;}
    }
    if(greetingUntil&&clock>=greetingUntil){$('greeting').hidden=true;greetingUntil=0;}
    position();
  }
  function syncSettings(){
    cancelAnimationFrame(raf);raf=0;last=0;
    const s=state.settings;$('walkerSize').value=s.size;$('reduceMotion').checked=s.reduced;$('hideWalker').checked=s.hidden;
    $('walker').hidden=s.hidden;$('walker').style.height=s.size+'px';$('walker').style.width=Math.round(s.size*160/204)+'px';$('greeting').style.bottom=s.size+'px';
    hero.setOptions({reduced:reduce()});walker.setOptions({action:reduce()?'idle':mode==='turn'?'idle':mode,direction:reduce()?'front':mode==='walk'?dir:'front',reduced:reduce(),paused:s.hidden});
    if(s.hidden||reduce())$('greeting').hidden=true;
    position();if(!document.hidden&&!reduce()&&!s.hidden)raf=requestAnimationFrame(tick);
  }
  $('walker').onclick=()=>{walkerMode('wave');deadline=clock+1.8;greetingUntil=clock+1.8;$('greeting').hidden=false;if(reduce()){walker.setOptions({action:'wave',direction:'front',reduced:true});}};
  $('walkerSize').onchange=e=>{state.settings.size=Number(e.target.value);syncSettings();persist();};
  $('reduceMotion').onchange=e=>{state.settings.reduced=e.target.checked;syncSettings();persist();};
  $('hideWalker').onchange=e=>{state.settings.hidden=e.target.checked;syncSettings();persist();};
  window.addEventListener('resize',position);document.addEventListener('visibilitychange',syncSettings);media.addEventListener('change',syncSettings);
  window.addEventListener('storage',e=>{if(e.key!==Store.KEY)return;try{state=Store.load();equipped={...state.avatar};$('gemBalance').textContent=state.gems.toLocaleString();hero.setAvatar(state.avatar);walker.setAvatar(state.avatar);renderWardrobe();renderLooks();syncSettings();}catch(e){storageBlocked=true;status(e.message,true);}});
  try{refreshBalance();}catch(e){status(e.message,true);}
  const requested=new URLSearchParams(location.search).get('item');if(requested&&A.item(requested)){const i=A.item(requested);state.avatar=A.normalize({...state.avatar,[i.slot]:i.id});hero.setAvatar(state.avatar);walker.setAvatar(state.avatar);}
  renderWardrobe();renderLooks();syncSettings();
  window.SushiAvatarStudio={getState:()=>structuredClone(state),getMotion:()=>({hero:hero.getState(),walker:walker.getState(),x,mode}),destroy(){cancelAnimationFrame(raf);hero.destroy();walker.destroy();}};
})();
