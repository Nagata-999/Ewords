'use strict';
/* Hand-authored bilingual lines inspired by Sushi TALK's polite/friendly
 * replies. No network, speech service, or generated-chat cost. */
(function(root,factory){
  const api=factory(root);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.SushiAvatarPersonality=api;
})(typeof window==='undefined'?null:window,function(root){
  const line=(en,ja)=>({en,ja});
  const lines={
    serious:{
      morning:[line('Good morning. Let’s learn something new.','おはようございます。今日も一つずつ学びましょう。'),line('A little practice is a good start.','少しの練習で、一日を始めましょう。')],
      day:[line('Welcome back. Take your time.','おかえりなさい。自分のペースで進めましょう。'),line('I’m here to support you.','今日の学習も応援しています。')],
      night:[line('Good evening. One step at a time.','こんばんは。一歩ずつ進めましょう。'),line('Please take a break when you need one.','疲れたら、休憩も大切にしてください。')],
      late:[line('Still studying? Please get some rest, too.','こんな時間まで学習中ですか。休息も大切に。')],
      idle:[line('Practice makes perfect.','練習を重ねることが、上達につながります。'),line('A little every day goes a long way.','毎日の少しずつが、大きな力になります。'),line('Let’s review one word.','単語を一つ、復習してみましょう。'),line('Take your time.','焦らず、自分のペースで大丈夫です。'),line('Mistakes help us learn.','間違いも、学ぶための大切な一歩です。'),line('I’ll be here when you’re ready.','準備ができたら、一緒に始めましょう。')],
      correct:[line('Well done. Keep it up.','よくできました。その調子です。'),line('Your practice is paying off.','練習の成果が出ていますね。')],
      wrong:[line('No worries. Let’s try again.','大丈夫です。もう一度、確認しましょう。'),line('You can learn from this.','この間違いから、また一つ学べます。')],
      combo:[line('Excellent focus!','素晴らしい集中力です！')]
    },
    casual:{
      morning:[line('Morning! Ready to roll?','おはよ！今日もゆるっといこう。'),line('Let’s start with one word!','まずは一単語、やってみよ！')],
      day:[line('Hey, welcome back!','やっほー、おかえり！'),line('Sounds good. Let’s do it!','いいね、今日もちょっとやろう！')],
      night:[line('Hey! Still got some energy?','やっほ！まだ元気残ってる？'),line('One more word, then a break?','あと一単語やったら、ひと休みしよっか。')],
      late:[line('Up this late? Don’t forget to rest!','まだ起きてるの？ちゃんと休んでね！')],
      idle:[line('You got this!','君ならいけるって！'),line('No worries. We’ll figure it out.','だいじょぶ、なんとかなるよ。'),line('One word at a time. Let’s go!','一単語ずつ。いこいこ！'),line('Practice makes perfect!','コツコツやれば、うまくなる！'),line('A quick break sounds good.','ちょっと休憩するのもいいね。'),line('I’m down for another round.','もう一回？いいね、のった！')],
      correct:[line('Nice! You did great!','いいね！よくできたじゃん！'),line('That’s awesome!','最高じゃん！その調子！')],
      wrong:[line('No worries. You got this!','ドンマイ！次はいけるよ！'),line('I feel you. Let’s try again.','わかる、それ難しいよね。もう一回いこ！')],
      combo:[line('You’re on fire!','ノってるね！すごいじゃん！')]
    }
  };
  function normalize(value){return value?.kind==='casual'||value==='casual'?'casual':'serious';}
  function merge(a,b){const valid=v=>v&&['serious','casual'].includes(v.kind)&&Number.isSafeInteger(v.updatedAt)&&v.updatedAt>=0;return valid(b)&&(!valid(a)||(b.updatedAt>a.updatedAt||(b.updatedAt===a.updatedAt&&b.kind>a.kind)))?b:valid(a)?a:{kind:'serious',updatedAt:0};}
  function choose(personality,event='greeting',hour=12,index=0){
    const key=event==='greeting'?hour<5?'late':hour<11?'morning':hour<18?'day':'night':event;
    const pool=lines[normalize(personality)][key]||lines[normalize(personality)].idle;
    return pool[((Math.floor(index)%pool.length)+pool.length)%pool.length];
  }
  function read(){try{return normalize(JSON.parse(root.localStorage.getItem('sushitan_login_bonus_v1')||'{}').avatarPersonality);}catch{return 'serious';}}
  function mount(host,{anchor=host,bubble=null,getPersonality=read,isHidden=()=>host.hidden,auto=true,contain=false}={}){
    if(!root)return null;
    if(!root.document.getElementById('avatarSpeechStyle')){
      const style=root.document.createElement('style');style.id='avatarSpeechStyle';
      style.textContent='.avatar-speech{position:absolute;bottom:calc(100% + 4px);width:max-content;max-width:min(260px,calc(100vw - 24px));box-sizing:border-box;padding:10px 13px;border:1px solid #dccdbd;border-radius:15px 15px 15px 4px;background:#fffdf7;color:#45382f;box-shadow:0 5px 16px #3e332e18;text-align:left;font:700 13px/1.5 system-ui;pointer-events:none;z-index:3;white-space:normal}.avatar-speech[hidden]{display:none!important}.avatar-speech strong,.avatar-speech small{display:block}.avatar-speech small{margin-top:3px;font-weight:500;font-size:12px;color:#746658}';
      root.document.head.append(style);
    }
    const created=!bubble;if(created){bubble=root.document.createElement('div');host.append(bubble);}
    bubble.classList.add('avatar-speech');bubble.dataset.avatarSpeech='true';bubble.setAttribute('role','status');bubble.setAttribute('aria-live','polite');bubble.hidden=true;
    let timer=null,idleTimer=null,lastSpoken=0,destroyed=false;
    const counts={};
    function position(){
      if(bubble.hidden)return;
      const h=host.getBoundingClientRect(),a=anchor.getBoundingClientRect();
      const width=bubble.getBoundingClientRect().width;
      const viewportLeft=contain?Math.max(h.left,Math.min(h.right-width,a.left-12)):Math.max(12,Math.min(root.innerWidth-width-12,a.left-12));
      bubble.style.left=(viewportLeft-h.left)+'px';bubble.style.right='auto';
    }
    function hide(){clearTimeout(timer);bubble.hidden=true;}
    function say(event='greeting',suffix=''){
      if(destroyed||root.document.hidden||isHidden())return null;
      const hour=new Date(Date.now()+9*3600000).getUTCHours();
      const message=choose(getPersonality(),event,hour,counts[event]||0);counts[event]=(counts[event]||0)+1;
      const en=root.document.createElement('strong'),ja=root.document.createElement('small');en.textContent=message.en+(suffix?' '+suffix:'');ja.textContent=message.ja;
      bubble.replaceChildren(en,ja);bubble.hidden=false;position();lastSpoken=Date.now();clearTimeout(timer);timer=root.setTimeout(hide,6500);return message;
    }
    const visibility=()=>{if(root.document.hidden)hide();else if(auto&&Date.now()-lastSpoken>600000)say();};
    root.document.addEventListener('visibilitychange',visibility);
    root.addEventListener('resize',position);
    if(auto){say();idleTimer=root.setInterval(()=>{if(Date.now()-lastSpoken>=40000)say('idle');},45000);}
    return {say,hide,position,bubble,destroy(){destroyed=true;hide();root.clearInterval(idleTimer);root.document.removeEventListener('visibilitychange',visibility);root.removeEventListener('resize',position);if(created)bubble.remove();}};
  }
  return {lines,normalize,merge,choose,read,mount};
});
