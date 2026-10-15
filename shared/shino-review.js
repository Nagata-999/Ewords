(function(global){
  'use strict';
  const KEY='sushi_shino_pair_review_v1';
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let volatile=false, pairs=[];
  try{const data=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(data))pairs=data.filter(p=>p&&typeof p.prompt==='string'&&typeof p.correct==='string').slice(-100);}catch(e){volatile=true;}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(pairs));}catch(e){volatile=true;}refresh();}
  function remember(prompt,correct){if(!prompt||!correct)return;const found=pairs.find(p=>p.prompt===prompt&&p.correct===correct);if(found)found.recalled=false;else pairs.push({prompt:String(prompt),correct:String(correct),recalled:false});pairs=pairs.slice(-100);save();}
  function refresh(){document.querySelectorAll('[data-shino-review]').forEach(b=>{b.textContent=`間違えた組を復習（${pairs.length}組）`;b.disabled=!pairs.length;});}
  function notes(prompt,correct){return `<p>この組は、ある意味で近い語です。すべての文で置き換えられるとは限りません。例文の意味と文型を確認しましょう。</p>${global.SushiWordNotes?.html(prompt)||''}${global.SushiWordNotes?.get(correct)?global.SushiWordNotes.html(correct):''}<p><a href="learning-guides/synonyms.html">consider・increase・attemptで学ぶ使い分け</a></p>`;}
  let dialog,queue=[],index=0,revealed=false;
  function render(){
    const card=dialog.querySelector('[data-card]');revealed=false;
    if(index>=queue.length){card.innerHTML='<p>今回の復習が終わりました。別の回でもう一度思い出せた組は、復習リストから外れます。日をあけて、例文でも使えるか確かめましょう。</p>';return;}
    const p=queue[index];
    card.innerHTML=`<p>${index+1} / ${queue.length}組・時間制限なし</p><h3 lang="en">${esc(p.prompt)}</h3><p>ゲームで出会った、意味の近い語を声に出してみましょう。ほかにも正しい類義語がある場合があります。</p><button type="button" data-reveal>答えと用法を確認</button><section data-answer hidden><h3 lang="en">${esc(p.correct)}</h3>${notes(p.prompt,p.correct)}<p>答えを見る前に、この語を思い出せましたか？</p><button type="button" data-recalled>思い出せた</button><button type="button" data-again>もう一度練習する</button></section>`;
    card.querySelector('[data-reveal]').onclick=()=>{revealed=true;card.querySelector('[data-answer]').hidden=false;card.querySelector('[data-reveal]').hidden=true;card.querySelector('[data-recalled]').focus();};
    const next=success=>{if(!revealed)return;const saved=pairs.find(x=>x.prompt===p.prompt&&x.correct===p.correct);if(saved){if(success&&saved.recalled)pairs=pairs.filter(x=>x!==saved);else saved.recalled=success;}save();index++;render();dialog.querySelector('[data-card]').focus();};
    card.querySelector('[data-recalled]').onclick=()=>next(true);card.querySelector('[data-again]').onclick=()=>next(false);
  }
  function open(){if(!pairs.length)return;queue=pairs.map(p=>({...p}));index=0;render();dialog.querySelector('[data-storage]').textContent=volatile?'保存できないため、このページを開いている間だけ復習できます。':'このブラウザに最大100組を保存します。共通の単語復習とは別に管理し、スコア・ジェムには加算しません。';dialog.showModal();}
  function init(){dialog=document.createElement('dialog');dialog.className='shino-review-dialog';dialog.setAttribute('aria-labelledby','shinoReviewTitle');dialog.innerHTML='<h2 id="shinoReviewTitle">類義語の組を復習</h2><p data-storage></p><div data-card tabindex="-1"></div><button type="button" data-close>復習を閉じる</button>';document.body.append(dialog);dialog.querySelector('[data-close]').onclick=()=>dialog.close();document.querySelectorAll('[data-shino-review]').forEach(b=>b.addEventListener('click',open));refresh();}
  global.SushiShinoReview=Object.freeze({remember,notes});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(window);
