'use strict';
(() => {
  if (window.__sushiAvatarWidgetLoaded) return;
  window.__sushiAvatarWidgetLoaded = true;
  const LEDGER='sushitan_login_bonus_v1';
  const ROOT='sushigacha/';
  let lastCombo=0,reactionTimer=null;

  function load(src){
    return new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
    });
  }

  function savedAvatar(){
    try{
      const raw=localStorage.getItem(LEDGER);
      const ledger=raw?JSON.parse(raw):{};
      const old=ledger?.gacha?.avatar||{};
      const a={...DEFAULT_AVATAR,...old};
      if(old.outfit&&!old.top)a.top=old.outfit;
      delete a.outfit;
      return a;
    }catch(_e){return {...DEFAULT_AVATAR};}
  }

  function addStyle(){
    if(document.getElementById('sushiAvatarWidgetStyle'))return;
    const style=document.createElement('style');
    style.id='sushiAvatarWidgetStyle';
    style.textContent=`
      .sushi-avatar-widget{position:fixed;right:max(14px,env(safe-area-inset-right));bottom:max(14px,env(safe-area-inset-bottom));z-index:9000;width:104px;height:126px;text-decoration:none;display:block;filter:drop-shadow(0 10px 16px rgba(15,23,42,.24));transition:transform .18s ease,filter .18s ease;isolation:isolate}
      .sushi-avatar-widget:hover{transform:translateY(-4px) scale(1.03);filter:drop-shadow(0 14px 20px rgba(15,23,42,.3))}
      .sushi-avatar-widget:focus-visible{outline:3px solid #fb923c;outline-offset:4px;border-radius:24px}
      .sushi-avatar-widget .saw-bubble{position:absolute;right:72px;bottom:72px;width:max-content;max-width:172px;padding:8px 10px;border-radius:14px 14px 4px 14px;background:rgba(255,255,255,.96);border:1px solid #fed7aa;color:#7c2d12;font:800 11px/1.35 system-ui,-apple-system,'Segoe UI',sans-serif;box-shadow:0 8px 18px rgba(15,23,42,.12);opacity:0;transform:translateY(4px);pointer-events:none;transition:.18s}
      .sushi-avatar-widget:hover .saw-bubble,.sushi-avatar-widget:focus-visible .saw-bubble,.sushi-avatar-widget.is-reacting .saw-bubble{opacity:1;transform:none}
      .sushi-avatar-widget .saw-stage{position:absolute;inset:0;overflow:hidden;border-radius:26px;background:radial-gradient(circle at 50% 72%,rgba(251,146,60,.20),transparent 58%);transform-origin:50% 100%}
      .sushi-avatar-widget svg{position:absolute;width:106px;height:auto;left:-1px;bottom:-10px;display:block}
      .sushi-avatar-widget .saw-badge{position:absolute;right:1px;bottom:1px;width:29px;height:29px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(180deg,#fb923c,#ea580c);color:#fff;font-size:15px;border:2px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.18)}
      .sushi-avatar-widget.react-correct .saw-stage{animation:sawHappy .6s cubic-bezier(.2,.8,.2,1)}
      .sushi-avatar-widget.react-combo .saw-stage{animation:sawJump .85s cubic-bezier(.15,.75,.2,1)}
      .sushi-avatar-widget.react-wrong .saw-stage{animation:sawOops .65s ease}
      .sushi-avatar-widget.react-wrong{filter:grayscale(.08) drop-shadow(0 8px 14px rgba(15,23,42,.20))}
      @keyframes sawHappy{0%,100%{transform:translateY(0) rotate(0)}25%{transform:translateY(-9px) rotate(-4deg)}50%{transform:translateY(-2px) rotate(4deg)}75%{transform:translateY(-7px) rotate(-2deg)}}
      @keyframes sawJump{0%,100%{transform:translateY(0) scale(1)}20%{transform:translateY(2px) scale(.96,1.04)}48%{transform:translateY(-30px) scale(1.05,.96)}68%{transform:translateY(-7px) scale(.98,1.02)}82%{transform:translateY(-14px) scale(1.02,.98)}}
      @keyframes sawOops{0%,100%{transform:translateX(0) rotate(0)}18%{transform:translateX(-7px) rotate(-5deg)}36%{transform:translateX(6px) rotate(4deg)}54%{transform:translateX(-4px) rotate(-3deg)}72%{transform:translateX(3px) rotate(2deg)}85%{transform:translateY(5px) scale(.98)}}
      @media(max-width:640px){.sushi-avatar-widget{width:78px;height:96px;right:8px;bottom:8px}.sushi-avatar-widget svg{width:80px;bottom:-8px}.sushi-avatar-widget .saw-badge{width:25px;height:25px;font-size:13px}.sushi-avatar-widget .saw-bubble{right:56px;bottom:58px;max-width:138px;font-size:10px;padding:7px 9px}}
      @media(prefers-reduced-motion:reduce){.sushi-avatar-widget{transition:none}.sushi-avatar-widget .saw-stage{animation:none!important}}
    `;
    document.head.appendChild(style);
  }

  function render(){
    const el=document.getElementById('sushiAvatarWidget');
    if(!el||typeof avatarSVG!=='function')return;
    el.querySelector('.saw-stage').innerHTML=avatarSVG(savedAvatar());
  }

  function react(kind,text){
    const el=document.getElementById('sushiAvatarWidget');
    if(!el)return;
    clearTimeout(reactionTimer);
    el.classList.remove('react-correct','react-combo','react-wrong','is-reacting');
    void el.offsetWidth;
    el.classList.add('react-'+kind,'is-reacting');
    const bubble=el.querySelector('.saw-bubble');
    if(bubble)bubble.textContent=text;
    reactionTimer=setTimeout(()=>{
      el.classList.remove('react-correct','react-combo','react-wrong','is-reacting');
      if(bubble)bubble.textContent='今日のコーデで勉強中！';
    },kind==='combo'?1200:900);
  }

  function inspectText(text){
    const t=String(text||'').trim();if(!t)return;
    if(/不正解|正解：|ミス|間違|wrong|MISS|Time up/i.test(t)){react('wrong','どんまい、次いこう！');return;}
    if(/正解|クリア|CLEAR|Nice|Good|復習完了|スタート！/i.test(t)){react('correct','いいね！');}
  }

  function inspectCombo(){
    const el=document.getElementById('comboValue')||document.querySelector('[id*="combo"][id*="Value"]');
    if(!el)return;
    const m=String(el.textContent||'').match(/(\d+)/);if(!m)return;
    const n=Number(m[1]);
    if(n>lastCombo&&n>=3&&(n===3||n===5||n===10||n%10===0))react('combo',`${n} COMBO!`);
    lastCombo=n;
  }

  function watchGame(){
    const targets=[
      ...document.querySelectorAll('.feedback,#feedback,#resultText,#reviewSummary,#message,.result-text,[aria-live="polite"],[aria-live="assertive"]')
    ];
    const seen=new WeakSet();
    const observe=el=>{
      if(!el||seen.has(el))return;seen.add(el);
      const mo=new MutationObserver(()=>{inspectText(el.textContent);inspectCombo();});
      mo.observe(el,{subtree:true,childList:true,characterData:true});
    };
    targets.forEach(observe);
    const bodyObserver=new MutationObserver(records=>{
      for(const r of records)for(const node of r.addedNodes){
        if(node.nodeType!==1)continue;
        if(node.matches?.('.feedback,#feedback,#resultText,#reviewSummary,#message,.result-text,[aria-live]'))observe(node);
        node.querySelectorAll?.('.feedback,#feedback,#resultText,#reviewSummary,#message,.result-text,[aria-live]').forEach(observe);
      }
      inspectCombo();
    });
    bodyObserver.observe(document.body,{subtree:true,childList:true});
    setInterval(inspectCombo,500);
  }

  function mount(){
    if(document.getElementById('sushiAvatarWidget'))return render();
    addStyle();
    const a=document.createElement('a');
    a.id='sushiAvatarWidget';
    a.className='sushi-avatar-widget';
    a.href='sushigacha/sushi-avatar.html';
    a.setAttribute('aria-label','マイアバターを開く');
    a.title='マイアバター';
    a.innerHTML='<span class="saw-bubble">今日のコーデで勉強中！</span><span class="saw-stage" aria-hidden="true"></span><span class="saw-badge" aria-hidden="true">👕</span>';
    document.body.appendChild(a);
    render();
    watchGame();
  }

  async function init(){
    try{
      if(typeof window.avatarSVG!=='function')await load(ROOT+'avatar.js?v=20260912-2');
      if(!document.querySelector('script[src*="avatar-polish.js"]'))await load(ROOT+'avatar-polish.js?v=4');
      mount();
      window.addEventListener('storage',e=>{if(e.key===LEDGER)render();});
      window.addEventListener('focus',render);
      window.addEventListener('pageshow',render);
      window.addEventListener('sushi-avatar-reaction',e=>react(e.detail?.kind||'correct',e.detail?.text||'いいね！'));
    }catch(e){console.warn('Avatar widget could not load',e);}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
