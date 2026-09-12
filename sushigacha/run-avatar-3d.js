'use strict';
(() => {
  const LEDGER='sushitan_login_bonus_v1';
  const player=document.getElementById('player');
  if(!player || player.dataset.threeRunnerV2==='1') return;
  player.dataset.threeRunnerV2='1';

  const loadScript=src=>new Promise((resolve,reject)=>{
    const hit=[...document.scripts].find(s=>s.src.includes(src.split('?')[0]));
    if(hit){ if(window.THREE) resolve(); else hit.addEventListener('load',resolve,{once:true}); return; }
    const s=document.createElement('script'); s.src=src; s.onload=resolve; s.onerror=reject; document.head.appendChild(s);
  });

  function readAvatar(){
    try{
      const ledger=JSON.parse(localStorage.getItem(LEDGER)||'{}');
      const a={...(window.DEFAULT_AVATAR||{}),...(ledger?.gacha?.avatar||{})};
      if(!a.top&&a.outfit)a.top=a.outfit;
      return a;
    }catch(_e){ return {...(window.DEFAULT_AVATAR||{})}; }
  }
  const item=(id,slot)=>Array.isArray(window.ITEMS)?window.ITEMS.find(x=>x.id===id&&(!slot||x.slot===slot)):null;

  function installCss(){
    if(document.getElementById('sushiRun3dCssV2')) return;
    const st=document.createElement('style'); st.id='sushiRun3dCssV2';
    st.textContent=`
      #player.sushi-runner-3d{background:none!important;overflow:visible!important;border-radius:0!important;}
      #player.sushi-runner-3d .run3d-canvas{position:absolute;left:50%;bottom:-13px;width:132px;height:146px;transform:translateX(-50%);pointer-events:none;filter:drop-shadow(0 7px 5px rgba(0,0,0,.28));}
      #player.sushi-runner-3d canvas{width:100%!important;height:100%!important;display:block;}
      @media(max-width:700px){#player.sushi-runner-3d .run3d-canvas{width:116px;height:132px;bottom:-10px;}}
    `;
    document.head.appendChild(st);
  }

  let renderer,scene,camera,root,parts={},raf,last=0;
  const M=c=>new THREE.MeshStandardMaterial({color:c,roughness:.73,metalness:0});
  const mesh=(g,m,p=root)=>{const x=new THREE.Mesh(g,m);p.add(x);return x;};
  const sphere=(r,c,p=root)=>mesh(new THREE.SphereGeometry(r,18,14),M(c),p);
  const box=(x,y,z,c,p=root)=>mesh(new THREE.BoxGeometry(x,y,z),M(c),p);
  function limb(parent,color,len=.52,r=.095){
    const pivot=new THREE.Group(); parent.add(pivot);
    const m=mesh(new THREE.CapsuleGeometry(r,len,5,9),M(color),pivot); m.position.y=-(len/2+r*.7);
    return {pivot,mesh:m};
  }

  function addHair(a,hair,headY){
    const female=a.gender==='female', style=Number(a.hair)||0;
    const cap=sphere(.47,hair,root); cap.position.set(0,headY+.09,.08); cap.scale.set(1.02,.92,.92);
    // carve a visible face area with a skin shell slightly toward the camera side
    const face=sphere(.405,parts.skin,root); face.position.set(0,headY-.02,-.075); face.scale.set(.97,.98,.94);
    if(female){
      if([1,2,3,6].includes(style)){
        const back=mesh(new THREE.CapsuleGeometry(.24,.56,6,10),M(hair),root); back.position.set(0,headY-.42,.22); back.scale.set(1.35,1,1);
      }
      if(style===4){const p=sphere(.18,hair,root);p.position.set(.29,headY-.02,.40);}
      if(style===5){for(const x of [-.32,.32]){const p=sphere(.17,hair,root);p.position.set(x,headY-.08,.20);}}
      if(style===7){const b=sphere(.20,hair,root);b.position.set(0,headY+.49,.08);}
    }else{
      if(style===2){cap.scale.set(1.08,.92,1.0);}
      if(style===4){const tuft=mesh(new THREE.ConeGeometry(.12,.34,8),M(hair),root);tuft.position.set(.10,headY+.44,-.08);tuft.rotation.z=-.42;}
      if(style===6){const back=mesh(new THREE.CapsuleGeometry(.17,.34,5,9),M(hair),root);back.position.set(0,headY-.32,.24);}
      if(style===7){for(const x of [-.18,0,.18]){const curl=sphere(.13,hair,root);curl.position.set(x,headY+.31,-.14);}}
    }
    // tiny side-visible eye; runner is rear three-quarter, so this is subtle rather than front-facing
    const eye=sphere(.035,'#25313d',root); eye.position.set(.27,headY-.02,-.36);
  }

  function addTopDetails(top,hips,female){
    const kind=top.kind, accent=top.accent||'#e9e3d5';
    if(kind==='schoolBlazerM'||kind==='schoolBlazerF'){
      const shirt=box(.34,.28,.39,'#f6f6f2',hips);shirt.position.set(0,.55,-.03);
      const tieColor=kind==='schoolBlazerF'?'#a62943':'#8f2237';
      const tie=mesh(new THREE.ConeGeometry(.075,.30,5),M(tieColor),hips);tie.rotation.x=Math.PI;tie.position.set(0,.43,-.235);
      for(const x of [-.16,.16]){const lap=box(.16,.35,.035,top.color||'#172d4e',hips);lap.position.set(x,.61,-.225);lap.rotation.z=x<0?-.35:.35;}
      for(const y of [.32,.08]){const b=sphere(.028,'#d6b55d',hips);b.position.set(.08,y,-.225);}
    }else if(kind==='hoodie'){
      const hood=mesh(new THREE.TorusGeometry(.25,.07,7,16,Math.PI),M(accent),hips);hood.rotation.x=Math.PI/2;hood.position.set(0,.73,.13);
    }else if(kind==='varsity'){
      for(const x of [-.35,.35]){const sl=box(.10,.52,.40,accent,hips);sl.position.set(x,.43,0);}
    }else if(kind==='royal'){
      const cape=box(.72,.70,.08,accent,hips);cape.position.set(0,.42,.25);cape.rotation.x=-.10;
    }else if(kind==='cosmic'){
      const star=sphere(.07,accent,hips);star.position.set(.12,.52,-.235);
    }
  }

  function addAccessories(a){
    const hat=item(a.hat,'hat');
    if(hat){
      if(hat.kind==='royal'){
        const c=mesh(new THREE.CylinderGeometry(.23,.31,.24,6),M('#e9c45b'),root);c.position.y=2.78;
        for(let i=0;i<5;i++){const tip=mesh(new THREE.ConeGeometry(.06,.22,5),M('#e9c45b'),root);const ang=i/5*Math.PI*2;tip.position.set(Math.cos(ang)*.22,2.99,Math.sin(ang)*.22);}
      }else if(hat.kind==='wizard'){
        const brim=mesh(new THREE.CylinderGeometry(.40,.40,.07,18),M('#56628e'),root);brim.position.y=2.70;
        const cone=mesh(new THREE.ConeGeometry(.30,.70,18),M('#56628e'),root);cone.position.y=3.05;cone.rotation.z=-.12;
      }else{
        const cap=mesh(new THREE.CylinderGeometry(.34,.39,.18,18),M(hat.kind==='chef'?'#f7f4e9':'#3f657b'),root);cap.position.y=2.70;
      }
    }
    const acc=item(a.accessory,'accessory');
    if(acc?.kind==='wings'){
      for(const x of [-.43,.43]){const w=sphere(.27,'#f3f7ff',root);w.scale.set(.60,1.50,.22);w.position.set(x,1.45,.34);w.rotation.z=x<0?.48:-.48;}
    }else if(acc?.kind==='bag'){
      const bag=box(.34,.39,.18,'#b56d4b',root);bag.position.set(.42,1.13,.28);bag.rotation.z=-.18;
      const strap=mesh(new THREE.TorusGeometry(.42,.025,6,18,Math.PI*1.1),M('#7d4938'),root);strap.rotation.z=1.0;strap.position.set(.05,1.48,.04);
    }else if(acc?.kind==='headphones'){
      const band=mesh(new THREE.TorusGeometry(.39,.055,7,20,Math.PI),M('#334155'),root);band.rotation.z=Math.PI;band.position.y=2.43;
      for(const x of [-.39,.39]){const e=box(.12,.23,.12,'#334155',root);e.position.set(x,2.30,.02);}
    }else if(acc?.kind==='glasses'){
      for(const x of [.19,.34]){const g=mesh(new THREE.TorusGeometry(.075,.012,5,12),M('#374151'),root);g.rotation.y=Math.PI/2;g.position.set(x,2.37,-.34);}
    }
  }

  function build(){
    const a=readAvatar(), female=a.gender==='female';
    const skins=['#f4cfae','#dba77f','#ac7657'], hairs=['#493b32','#9b6241','#323b52'];
    const skin=skins[a.skin]||skins[0], hair=hairs[a.hairColor]||hairs[0];
    const top=item(a.top,'top')||item('starter','top')||{color:'#f6f1e4',accent:'#f4511e',kind:'tee'};
    const bottom=item(a.bottom,'bottom')||item('basic-bottom','bottom')||{color:'#334155',kind:'basicBottom'};
    if(root)scene.remove(root); root=new THREE.Group();scene.add(root);parts={skin};

    // Rear three-quarter view: no more straight-on runner.
    root.rotation.y=Math.PI*.82; root.position.set(0,-.10,0);
    const hips=new THREE.Group();hips.position.y=.92;root.add(hips);parts.hips=hips;

    // Softer, 2.7-head chibi silhouette.
    const torso=mesh(new THREE.CapsuleGeometry(.33,.46,6,12),M(top.color||'#eee'),hips);torso.position.y=.47;torso.scale.set(female?.94:1.04,1,.78);parts.torso=torso;
    const neck=mesh(new THREE.CylinderGeometry(.105,.11,.13,12),M(skin),hips);neck.position.y=.91;
    addTopDetails(top,hips,female);

    const headY=2.22; const head=sphere(.47,skin,root);head.position.y=headY;head.scale.set(.98,1.03,.94);parts.head=head;
    addHair(a,hair,headY);

    const armColor=top.color||'#eee';
    const lArm=limb(hips,armColor,.50,.092),rArm=limb(hips,armColor,.50,.092);
    lArm.pivot.position.set(-.39,.70,0);rArm.pivot.position.set(.39,.70,0);parts.lArm=lArm.pivot;parts.rArm=rArm.pivot;
    for(const p of [lArm.pivot,rArm.pivot]){const hand=sphere(.105,skin,p);hand.position.y=-.68;}

    if(bottom.kind==='schoolSkirt'){
      const skirt=mesh(new THREE.CylinderGeometry(.38,.50,.40,18),M(bottom.color||'#323845'),hips);skirt.position.y=-.01;
      for(let i=0;i<6;i++){const pleat=box(.025,.32,.44,bottom.accent||'#6e7380',hips);pleat.position.set(-.30+i*.12,-.02,-.03);pleat.rotation.z=(i-2.5)*.025;}
    }else{
      const shorts=mesh(new THREE.CapsuleGeometry(.32,.10,4,10),M(bottom.color||'#334155'),hips);shorts.position.y=.01;shorts.scale.set(1.05,.85,.78);
    }

    const legColor=bottom.kind==='schoolSkirt'?skin:(bottom.color||'#334155');
    const lLeg=limb(hips,legColor,.58,.103),rLeg=limb(hips,legColor,.58,.103);
    lLeg.pivot.position.set(-.19,-.14,0);rLeg.pivot.position.set(.19,-.14,0);parts.lLeg=lLeg.pivot;parts.rLeg=rLeg.pivot;
    for(const p of [lLeg.pivot,rLeg.pivot]){
      if(bottom.kind==='schoolSkirt'){const sock=mesh(new THREE.CapsuleGeometry(.108,.25,4,8),M('#263650'),p);sock.position.y=-.62;}
      const shoe=box(.22,.13,.34,'#202733',p);shoe.position.set(0,-.78,-.09);shoe.rotation.x=.06;
    }
    addAccessories(a);
  }

  function setup3d(){
    const host=document.createElement('div');host.className='run3d-canvas';
    player.classList.add('sushi-runner-3d');player.classList.remove('sushi-avatar-runner');player.innerHTML='';player.appendChild(host);player.style.backgroundImage='none';
    renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.setSize(264,292,false);renderer.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(renderer.domElement);
    scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(25,264/292,.1,20);camera.position.set(.20,1.68,6.05);camera.lookAt(0,1.34,0);
    scene.add(new THREE.HemisphereLight(0xffffff,0x42526b,2.15));
    const key=new THREE.DirectionalLight(0xffffff,2.7);key.position.set(3.2,5.2,4);scene.add(key);
    const rim=new THREE.DirectionalLight(0x91c9ff,1.35);rim.position.set(-3,2,-4);scene.add(rim);
    build();
  }

  function animate(t){
    raf=requestAnimationFrame(animate);if(!root||!renderer)return;
    const phase=t*.011, miss=window.playerState==='miss'||player.classList.contains('run-miss'), dash=player.classList.contains('dash'), running=window.gameRunning!==false;
    if(running&&!miss){
      const s=Math.sin(phase), swing=s*.88;
      parts.lArm.rotation.x=swing;parts.rArm.rotation.x=-swing;
      parts.lLeg.rotation.x=-swing*.76;parts.rLeg.rotation.x=swing*.76;
      parts.lArm.rotation.z=-.10;parts.rArm.rotation.z=.10;
      parts.hips.position.y=.92+Math.abs(s)*.065;
      root.rotation.z=Math.sin(phase*.5)*.035;root.rotation.x=dash?.22:.065;root.position.z=dash?-.16:0;
      root.scale.setScalar(dash?1.06:1);
    }else if(miss){
      root.rotation.z=Math.sin(t*.025)*.22;root.rotation.x=-.10;parts.lArm.rotation.x=-1.15;parts.rArm.rotation.x=.85;parts.lLeg.rotation.x=.35;parts.rLeg.rotation.x=-.25;
    }else{
      for(const k of ['lArm','rArm','lLeg','rLeg'])if(parts[k])parts[k].rotation.x*=.88;
      root.rotation.z*=.88;root.rotation.x*=.88;root.scale.lerp(new THREE.Vector3(1,1,1),.15);
    }
    renderer.render(scene,camera);
  }

  async function init(){
    installCss();
    try{
      if(!window.ITEMS||!window.DEFAULT_AVATAR)await loadScript('sushigacha/avatar.js?v=20260913-three2');
      await loadScript('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.min.js');
      setup3d();animate(performance.now());
    }catch(err){console.warn('Three.js runner unavailable; keeping fallback runner.',err);}
  }
  window.addEventListener('storage',e=>{if(e.key===LEDGER&&scene)build();});
  window.addEventListener('focus',()=>{if(scene)build();});window.addEventListener('pageshow',()=>{if(scene)build();});
  init();
})();
