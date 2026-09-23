'use strict';
(function(){
  const URL='https://rxyoyveykxdfrpomkltl.supabase.co';
  const KEY='sb_publishable_RmWOSxRfsV5YRwCDnKPPAQ_m3VzsUM7';
  const MODE='sushi_dungeon';
  const NAME_KEY='sushidungeon_player_name_v1';
  const TURN_BASE=999999;
  let client=null,overlay=null,saving=false;

  function db(){
    if(client)return client;
    if(!window.supabase?.createClient)return null;
    client=window.supabase.createClient(URL,KEY);return client;
  }
  function encode(floor,turns){return Math.max(1,Math.min(30,Number(floor)||1))*1000000+(TURN_BASE-Math.min(TURN_BASE,Math.max(0,Number(turns)||0)))}
  function decode(score){const n=Math.max(0,Number(score)||0);return {floor:Math.floor(n/1000000),turns:TURN_BASE-(n%1000000)}}
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function build(){
    if(overlay)return overlay;
    overlay=document.createElement('div');overlay.className='dungeonRankingOverlay';overlay.hidden=true;
    overlay.innerHTML='<section class="dungeonRankingPanel" role="dialog" aria-modal="true" aria-label="ランキング"><h2>🏆 冒険者ランキング</h2><p class="dungeonRankingNote">到達階層が高いほど上位。同じ階では少ないターン数が上位。</p><div class="dungeonRankHeader"><span>順位</span><span>名前</span><span>到達</span><span>Lv</span><span>ターン</span></div><div class="dungeonRankingList"></div><div class="dungeonRankingActions"><button type="button" data-refresh>更新</button><button type="button" data-close>閉じる</button></div></section>';
    document.body.appendChild(overlay);
    overlay.querySelector('[data-close]').onclick=()=>overlay.hidden=true;
    overlay.querySelector('[data-refresh]').onclick=load;
    overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.hidden=true});
    return overlay;
  }
  async function load(){
    build();overlay.hidden=false;const list=overlay.querySelector('.dungeonRankingList');list.innerHTML='<div class="dungeonRankingEmpty">読み込み中…</div>';
    try{
      const c=db();if(!c)throw new Error('ランキング接続を読み込めませんでした');
      const {data,error}=await c.from('scores').select('player_name,score,max_combo,mode').eq('mode',MODE).order('score',{ascending:false}).limit(50);
      if(error)throw error;
      if(!data?.length){list.innerHTML='<div class="dungeonRankingEmpty">まだ記録がありません。最初の冒険者になろう！</div>';return}
      list.innerHTML=data.map((r,i)=>{const d=decode(r.score),medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':String(i+1);return `<div class="dungeonRankRow ${i<3?'top'+(i+1):''}"><span class="dungeonRankNo">${medal}</span><span class="dungeonRankName">${esc(r.player_name||'NO NAME')}</span><span class="dungeonRankStat">${d.floor}F</span><span class="dungeonRankStat">${Math.max(1,Number(r.max_combo)||1)}</span><span class="dungeonRankStat">${d.turns}</span></div>`}).join('');
    }catch(e){console.warn('[dungeon ranking]',e);list.innerHTML='<div class="dungeonRankingEmpty">ランキングに接続できませんでした。ゲームはそのまま遊べます。</div>'}
  }
  async function saveSnapshot(snapshot){
    if(!snapshot||snapshot.testMode)return;
    let status=document.querySelector('#dungeonAutoSave');
    if(!status){status=document.createElement('p');status.id='dungeonAutoSave';status.setAttribute('role','status');(document.querySelector('#titleScreen .titlePanel')||document.body).appendChild(status)}
    await SushiScores.save({p_score:encode(snapshot.floor,snapshot.turn),p_max_combo:Math.max(1,snapshot.level||1),p_accuracy:0,p_mode:MODE},{status});
  }
  function snap(){if(!game)return null;return {floor:Math.max(1,Math.min(30,game.floor||1)),turn:Math.max(0,game.turn||0),level:Math.max(1,game.level||1),testMode:!!game.testMode}}
  function hookResults(){
    if(typeof window.die==='function'&&!window.die.__dungeonRank){const base=window.die;window.die=function(){const s=snap(),r=base.apply(this,arguments);setTimeout(()=>saveSnapshot(s),120);return r};window.die.__dungeonRank=true}
    if(typeof window.finishClear==='function'&&!window.finishClear.__dungeonRank){const base=window.finishClear;window.finishClear=function(){const s=snap(),r=base.apply(this,arguments);setTimeout(()=>saveSnapshot(s),120);return r};window.finishClear.__dungeonRank=true}
  }
  function addButton(){
    const buttons=document.querySelector('#titleScreen .titleButtons');if(!buttons||buttons.querySelector('.rankBtn'))return;
    const b=document.createElement('button');b.type='button';b.className='titleBtn rankBtn';b.textContent='🏆 ランキング';b.onclick=load;buttons.appendChild(b);SushiPlayer.mount(buttons.parentElement);
  }
  function init(){build();addButton();hookResults();setTimeout(()=>{addButton();hookResults()},300)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.sushiDungeonRanking={open:load,save:()=>saveSnapshot(snap()),encode,decode};
})();