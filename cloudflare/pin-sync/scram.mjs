const encoder=new TextEncoder();
function check(value){if(!value)throw Error('invalid_scram_message')}
export function base64(value){return btoa(String.fromCharCode(...new Uint8Array(value)))}
export function unbase64(value){check(typeof value==='string'&&value.length<=1024&&/^[A-Za-z0-9+/]*={0,2}$/.test(value));const bytes=Uint8Array.from(atob(value),character=>character.charCodeAt(0));check(base64(bytes)===value);return bytes}
function equal(left,right){if(left.length!==right.length)return false;let difference=0;for(let index=0;index<left.length;index++)difference|=left[index]^right[index];return difference===0}
function xor(left,right){check(left.length===32&&right.length===32);return left.map((byte,index)=>byte^right[index])}
async function hash(value){return new Uint8Array(await crypto.subtle.digest('SHA-256',value))}
export async function hmac(key,value){const imported=await crypto.subtle.importKey('raw',key,{name:'HMAC',hash:'SHA-256'},false,['sign']);return new Uint8Array(await crypto.subtle.sign('HMAC',imported,encoder.encode(value)))}
export function nonce(){return base64(crypto.getRandomValues(new Uint8Array(24)))}
function validNonce(value){check(typeof value==='string'&&/^[\x21-\x2b\x2d-\x7e]{16,200}$/.test(value));return value}
export function clientStart(account,clientNonce=nonce()){
 check(/^[a-z0-9_-]{4,24}$/.test(account));validNonce(clientNonce);return {account,nonce:clientNonce,clientFirst:'n,,n='+account+',r='+clientNonce};
}
export function parseClientFirst(value){
 check(typeof value==='string'&&value.length<=256);const match=value.match(/^n,,n=([a-z0-9_-]{4,24}),r=(.+)$/);check(match);validNonce(match[2]);return {account:match[1],nonce:match[2],bare:value.slice(3)};
}
export async function verifierFromLegacy(account,legacyHash){
 check(typeof legacyHash==='string');clientStart(account);const parts=legacyHash.split('.');check(parts.length===2);
 const salt=unbase64(parts[0]),saltedPassword=unbase64(parts[1]);check(salt.length===16&&saltedPassword.length===32);
 const clientKey=await hmac(saltedPassword,'Client Key');
 return {account,salt:parts[0],iterations:150000,storedKey:base64(await hash(clientKey)),serverKey:base64(await hmac(saltedPassword,'Server Key'))};
}
export async function registrationVerifier(account,pin){
 check(typeof pin==='string'&&/^\d{4}$/.test(pin));clientStart(account);
 const salt=crypto.getRandomValues(new Uint8Array(16)),key=await crypto.subtle.importKey('raw',encoder.encode(pin),'PBKDF2',false,['deriveBits']);
 const derived=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations:150000},key,256);
 return verifierFromLegacy(account,base64(salt)+'.'+base64(derived));
}
export function serverStart(verifier,clientFirst,serverNonce=nonce()){
 const client=parseClientFirst(clientFirst);check(client.account===verifier.account);validNonce(serverNonce);
 check(Number.isSafeInteger(verifier.iterations)&&verifier.iterations>=4096&&verifier.iterations<=150000&&unbase64(verifier.salt).length===16);
 const combined=validNonce(client.nonce+serverNonce),serverFirst='r='+combined+',s='+verifier.salt+',i='+verifier.iterations;
 return {account:client.account,clientFirstBare:client.bare,combined,serverFirst};
}
export async function clientProof(password,started,serverFirst,expectedIterations=150000){
 check(typeof password==='string'&&/^[\x20-\x7e]{1,64}$/.test(password));const parsed=parseClientFirst(started.clientFirst);check(parsed.account===started.account&&parsed.nonce===started.nonce);
 check(typeof serverFirst==='string'&&serverFirst.length<=512);const match=serverFirst.match(/^r=([^,]+),s=([^,]+),i=([1-9]\d*)$/);check(match);
 const combined=validNonce(match[1]),salt=unbase64(match[2]),iterations=Number(match[3]);
 check(combined.startsWith(started.nonce)&&combined.length>started.nonce.length&&salt.length===16&&iterations===expectedIterations&&iterations>=4096&&iterations<=150000);
 const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
 const saltedPassword=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations},key,256));
 const clientKey=await hmac(saltedPassword,'Client Key'),storedKey=await hash(clientKey),finalBare='c=biws,r='+combined;
 const authMessage=parsed.bare+','+serverFirst+','+finalBare,signature=await hmac(storedKey,authMessage);
 return {clientFinal:finalBare+',p='+base64(xor(clientKey,signature)),serverSignature:base64(await hmac(await hmac(saltedPassword,'Server Key'),authMessage))};
}
export async function serverVerify(verifier,exchange,clientFinal){
 check(verifier.account===exchange.account&&typeof clientFinal==='string'&&clientFinal.length<=512);
 const prefix='c=biws,r='+exchange.combined+',p=';check(clientFinal.startsWith(prefix));const proof=unbase64(clientFinal.slice(prefix.length));check(proof.length===32);
 const finalBare='c=biws,r='+exchange.combined,authMessage=exchange.clientFirstBare+','+exchange.serverFirst+','+finalBare;
 const storedKey=unbase64(verifier.storedKey),serverKey=unbase64(verifier.serverKey);check(storedKey.length===32&&serverKey.length===32);
 const recoveredKey=xor(proof,await hmac(storedKey,authMessage));check(equal(await hash(recoveredKey),storedKey));
 return 'v='+base64(await hmac(serverKey,authMessage));
}
export function verifyServerFinal(client,serverFinal){
 check(typeof serverFinal==='string'&&serverFinal.startsWith('v='));check(equal(unbase64(client.serverSignature),unbase64(serverFinal.slice(2))));return true;
}
