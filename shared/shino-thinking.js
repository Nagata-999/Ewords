/* Contextual comparison mode. Shared achievement/daily hooks; no separate reward or storage. */
(function(global){
'use strict';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function validate(data){
 if(data?.version!==1||!Array.isArray(data.questions)||data.questions.length<3)throw Error('Invalid question bank');
 const ids=new Set();
 for(const q of data.questions){
  if(!q||typeof q.id!=='string'||!/^[a-z-]+$/.test(q.id)||ids.has(q.id))throw Error('Invalid ID');ids.add(q.id);
  for(const k of ['question','explanation','reflection','category'])if(typeof q[k]!=='string'||!q[k].trim())throw Error('Missing '+k);
  if(![1,2,3].includes(q.difficulty)||q.choices?.length!==2||new Set(q.choices).size!==2||!q.choices.includes(q.answer))throw Error('Invalid answer');
  if(q.words?.length!==2||q.examples?.length!==2)throw Error('Missing comparison');
  for(const w of q.choices)if(typeof w!=='string'||!q.words.some(x=>x.word===w&&typeof x.meaning==='string'&&x.meaning.trim())||!q.examples.some(x=>x.word===w&&typeof x.en==='string'&&x.en.trim()&&typeof x.ja==='string'&&x.ja.trim()))throw Error('Missing example');
 }
 return data.questions;
}
function shuffled(items){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function session(questions,review=false){
 let index=0,answered=false,correct=0;const wrong=[];
 return {questions,review,get index(){return index;},get done(){return index>=questions.length;},get score(){return correct;},get wrong(){return [...wrong];},
 answer(choice){const q=questions[index];if(!q||answered||!q.choices.includes(choice))return null;answered=true;const ok=choice===q.answer;if(ok)correct++;else wrong.push(q);return {q,correct:ok,review};},
 next(){if(!answered)return false;index++;answered=false;return true;}
 };
}
global.SushiShinoThinkingCore=Object.freeze({validate,session,shuffled});
function init(){
 const opener=document.getElementById('shinoThinkingStart');if(!opener)return;
 const dialog=document.createElement('dialog');dialog.className='shino-thinking';dialog.setAttribute('aria-labelledby','thinkingTitle');
 dialog.innerHTML='<header><p class="thinking-kicker">しの単のサブコーナー</p><h2 id="thinkingTitle">シノニムの微妙な違い</h2><button type="button" data-close>学習を閉じる</button></header><div data-content tabindex="-1"></div>';
 document.body.append(dialog);
 const content=dialog.querySelector('[data-content]');let bank=null,round=null,loading=false,run=0,serial=0;
 const sessionId=global.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
 const stop=()=>global.speechSynthesis?.cancel();
 dialog.querySelector('[data-close]').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{stop();opener.focus();});
 dialog.addEventListener('cancel',stop);
 function focusTop(){content.focus();dialog.scrollTop=0;}
 function launch(list,review=false){stop();round=session(list,review);run++;render();}
 async function load(article=false){
  if(loading)return;loading=true;content.innerHTML='<p role="status">問題を読み込んでいます。</p>';
  try{
   if(!bank){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);try{const r=await fetch('/data/shino-thinking.json?v=20261016-1',{signal:controller.signal});if(!r.ok)throw Error('HTTP');bank=validate(await r.json());}finally{clearTimeout(timer);}}
   if(article)launch(bank.filter(q=>['loneliness-solitude','equality-equity','efficiency-effectiveness'].includes(q.id)));
   else menu();
  }catch(e){content.innerHTML='<p role="alert">問題を読み込めませんでした。通信を確認して、もう一度お試しください。</p><button type="button" data-retry>読み込みを再試行</button>';content.querySelector('[data-retry]').onclick=()=>load(article);}
  finally{loading=false;}
 }
 function menu(){
  stop();content.innerHTML='<p>似た言葉や関連する概念を比べます。場面に合う語を選び、解説と例文を読んで、自分の経験を振り返りましょう。時間制限はありません。</p><p>問いには一つの正解はありません。単語の使い分けを確認した後は、あなた自身の考えを大切にしてください。</p><div class="thinking-actions"><button type="button" data-short>5問で学ぶ</button><button type="button" data-article>記事の3組を学ぶ</button><button type="button" data-all>全'+bank.length+'組を学ぶ</button></div><p>回答は共通の学習実績に記録します。初回の正解は対象日のデイリーにも反映します。間違えた問題はこの回の最後に復習できます。途中経過はページを閉じると終了します。</p><p><a href="/english-thinking">記事「英語は思考の筋トレである」を読む</a></p>';
  content.querySelector('[data-short]').onclick=()=>launch(shuffled(bank).slice(0,5));
  content.querySelector('[data-article]').onclick=()=>launch(bank.filter(q=>['loneliness-solitude','equality-equity','efficiency-effectiveness'].includes(q.id)));
  content.querySelector('[data-all]').onclick=()=>launch(shuffled(bank));
  focusTop();
 }
 function render(){
  stop();
  if(round.done){finish();return;}
  const q=round.questions[round.index];
  content.innerHTML='<p class="thinking-progress">'+(round.review?'今回の復習 · ':'')+(round.index+1)+' / '+round.questions.length+'問 · '+esc(q.category)+' · 難易度 '+q.difficulty+'/3</p><h3 class="thinking-question">'+esc(q.question)+'</h3><p>この場面で、よりふさわしい語を選んでください。</p><div class="thinking-choices">'+shuffled(q.choices).map(w=>'<button type="button" lang="en" data-choice="'+esc(w)+'">'+esc(w)+'</button>').join('')+'</div><div data-feedback></div>';
  content.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>answer(b.dataset.choice));
  focusTop();
 }
 function answer(choice){
  const result=round.answer(choice);if(!result)return;
  const {q,correct,review}=result;
  content.querySelectorAll('[data-choice]').forEach(b=>{b.disabled=true;b.classList.toggle('thinking-selected',b.dataset.choice===choice);});
  // Native answer hook is also used by the timed mode; review flag stays in the shared ledger.
  try{global.SushiAchievementEvents?.answer('shinotan','thinking:'+q.id,correct,{review});}catch{}
  if(correct&&!review)global.dispatchEvent(new CustomEvent('sushi-shino-thinking-correct',{detail:{id:sessionId+':'+run+':'+(++serial)}}));
  const feedback=content.querySelector('[data-feedback]');
  feedback.innerHTML='<p class="thinking-result" role="status" tabindex="-1">'+(correct?'正解です。':'今回は '+esc(q.answer)+' が適しています。')+'</p><h3>二つの言葉の違い</h3><div class="thinking-comparison">'+q.words.map(w=>'<section><h4 lang="en">'+esc(w.word)+'</h4><p>'+esc(w.meaning)+'</p></section>').join('')+'</div><p>'+esc(q.explanation)+'</p><h3>例文で確かめましょう</h3>'+q.examples.map((ex,i)=>'<section class="thinking-example"><p lang="en">'+esc(ex.en)+'</p><p>'+esc(ex.ja)+'</p>'+('speechSynthesis'in global&&'SpeechSynthesisUtterance'in global?'<button type="button" data-speak="'+i+'" aria-label="'+esc(ex.word)+' の例文を読み上げる">例文を聞く</button>':'')+'</section>').join('')+'<p data-audio-status role="status"></p><aside class="thinking-reflection"><h3>少し、考えてみませんか</h3><p>'+esc(q.reflection)+'</p><p class="thinking-hint">答えを入力する必要はありません。身近な出来事を一つ思い浮かべてみてください。</p></aside><button type="button" class="thinking-next" data-next>'+(round.index===round.questions.length-1?'学習を振り返る':'次の問題へ')+'</button>';
  feedback.querySelectorAll('[data-speak]').forEach(b=>b.onclick=()=>{
   stop();const utterance=new SpeechSynthesisUtterance(q.examples[Number(b.dataset.speak)].en);utterance.lang='en-US';utterance.rate=.85;
   const status=feedback.querySelector('[data-audio-status]');status.textContent='読み上げています。';
   utterance.onend=()=>{status.textContent='読み上げが終わりました。';};
   utterance.onerror=()=>{status.textContent='この端末では音声を再生できませんでした。英文を見ながら声に出してみましょう。';};
   global.speechSynthesis.speak(utterance);
  });
  feedback.querySelector('[data-next]').onclick=()=>{if(round.next())render();};
  feedback.querySelector('[role="status"]').focus();
 }
 function finish(){
  const wrong=round.wrong;
  content.innerHTML='<h3>今回の学習を振り返りましょう</h3><p>'+round.questions.length+'問中 '+round.score+'問正解しました。</p><p>点数だけでなく、言葉を選ぶ理由を説明できるか確かめてみましょう。</p><ul>'+round.questions.map(q=>'<li><span lang="en">'+esc(q.choices.join(' / '))+'</span></li>').join('')+'</ul><p class="thinking-reflection">今日の言葉で、見方が少し変わった出来事はありましたか。</p><div class="thinking-actions">'+(wrong.length?'<button type="button" data-review>間違えた'+wrong.length+'組を復習する</button>':'')+'<button type="button" data-menu>別の組を学ぶ</button></div><p><a href="/english-thinking">記事を読み、考えを深める</a></p><p>時間制限のない学習結果はしの単のランキングには加算しません。復習はデイリーへ重複加算しません。</p>';
  if(wrong.length)content.querySelector('[data-review]').onclick=()=>launch(wrong,true);
  content.querySelector('[data-menu]').onclick=menu;focusTop();
 }
 function open(article=false){if(!dialog.open)dialog.showModal();load(article);}
 opener.addEventListener('click',()=>open());
 if(new URLSearchParams(global.location.search).get('practice')==='article')open(true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(window);
