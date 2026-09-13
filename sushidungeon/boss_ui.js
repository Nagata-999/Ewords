'use strict';
(function(){
  function ensureHud(){
    const wrap=document.getElementById('boardWrap');
    if(!wrap)return null;
    let hud=document.getElementById('bossHud');
    if(hud)return hud;
    hud=document.createElement('div');
    hud.id='bossHud';hud.className='bossHud';hud.hidden=true;
    hud.innerHTML='<div class="bossHudName"><span id="bossHudName">BOSS</span><em id="bossHudHp"></em></div><i class="bossHudMeter"><b id="bossHudBar"></b></i>';
    wrap.appendChild(hud);return hud;
  }
  function paint(){
    const hud=ensureHud();if(!hud||!game)return;
    const boss=game.enemies?.find(e=>e.isBoss&&e.hp>0);
    document.querySelectorAll('#board .entity.enemy').forEach(el=>{
      const e=game.enemies?.find(x=>x.hp>0&&x.name===el.title&&x.isBoss);
      el.classList.toggle('bossEnemy',!!e);
      if(e){const glyph=el.querySelector('.enemyGlyph');if(glyph&&!glyph.dataset.bossMarked){glyph.dataset.bossMarked='1';glyph.insertAdjacentHTML('beforeend','<span aria-hidden="true" style="position:absolute;right:-3px;top:-5px;font-size:13px;filter:drop-shadow(0 1px 1px #000)">♛</span>')}}
    });
    if(!boss){hud.hidden=true;return}
    hud.hidden=false;
    document.getElementById('bossHudName').textContent='BOSS　'+boss.name;
    document.getElementById('bossHudHp').textContent=`HP ${Math.max(0,boss.hp)} / ${boss.maxHp}`;
    document.getElementById('bossHudBar').style.width=`${Math.max(0,boss.hp/boss.maxHp*100)}%`;
  }
  const baseRender=window.render;
  if(typeof baseRender==='function')window.render=function(){const r=baseRender.apply(this,arguments);paint();return r};
  window.addEventListener('DOMContentLoaded',paint);
})();