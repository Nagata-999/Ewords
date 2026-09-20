/* Uses the site's existing scores/save_high_score contract. No schema changes. */
(()=>{
 'use strict';
 const URL='https://rxyoyveykxdfrpomkltl.supabase.co/rest/v1/';
 const KEY='sb_publishable_RmWOSxRfsV5YRwCDnKPPAQ_m3VzsUM7';
 const MODE='sushi_cross';
 const $=id=>document.getElementById(id);
 let result=null,requestId=0;
 const form=$('crossSaveForm'),name=$('crossPlayerName'),save=$('crossSave'),status=$('crossSaveStatus');
 const dialog=$('crossRankingDialog'),rows=$('crossRankingRows'),rankStatus=$('crossRankingStatus');
 try{name.value=localStorage.getItem('sushiCrossPlayerName')||'';}catch{}
 async function request(path,body){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
  try{
   const response=await fetch(URL+path,{method:body?'POST':'GET',headers:{apikey:KEY,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:controller.signal,cache:'no-store'});
   if(!response.ok)throw Error('ranking request failed');
   return body?null:await response.json();
  }finally{clearTimeout(timer);}
 }
 async function loadRanking(){
  const token=++requestId;rankStatus.textContent='読み込み中…';rows.replaceChildren();
  try{
   const data=await request('scores?select=player_name,score,max_combo,accuracy&mode=eq.'+MODE+'&order=score.desc,max_combo.desc,accuracy.desc,player_name.asc&limit=50');
   if(token!==requestId)return;
   if(!Array.isArray(data))throw Error('invalid ranking');
   for(const [i,row] of data.entries()){
    const tr=document.createElement('tr');
    for(const value of [i+1,row.player_name,Number(row.score).toLocaleString(),Number(row.accuracy)+'%']){const td=document.createElement('td');td.textContent=String(value??'');tr.appendChild(td);}
    rows.appendChild(tr);
   }
   rankStatus.textContent=data.length?'上位50名・同じ名前の最高スコア':'まだ記録がありません。最初の記録を登録しよう！';
  }catch{if(token===requestId)rankStatus.textContent='ランキングを取得できませんでした。「再読み込み」でやり直せます。';}
 }
 function present(record){
  result=record?{...record,saving:false,saved:false}:null;
  form.hidden=!result;status.textContent='';save.disabled=!result||result.score<=0;name.disabled=false;
  if(result&&result.score<=0)status.textContent='1点以上でランキングに登録できます。';
 }
 form.addEventListener('submit',async event=>{
  event.preventDefault();const snapshot=result;
  if(!snapshot||snapshot.saving||snapshot.saved||snapshot.score<=0)return;
  const playerName=name.value.normalize('NFKC').trim().replace(/\s+/g,' ').slice(0,20);
  if(!playerName){status.textContent='名前を入力してください。';name.focus();return;}
  snapshot.saving=true;save.disabled=true;name.disabled=true;status.textContent='保存中…';
  try{
   await request('rpc/save_high_score',{p_player_name:playerName,p_score:snapshot.score,p_max_combo:snapshot.maxCombo,p_accuracy:snapshot.accuracy,p_mode:MODE});
   snapshot.saved=true;try{localStorage.setItem('sushiCrossPlayerName',playerName);}catch{}
   if(result===snapshot){status.textContent='送信しました。最高スコアを更新した場合にランキングへ反映されます。';name.value=playerName;}
   if(dialog.open)loadRanking();
  }catch{if(result===snapshot)status.textContent='保存できませんでした。通信を確認して、もう一度登録してください。';}
  finally{snapshot.saving=false;if(result===snapshot){save.disabled=snapshot.saved;name.disabled=snapshot.saved;}}
 });
 $('crossShowRanking').addEventListener('click',()=>{dialog.showModal();loadRanking();});
 $('crossCloseRanking').addEventListener('click',()=>dialog.close());
 $('crossReloadRanking').addEventListener('click',loadRanking);
 dialog.addEventListener('close',()=>{requestId++;});
 window.SushiCrossRanking=Object.freeze({setResult:present});
})();
