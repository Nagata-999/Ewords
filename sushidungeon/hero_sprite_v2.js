'use strict';
(function(){
  /* Dedicated hero renderer: true integer-pixel sprite, separate from the old SVG monster pass. */
  const SCALE_W=32, SCALE_H=48;
  const P={
    o:'#171922', o2:'#2b2d39', skin:'#efc39e', skin2:'#ffd9b6', skin3:'#b97b61',
    white:'#eee7d9', white2:'#fff7e7', white3:'#9b8e80', red:'#cf4d47', red2:'#ef7668', red3:'#822b31',
    pants:'#344957', pants2:'#56707e', pants3:'#1f2f38', shoe:'#201d25', steel:'#c7d3d6', steel2:'#f4f8f4', steel3:'#66757c',
    gold:'#d4a14c', gold2:'#f0cc72', wood:'#6e452b', shadow:'rgba(0,0,0,.36)'
  };
  const heroState={frame:0, walkUntil:0};
  function motion(el){ if(el.classList.contains('motion-attack'))return 'attack'; if(el.classList.contains('motion-hit'))return 'hit'; if(performance.now()<heroState.walkUntil)return 'walk'; return 'idle'; }
  function dir(el){ return ['n','e','s','w'].find(d=>el.classList.contains('facing-'+d))||'s'; }
  function frameCount(m){return m==='attack'?5:m==='hit'?3:4}
  function weaponSpec(name){
    return ({
      '木の棒':{blade:P.wood,edge:'#4f301c',len:13,w:2,kind:'club'},
      '川魚包丁':{blade:'#ccd9dc',edge:'#687880',len:11,w:4,kind:'knife'},
      '鉄の剣':{blade:'#bec9cc',edge:'#596970',len:14,w:3,kind:'sword'},
      'ロングソード':{blade:'#dde5e6',edge:'#73838a',len:17,w:2,kind:'sword'},
      '銀の出刃包丁':{blade:'#f2f6f6',edge:'#8899a0',len:12,w:5,kind:'knife'},
      '古騎士の剣':{blade:'#e1c66d',edge:'#816733',len:15,w:3,kind:'sword'}
    })[name]||{blade:'#bec9cc',edge:'#596970',len:14,w:3,kind:'sword'};
  }
  function px(ctx,x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x|0,y|0,w|0,h|0)}
  function shadow(ctx,x,y,w,h,c=P.shadow){ctx.fillStyle=c;ctx.fillRect(x,y,w,h)}
  function outlineRect(ctx,x,y,w,h,fill,edge=P.o){px(ctx,x,y,w,h,edge);px(ctx,x+1,y+1,w-2,h-2,fill)}
  function drawShadow(ctx){shadow(ctx,9,43,14,2);shadow(ctx,12,45,8,1,'rgba(0,0,0,.2)')}
  function drawSushi(ctx,d){
    /* nigiri cap: 5-color cluster, deliberately asymmetric like SFC sprites */
    if(d==='n'){
      px(ctx,8,4,16,3,P.red3); px(ctx,6,7,20,5,P.red); px(ctx,8,5,5,2,P.red2); px(ctx,14,4,7,2,P.red2); px(ctx,7,12,18,2,P.red3);
      px(ctx,9,8,4,1,'#ffc2ae'); px(ctx,17,9,5,1,'#ffc2ae');
      return;
    }
    px(ctx,7,3,18,2,P.red3); px(ctx,5,5,22,6,P.red); px(ctx,7,4,6,2,P.red2); px(ctx,15,3,7,2,P.red2); px(ctx,6,10,20,3,P.red3);
    px(ctx,8,6,5,1,'#ffd0bd'); px(ctx,17,7,6,1,'#ffd0bd'); px(ctx,11,5,3,1,'#f49b8e');
  }
  function drawHead(ctx,d,hit){
    const dx=hit?1:0;
    if(d==='e'||d==='w'){
      outlineRect(ctx,10+dx,11,13,15,P.skin);
      px(ctx,12+dx,12,9,3,P.skin2); px(ctx,11+dx,23,10,2,P.skin3);
      px(ctx,19+dx,16,2,3,P.o); px(ctx,21+dx,21,2,1,'#985a55');
    }else{
      outlineRect(ctx,8+dx,11,16,15,P.skin);
      px(ctx,10+dx,12,12,3,P.skin2); px(ctx,9+dx,23,14,2,P.skin3);
      if(d!=='n'){
        px(ctx,11+dx,16,2,3,P.o); px(ctx,19+dx,16,2,3,P.o); px(ctx,14+dx,21,5,1,'#985a55');
        px(ctx,12+dx,15,2,1,'#513b3b'); px(ctx,19+dx,15,2,1,'#513b3b');
      }
    }
    drawSushi(ctx,d);
  }
  function drawBody(ctx,d,f,m){
    const walk=m==='walk';
    const a=walk?[-1,0,1,0][f]:0;
    if(d==='e'||d==='w'){
      /* rear leg */
      px(ctx,13,34,5,8+a,P.pants3); px(ctx,14,35,4,6+a,P.pants); px(ctx,13,41+a,6,3,P.shoe);
      /* front leg */
      px(ctx,17,34,6,8-a,P.pants); px(ctx,18,35,4,5-a,P.pants2); px(ctx,17,41-a,7,3,P.shoe);
      outlineRect(ctx,10,25,14,12,P.white); px(ctx,12,26,10,3,P.white2); px(ctx,12,30,10,3,P.red); px(ctx,12,35,10,2,P.white3);
      outlineRect(ctx,8,27,5,10,P.white); px(ctx,9,28,3,4,P.white2); px(ctx,8,35,4,3,P.skin);
      outlineRect(ctx,21,27,5,10,P.white); px(ctx,22,28,3,4,P.white2); px(ctx,22,35,4,3,P.skin);
    }else{
      px(ctx,9,34,6,8+a,P.pants3); px(ctx,10,35,4,6+a,P.pants); px(ctx,9,41+a,7,3,P.shoe);
      px(ctx,17,34,6,8-a,P.pants); px(ctx,18,35,4,5-a,P.pants2); px(ctx,17,41-a,7,3,P.shoe);
      outlineRect(ctx,7,25,18,12,P.white); px(ctx,9,26,14,3,P.white2); px(ctx,9,30,14,3,P.red); px(ctx,9,35,14,2,P.white3);
      outlineRect(ctx,4,27,5,10,P.white); px(ctx,5,28,3,4,P.white2); px(ctx,4,35,4,3,P.skin);
      outlineRect(ctx,23,27,5,10,P.white); px(ctx,24,28,3,4,P.white2); px(ctx,24,35,4,3,P.skin);
    }
  }
  function drawShield(ctx,name,d,m,f){
    if(!name)return;
    const board=name.includes('まな板'), metal=name.includes('鉄')||name.includes('騎士'), dark=name.includes('黒檀');
    const base=board?(dark?'#382923':'#b98751'):metal?'#88969e':'#855a37';
    const hi=board?(dark?'#5b463b':'#dcb57a'):metal?'#c4cfd4':'#b37d50';
    const sh=board?'#5c3e29':metal?'#4f5e66':'#50351f';
    let x=d==='e'?4:22, y=29; if(d==='n')y=27; if(m==='attack'&&f===2)y++;
    if(board){outlineRect(ctx,x,y,8,11,base);px(ctx,x+2,y+2,4,2,hi);px(ctx,x+3,y+5,1,4,sh)}
    else if(metal){px(ctx,x,y+2,8,6,P.o);px(ctx,x+1,y+1,6,9,P.o);px(ctx,x+2,y+2,4,6,base);px(ctx,x+2,y+2,4,2,hi);px(ctx,x+3,y+4,1,4,sh)}
    else{px(ctx,x+1,y,6,1,P.o);px(ctx,x,y+1,8,7,P.o);px(ctx,x+1,y+1,6,6,base);px(ctx,x+2,y+2,3,1,hi);px(ctx,x+3,y+3,1,3,sh)}
  }
  function drawWeapon(ctx,name,d,m,f){
    if(!name)return;
    const s=weaponSpec(name); let x=d==='w'?5:25,y=34,ang=0;
    if(d==='n'){x=5;y=30;ang=-.12}else if(d==='e')ang=.1;else if(d==='w')ang=-.1;
    if(m==='attack'){ang+=[-.8,-.35,.15,.8,.25][f]*(d==='w'?-1:1);x+=d==='w'?-2:2;y-=[0,1,2,1,0][f]}
    ctx.save();ctx.translate(x,y);ctx.rotate(ang);
    px(ctx,-2,0,6,2,P.gold);px(ctx,0,2,2,6,P.wood);
    if(s.kind==='knife'){
      px(ctx,-1,-s.len,s.w,s.len,s.edge);px(ctx,0,-s.len+1,s.w-1,s.len-2,s.blade);px(ctx,0,-s.len+1,1,s.len-4,P.steel2);
    }else if(s.kind==='club'){
      px(ctx,0,-s.len,3,s.len,s.edge);px(ctx,1,-s.len,2,s.len-1,s.blade);px(ctx,1,-s.len,1,3,'#b27b49');
    }else{
      px(ctx,0,-s.len,s.w,s.len,s.edge);px(ctx,1,-s.len+1,Math.max(1,s.w-2),s.len-2,s.blade);px(ctx,1,-s.len,1,s.len-3,P.steel2);px(ctx,0,-s.len-2,s.w,2,s.edge);px(ctx,1,-s.len-3,1,2,s.blade);
    }
    ctx.restore();
  }
  function drawAttackArc(ctx,d,f){
    if(f===0||f===4)return;
    ctx.save();ctx.globalAlpha=[0,.42,.82,.55,0][f];ctx.strokeStyle='#eafcff';ctx.lineWidth=1;ctx.beginPath();
    if(d==='w'){ctx.moveTo(13,14);ctx.quadraticCurveTo(1,22,4,36)}
    else{ctx.moveTo(19,14);ctx.quadraticCurveTo(31,22,28,36)}
    ctx.stroke();ctx.restore();
  }
  function paint(canvas,el){
    const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,SCALE_W,SCALE_H);
    const m=motion(el),d=dir(el),fc=frameCount(m),f=heroState.frame%fc,hit=m==='hit'?[0,1,-1][f]:0,bob=m==='idle'?[0,-1,0,-1][f]:0;
    ctx.save();ctx.translate(hit,bob);
    drawShadow(ctx);
    if(d==='n')drawWeapon(ctx,game?.weapon?.name,d,m,f);
    drawShield(ctx,game?.shield?.name,d,m,f);
    drawBody(ctx,d,f,m);
    drawHead(ctx,d,m==='hit');
    if(d!=='n')drawWeapon(ctx,game?.weapon?.name,d,m,f);
    if(m==='attack')drawAttackArc(ctx,d,f);
    if(m==='hit'&&f===1){ctx.globalCompositeOperation='source-atop';ctx.globalAlpha=.28;ctx.fillStyle='#fff';ctx.fillRect(0,0,SCALE_W,SCALE_H)}
    ctx.restore();
  }
  function ensureHero(el){
    let c=el.querySelector('canvas.heroSpriteV2');
    if(!c){el.innerHTML='';c=document.createElement('canvas');c.className='heroSpriteV2';c.width=SCALE_W;c.height=SCALE_H;el.append(c)}
    paint(c,el);
  }
  function repaint(){document.querySelectorAll('#board .entity.player').forEach(ensureHero)}
  const baseMove=window.move;
  if(typeof baseMove==='function')window.move=function(dx,dy){const before=game?.player?`${game.player.x},${game.player.y}`:'';const r=baseMove.apply(this,arguments);const after=game?.player?`${game.player.x},${game.player.y}`:'';if(before&&before!==after)heroState.walkUntil=performance.now()+240;repaint();return r};
  const obs=new MutationObserver(()=>requestAnimationFrame(repaint));
  window.addEventListener('DOMContentLoaded',()=>{const b=document.getElementById('board');if(b)obs.observe(b,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});repaint()});
  setInterval(()=>{heroState.frame++;repaint()},105);
})();