const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const resultKey = id => `common_reading_${id}_result`;

function loadResult(id){
  try { return JSON.parse(localStorage.getItem(resultKey(id)) || 'null'); }
  catch { return null; }
}

function render(items){
  const results = items.map(item => ({item, result: loadResult(item.id)}));
  const completed = results.filter(x => x.result).length;
  const totalCorrect = results.reduce((sum,x)=>sum+(x.result?.score||0),0);
  const totalQuestions = results.reduce((sum,x)=>sum+(x.result?.total||0),0);
  const accuracy = totalQuestions ? Math.round(totalCorrect/totalQuestions*100) : 0;

  document.querySelector('#heroStats').innerHTML = `
    <div class="heroStat"><b>${completed}</b><span>Completed</span></div>
    <div class="heroStat"><b>${accuracy}%</b><span>Overall accuracy</span></div>`;

  const typeStats = {};
  for(const {result} of results){
    for(const [type,stat] of Object.entries(result?.typeStats || {})){
      typeStats[type] ||= {correct:0,total:0};
      typeStats[type].correct += stat.correct;
      typeStats[type].total += stat.total;
    }
  }
  const weakest = Object.entries(typeStats)
    .filter(([,s])=>s.total>0)
    .sort((a,b)=>(a[1].correct/a[1].total)-(b[1].correct/b[1].total))[0];

  document.querySelector('#dashboard').innerHTML = completed ? `
    <div class="dashCard"><span class="dashLabel">Progress</span><b>${completed} / ${items.length}</b><div class="progressTrack"><span style="width:${Math.round(completed/items.length*100)}%"></span></div></div>
    <div class="dashCard"><span class="dashLabel">Current weak point</span><b>${weakest ? esc(weakest[0]) : 'More data needed'}</b><small>${weakest ? `${weakest[1].correct}/${weakest[1].total} correct` : 'Complete more sets to analyse.'}</small></div>
    <button class="btn" id="resetProgress">Reset local progress</button>` : `
    <div class="dashIntro"><b>まず1つ解いてみよう。</b><span>結果はこの端末に自動保存されます。</span></div>`;

  document.querySelector('#resetProgress')?.addEventListener('click',()=>{
    if(!confirm('共通 Readingの保存済み進捗をこの端末から削除しますか？')) return;
    Object.keys(localStorage).filter(k=>k.startsWith('common_reading_')).forEach(k=>localStorage.removeItem(k));
    location.reload();
  });

  const sets = [...new Set(items.map(x=>x.id.split('-')[0]))];
  document.querySelector('#library').innerHTML = sets.map(set => `
    <section class="setSection">
      <div class="setHead"><h2>SET ${esc(set)}</h2><span>${items.filter(x=>x.id.startsWith(set+'-')).length} sets</span></div>
      <div class="cards">
        ${items.filter(x=>x.id.startsWith(set+'-')).map(item=>{
          const r=loadResult(item.id);
          return `<a class="card ${r?'completed':''}" href="reading.html?id=${encodeURIComponent(item.id)}">
            <div class="cardTop"><span class="cardCode">${esc(item.id)}</span>${r?'<span class="doneBadge">COMPLETED</span>':''}</div>
            <div class="cardTitle">${esc(item.title)}</div>
            <div class="cardMeta">${esc(item.range)} · ${esc(item.questionCount)} questions · ${esc(item.durationMinutes||20)} min</div>
            ${r?`<div class="cardResult"><b>${r.score}/${r.total}</b><span>${Math.round(r.score/r.total*100)}%</span></div>`:'<div class="cardStart">Start passage →</div>'}
          </a>`;
        }).join('')}
      </div>
    </section>`).join('');
}

fetch('data/manifest.json',{cache:'no-store'})
  .then(r=>{if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.json();})
  .then(render)
  .catch(err=>document.querySelector('#library').innerHTML=`<div class="errorBox"><b>Library data could not be loaded.</b><br>GitHub Pages / Cloudflare Pages上で開いてください。<small>${esc(err.message)}</small></div>`);
