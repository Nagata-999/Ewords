IELTS Reading Library — GitHubアップロード用

【設置方法】
1. この「IELTS」フォルダを、そのままGitHubリポジトリの sushitan/ 配下へアップロードします。
2. 最終配置を次の形にしてください。

sushitan/
  index.html
  IELTS/
    index.html
    reading.html
    css/reading.css
    js/library.js
    js/reading.js
    data/manifest.json
    data/1-1.json ...

3. アクセス先
   /IELTS/index.html
   例: https://あなたのドメイン/IELTS/

【重要】
- IELTSフォルダ内の階層を崩さず、フォルダごとアップロードしてください。
- PC上で index.html を直接ダブルクリックすると、ブラウザの制限でJSONが読み込めない場合があります。
- GitHub Pages / Cloudflare Pages上ではそのまま動作します。
- IELTSトップの「← すし英語トップ」は ../index.html に戻る設定です。

【新しいPassageの追加】
1. data/3-1.json のような教材JSONを追加します。
2. data/manifest.json に1件追加します。
3. それだけでLibraryにカードが自動表示されます。HTMLの追加は不要です。

manifest.json 追加例:
{
  "id": "3-1",
  "title": "New Passage Title",
  "range": "Questions 1–13",
  "status": "available",
  "questionCount": 13,
  "durationMinutes": 20
}

【現在の機能】
- reading.html?id=1-1 方式の共通画面
- Passageごとの20分タイマー
- 自動保存、最高点、Library進捗表示
- 問題形式別の弱点分析
- 詳細採点（根拠・シノニム・矛盾語・NOT GIVEN理由・日本語解説）
- Incorrect only復習
- Reviewフラグ
- Vocabulary Mission
- 本文マーカー
- 生徒名・クラス保存
- 教師提出用レポートのコピー／TXT保存
- 前後のPassage移動

【データ保存】
進捗はブラウザのlocalStorageに保存されます。別端末とは同期されません。
Supabase連携は次の成長段階として追加できますが、現版は設定なしですぐ公開・使用できます。
