(()=>{'use strict';
 if (!(globalThis.SushiAdminFeatures?.enabled === true)) return;
const nonce=new URLSearchParams(location.search).get('nonce'),$=id=>document.getElementById(id);let original={},avatar={},ready=false,visible=false,last=0;const directions=['front','right','back','left'],names=['正面','右','後ろ','左'];
function draw(time){for(const style of ['painted','classic'])$(style).innerHTML=directions.map((direction,i)=>`<div class="tile">${SushiAvatarV2.render(avatar,{direction,action:$('action').value,time,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,style:style==='classic'?'classic':'painted-b'})}<div>${names[i]}</div></div>`).join('');}
function restore(){avatar={...original};$('top').value=avatar.top;$('shoes').value=avatar.shoes;draw(0);}
window.addEventListener('message',e=>{if(e.source!==parent||!nonce||e.data?.nonce!==nonce)return;if(e.data.type==='sushi-avatar-preview-init'){original=SushiAvatarV2.normalize(e.data.avatar);ready=true;$('preview').hidden=false;$('status').hidden=true;for(const slot of ['top','shoes']){for(const item of SushiAvatarV2.catalog.filter(i=>i.slot===slot)){const option=document.createElement('option');option.value=item.id;option.textContent=item.name;$(slot).append(option);}$(slot).onchange=()=>{avatar[slot]=$(slot).value;draw(0);};}restore();}else if(e.data.type==='sushi-avatar-preview-visible')visible=!!e.data.visible;});
$('reset').onclick=restore;$('action').onchange=()=>draw(0);
function tick(t){if(ready&&visible&&!document.hidden&&t-last>80){last=t;draw(t/1000);}requestAnimationFrame(tick);}requestAnimationFrame(tick);if(parent!==window&&nonce)parent.postMessage({type:'sushi-avatar-preview-ready',nonce},'*');
})();
