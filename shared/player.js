(function(){
'use strict';
if(window.SushiPlayer)return;
const KEY='sushitan_shared_player_name_v1';
const LEGACY=['sushitan_player_name','speed_vocab_name','sushiCrossPlayerName','sushiIdiomName','sushidungeon_player_name_v1','sushiSlashName','sushi_run_3d_name','sushi_parts_player_name','player_name','playerName'];
const normalize=value=>Array.from(String(value??'').normalize('NFKC').trim().replace(/\s+/g,' ')).slice(0,20).join('');
const placeholder=value=>/^(?:no\s*name|anonymous|guest|名無し(?:すし)?|未設定)$/i.test(value);
function read(key){try{return localStorage.getItem(key)}catch(_){return null}}
function write(key,value){try{localStorage.setItem(key,value);return true}catch(_){return false}}
function randomName(){const bytes=new Uint32Array(2);try{crypto.getRandomValues(bytes)}catch(_){bytes[0]=Math.floor(Math.random()*1e9);bytes[1]=Math.floor(Math.random()*1e9)}return '名無し'+Array.from(bytes,n=>String(n%1000000).padStart(6,'0')).join('')}
function legacyLocalName(){
 const rows=[];for(const key of ['sushikobutanRankingV2','sushi_run_3d_ranks'])try{const data=JSON.parse(read(key)||'[]');if(Array.isArray(data))rows.push(...data)}catch(_){}
 return rows.sort((a,b)=>(Number(new Date(b.created_at))||0)-(Number(new Date(a.created_at))||0)).map(row=>normalize(row.player_name)).find(n=>n&&!placeholder(n));
}
let name=normalize(read(KEY));
if(!name)name=LEGACY.map(k=>normalize(read(k))).find(n=>n&&!placeholder(n))||legacyLocalName()||randomName();
function preserveParts(next){
 try{
  const old=read('sushi_parts_player_name'),raw=read('sushi_parts_rogue_state_v2'),run=raw?JSON.parse(raw):null;
  const sources=[old,run?.player].filter(n=>n&&n!==next);
  for(const source of sources){
   const words=JSON.parse(read('sushi_parts_words_'+source)||'[]');
   if(Array.isArray(words)&&words.length){const current=JSON.parse(read('sushi_parts_words_'+next)||'[]');write('sushi_parts_words_'+next,JSON.stringify([...new Set([...(Array.isArray(current)?current:[]),...words])]))}
  }
  if(run&&sources.includes(run.player)){run.player=next;write('sushi_parts_rogue_state_v2',JSON.stringify(run))}
 }catch(_){/* Keep the original save if an older format cannot be read. */}
}
function persist(){preserveParts(name);write(KEY,name);for(const key of LEGACY)write(key,name)}
function getName(){const stored=normalize(read(KEY));if(stored)name=stored;return name}
function render(){
 document.querySelectorAll('[data-sushi-name]').forEach(input=>{if(input!==document.activeElement)input.value=getName()});
 document.querySelectorAll('[data-sushi-player-label]').forEach(el=>el.textContent=getName());
}
function setName(value){const next=normalize(value);if(!next)return getName();name=next;persist();render();window.dispatchEvent(new CustomEvent('sushi-player-change',{detail:{name}}));return name}
function bind(input){
 if(!input||input.dataset.sushiNameBound)return;
 input.dataset.sushiNameBound='true';input.setAttribute('data-sushi-name','');input.maxLength=20;input.value=getName();
 input.addEventListener('change',()=>{input.value=setName(input.value)});
 input.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Enter'){event.preventDefault();input.value=setName(input.value);input.blur()}});
}
function mount(parent){
 if(!parent||parent.querySelector('[data-sushi-player-widget]'))return;
 const details=document.createElement('details');details.dataset.sushiPlayerWidget='';details.className='sushi-player-profile';
 const summary=document.createElement('summary');summary.append('名前：');const label=document.createElement('span');label.dataset.sushiPlayerLabel='';label.textContent=getName();summary.append(label);
 const field=document.createElement('label');field.textContent='全ゲーム共通の名前 ';const input=document.createElement('input');input.setAttribute('aria-label','全ゲーム共通の名前');input.autocomplete='nickname';field.append(input);
 const note=document.createElement('small');note.textContent='名前はこのブラウザで共通です。ランキング対応モードの結果は自動保存されます。';
 details.append(summary,field,note);parent.append(details);bind(input);
}
function scan(){document.querySelectorAll('[data-sushi-player]').forEach(mount);document.querySelectorAll('[data-sushi-name]').forEach(bind)}
function start(){
 const style=document.createElement('style');style.textContent='[data-auto-score-button]{display:none!important}.sushi-player-profile{box-sizing:border-box;max-width:520px;margin:12px auto;padding:9px 12px;border:1px solid #8885;border-radius:10px;font:13px/1.6 system-ui;text-align:left;color:inherit;touch-action:pan-y}.sushi-player-profile summary{cursor:pointer;overflow-wrap:anywhere}.sushi-player-profile label{display:block;margin-top:8px}.sushi-player-profile input{box-sizing:border-box;width:100%;padding:8px;border:1px solid #aaa;border-radius:7px;font:16px system-ui;background:#fff;color:#18232d}.sushi-player-profile small{display:block;margin-top:7px;opacity:.8}';document.head.appendChild(style);
 scan();new MutationObserver(records=>{if(records.some(record=>[...record.addedNodes].some(node=>node.nodeType===1&&(node.matches('[data-sushi-player],[data-sushi-name]')||node.querySelector('[data-sushi-player],[data-sushi-name]')))))scan()}).observe(document.body,{childList:true,subtree:true});
}
persist();window.SushiPlayer={getName,setName,bind,mount,normalize};
window.addEventListener('storage',event=>{if(event.key===KEY){getName();render();window.dispatchEvent(new CustomEvent('sushi-player-change',{detail:{name}}))}});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
