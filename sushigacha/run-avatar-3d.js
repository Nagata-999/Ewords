'use strict';
(() => {
  const LEDGER='sushitan_login_bonus_v1';
  const player=document.getElementById('player');
  if(!player || player.dataset.threeRunnerInstalled==='1') return;
  player.dataset.threeRunnerInstalled='1';

  function loadScript(src){
    return new Promise((resolve,reject)=>{
      const hit=[...document.scripts].find(s=>s.src.includes(src.split('?')[0]));
      if(hit){ if(window.THREE) resolve(); else hit.addEventListener('load',resolve,{once:true}); return; }
      const s=document.createElement('script');
      s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
    });
  }

  function readAvatar(){
    try{
      const raw=localStorage.getItem(LEDGER);
      const ledger=raw?JSON.parse(raw):{};
      const a={...(window.DEFAULT_AVATAR||{}),...(ledger?.gacha?.avatar||{})};
      if(!a.top&&a.outfit)a.top=a.outfit;
      return a;
    }catch(_e){return {...(window.DEFAULT_AVATAR||{})};}
  }

  function item(id,slot){
    return Array.isArray(window.ITEMS)?window.ITEMS.find(x=>x.id===id&&(!slot||x.slot===slot)):null;
  }

  function installCss(){
    if(document.getElementById('sushiRun3dCss')) return;
    const st=document.createElement('style');
    st.id='sushiRun3dCss';
    st.textContent=`
      #player.sushi-runner-3d{background:none!important;overflow:visible!important;border-radius:0!important;}
      #player.sushi-runner-3d .run3d-canvas{position:absolute;left:50%;bottom:-9px;width:118px;height:132px;transform:translateX(-50%);pointer-events:none;filter:drop-shadow(0 6px 5px rgba(0,0,0,.28));}
      #player.sushi-runner-3d canvas{width:100%!important;height:100%!important;display:block;}
      @media(max-width:700px){#player.sushi-runner-3d .run3d-canvas{width:104px;height:120px;bottom:-7px;}}
    `;
    document.head.appendChild(st);
  }

  let renderer,scene,camera,root,parts={},raf=0,last=0;

  function mat(color,rough=.72){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:0});}
  function mesh(geo,material,parent=root){const m=new THREE.Mesh(geo,material);m.castShadow=false;m.receiveShadow=false;parent.add(m);return m;}
  function limb(parent,color,len=.55,r=.105){
    const pivot=new THREE.Group();parent.add(pivot);
    const m=mesh(new THREE.CapsuleGeometry(r,len,5,10),mat(color),pivot);m.position.y=-(len/2+r*.7);return {pivot,mesh:m};
  }

  function build(){
    const a=readAvatar();
    const female=a.gender==='female';
    const skins=['#f4cfae','#dba77f','#ac7657'];
    const hairs=['#493b32','#9b6241','#323b52'];
    const skin=skins[a.skin]||skins[0], hair=hairs[a.hairColor]||hairs[0];
    const top=item(a.top,'top')||item('starter','top')||{color:'#f6f1e4',accent:'#f4511e',kind:'tee'};
    const bottom=item(a.bottom,'bottom')||item('basic-bottom','bottom')||{color:'#334155',kind:'basicBottom'};

    if(root) scene.remove(root);
    root=new THREE.Group();scene.add(root);parts={};
    root.rotation.y=Math.PI;
    root.position.y=-.12;

    const hips=new THREE.Group();hips.position.y=.92;root.add(hips);parts.hips=hips;
    const torso=mesh(new THREE.BoxGeometry(.72,.76,.40),mat(top.color||'#eee'),hips);torso.position.y=.48;torso.scale.x=female?.92:1.0;parts.torso=torso;
    const collar=mesh(new THREE.BoxGeometry(.42,.08,.43),mat(top.accent||'#ddd'),hips);collar.position.set(0,.84,0);parts.collar=collar;

    const head=mesh(new THREE.SphereGeometry(.43,22,18),mat(skin),root);head.position.y=2.02;head.scale.y=1.03;parts.head=head;
    const hairBack=mesh(new THREE.SphereGeometry(.455,20,16),mat(hair),root);hairBack.position.set(0,2.10,.10);hairBack.scale.set(1.03,.98,.88);parts.hair=hairBack;
    const faceMask=mesh(new THREE.SphereGeometry(.407,18,14,0,Math.PI*2,0,Math.PI*.52),mat(skin),root);faceMask.rotation.x=Math.PI;faceMask.position.set(0,2.04,-.07);

    if(female && (a.hair===3||a.hair===2||a.hair===1)){
      const longHair=mesh(new THREE.CapsuleGeometry(.23,.62,6,12),mat(hair),root);longHair.position.set(0,1.72,.24);longHair.scale.x=1.45;
    }
    if(female && a.hair===4){const pony=mesh(new THREE.SphereGeometry(.20,14,12),mat(hair),root);pony.position.set(.28,1.92,.42);}
    if(female && a.hair===5){for(const x of [-.34,.34]){const t=mesh(new THREE.SphereGeometry(.18,14,12),mat(hair),root);t.position.set(x,1.90,.24);}}
    if(female && a.hair===7){const bun=mesh(new THREE.SphereGeometry(.20,14,12),mat(hair),root);bun.position.set(0,2.46,.08);}

    const lArm=limb(hips,top.color||'#eee',.54,.095), rArm=limb(hips,top.color||'#eee',.54,.095);
    lArm.pivot.position.set(-.43,.72,0);rArm.pivot.position.set(.43,.72,0);parts.lArm=lArm.pivot;parts.rArm=rArm.pivot;
    const lh=mesh(new THREE.SphereGeometry(.105,12,10),mat(skin),lArm.pivot);lh.position.y=-.72;
    const rh=mesh(new THREE.SphereGeometry(.105,12,10),mat(skin),rArm.pivot);rh.position.y=-.72;

    if(bottom.kind==='schoolSkirt'){
      const skirt=mesh(new THREE.CylinderGeometry(.43,.52,.43,16),mat(bottom.color||'#323845'),hips);skirt.position.y=-.02;parts.skirt=skirt;
    } else {
      const shorts=mesh(new THREE.BoxGeometry(.68,.34,.42),mat(bottom.color||'#334155'),hips);shorts.position.y=.03;parts.shorts=shorts;
    }

    const lLeg=limb(hips,bottom.kind==='schoolSkirt'?skin:(bottom.color||'#334155'),.60,.105), rLeg=limb(hips,bottom.kind==='schoolSkirt'?skin:(bottom.color||'#334155'),.60,.105);
    lLeg.pivot.position.set(-.20,-.15,0);rLeg.pivot.position.set(.20,-.15,0);parts.lLeg=lLeg.pivot;parts.rLeg=rLeg.pivot;
    for(const p of [lLeg.pivot,rLeg.pivot]){const shoe=mesh(new THREE.BoxGeometry(.22,.12,.34),mat('#202733'),p);shoe.position.set(0,-.80,-.08);}

    const hat=item(a.hat,'hat');
    if(hat){
      const hmat=mat(hat.kind==='royal'?'#e9c45b':hat.kind==='chef'?'#f7f4e9':'#3f657b');
      if(hat.kind==='royal'){
        const crown=mesh(new THREE.CylinderGeometry(.26,.32,.26,6),hmat,root);crown.position.y=2.55;
      } else if(hat.kind==='wizard'){
        const cone=mesh(new THREE.ConeGeometry(.32,.72,16),mat('#56628e'),root);cone.position.y=2.78;cone.rotation.z=-.10;
      } else {
        const cap=mesh(new THREE.CylinderGeometry(.34,.39,.20,18),hmat,root);cap.position.y=2.48;
      }
    }
    const acc=item(a.accessory,'accessory');
    if(acc?.kind==='wings'){
      for(const x of [-.42,.42]){const wing=mesh(new THREE.SphereGeometry(.26,12,10),mat('#f4f7ff'),root);wing.scale.set(.65,1.45,.25);wing.position.set(x,1.36,.34);wing.rotation.z=x<0?.5:-.5;}
    }
    if(acc?.kind==='bag'){
      const bag=mesh(new THREE.BoxGeometry(.36,.40,.18),mat('#b56d4b'),root);bag.position.set(.43,1.15,.28);bag.rotation.z=-.16;
    }
  }

  function setup3d(){
    const host=document.createElement('div');host.className='run3d-canvas';
    player.classList.add('sushi-runner-3d');
    player.classList.remove('sushi-avatar-runner');
    player.innerHTML='';player.appendChild(host);player.style.backgroundImage='none';

    renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.setSize(236,264,false);renderer.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(renderer.domElement);
    scene=new THREE.Scene();
    camera=new THREE.PerspectiveCamera(26,236/264,.1,20);camera.position.set(0,1.55,5.7);camera.lookAt(0,1.25,0);
    scene.add(new THREE.HemisphereLight(0xffffff,0x334455,2.0));
    const key=new THREE.DirectionalLight(0xffffff,2.5);key.position.set(3,5,4);scene.add(key);
    const rim=new THREE.DirectionalLight(0x8ec5ff,1.2);rim.position.set(-3,2,-4);scene.add(rim);
    build();
  }

  function animate(t){
    raf=requestAnimationFrame(animate);
    if(!root||!renderer)return;
    const dt=Math.min(.05,(t-last||16)/1000);last=t;
    const running=window.gameRunning!==false;
    const phase=t*.0105;
    const miss=window.playerState==='miss'||player.classList.contains('run-miss');
    const dash=player.classList.contains('dash');
    if(running&&!miss){
      const swing=Math.sin(phase)*.78;
      parts.lArm.rotation.x=swing;parts.rArm.rotation.x=-swing;
      parts.lLeg.rotation.x=-swing*.82;parts.rLeg.rotation.x=swing*.82;
      parts.hips.position.y=.92+Math.abs(Math.sin(phase))*0.055;
      root.rotation.z=Math.sin(phase*.5)*.025;
      root.rotation.x=dash?.18:.04;
      root.position.z=dash?-.12:0;
    }else if(miss){
      root.rotation.z=Math.sin(t*.025)*.20;root.rotation.x=-.08;
      parts.lArm.rotation.x=-1.0;parts.rArm.rotation.x=.7;
    }else{
      parts.lArm.rotation.x*=.90;parts.rArm.rotation.x*=.90;parts.lLeg.rotation.x*=.90;parts.rLeg.rotation.x*=.90;
      root.rotation.z*=.90;root.rotation.x*=.90;
    }
    renderer.render(scene,camera);
  }

  async function init(){
    installCss();
    try{
      if(!window.ITEMS||!window.DEFAULT_AVATAR) await loadScript('sushigacha/avatar.js?v=20260913-three1');
      await loadScript('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.min.js');
      setup3d();animate(performance.now());
    }catch(err){console.warn('Three.js runner unavailable; keeping 2D runner.',err);}
  }

  window.addEventListener('storage',e=>{if(e.key===LEDGER&&scene)build();});
  window.addEventListener('focus',()=>{if(scene)build();});
  window.addEventListener('pageshow',()=>{if(scene)build();});
  init();
})();
