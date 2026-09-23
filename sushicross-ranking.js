(function(){
"use strict";
const URL="https://rxyoyveykxdfrpomkltl.supabase.co/rest/v1";
const KEY="sb_publishable_RmWOSxRfsV5YRwCDnKPPAQ_m3VzsUM7";
const MODE="sushi_cross";
function init(storage){
 const dialog=document.querySelector("#rankingDialog"),list=document.querySelector("#rankingRows"),status=document.querySelector("#rankingStatus");
 const form=document.querySelector("#saveRanking"),nameInput=document.querySelector("#playerName"),saveButton=document.querySelector("#saveScore"),saveStatus=document.querySelector("#saveStatus");
 let snapshot=null,requestId=0;
 nameInput.value=storage.get("sushiCrossPlayerName",storage.get("sushitan_player_name",storage.get("speed_vocab_name","")));
 async function request(path,options={}){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{
   const response=await fetch(URL+path,{...options,headers:{apikey:KEY,"Content-Type":"application/json"},signal:controller.signal});
   if(!response.ok)throw new Error("ランキングに接続できませんでした");
   if(options.method==="POST")return null;
   const data=await response.json();if(!Array.isArray(data))throw new Error("ランキングの形式が正しくありません");return data;
  }finally{clearTimeout(timer)}
 }
 async function load(){
  const id=++requestId;status.textContent="読み込み中…";list.replaceChildren();
  try{
   const rows=await request("/scores?select=player_name,score,max_combo,accuracy&mode=eq."+MODE+"&order=score.desc,id.asc&limit=50");
   if(id!==requestId)return;
   status.textContent=rows.length?"通算ランキング・上位50件。同点は同順位です。":"まだ記録がありません。";
   let rank=0,previous=null;
   rows.forEach((row,index)=>{
    if(row.score!==previous)rank=index+1;previous=row.score;
    const tr=document.createElement("tr");
    for(const value of [rank,row.player_name,row.score,row.max_combo]){const td=document.createElement("td");td.textContent=String(value??"");tr.appendChild(td)}
    list.appendChild(tr);
   });
  }catch(_){if(id===requestId)status.textContent="ランキングを取得できませんでした。「更新」で再試行できます。"}
 }
 document.querySelector("#openRanking").addEventListener("click",()=>{dialog.showModal();load()});
 document.querySelector("#closeRanking").addEventListener("click",()=>dialog.close());
 document.querySelector("#refreshRanking").addEventListener("click",load);
 form.addEventListener("submit",event=>event.preventDefault());
 SushiPlayer.bind(nameInput);
 return {
  isOpen:()=>dialog.open,
  reset(){snapshot=null;form.hidden=true;saveStatus.textContent=""},
  present(result){
   snapshot={...result};form.hidden=false;
   SushiScores.save({p_score:snapshot.score,p_max_combo:snapshot.stage,p_accuracy:snapshot.accuracy,p_mode:MODE},{status:saveStatus});
  }
 };
}
window.SushiCrossRanking={init};
})();
