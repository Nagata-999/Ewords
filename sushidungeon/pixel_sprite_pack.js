'use strict';
(function(){
  const px=(body,cls='')=>`<svg class="pixelSprite ${cls}" viewBox="0 0 48 48" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
  function dir(el){for(const d of ['n','e','s','w'])if(el.classList.contains('facing-'+d))return d;return 's'}
  function frame(el){return Number(el.dataset.animFrame||0)%4}
  function motion(el){if(el.classList.contains('motion-attack'))return 'attack';if(el.classList.contains('motion-hit'))return 'hit';return 'idle'}
  function weapon(name,d){if(!name)return '';const c={
    '木の棒':['#9b6a3d','#5e3b20'], '川魚包丁':['#d7e0e1','#6b7a80'], '鉄の剣':['#c9d2d5','#6d7b82'],
    'ロングソード':['#e3e9ea','#7c8b91'], '銀の出刃包丁':['#f3f6f6','#87999f'], '古騎士の剣':['#efd879','#8f7335']
  }[name]||['#c9d2d5','#6d7b82'];
  if(d==='n')return `<g><rect x="7" y="20" width="4" height="14" fill="#6b4325"/><rect x="6" y="18" width="6" height="3" fill="#b18545"/><polygon points="8,18 10,18 10,6 9,3 8,6" fill="${c[0]}" stroke="${c[1]}" stroke-width="1"/></g>`;
  const flip=d==='w'?'transform="translate(48 0) scale(-1 1)"':'';return `<g ${flip}><rect x="36" y="27" width="4" height="12" fill="#6b4325"/><rect x="33" y="25" width="10" height="3" fill="#b18545"/><polygon points="36,25 40,25 40,8 38,4 36,8" fill="${c[0]}" stroke="${c[1]}" stroke-width="1"/></g>`}
  function shield(name,d){if(!name)return '';const fill=name.includes('まな板')?'#b88952':name.includes('鉄')||name.includes('騎士')?'#8f9ca3':'#8d6037',edge=name.includes('まな板')?'#654526':'#4d3828';const x=d==='e'?5:30;return `<g><rect x="${x}" y="24" width="12" height="14" rx="2" fill="${fill}" stroke="${edge}" stroke-width="2"/><rect x="${x+5}" y="26" width="2" height="10" fill="${edge}" opacity=".65"/></g>`}
  function hero(el){
    const d=dir(el),m=motion(el),f=frame(el),bob=m==='idle'?[0,-1,0,-1][f]:0,walk=f%2,hit=m==='hit'?'opacity=".75"':'';
    const flip=d==='w'?'transform="translate(48 0) scale(-1 1)"':'';
    const eyes=d==='n'?'':`<rect x="18" y="16" width="3" height="4" fill="#182027"/><rect x="27" y="16" width="3" height="4" fill="#182027"/>`;
    const legL=walk?31:33,legR=walk?33:31;
    let attack=''; if(m==='attack'){const q=f%4;attack=`<path d="M33 ${25-q*2}Q42 ${18-q*2} 45 ${9+q}" fill="none" stroke="#dff7ff" stroke-width="3"/>`;}
    const body=`<g ${flip} ${hit} transform="translate(0 ${bob})"><ellipse cx="24" cy="39" rx="10" ry="3" fill="#000" opacity=".35"/>
      <rect x="17" y="27" width="14" height="12" fill="#f0eee5" stroke="#27323a" stroke-width="2"/>
      <rect x="17" y="28" width="14" height="3" fill="#c55b45"/>
      <rect x="18" y="${legL}" width="5" height="9" fill="#3f4c55"/><rect x="25" y="${legR}" width="5" height="9" fill="#3f4c55"/>
      <rect x="17" y="39" width="6" height="3" fill="#211d1a"/><rect x="25" y="39" width="6" height="3" fill="#211d1a"/>
      <rect x="12" y="28" width="5" height="9" fill="#f0eee5" stroke="#27323a" stroke-width="2"/><rect x="31" y="28" width="5" height="9" fill="#f0eee5" stroke="#27323a" stroke-width="2"/>
      <rect x="13" y="35" width="4" height="4" fill="#f1d3b6"/><rect x="31" y="35" width="4" height="4" fill="#f1d3b6"/>
      <rect x="13" y="8" width="22" height="19" rx="5" fill="#f7f3e6" stroke="#27323a" stroke-width="2"/>${eyes}<rect x="22" y="22" width="5" height="2" fill="#a7655a"/>
      <path d="M10 10Q14 2 24 3Q34 2 38 10L34 14Q26 11 22 13Q15 14 11 12Z" fill="#ed5b50" stroke="#8c2d2b" stroke-width="2"/><rect x="13" y="9" width="23" height="3" fill="#d74440"/><rect x="16" y="5" width="6" height="2" fill="#ffd0bd"/><rect x="26" y="7" width="6" height="2" fill="#ffd0bd"/>
      ${shield(game?.shield?.name,d)}${weapon(game?.weapon?.name,d)}${attack}</g>`;
    return px(body,'heroSprite');
  }
  const monster=(name,d,f,m)=>{
    const flip=d==='w'?'transform="translate(48 0) scale(-1 1)"':'',bob=m==='idle'?[0,-1,0,-1][f]:0,hit=m==='hit'?'opacity=".6"':'';
    let b='';
    if(name==='洞窟ネズミ')b=`<g ${flip} ${hit} transform="translate(0 ${bob})"><ellipse cx="24" cy="39" rx="10" ry="3" fill="#000" opacity=".3"/><rect x="14" y="24" width="20" height="12" fill="#75675e"/><rect x="27" y="19" width="9" height="10" fill="#84736a"/><rect x="30" y="17" width="4" height="4" fill="#a28c7d"/><rect x="35" y="22" width="3" height="3" fill="#e39a94"/><rect x="32" y="21" width="2" height="2" fill="#111"/><path d="M14 29H8V25H5" fill="none" stroke="#9b8173" stroke-width="2"/><rect x="17" y="35" width="4" height="4" fill="#51453f"/><rect x="28" y="35" width="4" height="4" fill="#51453f"/></g>`;
    else if(name==='緑小鬼')b=`<g ${flip} ${hit} transform="translate(0 ${bob})"><ellipse cx="24" cy="40" rx="10" ry="3" fill="#000" opacity=".3"/><rect x="17" y="22" width="15" height="15" fill="#529b4a"/><rect x="14" y="10" width="20" height="17" fill="#63b158"/><rect x="8" y="14" width="7" height="5" fill="#63b158"/><rect x="34" y="14" width="7" height="5" fill="#63b158"/><rect x="18" y="16" width="3" height="3" fill="#172018"/><rect x="27" y="16" width="3" height="3" fill="#172018"/><rect x="20" y="22" width="9" height="2" fill="#2f5c2a"/><rect x="19" y="36" width="5" height="5" fill="#355d31"/><rect x="27" y="36" width="5" height="5" fill="#355d31"/><rect x="9" y="27" width="10" height="3" fill="#c8d3d6"/><rect x="6" y="26" width="4" height="5" fill="#76522e"/></g>`;
    else if(name==='洞窟コウモリ')b=`<g ${hit} transform="translate(0 ${bob-2})"><path d="M24 24L5 12L10 29L18 27L24 34L30 27L38 29L43 12Z" fill="#5f5575"/><rect x="18" y="17" width="12" height="14" fill="#373047"/><rect x="20" y="20" width="3" height="3" fill="#d8b9ff"/><rect x="27" y="20" width="3" height="3" fill="#d8b9ff"/></g>`;
    else if(name==='骸骨兵')b=`<g ${flip} ${hit} transform="translate(0 ${bob})"><rect x="16" y="8" width="16" height="14" fill="#d9d5bf"/><rect x="18" y="13" width="4" height="4" fill="#2c2a26"/><rect x="26" y="13" width="4" height="4" fill="#2c2a26"/><rect x="21" y="20" width="7" height="3" fill="#807a6d"/><rect x="22" y="22" width="4" height="14" fill="#d9d5bf"/><rect x="15" y="26" width="18" height="3" fill="#d9d5bf"/><rect x="17" y="35" width="4" height="7" fill="#d9d5bf"/><rect x="27" y="35" width="4" height="7" fill="#d9d5bf"/></g>`;
    else if(name==='毒蜘蛛')b=`<g ${hit} transform="translate(0 ${bob})"><rect x="17" y="16" width="14" height="12" fill="#33283b"/><rect x="14" y="25" width="20" height="12" fill="#4a3755"/><rect x="20" y="18" width="3" height="3" fill="#d6b4e8"/><rect x="26" y="18" width="3" height="3" fill="#d6b4e8"/><path d="M15 27L5 20M15 31L4 31M16 34L7 41M33 27L43 20M33 31L44 31M32 34L41 41" stroke="#765986" stroke-width="3"/></g>`;
    else {const col=name==='石像兵'?'#788078':name==='洞窟トロル'?'#65704d':'#78734b';b=`<g ${flip} ${hit} transform="translate(0 ${bob})"><ellipse cx="24" cy="40" rx="11" ry="3" fill="#000" opacity=".3"/><rect x="13" y="18" width="22" height="19" fill="${col}"/><rect x="16" y="7" width="17" height="15" fill="${col}"/><rect x="19" y="13" width="3" height="3" fill="#151515"/><rect x="27" y="13" width="3" height="3" fill="#151515"/><rect x="16" y="36" width="6" height="6" fill="#3b402f"/><rect x="27" y="36" width="6" height="6" fill="#3b402f"/><rect x="7" y="23" width="7" height="12" fill="${col}"/><rect x="35" y="23" width="7" height="12" fill="${col}"/></g>`}
    return px(b,'monsterPixel');
  };
  function chest(){return px(`<ellipse cx="24" cy="40" rx="14" ry="3" fill="#000" opacity=".3"/><rect x="10" y="20" width="28" height="18" fill="#9a571f" stroke="#4e2a12" stroke-width="2"/><rect x="12" y="14" width="24" height="9" fill="#c67a2d" stroke="#5f3515" stroke-width="2"/><rect x="21" y="21" width="7" height="9" fill="#f0c14d"/><rect x="23" y="23" width="3" height="5" fill="#6b4a15"/>`,'chestPixel')}
  function stairs(){return px(`<g fill="#aab3ba" stroke="#4c5860" stroke-width="1"><rect x="9" y="32" width="30" height="6"/><rect x="14" y="26" width="25" height="6"/><rect x="19" y="20" width="20" height="6"/><rect x="24" y="14" width="15" height="6"/><rect x="29" y="8" width="10" height="6"/></g>`,'stairsPixel')}
  function itemSvg(icon){if(icon==='🍣')return px(`<rect x="12" y="24" width="24" height="10" rx="4" fill="#f5f0e4"/><path d="M10 22Q16 12 24 14Q33 12 38 22L34 26Q24 22 14 26Z" fill="#ea5b50"/><rect x="17" y="17" width="7" height="2" fill="#ffd1bd"/>`,'itemPixel');if(icon==='🍵')return px(`<rect x="13" y="21" width="22" height="15" rx="3" fill="#cbd9c2"/><rect x="16" y="23" width="16" height="7" fill="#5e8a4d"/><rect x="35" y="24" width="6" height="9" fill="none" stroke="#cbd9c2" stroke-width="3"/>`,'itemPixel');return null}
  function repaint(){
    document.querySelectorAll('#board .entity.player').forEach(el=>{el.innerHTML=hero(el)});
    document.querySelectorAll('#board .entity.enemy').forEach(el=>{const hp=el.querySelector('.enemyHp')?.outerHTML||'';el.innerHTML=`<span class="enemyGlyph directionalEnemy">${monster(el.title,dir(el),frame(el),motion(el))}</span>${hp}`});
    document.querySelectorAll('#board .treasure').forEach(el=>{if(el.dataset.pixel)return;el.dataset.pixel='1';el.innerHTML=chest()});
    document.querySelectorAll('#board .item').forEach(el=>{const s=itemSvg(el.textContent.trim());if(s){el.dataset.pixel='1';el.innerHTML=s}});
    document.querySelectorAll('#board .cell.exit').forEach(c=>{if(!c.querySelector('.pixelStairs')){const s=document.createElement('span');s.className='pixelStairs';s.innerHTML=stairs();c.append(s)}})
  }
  const obs=new MutationObserver(()=>requestAnimationFrame(repaint));
  window.addEventListener('DOMContentLoaded',()=>{const b=document.getElementById('board');if(b)obs.observe(b,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});repaint()});
  setInterval(repaint,110);
})();