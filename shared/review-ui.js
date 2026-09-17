(function(global){
 'use strict';
 const learning=global.SushiLearning;if(!learning)return;
 const requested=new URLSearchParams(location.search).get('review')==='weak';
 let selected=requested,active=false;
 const words=()=>learning.getReviewWords();
 global.SushiReview={get active(){return active;},get selected(){return selected;},
   begin(){active=selected;if(active&&!words().length){alert('苦手単語はまだありません。通常モードで学習すると記録されます。');return false;}return true;},
   words,record:(word,correct,game)=>learning.recordAnswer(learning.resolveWordId(word),correct,game)};
 const style=document.createElement('style');style.textContent=`.shared-review-option{display:block;margin:12px 0;padding:9px 12px;border:1px solid #8295a966;border-radius:10px;font-size:14px;line-height:1.6;color:inherit;background:#8295a914}.shared-review-option input{width:auto!important;margin-right:8px;accent-color:#179479}.shared-learning-status{font-size:12px;line-height:1.5;color:#b77919;margin:6px}.shared-learning-home{padding:16px;border:1px solid #8295a966;border-radius:16px;margin:16px 0}.shared-learning-home summary{cursor:pointer;font-weight:700}.shared-learning-home a{display:inline-block;padding:8px 12px;margin:4px;border:1px solid #8295a966;border-radius:10px;color:inherit}`;document.head.appendChild(style);
 const countsStyle=document.createElement('style');countsStyle.textContent='.learning-counts{display:flex;flex-wrap:wrap;gap:6px 18px}.learning-counts span{white-space:nowrap}';document.head.appendChild(countsStyle);
 function mount(){
  const file=location.pathname.split('/').pop();
  const selectors={'sushi_run.html':'#startBtn','sushi-run3D.html':'#menu #start','sushigiri.html':'#startBtn','sushiflow.html':'#startBtn','SushiFlow.html':'#startBtn'};
  const button=document.querySelector(selectors[file]||'#__not_present');
  if(button&&!button.parentElement.querySelector('.shared-review-option')){
   const label=document.createElement('label');label.className='shared-review-option';
   const input=document.createElement('input');input.type='checkbox';input.checked=selected;
   input.addEventListener('change',()=>{selected=input.checked;const url=new URL(location.href);if(selected)url.searchParams.set('review','weak');else url.searchParams.delete('review');history.replaceState(null,'',url);});
   label.append(input,document.createTextNode('苦手復習（全ゲーム共通）'));button.before(label);
  }
  const message=learning.getStorageStatus().message;
  if(message){let box=document.querySelector('.shared-learning-status');if(!box){box=document.createElement('p');box.className='shared-learning-status';box.setAttribute('role','status');(document.querySelector('main')||document.body).appendChild(box);}if(box.textContent!==message)box.textContent=message;}
 }
 document.addEventListener('DOMContentLoaded',()=>{mount();new MutationObserver(mount).observe(document.body,{childList:true,subtree:true});});
 global.addEventListener('sushi-learning-storage',mount);
})(window);
