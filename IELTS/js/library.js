const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const resultKey = id => `ielts_${id}_result`;

function loadResult(id){
  try { return JSON.parse(localStorage.getItem(resultKey(id)) || 'null'); }
  catch { return null; }
}

function normaliseManifest(raw){
  if(Array.isArray(raw)){
    const ids=[...new Set(raw.map(x=>String(x.id).split('-')[0]))];
    return {version:'1',sets:ids.map(id=>({id,title:`SET ${id}`,band:'',description:'',status:'available',passages:raw.filter(x=>String(x.id).startsWith(id+'-'))}))};
  }
  return raw?.sets ? raw : {version:'2.0',sets:[]};
}

function allPassages(manifest){ return manifest.sets.flatMap(set=>set.passages||[]); }

function render(raw){
  const manifest=normaliseManifest(raw);
  const items=allPassages(manifest);
  const results=items.map(item=>({item,result:loadResult(item.id)}));
  const completed=results.filter(x=>x.result).length;
  const totalCorrect=results.reduce((sum,x)=>sum+(x.result?.score||0),0);
  const totalQuestions=results.reduce((sum,x)=>sum+(x.result?.total||0),0);
  const accuracy=totalQuestions?Math.round(totalCorrect/totalQuestions*100):0;

  document.querySelector('#heroStats').innerHTML=`
    <div class="heroStat"><b>${completed}</b><span>Completed</span></div>
    <div class="heroStat"><b>${accuracy}%</b><span>Overall accuracy</span></div>`;

  const typeStats={};
  for(const {result} of results){
    for(const [type,stat] of Object.entries(result?.typeStats||{})){
      typeStats[type]||={correct:0,total:0};
      typeStats[type].correct+=stat.correct; typeStats[type].total+=stat.total;
    }
  }
  const weakest=Object.entries(typeStats).filter(([,s])=>s.total>0).sort((a,b)=>(a[1].correct/a[1].total)-(b[1].correct/b[1].total))[0];
  document.querySelector('#dashboard').innerHTML=completed?`
    <div class="dashCard"><span class="dashLabel">Progress</span><b>${completed} / ${items.length}</b><div class="progressTrack"><span style="width:${items.length?Math.round(completed/items.length*100):0}%"></span></div></div>
    <div class="dashCard"><span class="dashLabel">Current weak point</span><b>${weakest?esc(weakest[0]):'More data needed'}</b><small>${weakest?`${weakest[1].correct}/${weakest[1].total} correct`:'Complete more passages to analyse.'}</small></div>
    <button class="btn" id="resetProgress">Reset local progress</button>`:
    `<div class="dashIntro"><b>まず1つ解いてみよう。</b><span>1問ごとのCheckと5分タイマーも使えます。結果はこの端末に自動保存されます。</span></div>`;

  document.querySelector('#resetProgress')?.addEventListener('click',()=>{
    if(!confirm('IELTS Readingの保存済み進捗をこの端末から削除しますか？'))return;
    Object.keys(localStorage).filter(k=>k.startsWith('ielts_')).forEach(k=>localStorage.removeItem(k)); location.reload();
  });

  document.querySelector('#library').innerHTML=manifest.sets.map(set=>{
    const passages=set.passages||[];
    const done=passages.filter(p=>loadResult(p.id)).length;
    const pct=passages.length?Math.round(done/passages.length*100):0;
    const coming=set.status==='coming-soon'||!passages.length;
    return `<section class="setSection ${coming?'setComing':''}">
      <div class="setOverview">
        <div><div class="setKicker">${esc(set.difficulty||'IELTS Reading')}</div><h2>${esc(set.title||`SET ${set.id}`)}</h2><p>${esc(set.description||'')}</p></div>
        <div class="setBadges"><span>Band ${esc(set.band||'—')}</span><span>${passages.length} Passages</span></div>
      </div>
      ${coming?`<div class="comingCard">Coming soon — JSONを追加すると自動でここに表示されます。</div>`:`
      <div class="setProgress"><span>SET progress ${done}/${passages.length}</span><div class="progressTrack"><span style="width:${pct}%"></span></div></div>
      <div class="cards">${passages.map(item=>{
        const r=loadResult(item.id);
        return `<a class="card ${r?'completed':''}" href="reading.html?id=${encodeURIComponent(item.id)}">
          <div class="cardTop"><span class="cardCode">${esc(item.id)}</span>${r?'<span class="doneBadge">COMPLETED</span>':''}</div>
          <div class="cardTitle">${esc(item.title)}</div>
          <div class="cardMeta">${esc(item.range)} · ${esc(item.questionCount)} questions · ${esc(item.durationMinutes||20)} min</div>
          ${r?`<div class="cardResult"><b>${r.score}/${r.total}</b><span>${Math.round(r.score/r.total*100)}%</span></div>`:'<div class="cardStart">Start passage →</div>'}
        </a>`}).join('')}</div>`}
    </section>`;
  }).join('');
}

fetch('data/manifest.json',{cache:'no-store'})
  .then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json();})
  .then(render)
  .catch(err=>document.querySelector('#library').innerHTML=`<div class="errorBox"><b>Library data could not be loaded.</b><br>GitHub Pages / Cloudflare Pages上で開いてください。<small>${esc(err.message)}</small></div>`);
