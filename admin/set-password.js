"use strict";
(async()=>{
 if (!(globalThis.SushiAdminFeatures?.enabled === true)) return;

 const base="https://rxyoyveykxdfrpomkltl.supabase.co",apikey="sb_publishable_RmWOSxRfsV5YRwCDnKPPAQ_m3VzsUM7",$=id=>document.getElementById(id);
 const hash=new URLSearchParams(location.hash.slice(1));history.replaceState(null,"",location.pathname);let token="";
 try{const r=await fetch(base+"/auth/v1/verify",{method:"POST",headers:{apikey,"Content-Type":"application/json"},body:JSON.stringify({token_hash:hash.get("token_hash"),type:"recovery"}),cache:"no-store"});const d=await r.json();if(!r.ok||!d.access_token)throw Error();token=d.access_token;$("save").disabled=false;$("message").textContent="12文字以上で設定してください。";}catch{$("message").textContent="設定リンクが期限切れか、使用済みです。新しいリンクを依頼してください。";}
 $("setupForm").onsubmit=async e=>{e.preventDefault();if($("newPassword").value!==$("confirmPassword").value){$("message").textContent="入力したパスワードが一致しません。";return}$("save").disabled=true;try{const r=await fetch(base+"/auth/v1/user",{method:"PUT",headers:{apikey,Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({password:$("newPassword").value}),cache:"no-store"});$("newPassword").value="";$("confirmPassword").value="";if(!r.ok)throw Error();await fetch(base+"/auth/v1/logout",{method:"POST",headers:{apikey,Authorization:"Bearer "+token}});token="";$("setupForm").hidden=true;$("message").textContent="設定できました。管理者ログインからメールアドレスとパスワードで入れます。";}catch{$("message").textContent="設定できませんでした。リンクの期限またはパスワードを確認してください。";$("save").disabled=false;}};
})();
