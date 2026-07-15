'use strict';

const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const params = new URLSearchParams(location.search);
const passageId = params.get('id') || 'q1';
const storageKey = suffix => `common_reading_${passageId}_${suffix}`;

let data = null;
let manifest = [];
let answers = {};
let flags = {};
let graded = false;
let wrongOnly = false;
let seconds = 1200;
let timerId = null;
let markMode = false;
let checkedQuestions = new Set();
let eliminated = {};
let studentName = localStorage.getItem('common_reading_student_name') || '';
let className = localStorage.getItem('common_reading_class_name') || '';

const questionNumbers = q => q.nums || [q.num];
const answerFor = (q,n) => String(q.answers ? (q.answers[n] ?? '') : (q.answer ?? ''));
const normalise = value => String(value ?? '').trim().toLowerCase().replace(/[’']/g,"'").replace(/\s+/g,' ');
const acceptedAnswers = (q,n) => {
  const extra = q.accept ? (q.accept[n] || q.accept) : [];
  return [answerFor(q,n), ...(Array.isArray(extra) ? extra : [extra])].filter(Boolean);
};
const isCorrect = (q,n) => acceptedAnswers(q,n).some(a => normalise(a) === normalise(answers[n]));
const totalQuestions = () => data.questions.reduce((sum,q)=>sum+questionNumbers(q).length,0);

function loadSaved(){
  try { answers = JSON.parse(localStorage.getItem(storageKey('answers')) || '{}'); } catch { answers = {}; }
  try { flags = JSON.parse(localStorage.getItem(storageKey('flags')) || '{}'); } catch { flags = {}; }
  try { eliminated = JSON.parse(localStorage.getItem(storageKey('eliminated')) || '{}'); } catch { eliminated = {}; }
}

function saveProgress(){
  localStorage.setItem(storageKey('answers'), JSON.stringify(answers));
  localStorage.setItem(storageKey('flags'), JSON.stringify(flags));
  localStorage.setItem(storageKey('eliminated'), JSON.stringify(eliminated));
  updateAnsweredCount();
}

function updateAnsweredCount(){
  const answered = Object.values(answers).filter(v=>String(v).trim()).length;
  $('#answeredCount').textContent = `Answered ${answered} / ${totalQuestions()}`;
}

function questionType(q){
  if(q.type === 'summary') return 'Summary completion';
  if(q.type === 'text') return 'Short answer';
  const opts = q.options || [];
  if(opts.includes('TRUE') && opts.includes('FALSE')) return 'TRUE / FALSE / NOT GIVEN';
  if(opts.length && opts.every(x=>/^[A-Z]$/.test(x))) return 'Paragraph matching';
  return 'Multiple choice';
}

function tableHtml(title,pairs){
  if(!pairs?.length) return '';
  return `<div class="fbTitle">${esc(title)}</div><table class="pairs"><tr><th>Question</th><th>Passage</th></tr>${pairs.map(pair=>`<tr><td>${esc(pair[0])}</td><td>${esc(pair[1])}</td></tr>`).join('')}</table>`;
}

function feedbackHtml(q,n){
  const ev = typeof q.evidence === 'string' ? q.evidence : q.evidence?.[n];
  const reason = typeof q.reason_ja === 'string' ? q.reason_ja : q.reason_ja?.[n];
  const synonyms = Array.isArray(q.keyword_pairs) ? q.keyword_pairs : q.keyword_pairs?.[n];
  const contradictions = Array.isArray(q.contradiction_pairs) ? q.contradiction_pairs : q.contradiction_pairs?.[n];
  const ngReason = typeof q.not_given_reason === 'string' ? q.not_given_reason : q.not_given_reason?.[n];
  const skill = questionType(q);
  let html = `<div class="feedback"><div class="feedbackHead"><span>${esc(skill)}</span><b>Answer: ${esc(answerFor(q,n))}</b></div>`;
  if(ev) html += `<div class="fbTitle">Evidence</div><div class="evidence">“${esc(ev)}”</div>`;
  html += tableHtml('Synonyms / matching expressions', synonyms);
  html += tableHtml('Contradicting expressions', contradictions);
  if(ngReason) html += `<div class="fbTitle">Why NOT GIVEN?</div><div>${esc(ngReason)}</div>`;
  if(reason) html += `<div class="fbTitle">日本語解説</div><div>${esc(reason)}</div>`;
  html += `<div class="yourAnswer">Your answer: ${esc(answers[n] || '未回答')}</div></div>`;
  return html;
}

function resultLine(q,n){
  if(!String(answers[n] || '').trim()) return '<div class="result empty">Unanswered</div>';
  return `<div class="result ${isCorrect(q,n)?'correct':'wrong'}">${isCorrect(q,n)?'Correct':'Incorrect'}</div>`;
}

function shouldShowQuestion(q){
  if(!wrongOnly || !graded) return true;
  return questionNumbers(q).some(n=>!isCorrect(q,n));
}

function checkOne(n){
  const q = data.questions.find(item=>questionNumbers(item).includes(Number(n)));
  if(!q) return;
  if(!String(answers[n] || '').trim()){
    const card = document.querySelector(`[data-question-card="${n}"]`) || document.querySelector(`[data-summary-card="${questionNumbers(q)[0]}"]`);
    const note = card?.querySelector(`[data-check-note="${n}"]`);
    if(note){
      note.textContent = '先に解答を入力してください。';
      note.className = 'checkNote warn';
    }
    return;
  }
  checkedQuestions.add(Number(n));
  renderQuestions();
  requestAnimationFrame(()=>{
    const target=document.querySelector(`[data-feedback-for="${n}"]`);
    target?.scrollIntoView({behavior:'smooth',block:'nearest'});
  });
}

function setQuickTimer(minutes){
  stopTimer();
  seconds = minutes * 60;
  updateTimer();
  timerId = setInterval(tick,1000);
  $('#startPause').textContent='Pause';
  $('#moreMenu')?.classList.remove('show');
}

function renderQuestions(){
  let html = '';
  for(const q of data.questions){
    if(!shouldShowQuestion(q)) continue;
    const nums = questionNumbers(q);
    const flagged = nums.some(n=>flags[n]);
    if(q.type === 'summary'){
      html += `<article class="qcard" data-summary-card="${nums[0]}"><div class="qtop"><span class="qnum">Q${nums[0]}–${nums.at(-1)}</span><button class="flag ${flagged?'on':''}" data-flag="${nums[0]}">Review</button></div><div class="qtype">${esc(questionType(q))}</div><div class="qtext">${esc(q.question)}</div><div class="summaryBox">${q.summaryHtml.replace(/\{\{(\d+)(?:\|[^}]*)?\}\}/g,(_,n)=>`<input aria-label="Question ${n}" data-n="${n}" value="${esc(answers[n]||'')}">`)}</div><div class="summaryCheckRow">${nums.map(n=>`<button class="checkBtn" data-check="${n}">Check Q${n}</button><span class="checkNote" data-check-note="${n}"></span>`).join('')}</div>`;
      for(const n of nums){
        if(graded || checkedQuestions.has(Number(n))) html += `<div class="subResult" data-feedback-for="${n}"><b>Q${n}</b>${resultLine(q,n)}${feedbackHtml(q,n)}</div>`;
      }
      html += '</article>';
    } else {
      const n = q.num;
      html += `<article class="qcard" data-question-card="${n}"><div class="qtop"><span class="qnum">Q${n}</span><button class="flag ${flags[n]?'on':''}" data-flag="${n}">Review</button></div><div class="qtype">${esc(questionType(q))}</div><div class="qtext">${esc(q.question)}</div>`;
      if(q.type === 'radio'){
        html += `<div class="options">${q.options.map(o=>`<label class="opt ${eliminated[n]?.includes(o)?'eliminated':''}"><input type="radio" name="q${n}" data-n="${n}" value="${esc(o)}" ${answers[n]===o?'checked':''}><span>${esc(o)}</span><button type="button" class="strikeToggle" data-strike-n="${n}" data-strike-o="${esc(o)}" title="選択肢を消去">×</button></label>`).join('')}</div>`;
      } else {
        html += `<input class="textAns" aria-label="Question ${n}" data-n="${n}" value="${esc(answers[n]||'')}">`;
      }
      html += `<div class="singleCheckRow"><button class="checkBtn" data-check="${n}">Check Q${n}</button><span class="checkNote" data-check-note="${n}"></span></div>`;
      if(graded || checkedQuestions.has(Number(n))) html += `<div data-feedback-for="${n}">${resultLine(q,n)}${feedbackHtml(q,n)}</div>`;
      html += '</article>';
    }
  }
  if(!html) html = '<div class="allCorrectBox">No incorrect questions. Excellent work.</div>';
  $('#questionsBody').innerHTML = html;
  $('#questionsBody').querySelectorAll('[data-n]').forEach(el=>{
    el.addEventListener(el.type === 'radio' ? 'change' : 'input', event=>{
      const n=Number(event.target.dataset.n);
      answers[n] = event.target.value;
      checkedQuestions.delete(n);
      saveProgress();
      if(el.type === 'radio') renderQuestions();
    });
  });
  $('#questionsBody').querySelectorAll('[data-strike-n]').forEach(button=>{
    button.addEventListener('click',event=>{
      event.preventDefault(); event.stopPropagation();
      const n=Number(button.dataset.strikeN), o=button.dataset.strikeO;
      eliminated[n] ||= [];
      eliminated[n] = eliminated[n].includes(o) ? eliminated[n].filter(x=>x!==o) : [...eliminated[n],o];
      saveProgress(); renderQuestions();
    });
  });
  $('#questionsBody').querySelectorAll('[data-check]').forEach(button=>{
    button.addEventListener('click',()=>checkOne(Number(button.dataset.check)));
  });
  $('#questionsBody').querySelectorAll('[data-flag]').forEach(button=>{
    button.addEventListener('click',()=>{
      const first = Number(button.dataset.flag);
      const q = data.questions.find(item=>questionNumbers(item).includes(first));
      for(const n of questionNumbers(q)) flags[n] = !flaggedState(q);
      saveProgress();
      renderQuestions();
    });
  });
  updateAnsweredCount();
}

function flaggedState(q){ return questionNumbers(q).some(n=>flags[n]); }

function calculateResult(){
  let score=0, unanswered=0;
  const typeStats = {};
  const details = [];
  for(const q of data.questions){
    const type = questionType(q);
    typeStats[type] ||= {correct:0,total:0};
    for(const n of questionNumbers(q)){
      const filled = String(answers[n]||'').trim() !== '';
      const correct = filled && isCorrect(q,n);
      if(correct) score++;
      if(!filled) unanswered++;
      typeStats[type].total++;
      if(correct) typeStats[type].correct++;
      details.push({number:n,type,user:answers[n]||'',answer:answerFor(q,n),correct});
    }
  }
  return {id:passageId,title:data.title,score,total:totalQuestions(),unanswered,typeStats,details,studentName,className,completedAt:new Date().toISOString()};
}

function grade(){
  graded = true;
  wrongOnly = false;
  renderQuestions();
  const result = calculateResult();
  localStorage.setItem(storageKey('result'), JSON.stringify(result));
  localStorage.setItem(storageKey('best'), String(Math.max(result.score, Number(localStorage.getItem(storageKey('best'))||0))));
  const weakest = Object.entries(result.typeStats).sort((a,b)=>(a[1].correct/a[1].total)-(b[1].correct/b[1].total))[0];
  $('#resultBody').innerHTML = `
    <div class="scoreGrid"><div class="metric"><b>${result.score}/${result.total}</b><span>Score</span></div><div class="metric"><b>${Math.round(result.score/result.total*100)}%</b><span>Accuracy</span></div><div class="metric"><b>${result.unanswered}</b><span>Unanswered</span></div></div>
    <div class="resultAdvice"><b>Focus next:</b> ${esc(weakest?.[0]||'—')} (${weakest?weakest[1].correct+'/'+weakest[1].total:'—'})</div>
    <p>各問題の下に、根拠・対応表現・日本語解説を表示しました。</p>`;
  $('#resultModal').classList.add('show');
  $('#reviewWrongBtn').hidden = false;
  stopTimer();
}

function tick(){
  seconds--;
  updateTimer();
  if(seconds <= 0){ stopTimer(); grade(); }
}
function updateTimer(){
  const m=Math.max(0,Math.floor(seconds/60)), s=Math.max(0,seconds%60);
  $('#timer').textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  $('#timer').classList.toggle('danger',seconds<300);
}
function stopTimer(){
  if(timerId) clearInterval(timerId);
  timerId=null;
  if($('#startPause')) $('#startPause').textContent = seconds > 0 ? 'Resume' : 'Finished';
}
function toggleTimer(){
  if(timerId){ stopTimer(); }
  else if(seconds>0){ timerId=setInterval(tick,1000); $('#startPause').textContent='Pause'; }
}

function openVocabulary(){
  let saved={}; try{saved=JSON.parse(localStorage.getItem(storageKey('vocab'))||'{}')}catch{}
  $('#vocabBody').innerHTML = `<div class="vocabTools"><button class="btn" id="toggleMeanings">Hide meanings</button></div><div class="vocabGrid"><b>Word</b><b>Your guess</b><b class="meaningCol">Meaning</b>${(data.vocab||[]).map(v=>{const word=typeof v==='string'?v:v.word,meaning=typeof v==='string'?'':v.meaning;return `<div><b>${esc(word)}</b></div><input data-v="${esc(word)}" value="${esc(saved[word]||'')}"><div class="meaningCol">${esc(meaning)}</div>`}).join('')}</div>`;
  $('#vocabBody').querySelectorAll('input').forEach(input=>input.addEventListener('input',()=>{saved[input.dataset.v]=input.value;localStorage.setItem(storageKey('vocab'),JSON.stringify(saved))}));
  $('#toggleMeanings').onclick=()=>document.querySelectorAll('.meaningCol').forEach(el=>el.classList.toggle('hidden'));
  $('#vocabModal').classList.add('show');
}

function submissionReport(){
  const r=calculateResult();
  const lines=[
    'COMMON READING SUBMISSION',
    `Student: ${studentName || 'No name'}`,
    `Class: ${className || '-'}`,
    `Passage: ${passageId} ${data.title}`,
    `Score: ${r.score}/${r.total} (${Math.round(r.score/r.total*100)}%)`,
    `Completed: ${new Date().toLocaleString('ja-JP')}`,
    '',
    'QUESTION RESULTS'
  ];
  for(const d of r.details) lines.push(`Q${d.number}\t${d.correct?'CORRECT':'INCORRECT'}\tYour answer: ${d.user||'(blank)'}\tCorrect answer: ${d.answer}`);
  lines.push('', 'SKILL BREAKDOWN');
  for(const [type,stat] of Object.entries(r.typeStats)) lines.push(`${type}: ${stat.correct}/${stat.total}`);
  return lines.join('\n');
}

function openSubmission(){
  $('#submitText').value=submissionReport();
  $('#submitModal').classList.add('show');
}

function setupMarker(){
  const passage=$('#passageContent');
  passage.addEventListener('mouseup',()=>{
    if(!markMode) return;
    const selection=getSelection();
    if(!selection.rangeCount || selection.isCollapsed || !passage.contains(selection.anchorNode)) return;
    const range=selection.getRangeAt(0), span=document.createElement('span');
    span.className='marker';
    try{range.surroundContents(span);selection.removeAllRanges()}catch{}
  });
}

function neighbourLinks(){
  const idx=manifest.findIndex(x=>x.id===passageId);
  const prev=manifest[idx-1], next=manifest[idx+1];
  return {prev,next};
}

function renderApp(){
  seconds=(data.durationMinutes||20)*60;
  document.title=`${data.id} ${data.title} | 共通 Reading`;
  const {prev,next}=neighbourLinks();
  $('#app').innerHTML = `
    <header class="appHeader">
      <a class="brand" href="index.html">共通 <span>Reading</span> <small>${esc(data.id)}</small></a>
      <div class="headRight"><div class="timer" id="timer"></div><button class="btn" id="startPause">Start</button><button class="btn quickBtn" id="fiveMinBtn">5 min</button><button class="btn" id="vocabBtn">Vocabulary</button><button class="btn dark" id="gradeBtn">Grade</button><button class="btn hamburger" id="moreBtn">☰</button></div>
      <div class="moreMenu" id="moreMenu"><button id="twentyMinBtn">20-minute timer</button><button id="fiveMinMenuBtn">5-minute timer</button><button id="submitBtn">Submit report</button><button id="changeNameBtn">Change name</button><button id="clearAnswersBtn">Clear this passage</button></div>
    </header>
    <div class="studentStrip"><span>${esc(studentName||'No name')}</span>${className?`<span>${esc(className)}</span>`:''}<button class="btn smallBtn" id="reviewWrongBtn" hidden>Incorrect only</button></div>
    <main class="readerGrid">
      <section class="pane"><div class="paneHead"><div><b>${esc(data.title)}</b><small>${esc(data.source||'')}</small></div><div class="paneTools"><button class="btn" id="markBtn">Marker</button><button class="btn" id="clearMarksBtn">Clear marks</button></div></div><div class="paneBody"><div class="passageContent" id="passageContent">${data.passageHtml}</div></div><div class="footer"><a href="${prev?`reading.html?id=${encodeURIComponent(prev.id)}`:'index.html'}">${prev?'← '+esc(prev.id):'← Library'}</a><span>${esc(data.range||'')}</span><a href="${next?`reading.html?id=${encodeURIComponent(next.id)}`:'index.html'}">${next?esc(next.code || next.id)+' →':'Library →'}</a></div></section>
      <section class="pane"><div class="paneHead"><div><b>Questions</b><small>1問だけでも「Check Q」で採点できます。</small></div><button class="btn primary" id="gradeBtn2">この大問を採点</button></div><div class="paneBody" id="questionsBody"></div><div class="footer"><span id="answeredCount"></span><button class="btn" id="topBtn">Top ↑</button></div></section>
    </main>
    <div class="modal" id="resultModal"><div class="modalCard"><h2>Result</h2><div id="resultBody"></div><div class="modalActions"><button class="btn primary" id="resultReviewBtn">Review incorrect answers</button><button class="btn" id="resultSubmitBtn">Submission report</button><button class="btn dark closeModal">Close</button></div></div></div>
    <div class="modal" id="vocabModal"><div class="modalCard"><h2>Vocabulary Mission</h2><p class="smallText">先に意味を推測してから答えを確認しよう。</p><div id="vocabBody"></div><button class="btn dark closeModal">Close</button></div></div>
    <div class="modal" id="submitModal"><div class="modalCard"><h2>Submit to Teacher</h2><p class="smallText">コピーしてClassroomやFormsへ貼るか、TXTで保存できます。</p><textarea id="submitText" readonly></textarea><div class="modalActions"><button class="btn primary" id="copySubmitBtn">Copy report</button><button class="btn" id="downloadSubmitBtn">Download TXT</button><button class="btn dark closeModal">Close</button></div></div></div>
    <div class="modal" id="nameModal"><div class="modalCard compact"><h2>Student</h2><input id="studentNameInput" placeholder="Name / 名前" value="${esc(studentName)}"><input id="classNameInput" placeholder="Class / Group（任意）" value="${esc(className)}"><button class="btn primary" id="saveNameBtn">Save</button></div></div>`;
  updateTimer();
  loadSaved();
  renderQuestions();
  setupMarker();

  $('#gradeBtn').onclick=$('#gradeBtn2').onclick=grade;
  $('#startPause').onclick=toggleTimer;
  $('#fiveMinBtn').onclick=()=>setQuickTimer(5);
  $('#fiveMinMenuBtn').onclick=()=>setQuickTimer(5);
  $('#twentyMinBtn').onclick=()=>setQuickTimer(data.durationMinutes||20);
  $('#vocabBtn').onclick=openVocabulary;
  $('#markBtn').onclick=()=>{markMode=!markMode;$('#markBtn').classList.toggle('primary',markMode)};
  $('#clearMarksBtn').onclick=()=>document.querySelectorAll('.marker').forEach(mark=>mark.replaceWith(document.createTextNode(mark.textContent)));
  $('#topBtn').onclick=()=>$('#questionsBody').scrollTo({top:0,behavior:'smooth'});
  $('#moreBtn').onclick=()=>$('#moreMenu').classList.toggle('show');
  $('#submitBtn').onclick=$('#resultSubmitBtn').onclick=openSubmission;
  $('#changeNameBtn').onclick=()=>$('#nameModal').classList.add('show');
  $('#clearAnswersBtn').onclick=()=>{if(confirm('このPassageの解答と結果を削除しますか？')){['answers','flags','eliminated','result','best','vocab'].forEach(k=>localStorage.removeItem(storageKey(k)));location.reload();}};
  $('#reviewWrongBtn').onclick=$('#resultReviewBtn').onclick=()=>{graded=true;wrongOnly=!wrongOnly;renderQuestions();$('#reviewWrongBtn').textContent=wrongOnly?'Show all questions':'Incorrect only';document.querySelectorAll('.modal').forEach(m=>m.classList.remove('show'));};
  $('#copySubmitBtn').onclick=async()=>{await navigator.clipboard.writeText($('#submitText').value);$('#copySubmitBtn').textContent='Copied';};
  $('#downloadSubmitBtn').onclick=()=>{const blob=new Blob([$('#submitText').value],{type:'text/plain;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`COMMON_${passageId}_${studentName||'student'}.txt`;a.click();URL.revokeObjectURL(a.href);};
  $('#saveNameBtn').onclick=()=>{studentName=$('#studentNameInput').value.trim();className=$('#classNameInput').value.trim();localStorage.setItem('common_reading_student_name',studentName);localStorage.setItem('common_reading_class_name',className);location.reload();};
  document.querySelectorAll('.closeModal').forEach(btn=>btn.onclick=()=>btn.closest('.modal').classList.remove('show'));
  document.querySelectorAll('.modal').forEach(modal=>modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('show')}));
  if(!studentName) $('#nameModal').classList.add('show');
}

Promise.all([
  fetch(`data/${encodeURIComponent(passageId)}.json`,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`Passage HTTP ${r.status}`);return r.json()}),
  fetch('data/manifest.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`Manifest HTTP ${r.status}`);return r.json()})
]).then(([passage,items])=>{data=passage;manifest=items;renderApp()}).catch(error=>{
  $('#app').innerHTML=`<div class="errorBox standalone"><b>問題データを読み込めませんでした。</b><p><a href="index.html">ライブラリへ戻る</a></p><small>${esc(error.message)}</small></div>`;
});
