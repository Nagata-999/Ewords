const encoder=new TextEncoder();
const PURPOSE='ewords-pin-login-v1';

function requireValue(condition){if(!condition)throw Error('invalid_auth_input')}
export function encode(bytes){return btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'')}
export function decode(value){
 requireValue(typeof value==='string'&&/^[A-Za-z0-9_-]+$/.test(value));
 const bytes=Uint8Array.from(atob(value.replaceAll('-','+').replaceAll('_','/')),character=>character.charCodeAt(0));
 requireValue(encode(bytes)===value);return bytes;
}
function fromLegacy(value){return Uint8Array.from(atob(value),character=>character.charCodeAt(0))}
function identity(account){requireValue(typeof account==='string'&&/^[a-z0-9_-]{4,24}$/.test(account));return account}
function binding(account,salt){return encoder.encode(JSON.stringify([PURPOSE,identity(account),salt]))}
function message(challenge){
 requireValue(challenge?.purpose===PURPOSE&&challenge.origin==='https://sushitan.net'&&Number.isSafeInteger(challenge.expires));
 requireValue(decode(challenge.id).length===32&&decode(challenge.nonce).length===32);
 return encoder.encode(JSON.stringify([PURPOSE,challenge.origin,identity(challenge.account),challenge.id,challenge.nonce,challenge.salt,challenge.expires]));
}
async function hmacKey(bytes){return crypto.subtle.importKey('raw',bytes,{name:'HMAC',hash:'SHA-256'},false,['sign','verify'])}
export async function importWrappingKey(bytes){requireValue(bytes.length===32);return crypto.subtle.importKey('raw',bytes,'AES-GCM',false,['encrypt','decrypt'])}
export async function sealLegacyVerifier(account,legacyHash,wrappingKey){
 const parts=legacyHash.split('.');requireValue(parts.length===2);
 const salt=fromLegacy(parts[0]),derived=fromLegacy(parts[1]);requireValue(salt.length===16&&derived.length===32);
 const saltText=encode(salt),iv=crypto.getRandomValues(new Uint8Array(12));
 const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:binding(account,saltText),tagLength:128},wrappingKey,derived);
 return {account:identity(account),salt:saltText,iv:encode(iv),ciphertext:encode(ciphertext)};
}
export function issueChallenge(verifier,now=Date.now()){
 return {purpose:PURPOSE,origin:'https://sushitan.net',account:identity(verifier.account),id:encode(crypto.getRandomValues(new Uint8Array(32))),nonce:encode(crypto.getRandomValues(new Uint8Array(32))),salt:verifier.salt,expires:now+120000};
}
export async function browserProof(pin,challenge){
 requireValue(typeof pin==='string'&&/^\d{4}$/.test(pin));const payload=message(challenge),salt=decode(challenge.salt);requireValue(salt.length===16);
 const key=await crypto.subtle.importKey('raw',encoder.encode(pin),'PBKDF2',false,['deriveBits']);
 const derived=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations:150000},key,256);
 return encode(await crypto.subtle.sign('HMAC',await hmacKey(derived),payload));
}
export async function verifyProof(verifier,wrappingKey,challenge,proof,now=Date.now()){
 requireValue(challenge.account===verifier.account&&challenge.salt===verifier.salt&&challenge.expires>now);
 const payload=message(challenge),signature=decode(proof);requireValue(signature.length===32);
 const derived=await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(verifier.iv),additionalData:binding(verifier.account,verifier.salt),tagLength:128},wrappingKey,decode(verifier.ciphertext));
 return crypto.subtle.verify('HMAC',await hmacKey(derived),signature,payload);
}
export async function tokenHash(token){requireValue(decode(token).length===32);return encode(await crypto.subtle.digest('SHA-256',encoder.encode(token)))}
export async function newSession(now=Date.now()){
 const token=encode(crypto.getRandomValues(new Uint8Array(32)));
 return {token,hash:await tokenHash(token),createdAt:now,expires:now+7*86400000};
}
export function sessionCookie(token,maxAge=604800){requireValue(decode(token).length===32&&Number.isSafeInteger(maxAge)&&maxAge>=1&&maxAge<=604800);return '__Host-ewords-sync='+token+'; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age='+maxAge}
