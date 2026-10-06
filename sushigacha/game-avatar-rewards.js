'use strict';
(() => {
  async function showResult(container,game,score){
    const items=SushiAvatarV2.catalog.filter(i=>i.reward?.game===game);
    if(!items.length)return;
    const panel=document.createElement('section');panel.className='avatar-game-reward';panel.setAttribute('aria-label','アバター達成報酬');panel.setAttribute('role','status');
    panel.style.cssText='margin:16px 0;padding:16px;border:1px solid #bd9c58;border-radius:14px;background:#172536;color:#fff;text-align:center';
    container.querySelector('.avatar-game-reward')?.remove();container.append(panel);
    const item=items[0],art=document.createElement('div');art.style.cssText='height:150px;width:120px;margin:auto';art.innerHTML=SushiAvatarV2.render({[item.slot]:item.id});panel.append(art);
    const kind=item.slot==='auraEffect'?'オーラ':'刀',label=kind==='刀'?'限定の刀':'限定オーラ';
    const title=document.createElement('strong');title.textContent='達成報酬：'+item.name;panel.append(title);
    const message=document.createElement('p');panel.append(message);
    if(score<item.reward.minScore){message.textContent=item.reward.label+'で獲得（あと'+(item.reward.minScore-score).toLocaleString()+'点）';return;}
    const retry=document.createElement('button');retry.textContent='獲得を再試行';retry.hidden=true;panel.append(retry);
    async function grant(){
      retry.hidden=true;message.textContent='報酬を保存しています…';
      try{
        const result=await SushiAvatarStore.awardGameResult(game,score);
        message.textContent=result.some(r=>r.fresh)?`${label}「${item.name}」を獲得しました！`:`${label}「${item.name}」は獲得済みです。`;
        const link=document.createElement('a');link.href='sushigacha/sushi-avatar.html?item='+encodeURIComponent(item.id);link.textContent=kind+'を装備する';link.style.cssText='display:inline-block;padding:10px 18px;border-radius:8px;background:#e8c576;color:#172536;font-weight:bold;text-decoration:none';panel.append(link);
      }catch(e){message.textContent='報酬を保存できませんでした。'+e.message;retry.hidden=false;}
    }
    retry.onclick=grant;await grant();
  }
  window.SushiGameAvatarRewards={showResult};
})();

