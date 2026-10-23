import fs from 'node:fs/promises';

await fs.mkdir(new URL('./assets/',import.meta.url),{recursive:true});
for(const [source,target] of [['../../shared/sushi-profile.js','profile.txt'],['../../sushigacha/achievement-login.js','login.txt'],['transport.mjs','transport.txt'],['scram.mjs','scram.txt']])await fs.copyFile(new URL(source,import.meta.url),new URL('./assets/'+target,import.meta.url));
