'use strict';

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => (
  {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]
));
const resultKey = id => `ielts_${id}_result`;

function loadResult(id){
  try { return JSON.parse(localStorage.getItem(resultKey(id)) || 'null'); }
  catch { return null; }
}

function normaliseManifest(raw){
  if(Array.isArray(raw)){
    const grouped = {};
    raw.forEach(item => {
      const number = Number(String(item.id).split('-')[0]) || 1;
      grouped[number] ||= {
        id:`set${number}`, number, title:`SET ${number}`, band:'',
        description:'', status:'available', passages:[]
      };
      grouped[number].passages.push(item);
    });
    return {version:'legacy', sets:Object.values(grouped).sort((a,b)=>a.number-b.number)};
  }
  return raw && Array.isArray(raw.sets) ? raw : {version:'unknown', sets:[]};
}

function availablePassages(manifest){
  return manifest.sets.flatMap(set => set.passages || []).filter(p => p.status !== 'coming-soon');
}

function setCard(set){
  const passages = set.passages || [];
  const results = passages.map(item => ({item, result:loadResult(item.id)}));
  const completed = results.filter(x => x.result).length;
  const percent = passages.length ? Math.round(completed / passages.length * 100) : 0;
  const coming = set.status === 'coming-soon' || passages.length === 0;

  return `
    <section class="setSection ${coming ? 'comingSet' : ''}">
      <div class="setHead">
        <div>
          <h2>SET ${esc(set.number)} — ${esc(set.title)}</h2>
          <span>${esc(set.band ? `Band ${set.band}` : '')}</span>
        </div>
        <span>${coming ? 'Coming soon' : `${completed}/${passages.length} completed`}</span>
      </div>
      <p class="setDescription">${esc(set.description || '')}</p>
      ${coming ? '<div class="dashIntro"><b>Coming soon</b><span>新しいPassageを追加すると自動表示されます。</span></div>' : `
        <div class="progressTrack setProgress"><span style="width:${percent}%"></span></div>
        <div class="cards">
          ${results.map(({item,result}) => `
            <a class="card ${result ? 'completed' : ''}" href="reading.html?id=${encodeURIComponent(item.id)}">
              <div class="cardTop">
                <span class="cardCode">${esc(item.id)}</span>
                ${result ? '<span class="doneBadge">COMPLETED</span>' : ''}
              </div>
              <div class="cardTitle">${esc(item.title)}</div>
              <div class="cardMeta">${esc(item.range)} · ${esc(item.questionCount)} questions · ${esc(item.durationMinutes || 20)} min</div>
              ${result
                ? `<div class="cardResult"><b>${result.score}/${result.total}</b><span>${Math.round(result.score/result.total*100)}%</span></div>`
                : '<div class="cardStart">Start passage →</div>'}
            </a>`).join('')}
        </div>`}
    </section>`;
}

function render(raw){
  const manifest = normaliseManifest(raw);
  const items = availablePassages(manifest);
  const results = items.map(item => ({item, result:loadResult(item.id)}));
  const completed = results.filter(x => x.result).length;
  const totalCorrect = results.reduce((sum,x)=>sum+(x.result?.score||0),0);
  const totalQuestions = results.reduce((sum,x)=>sum+(x.result?.total||0),0);
  const accuracy = totalQuestions ? Math.round(totalCorrect/totalQuestions*100) : 0;

  document.querySelector('#heroStats').innerHTML = `
    <div class="heroStat"><b>${completed}</b><span>Completed</span></div>
    <div class="heroStat"><b>${accuracy}%</b><span>Overall accuracy</span></div>`;

  const typeStats = {};
  results.forEach(({result}) => {
    Object.entries(result?.typeStats || {}).forEach(([type,stat]) => {
      typeStats[type] ||= {correct:0,total:0};
      typeStats[type].correct += stat.correct;
      typeStats[type].total += stat.total;
    });
  });
  const weakest = Object.entries(typeStats)
    .filter(([,s])=>s.total>0)
    .sort((a,b)=>(a[1].correct/a[1].total)-(b[1].correct/b[1].total))[0];

  document.querySelector('#dashboard').innerHTML = completed ? `
    <div class="dashCard"><span class="dashLabel">Progress</span><b>${completed} / ${items.length}</b><div class="progressTrack"><span style="width:${items.length ? Math.round(completed/items.length*100) : 0}%"></span></div></div>
    <div class="dashCard"><span class="dashLabel">Current weak point</span><b>${weakest ? esc(weakest[0]) : 'More data needed'}</b><small>${weakest ? `${weakest[1].correct}/${weakest[1].total} correct` : 'Complete more passages to analyse.'}</small></div>
    <button class="btn" id="resetProgress">Reset local progress</button>` :
    `<div class="dashIntro"><b>まず1つ解いてみよう。</b><span>1問ごとのCheckと5分練習も使えます。</span></div>`;

  document.querySelector('#resetProgress')?.addEventListener('click',()=>{
    if(!confirm('IELTS Readingの保存済み進捗をこの端末から削除しますか？')) return;
    Object.keys(localStorage).filter(k=>k.startsWith('ielts_')).forEach(k=>localStorage.removeItem(k));
    location.reload();
  });

  document.querySelector('#library').innerHTML = manifest.sets.map(setCard).join('');
}

fetch('data/manifest.json',{cache:'no-store'})
  .then(r=>{if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.json();})
  .then(render)
  .catch(err=>{
    document.querySelector('#library').innerHTML =
      `<div class="errorBox"><b>Library data could not be loaded.</b><br>
      GitHub Pages / Cloudflare Pages上で開いてください。<small>${esc(err.message)}</small></div>`;
  });
