const headers={'Access-Control-Allow-Origin':'https://sushitan.net','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
export function legacyFreeze(request){
 const origin=request.headers.get('origin');
 if(origin&&origin!=='https://sushitan.net')return new Response(JSON.stringify({error:'origin_not_allowed'}),{status:403,headers});
 if(request.method==='OPTIONS')return new Response('ok',{headers});
 if(request.method!=='POST')return new Response(JSON.stringify({error:'method_not_allowed'}),{status:405,headers});
 return new Response(JSON.stringify({ok:false,error:'同期先を切り替えました。ページを再読み込みして同期してください。',code:'reload_required'}),{status:426,headers:{...headers,Upgrade:'ewords-d1-sync'}});
}


Deno.serve(legacyFreeze);
