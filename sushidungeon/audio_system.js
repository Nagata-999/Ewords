'use strict';
(function(){
  const KEY='sushiDungeonAudioV1';
  let config={enabled:true,bgmVolume:0.34,seVolume:0.65};
  try{config={...config,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{}
  let bgm=null;
  let started=false;

  function save(){
    try{localStorage.setItem(KEY,JSON.stringify(config))}catch{}
  }

  function ensureBgm(){
    if(bgm)return bgm;
    bgm=new Audio('Under_The_Cold_Stone.mp3');
    bgm.loop=true;
    bgm.preload='auto';
    bgm.volume=config.enabled?config.bgmVolume:0;
    bgm.addEventListener('error',()=>{
      const button=document.getElementById('audioToggle');
      if(button)button.title='BGMファイルが見つかりません';
    });
    return bgm;
  }

  function updateUi(){
    const button=document.getElementById('audioToggle');
    if(button)button.textContent=config.enabled?'🔊':'🔇';
    if(bgm)bgm.volume=config.enabled?config.bgmVolume:0;
  }

  function startBgm(){
    const audio=ensureBgm();
    if(!config.enabled||started)return;
    audio.play().then(()=>{started=true;updateUi()}).catch(()=>{});
  }

  function toggleAudio(){
    config.enabled=!config.enabled;
    save();
    if(config.enabled){
      startBgm();
    }else if(bgm){
      bgm.pause();
      started=false;
    }
    updateUi();
  }

  function buildUi(){
    if(document.getElementById('audioDock'))return;
    const dock=document.createElement('div');
    dock.id='audioDock';
    dock.className='audioDock';
    dock.innerHTML='<button id="audioToggle" type="button" aria-label="音声のオンオフ">🔊</button><label>♪<input id="bgmVolume" type="range" min="0" max="1" step="0.05"></label><label>⚔<input id="seVolume" type="range" min="0" max="1" step="0.05"></label>';
    document.body.append(dock);
    const bgmSlider=dock.querySelector('#bgmVolume');
    const seSlider=dock.querySelector('#seVolume');
    bgmSlider.value=config.bgmVolume;
    seSlider.value=config.seVolume;
    dock.querySelector('#audioToggle').onclick=toggleAudio;
    bgmSlider.oninput=()=>{config.bgmVolume=Number(bgmSlider.value);save();updateUi()};
    seSlider.oninput=()=>{config.seVolume=Number(seSlider.value);save()};
    updateUi();
  }

  function unlock(){
    startBgm();
    window.removeEventListener('pointerdown',unlock,true);
    window.removeEventListener('keydown',unlock,true);
  }

  window.addEventListener('DOMContentLoaded',buildUi);
  window.addEventListener('pointerdown',unlock,true);
  window.addEventListener('keydown',unlock,true);
  window.sushiAudio={startBgm,toggleAudio,getConfig:()=>({...config})};
})();
