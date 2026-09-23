/* Shared dictionary adapter for Sushi Cross. */
(function(root){
"use strict";
const PATH="./data/words_master_v2_reviewed.json";
const key=value=>String(value??"").normalize("NFKC").trim().toLowerCase();
const meaningKey=value=>key(value).replace(/[～~\s]/g,"");
function shortMeaning(value){return String(value).replace(/（[^）]*）|\([^)]*\)/g,"").split(/[、，,；;]/)[0].trim()||String(value).trim()}
function normalize(master){
 if(!Array.isArray(master))throw new Error("単語データの形式が正しくありません");
 const seen=new Set(),words=[];
 for(const row of master){
  if(typeof row?.en!=="string"||typeof row?.jp!=="string")continue;
  const en=row.en.trim(),jp=row.jp.trim(),id=key(en);
  if(!id||!jp||seen.has(id))continue;
  seen.add(id);
  words.push({en,jp,label:shortMeaning(jp),id,synonyms:new Set((Array.isArray(row.synonyms)?row.synonyms:[]).map(key)),meanings:new Set(jp.replace(/（[^）]*）|\([^)]*\)/g,"").split(/[、，,；;／/]/).map(meaningKey).filter(Boolean))});
 }
 if(words.length<3)throw new Error("出題できる単語が不足しています");
 return words;
}
function shuffle(items,rng=Math.random){
 const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out;
}
function compatible(a,b){
 if(a.id===b.id||a.synonyms.has(b.id)||b.synonyms.has(a.id)||meaningKey(a.label)===meaningKey(b.label))return false;
 for(const m of a.meanings)for(const n of b.meanings)if(m===n||(Math.min(m.length,n.length)>=3&&(m.includes(n)||n.includes(m))))return false;
 return true;
}
function choices(word,words,rng=Math.random){
 const selected=[word];
 for(const candidate of shuffle(words,rng)){
  if(selected.every(other=>compatible(other,candidate)))selected.push(candidate);
  if(selected.length===3)break;
 }
 if(selected.length!==3)throw new Error("選択肢を作成できませんでした");
 return shuffle(selected.map(w=>({text:w.label,fullText:w.jp,correct:w.id===word.id})),rng);
}
function createDeck(words,rng=Math.random){
 let remaining=[],last="";
 return {next(){
  if(!remaining.length){remaining=shuffle(words,rng);if(remaining.length>1&&remaining[remaining.length-1].id===last)[remaining[0],remaining[remaining.length-1]]=[remaining[remaining.length-1],remaining[0]]}
  const word=remaining.pop();last=word.id;return word;
 }};
}
async function load(fetcher=fetch){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try{const response=await fetcher(PATH,{signal:controller.signal});if(!response.ok)throw new Error("単語データの取得に失敗しました");return normalize(await response.json())}finally{clearTimeout(timer)}
}
const api={PATH,normalize,shortMeaning,shuffle,compatible,choices,createDeck,load};
if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.SushiCrossWords=api;
})(typeof window!=="undefined"?window:globalThis);
