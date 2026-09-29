// Render the public, JavaScript-independent lesson from the same notes used by the games.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'shared/word-notes.js'),'utf8'),ctx);
const entries=ctx.window.SushiWordNotes.entries();
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
if(entries.length!==101||entries[100].word!=='available')throw Error('Update lesson coverage before changing the dataset');
const groups=Array.from({length:5},(_,i)=>({id:'range-'+(i*20+1),title:`${i*20+1}〜${i*20+20}番`,entries:entries.slice(i*20,i*20+20),offset:i*20}));
groups.push({id:'extra',title:'追加の解説',entries:entries.slice(100),offset:null});
const sections=groups.map(g=>`<section aria-labelledby="${g.id}"><h2 id="${g.id}">${g.title}</h2><nav aria-label="${g.title}の単語">${g.entries.map(e=>`<a href="#${e.word}">${e.word}</a>`).join(' · ')}</nav>${g.entries.map((e,i)=>`<article id="${e.word}"><h3>${g.offset===null?'':(g.offset+i+1)+'. '}${e.word}</h3><p lang="en">${esc(e.example)}</p><p>${esc(e.translation)}</p><p>${esc(e.note)}</p><p class="practice-hint">確認練習：上の英文を手で隠し、和訳を英語で言い直してください。</p><details><summary>例文をもう一度確認する</summary><p lang="en">${esc(e.example)}</p><p>単語だけでなく、前置詞や動詞の形も比べましょう。別の英文が正しい場合もあります。</p></details></article>`).join('\n')}<p><a href="#contents">範囲一覧へ戻る</a> · <a href="sushian.html">すし暗で練習する</a></p></section>`).join('\n');
const html=`<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>基本英単語101語の例文と使い方｜すし単</title><meta name="description" content="すし暗1〜100番とavailableを、自作例文・和訳・文型や似た表現との違いで学ぶ復習教材。20語ずつの範囲で確認できます。"><link rel="canonical" href="https://sushitan.net/word-notes"><link rel="stylesheet" href="shared/word-notes.css"></head>
<body class="word-notes-page"><main><nav><a href="index.html">すし単トップ</a> · <a href="sushitan.html">すし単</a> · <a href="sushian.html">すし暗</a></nav>
<h1>基本英単語101語の例文と使い方</h1>
<p>意味を選べても、自分で英文にすると迷うことがあります。例文を読んで使い方を確認し、次に英語を手で隠して、和訳から言い直してみてください。</p>
<p>現在の掲載範囲は、すし暗の1〜100番と available の計101語です。各語のすべての意味を網羅する辞書ではなく、一つの使い方を学ぶための自作例文と解説です。</p>
<h2>20語ずつの復習手順</h2><ol><li><a href="sushian.html">すし暗を開く</a>。まず範囲を1〜20、問題数を20問に設定して解きます。</li><li>答え合わせで『例文・使い方』を開き、文型や意味の違いを確認します。</li><li><a href="sushian.html?review=weak">苦手復習</a>で、解説を見ずに意味を思い出します。</li><li>次は21〜40番のように範囲を進めます。前の範囲も日をあけて確かめてください。</li></ol>
<p>苦手復習には、このブラウザでほかのゲームから記録された単語も含まれます。解説を読んだだけでは正解数や克服状態は変わりません。</p>
<h2 id="contents">範囲から探す</h2><nav aria-label="範囲一覧">${groups.map(g=>`<a href="#${g.id}">${g.title}</a>`).join(' · ')}</nav>
${sections}
<footer><p>例文と解説の初回掲載：2026年9月29日。掲載数：101語。</p><a href="contact.html">誤り・分かりにくい点を知らせる</a> · <a href="about.html">運営者情報</a> · <a href="privacy.html">プライバシーポリシー</a></footer></main></body></html>\n`;
const output=path.join(root,'word-notes.html');
if(process.argv.includes('--check')){if(fs.readFileSync(output,'utf8').trim()!==html.trim())throw Error('Run node scripts/build-word-notes.cjs to refresh the lesson');console.log('PASS: static lesson matches game notes');}
else fs.writeFileSync(output,html);
