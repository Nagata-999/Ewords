'use strict';
(() => {
  if (window.SushiProfileSync) return;

  const SUPABASE_URL = 'https://rxyoyveykxdfrpomkltl.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_RmWOSxRfsV5YRwCDnKPPAQ_m3VzsUM7';
  const LEDGER_KEY = 'sushitan_login_bonus_v1';
  const NAME_KEY = 'sushitan_shared_player_name_v1';
  const SCRIPT_ID = 'sushi-supabase-js';
  let client = null;

  const object = v => v && typeof v === 'object' && !Array.isArray(v);
  const readJSON = key => { try { const v=JSON.parse(localStorage.getItem(key)||'{}'); return object(v)?v:{}; } catch { return {}; } };
  const unique = a => [...new Set((Array.isArray(a)?a:[]).filter(x => typeof x === 'string'))];

  function mergeLedger(cloud, local) {
    cloud=object(cloud)?cloud:{}; local=object(local)?local:{};
    const out={...cloud,...local};
    out.gems=Math.max(0, Number.isSafeInteger(cloud.gems)?cloud.gems:0, Number.isSafeInteger(local.gems)?local.gems:0);
    const cg=object(cloud.gacha)?cloud.gacha:{}, lg=object(local.gacha)?local.gacha:{};
    out.gacha={...cg,...lg,owned:unique([...(cg.owned||[]),...(lg.owned||[])])};
    for(const key of ['loginManualClaims','dailyGemClaims']){
      out[key]=unique([...(cloud[key]||[]),...(local[key]||[])]).slice(-400);
    }
    out.loginBonusTotal=Math.max(Number(cloud.loginBonusTotal)||0,Number(local.loginBonusTotal)||0);
    out.loginBonusStreak=Math.max(Number(cloud.loginBonusStreak)||0,Number(local.loginBonusStreak)||0);
    const cloudDay=String(cloud.loginBonusLastDay||''),localDay=String(local.loginBonusLastDay||'');
    out.loginBonusLastDay=cloudDay>localDay?cloudDay:localDay;
    return out;
  }

  function loadSdk(){
    if(window.supabase?.createClient)return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const old=document.getElementById(SCRIPT_ID);
      if(old){old.addEventListener('load',resolve,{once:true});old.addEventListener('error',reject,{once:true});return;}
      const s=document.createElement('script');s.id=SCRIPT_ID;
      s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
      s.onload=resolve;s.onerror=()=>reject(new Error('同期ライブラリを読み込めませんでした。'));
      document.head.appendChild(s);
    });
  }
  async function getClient(){
    if(client)return client;
    await loadSdk();
    client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    return client;
  }

  async function syncNow(){
    const sb=await getClient();
    const {data:{user},error:userError}=await sb.auth.getUser();
    if(userError||!user)return {signedIn:false};
    const localLedger=readJSON(LEDGER_KEY);
    const localName=window.SushiPlayer?.getName?.()||localStorage.getItem(NAME_KEY)||null;
    const {data:cloud,error:readError}=await sb.from('sushi_user_profiles').select('player_name,ledger,learning,profile_version,updated_at').eq('user_id',user.id).maybeSingle();
    if(readError)throw readError;
    const mergedLedger=mergeLedger(cloud?.ledger,localLedger);
    const mergedName=(cloud?.player_name||localName||'').slice(0,20)||null;
    const {error:writeError}=await sb.from('sushi_user_profiles').upsert({
      user_id:user.id,player_name:mergedName,ledger:mergedLedger,learning:object(cloud?.learning)?cloud.learning:{},profile_version:1,updated_at:new Date().toISOString()
    },{onConflict:'user_id'});
    if(writeError)throw writeError;
    localStorage.setItem(LEDGER_KEY,JSON.stringify(mergedLedger));
    if(mergedName){localStorage.setItem(NAME_KEY,mergedName);window.SushiPlayer?.setName?.(mergedName);}
    window.dispatchEvent(new Event('sushi-avatar-changed'));
    window.dispatchEvent(new CustomEvent('sushi-profile-synced',{detail:{userId:user.id}}));
    return {signedIn:true,user};
  }

  async function signIn(){
    const sb=await getClient();
    const redirectTo=location.origin+location.pathname;
    const {error}=await sb.auth.signInWithOAuth({provider:'google',options:{redirectTo}});
    if(error)throw error;
  }
  async function signOut(){
    const sb=await getClient(); const {error}=await sb.auth.signOut(); if(error)throw error; render();
  }

  function ensureUI(){
    if(document.getElementById('sushiSyncButton'))return;
    const style=document.createElement('style');
    style.textContent=`#sushiSyncButton{position:fixed;right:14px;bottom:76px;z-index:100015;border:1px solid #fed7aa;border-radius:999px;background:#fffaf2;color:#c2410c;padding:9px 12px;font:800 12px system-ui;box-shadow:0 6px 18px #0002;cursor:pointer}#sushiSyncSheet{position:fixed;inset:0;z-index:100030;background:#1423208a;display:none;align-items:flex-end;justify-content:center;font-family:system-ui}#sushiSyncSheet.open{display:flex}.ssp-card{width:min(520px,100%);background:#fffdf8;border-radius:24px 24px 0 0;padding:20px 18px calc(28px + env(safe-area-inset-bottom));color:#243b37}.ssp-card h2{margin:0 0 8px}.ssp-card p{font-size:13px;line-height:1.7;color:#667}.ssp-actions{display:grid;gap:9px;margin-top:14px}.ssp-actions button{border:0;border-radius:14px;padding:13px;font-weight:900;cursor:pointer}.ssp-main{background:#f4511e;color:white}.ssp-sub{background:#eee8dd;color:#344}.ssp-status{padding:10px;border-radius:12px;background:#f7f2e8;font-size:12px;font-weight:800}`;
    document.head.appendChild(style);
    const b=document.createElement('button');b.id='sushiSyncButton';b.type='button';b.textContent='☁ データ同期';
    const sheet=document.createElement('div');sheet.id='sushiSyncSheet';sheet.innerHTML=`<div class="ssp-card"><h2>☁ データ同期</h2><p>ログインしなくても、これまで通り遊べます。Google連携すると、名前・ジェム・取得したアバターを別の端末でも引き継げます。</p><div class="ssp-status" id="sspStatus">確認中…</div><div class="ssp-actions"><button class="ssp-main" id="sspMain" type="button">Googleで連携</button><button class="ssp-sub" id="sspClose" type="button">閉じる</button><button class="ssp-sub" id="sspOut" type="button" hidden>この端末でログアウト</button></div></div>`;
    document.body.append(b,sheet);
    b.onclick=()=>{sheet.classList.add('open');render();};
    sheet.addEventListener('click',e=>{if(e.target===sheet)sheet.classList.remove('open')});
    sheet.querySelector('#sspClose').onclick=()=>sheet.classList.remove('open');
    sheet.querySelector('#sspMain').onclick=async()=>{try{const sb=await getClient();const {data:{user}}=await sb.auth.getUser();if(user){setStatus('同期しています…');await syncNow();setStatus('✓ 同期しました');}else await signIn();}catch(e){setStatus('同期できませんでした：'+(e?.message||e));}};
    sheet.querySelector('#sspOut').onclick=async()=>{try{await signOut();setStatus('この端末からログアウトしました');}catch(e){setStatus('ログアウトできませんでした');}};
  }
  function setStatus(s){const el=document.getElementById('sspStatus');if(el)el.textContent=s;}
  async function render(){
    ensureUI();
    try{
      const sb=await getClient(),{data:{user}}=await sb.auth.getUser();
      const main=document.getElementById('sspMain'),out=document.getElementById('sspOut');
      if(user){setStatus('Google連携済み。この端末とクラウドを同期できます。');main.textContent='今すぐ同期';out.hidden=false;}
      else{setStatus('未連携。この端末のデータだけで遊んでいます。');main.textContent='Googleで連携';out.hidden=true;}
    }catch{setStatus('未連携。この端末のデータだけで遊べます。');}
  }

  window.SushiProfileSync={syncNow,signIn,signOut,mergeLedger};
  const start=async()=>{ensureUI();try{const sb=await getClient();sb.auth.onAuthStateChange((_event,session)=>{if(session?.user)setTimeout(()=>syncNow().catch(()=>{}),0);render();});await syncNow();}catch{}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();