'use strict';
(() => {
  const KEY='sushitan_login_bonus_v1',BACKUP='sushitan_avatar_before_v2',A=SushiAvatarV2;
  const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
  function read(){const raw=localStorage.getItem(KEY);let value;if(raw===null)return {};try{value=JSON.parse(raw);}catch{throw Error('保存データを読み込めません。元のデータは変更していません。');}if(!object(value)||(value.gacha!==undefined&&!object(value.gacha))||(value.gacha?.avatar!==undefined&&!object(value.gacha.avatar))||(value.gacha?.owned!==undefined&&!Array.isArray(value.gacha.owned)))throw Error('保存データの形式を確認してください。');return value;}
  function owned(value){const g=value.gacha||{},ids=new Set(['starter','basic-bottom','studio-sneakers',...(g.owned||[]).filter(x=>typeof x==='string')]);if((g.version||1)<2)for(const [top,hat] of Object.entries({chef:'hat-chef',royal:'hat-crown',explorer:'hat-explorer'}))if(ids.has(top))ids.add(hat);return [...ids];}
  function missing(avatar,ids){const a=A.normalize(avatar);return [...new Set(Object.keys(A.slots).map(k=>a[k]).filter(id=>id&&!ids.includes(id)))];}
  function worn(value){const old=value.gacha?.avatar||{},a=A.normalize(old),ids=owned(value);if((value.gacha?.version||1)<2&&!Object.hasOwn(old,'hat'))a.hat={chef:'hat-chef',royal:'hat-crown',explorer:'hat-explorer'}[a.top]||null;for(const slot of Object.keys(A.slots))if(a[slot]&&!ids.includes(a[slot]))a[slot]=A.defaults[slot];return a;}
  function settings(value){const s=value.avatarStudioV2?.settings||{};return {size:[76,96,116].includes(s.size)?s.size:96,reduced:s.reduced===true,hidden:s.hidden===true};}
  function load(){const l=read(),s=l.avatarStudioV2||{};return {avatar:worn(l),owned:owned(l),gems:Number.isSafeInteger(l.gems)&&l.gems>=0?l.gems:0,looks:Array.from({length:3},(_,i)=>object(s.looks?.[i])?A.normalize(s.looks[i]):null),settings:settings(l)};}
  function transaction(change){const run=()=>{const raw=localStorage.getItem(KEY),l=read();const result=change(l);if(raw!==null&&localStorage.getItem(BACKUP)===null)localStorage.setItem(BACKUP,raw);localStorage.setItem(KEY,JSON.stringify(l));window.dispatchEvent(new Event('sushi-avatar-changed'));return result;};return navigator.locks?navigator.locks.request('sushitan-ledger',run):Promise.resolve().then(run);}
  async function equip(avatar){return transaction(l=>{const ids=owned(l),a=A.normalize(avatar);if(missing(a,ids).length)throw Error('未所持のアイテムは保存できません。ガチャやゲームの達成報酬で入手してください。');l.gacha={...(l.gacha||{}),avatar:{...(l.gacha?.avatar||{}),...a},owned:ids,version:Math.max(4,Number(l.gacha?.version)||0)};delete l.gacha.avatar.outfit;});}
  async function saveLook(index,avatar){if(!Number.isInteger(index)||index<0||index>=3)throw Error('保存先が無効です。');return transaction(l=>{const a=A.normalize(avatar);if(missing(a,owned(l)).length)throw Error('未所持のアイテムはコーデに保存できません。');const s=object(l.avatarStudioV2)?l.avatarStudioV2:{},looks=Array.from({length:3},(_,i)=>s.looks?.[i]||null);looks[index]=a;l.avatarStudioV2={...s,looks};});}
  async function saveSettings(s){return transaction(l=>{l.avatarStudioV2={...(l.avatarStudioV2||{}),settings:settings({avatarStudioV2:{settings:s}})};});}
  function normalizeGacha(l){const g=l.gacha||{};return {...g,version:Math.max(4,Number(g.version)||0),avatar:worn(l),owned:owned(l),pulls:Number.isSafeInteger(g.pulls)&&g.pulls>=0?g.pulls:0};}
  // Reward requirements live on catalog entries; repeats never grant currency or reset equipment.
  async function awardGameResult(game,score){
    if(typeof game!=='string'||!Number.isSafeInteger(score)||score<0)throw Error('ゲーム結果が無効です。');
    const rewards=A.catalog.filter(i=>i.reward?.game===game&&score>=i.reward.minScore);
    if(!rewards.length)return [];
    return transaction(l=>{
      const ids=owned(l),result=[];
      for(const item of rewards){const fresh=!ids.includes(item.id);if(fresh)ids.push(item.id);result.push({id:item.id,name:item.name,fresh});}
      l.gacha={...(l.gacha||{}),owned:ids};
      const progress=object(l.gameAvatarRewards)?l.gameAvatarRewards:{};
      const previous=object(progress[game])?progress[game]:{};
      l.gameAvatarRewards={...progress,[game]:{...previous,bestScore:Math.max(Number(previous.bestScore)||0,score)}};
      return result;
    });
  }
  window.SushiAvatarStore={KEY,BACKUP,awardGameResult,load,missing,equip,saveLook,saveSettings,read,normalizeGacha};
})();

