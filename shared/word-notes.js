(function (global) {
  'use strict';
  // Original example sentences. Coverage is deliberately explicit, not generated at runtime.
  const rows = [
    ['follow','Follow the instructions carefully.','指示に注意深く従ってください。','follow の直後に従う対象を置きます。follow to the instructions とはしません。'],
    ['consider','We are considering moving to a smaller house.','私たちはもっと小さな家へ引っ越すことを検討しています。','「〜することを検討する」は consider doing。consider to do と混同しないようにしましょう。'],
    ['increase','The number of visitors increased last year.','昨年、訪問者の数が増えました。','increase は「増える」と「増やす」の両方に使えます。この例では後ろに目的語がなく、「増える」です。'],
    ['expect','I expect the train to arrive soon.','電車はまもなく到着すると思います。','expect は予測や期待を表します。必ずしも「そうなってほしい」という願いではありません。expect A to do の形です。'],
    ['decide','We decided to walk home.','私たちは歩いて帰ることに決めました。','「〜することに決める」は decide to do。決定した内容を to の後ろに置きます。'],
    ['develop','She developed a new way to teach vocabulary.','彼女は語彙を教える新しい方法を開発しました。','この例は develop + 目的語で「〜を開発する」。Skills develop with practice. なら「技能が発達する」です。'],
    ['provide','The school provides students with lunch.','その学校は生徒に昼食を提供しています。','provide 人 with 物の形。provide lunch for students とも表せます。'],
    ['continue','The rain continued all night.','雨は一晩中降り続きました。','この例の continue は「続く」。continue studying のように、続ける行動を後ろに置くこともできます。'],
    ['include','The price includes breakfast.','料金には朝食が含まれています。','include は全体の中に何かを含むこと。朝食以外が含まれない、という意味ではありません。'],
    ['remain','Please remain calm.','落ち着いたままでいてください。','remain + 形容詞で「〜のままでいる」。この例の calm は動作ではなく状態を表します。'],
    ['reach','We reached the station before noon.','私たちは正午前に駅に着きました。','到着先は reach の直後に置きます。arrive at the station と違い、reach at the station とはしません。'],
    ['allow','My parents allow me to use their computer.','両親は私が両親のパソコンを使うことを許可しています。','allow 人 to do で「人が〜することを許す」。許可される人と行動を分けて読みます。'],
    ['force','The storm forced us to stay indoors.','嵐のため、私たちは屋内にとどまらざるを得ませんでした。','force 人 to do は「人に〜することを強いる」。人だけでなく状況も主語になります。'],
    ['offer','He offered to carry my bag.','彼は私のかばんを運ぼうかと申し出ました。','offer to do は自分から行動を申し出ること。相手に行動を求める ask とは区別します。'],
    ['realize','I realized that I had the wrong key.','私は違う鍵を持っていることに気づきました。','この例では、事実を理解して「気づく」。notice が見聞きして気づく場合に使われるのに対し、realize は理解に焦点があります。'],
    ['suggest','She suggested taking an earlier train.','彼女はもっと早い電車に乗ることを提案しました。','suggest doing で行動を提案します。この意味で suggest to take とはしません。'],
    ['require','This job requires patience.','この仕事には忍耐力が必要です。','require は必要条件を表します。単に「欲しい」を表す want と同じではありません。'],
    ['worry','Try not to worry about the test.','試験のことを心配しすぎないようにしてください。','心配の対象には worry about を使います。The news worried me. なら「その知らせが私を心配させた」です。'],
    ['wonder','I wonder why the shop is closed.','なぜその店が閉まっているのだろう。','wonder は「〜だろうかと思う」。why の後ろは the shop is の語順で、疑問文の is the shop にはしません。'],
    ['cost','This ticket costs 500 yen.','この切符は500円です。','費用がかかる物を主語にして cost + 金額。人を主語にする pay と区別しましょう。'],
    ['available','This room is available tomorrow.','この部屋は明日利用できます。','available は物や人が「利用できる・対応できる」こと。possible は物事が「実現可能」であることです。部屋の空きを表すこの例では available を使います。']
  ];
  const notes = new Map(rows.map(([word,example,translation,note])=>[word,{word,example,translation,note}]));
  const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function get(word) { return notes.get(String(word || '').normalize('NFKC').trim().toLowerCase()) || null; }
  function html(word) {
    const entry=get(word);
    if (!entry) return '<p class="word-note">この単語の例文・用法解説は未掲載です。まず表示された意味を確認し、苦手復習でもう一度思い出してみましょう。</p>';
    return `<details class="word-note"><summary>${escape(entry.word)} の例文・使い方</summary><p lang="en">${escape(entry.example)}</p><p>${escape(entry.translation)}</p><p>${escape(entry.note)}</p><details><summary>確認練習：例文を隠して、日本語から英語で言ってみる</summary><p lang="en">${escape(entry.example)}</p><p>答えを見ずに言えたか確認し、後で苦手復習にも取り組みましょう。この確認だけでは学習記録は変わりません。</p></details></details>`;
  }
  global.SushiWordNotes=Object.freeze({get,html,entries:()=>rows.map(([word])=>({...get(word)}))});
})(window);

