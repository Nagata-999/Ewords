'use strict';
(function(){
  /* 256x256 dedicated hero renderer. Art is authored at 2-4px detail, not upscaled from the old 32x48 sprite. */
  const W=256,H=256;
  const P={
    ink:'#171821',ink2:'#292b36',ink3:'#3b3e49',
    skin:'#e6ae83',skinHi:'#ffd5ad',skinMid:'#efbd95',skinSh:'#b96f55',skinDeep:'#7d463d',
    rice:'#f1eee3',riceHi:'#fffdf4',riceMid:'#d8d2c5',riceSh:'#9b9387',
    salmon:'#d94e48',salmonHi:'#ff8273',salmonMid:'#ed665d',salmonSh:'#8c2931',salmonDeep:'#5d2029',
    cloth:'#e9e3d7',clothHi:'#fff9eb',clothMid:'#c7bdad',clothSh:'#8b8176',red:'#b8423e',
    pants:'#334856',pantsHi:'#55717f',pantsSh:'#1f2d36',boot:'#25232a',
    steel:'#bcc9ce',steelHi:'#eef6f5',steelMid:'#87979f',steelSh:'#536168',gold:'#c9923d',goldHi:'#f3c968',wood:'#71492e',
    shadow:'rgba(0,0,0,.34)'
  };
  const S={frame:0,walkUntil:0};
  const dir=el=>['n','e','s','w'].find(d=>el.classList.contains('facing-'+d))||'s';
  const motion=el=>el.classList.contains('motion-attack')?'attack':el.classList.contains('motion-hit')?'hit':(performance.now()<S.walkUntil?'walk':'idle');
  const fc=m=>m==='attack'?5:m==='hit'?3:4;
  function r(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(x|0,y|0,w|0,h|0)}
  function poly(c,pts,col,stroke=P.ink,sw=4){c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.closePath();c.fillStyle=col;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=sw;c.stroke()}}
  function ell(c,x,y,rx,ry,col){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=col;c.fill()}
  function line(c,pts,col,w){c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.strokeStyle=col;c.lineWidth=w;c.lineCap='square';c.stroke()}
  function rounded(c,x,y,w,h,rad,fill,stroke=P.ink,sw=4){c.beginPath();c.roundRect(x,y,w,h,rad);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=sw;c.stroke()}}
  function weaponSpec(name){return ({
    '木の棒':{blade:P.wood,edge:'#4a2d1c',len:72,w:14,kind:'club'},'川魚包丁':{blade:'#cbd7da',edge:'#61727a',len:62,w:24,kind:'knife'},
    '鉄の剣':{blade:'#bcc7ca',edge:'#56666e',len:78,w:16,kind:'sword'},'ロングソード':{blade:'#dce5e7',edge:'#6d7f87',len:92,w:14,kind:'sword'},
    '銀の出刃包丁':{blade:'#f1f5f5',edge:'#82949b',len:68,w:28,kind:'knife'},'古騎士の剣':{blade:'#e0c56b',edge:'#80662e',len:84,w:18,kind:'sword'}
  })[name]||{blade:'#bcc7ca',edge:'#56666e',len:78,w:16,kind:'sword'}}
  function drawShadow(c){ell(c,128,231,60,12,P.shadow);ell(c,128,234,42,6,'rgba(0,0,0,.20)')}
  function drawSushi(c,d){
    if(d==='n'){
      poly(c,[[70,66],[82,40],[108,27],[145,24],[174,33],[189,48],[194,68],[181,81],[149,73],[119,77],[88,80]],P.salmon,P.ink,5);
      poly(c,[[78,55],[101,38],[135,32],[161,37],[177,49],[163,52],[137,47],[108,51]],P.salmonHi,null,0);
      poly(c,[[78,70],[102,65],[131,66],[159,61],[187,67],[181,80],[151,73],[118,78],[88,80]],P.salmonSh,null,0);
      line(c,[[101,43],[124,38],[148,40]],'#ffc0ae',6);line(c,[[136,55],[162,54]],'#ffb19d',5);return;
    }
    poly(c,[[66,62],[77,38],[101,24],[135,20],[166,27],[186,42],[195,61],[186,78],[159,70],[131,73],[100,78],[75,75]],P.salmon,P.ink,5);
    poly(c,[[76,50],[104,32],[139,27],[168,34],[180,46],[160,44],[137,40],[110,43],[92,54]],P.salmonHi,null,0);
    poly(c,[[72,65],[100,59],[129,61],[158,57],[190,63],[185,77],[158,70],[129,74],[99,79],[77,75]],P.salmonSh,null,0);
    line(c,[[101,38],[124,32],[148,34]],'#ffd1bd',6);line(c,[[136,48],[161,46]],'#ffb09b',5);line(c,[[87,57],[111,52]],'#f3978b',4)
  }
  function drawHead(c,d,hit){
    const dx=hit?5:0,side=d==='e'||d==='w',back=d==='n';
    if(side){rounded(c,82+dx,68,96,88,18,P.skin,P.ink,5);r(c,91+dx,74,69,14,P.skinHi);r(c,90+dx,133,72,14,P.skinSh);r(c,94+dx,139,64,8,P.skinDeep);if(!back){r(c,143+dx,96,10,18,P.ink);r(c,150+dx,125,16,5,'#99534f');r(c,132+dx,88,20,5,P.skinMid)}}
    else{rounded(c,74+dx,68,108,90,20,P.skin,P.ink,5);r(c,84+dx,75,87,14,P.skinHi);r(c,82+dx,135,92,14,P.skinSh);r(c,89+dx,143,78,7,P.skinDeep);if(!back){r(c,96+dx,98,11,18,P.ink);r(c,149+dx,98,11,18,P.ink);r(c,113+dx,127,31,5,'#99534f');r(c,94+dx,91,19,5,'#6b4745');r(c,145+dx,91,19,5,'#6b4745');r(c,122+dx,111,12,6,P.skinMid)}}
    drawSushi(c,d)
  }
  function drawBody(c,d,f,m){
    const side=d==='e'||d==='w',walk=m==='walk',step=walk?[-8,0,8,0][f]:0;
    if(side){
      poly(c,[[100,173],[117,171],[121,221+step],[96,221+step]],P.pantsSh,P.ink,4);poly(c,[[122,171],[148,171],[157,220-step],[128,220-step]],P.pants,P.ink,4);r(c,132,180,15,28,P.pantsHi);rounded(c,91,215+step,34,14,4,P.boot,P.ink,3);rounded(c,126,214-step,39,15,4,P.boot,P.ink,3);
      rounded(c,85,145,88,55,10,P.cloth,P.ink,5);r(c,96,151,64,12,P.clothHi);r(c,95,166,66,14,P.red);r(c,96,184,64,9,P.clothSh);
      poly(c,[[78,151],[94,146],[104,166],[98,195],[78,191],[67,170]],P.cloth,P.ink,5);r(c,76,184,21,14,P.skin);r(c,82,154,13,12,P.clothHi);
      poly(c,[[164,150],[177,154],[187,174],[181,194],[162,190],[157,167]],P.cloth,P.ink,5);r(c,163,184,20,14,P.skin);r(c,163,154,11,12,P.clothHi);
    }else{
      poly(c,[[87,173],[112,171],[117,221+step],[82,221+step]],P.pantsSh,P.ink,4);poly(c,[[137,171],[164,173],[172,221-step],[136,221-step]],P.pants,P.ink,4);r(c,142,180,15,27,P.pantsHi);rounded(c,78,215+step,43,15,4,P.boot,P.ink,3);rounded(c,133,214-step,45,16,4,P.boot,P.ink,3);
      rounded(c,75,144,106,58,11,P.cloth,P.ink,5);r(c,88,151,80,12,P.clothHi);r(c,87,166,82,14,P.red);r(c,88,184,80,10,P.clothSh);
      poly(c,[[66,150],[80,146],[89,168],[82,196],[61,193],[53,171]],P.cloth,P.ink,5);r(c,59,185,22,14,P.skin);r(c,66,154,11,13,P.clothHi);
      poly(c,[[176,149],[189,153],[199,171],[193,194],[173,192],[167,168]],P.cloth,P.ink,5);r(c,174,185,21,14,P.skin);r(c,176,154,10,13,P.clothHi);
    }
  }
  function drawShield(c,name,d,m,f){if(!name)return;const board=name.includes('まな板'),metal=name.includes('鉄')||name.includes('騎士'),dark=name.includes('黒檀');const base=board?(dark?'#382a25':'#b9854f'):metal?'#87959d':'#845936';const hi=board?(dark?'#5e493d':'#dfb879'):metal?'#c7d2d5':'#b47c4e';const sh=board?'#5c3c29':metal?'#4e5d64':'#50331f';let x=d==='e'?45:172,y=153;if(d==='n')y=145;if(m==='attack'&&f===2)y+=6;if(board){rounded(c,x,y,50,70,4,base,P.ink,5);r(c,x+9,y+10,31,9,hi);r(c,x+17,y+28,6,30,sh);line(c,[[x+7,y+57],[x+41,y+57]],dark?'#2c211d':'#8b5f39',4)}else if(metal){poly(c,[[x+25,y],[x+48,y+13],[x+43,y+50],[x+25,y+69],[x+7,y+50],[x+2,y+13]],base,P.ink,5);line(c,[[x+25,y+8],[x+25,y+56]],hi,5);line(c,[[x+9,y+27],[x+41,y+27]],hi,4);r(c,x+21,y+21,8,13,sh)}else{ell(c,x+25,y+33,27,31,P.ink);ell(c,x+25,y+33,22,26,base);line(c,[[x+11,y+18],[x+39,y+18]],hi,5);ell(c,x+25,y+33,7,7,sh)}}
  function drawWeapon(c,name,d,m,f){if(!name)return;const s=weaponSpec(name);let x=d==='w'?38:198,y=183,ang=0;if(d==='n'){x=43;y=165;ang=-.12}else if(d==='e')ang=.08;else if(d==='w')ang=-.08;if(m==='attack'){ang+=[-.9,-.45,.1,.8,.25][f]*(d==='w'?-1:1);x+=d==='w'?-12:12;y-=[0,6,13,6,0][f]}c.save();c.translate(x,y);c.rotate(ang);r(c,-14,0,35,8,P.gold);r(c,-8,6,14,32,P.wood);r(c,-5,9,6,24,'#9a6a43');if(s.kind==='knife'){poly(c,[[-8,-s.len],[s.w,-s.len],[s.w,0],[-2,0]],s.blade,s.edge,4);r(c,0,-s.len+6,5,s.len-14,P.steelHi)}else if(s.kind==='club'){rounded(c,-3,-s.len,18,s.len,4,s.blade,s.edge,4);r(c,2,-s.len+5,5,s.len-13,'#a67549')}else{poly(c,[[0,-s.len],[s.w,-s.len],[s.w,0],[0,0]],s.blade,s.edge,4);poly(c,[[0,-s.len],[s.w/2,-s.len-17],[s.w,-s.len]],s.blade,s.edge,4);r(c,4,-s.len+5,5,s.len-15,P.steelHi)}c.restore()}
  function drawArc(c,d,f){if(f===0||f===4)return;c.save();c.globalAlpha=[0,.32,.72,.52,0][f];c.strokeStyle='#e8fbff';c.lineWidth=8;c.beginPath();if(d==='w'){c.moveTo(106,74);c.quadraticCurveTo(17,107,34,191)}else{c.moveTo(148,74);c.quadraticCurveTo(238,108,220,190)}c.stroke();c.restore()}
  function paint(canvas,el){const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,W,H);const m=motion(el),d=dir(el),f=S.frame%fc(m),hit=m==='hit'?[0,7,-5][f]:0,bob=m==='idle'?[0,-4,0,-2][f]:0;c.save();c.translate(hit,bob);drawShadow(c);if(d==='n')drawWeapon(c,game?.weapon?.name,d,m,f);drawShield(c,game?.shield?.name,d,m,f);drawBody(c,d,f,m);drawHead(c,d,m==='hit');if(d!=='n')drawWeapon(c,game?.weapon?.name,d,m,f);if(m==='attack')drawArc(c,d,f);if(m==='hit'&&f===1){c.globalCompositeOperation='source-atop';c.globalAlpha=.28;c.fillStyle='#fff';c.fillRect(0,0,W,H)}c.restore()}
  function ensure(el){let cv=el.querySelector('canvas.heroSpriteV2');if(!cv){el.innerHTML='';cv=document.createElement('canvas');cv.className='heroSpriteV2';cv.width=W;cv.height=H;el.append(cv)}if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H}paint(cv,el)}
  function repaint(){document.querySelectorAll('#board .entity.player').forEach(ensure)}
  const baseMove=window.move;if(typeof baseMove==='function')window.move=function(dx,dy){const b=game?.player?`${game.player.x},${game.player.y}`:'';const out=baseMove.apply(this,arguments);const a=game?.player?`${game.player.x},${game.player.y}`:'';if(b&&b!==a)S.walkUntil=performance.now()+260;repaint();return out};
  const obs=new MutationObserver(()=>requestAnimationFrame(repaint));window.addEventListener('DOMContentLoaded',()=>{const b=document.getElementById('board');if(b)obs.observe(b,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});repaint()});setInterval(()=>{S.frame++;repaint()},110);
})();