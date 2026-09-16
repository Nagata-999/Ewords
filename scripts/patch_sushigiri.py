from pathlib import Path

p=Path('sushigiri.html')
s=p.read_text(encoding='utf-8')

# Desktop: do not classify touch-capable PCs as mobile.
s=s.replace('const mobileTypingMode=matchMedia("(pointer: coarse)").matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);','const mobileTypingMode=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && matchMedia("(max-width: 900px)").matches;')
s=s.replace('@media (max-width:900px),(pointer:coarse){html.mobileTyping #game{height:56dvh;min-height:360px}','@media (max-width:900px){html.mobileTyping #game{height:56dvh;min-height:360px}')

# Larger Japanese meaning.
style='''\n<style id="sushiGiriMeaningSize">\n.jp{font-size:clamp(20px,2.1vw,30px)!important;font-weight:800!important;line-height:1.35!important;opacity:.9!important}\n@media(max-width:900px){html.mobileTyping .jp{font-size:clamp(18px,5vw,25px)!important}}\n</style>\n'''
if 'id="sushiGiriMeaningSize"' not in s:
    s=s.replace('</head>',style+'</head>',1)

# Same player name: keep one personal best. Lower/equal scores are silent.
start=s.index('async function saveSlashRanking(){')
end=s.index('\nfunction initRankingResult(){',start)
new='''async function saveSlashRanking(){
  if(rankingSaved)return;
  const input=document.querySelector("#slashPlayerName");
  const st=document.querySelector("#slashRankStatus");
  const btn=document.querySelector("#slashSaveBtn");
  let rawName=(input?.value||"").trim().slice(0,16);
  if(!rawName){
    const ok=window.confirm("名前が未入力です。\\n「名無しすし」でランキング登録しますか？");
    if(!ok){ input?.focus(); return; }
    rawName="名無しすし";
  }
  const name=rawName;
  if(!slashDb)return;
  if(st)st.textContent="";
  if(btn)btn.disabled=true;
  try{
    if(name!=="名無しすし") localStorage.setItem("sushiSlashName",name);
    const {data:rows,error:findError}=await slashDb.from(SLASH_RANK_TABLE).select("score").eq("mode",slashMode()).eq("player_name",name).limit(1);
    if(findError)throw findError;
    const existing=rows?.[0]||null;
    const oldScore=Number(existing?.score||0);
    if(existing && score<=oldScore){if(btn)btn.disabled=false;return;}
    const payload={player_name:name,score:Math.max(0,Math.round(score)),max_combo:Math.max(0,Math.round(maxCombo)),accuracy:100,mode:slashMode()};
    let error;
    if(existing){({error}=await slashDb.from(SLASH_RANK_TABLE).update(payload).eq("mode",slashMode()).eq("player_name",name));}
    else{({error}=await slashDb.from(SLASH_RANK_TABLE).insert(payload));}
    if(error)throw error;
    rankingSaved=true;
    if(st)st.textContent=existing ? "自己ベスト更新！" : "総合ランキングに保存しました！";
    await showSlashRanking();
  }catch(e){console.warn("ranking save",e);if(st)st.textContent="";if(btn)btn.disabled=false;}
}'''
s=s[:start]+new+s[end:]

# Start countdown: gameplay clocks and combo timer begin only after START!.
if 'id="sushiGiriCountdownStyle"' not in s:
    countdown_style='''\n<style id="sushiGiriCountdownStyle">\n#slashCountdown{position:absolute;inset:0;z-index:190;display:none;place-items:center;pointer-events:none;background:rgba(255,255,255,.12);font:1000 clamp(88px,18vw,190px)/1 system-ui,sans-serif;color:#111;text-shadow:0 5px 0 #fff,0 0 28px rgba(255,255,255,.95)}\n#slashCountdown.show{display:grid}\n#slashCountdown.go{font-size:clamp(54px,10vw,110px);color:#e44b2a}\n</style>\n'''
    s=s.replace('</head>',countdown_style+'</head>',1)
if 'id="slashCountdown"' not in s:
    s=s.replace('<div id="game">','<div id="game"><div id="slashCountdown" aria-live="assertive"></div>',1)
old=''' usedWordIndexes.clear();\n startSushiSlashBgm();\n ac().resume();prepareFinishSlash();document.querySelector("#start").classList.add("hidden");\n running=true;paused=false;score=0;combo=0;fever=0;time=30;lastTs=0;kills=0;maxCombo=0;misses=0;typoMisses=0;breaks=0;criticals=0;\n clearComboGrace();newWord();updateHud();requestAnimationFrame(loop);'''
new_start=''' usedWordIndexes.clear();\n ac().resume();prepareFinishSlash();document.querySelector("#start").classList.add("hidden");\n running=false;paused=false;score=0;combo=0;fever=0;time=30;lastTs=0;kills=0;maxCombo=0;misses=0;typoMisses=0;breaks=0;criticals=0;\n clearComboGrace();updateHud();\n const cd=document.querySelector("#slashCountdown");\n cd.classList.add("show");\n for(const n of [3,2,1]){cd.classList.remove("go");cd.textContent=n;tone(440,.08,"square",.035);await new Promise(r=>setTimeout(r,700));}\n cd.textContent="START!";cd.classList.add("go");tone(760,.12,"square",.05);\n startSushiSlashBgm();\n running=true;lastTs=0;newWord();updateHud();requestAnimationFrame(loop);\n setTimeout(()=>{cd.classList.remove("show","go");cd.textContent="";},420);'''
if old in s:
    s=s.replace(old,new_start,1)
elif 'for(const n of [3,2,1])' not in s:
    raise SystemExit('start block not found')

p.write_text(s,encoding='utf-8')
print('patched sushigiri.html')
