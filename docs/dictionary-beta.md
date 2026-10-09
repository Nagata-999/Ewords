# すし辞書 β の実装・公開手順

## 構成

- 現在の辞書 v3.57、13,500語を `data/dictionary/` に保存。更新元と既存内容の保持・検証記録は `docs/dictionary-v3.57.md` を参照。
- `python scripts/build-dictionary.py` で HTML・検索索引・sitemap を再生成する。外部ライブラリ、サーバー、データベースの追加は不要。
- `/dictionary/abandon/` のように、各語に独立した静的HTMLを生成。末尾スラッシュなしのアクセスは静的ホストのディレクトリ転送を使う。
- JavaScriptを無効にしても日本語の意味と内部リンクが読める。各HTMLに title / description / canonical / OG / DefinedTerm のJSON-LDを出力。
- 検索は最初の操作時のみ約381KBの単語名・検索語索引を取得する。辞書本文や全HTMLは読み込まない。部分一致と編集距離2以内の近似候補に対応。
- スペースなどの非英数字は `~20~` などのコードポイント表現にする。スペースとハイフンが衝突せず、後から語が増えても既存URLを変更しない。
- sitemapは10,000 URL単位で分割し、`/dictionary/sitemap.xml` にまとめる。robots.txtから参照。既存sitemapは維持。
- A–Zの一覧から全語へ通常のHTMLリンクを設け、検索操作なしでもクロールできる。

## データと表示

v3.57完全版JSONを反映し、現行リポジトリにだけ存在した良質な例文37組・語義22件を補完して保持した。補完履歴と更新元のハッシュは `data/dictionary/integration-v3.57.json` に記録。日本語の語義、登録された語形、熟語、例文などをそのまま表示する。IPAも登録がある場合に限って表示する。音声は端末の英語読み上げで、辞書収録の録音音声ではない。

既知の未完成テンプレート（英文定義1,794件・汎用例文1,939件）は公開画面から除外する。判定は既存の `scripts/dictionary-quality.py`、集計は `data/dictionary-build-report.json`。代替説明や例文は生成しない。判定に合う有用な文を追加する場合はルールを見直す。辞書データ自体の語義監修を完了したことを意味しない。

## 学習連携

「この単語を覚える」は `/sushian.html?dictionary=abandon` に移動し、対象ページ1枚の学習カードを取得して既存の4択クイズを開始する。

- 既存収録語は既存IDを使用する。過去の正誤・苦手履歴をリセットしない。
- 辞書専用語は `dictionary:sw-xxxxx` で登録する。ブラウザが学習した語だけのカードを `sushitan_learning_v1:card:` 以下に保存。
- 解答記録は既存の共通イベント保存方式を使用。誤答は苦手復習へ、正答は既存の克服ルールへ反映。
- ボタンを押しただけで誤答や報酬は発生させない。保存不能時は既存の保存状態通知を利用。
- ローカル保存のため、別端末・別ブラウザには自動同期されない。
- ランキング、アバター、Daily Quest、オンライン保存の処理は変更していない。

## 公開

2026-10-04、PR #23をmainに統合し、GitHub Pagesへの本番公開を完了した。公開先は https://sushitan.net/dictionary/ 。本番ブラウザでも検索・直接アクセス・リロード・スマホ表示・学習と苦手復習・404・sitemapを確認済み。Search Consoleへの送信は未実施。

以下は再公開・更新時の手順。

1. 作業ベースは Ewords の `bdb4220e23778f27f61da4b8be4b4db0fe86ae07`。以後の変更があれば、変更ファイル一覧と差分を確認して統合する。古いサイト全体で現行サイトを無条件に置き換えない。
2. GitHubのサイト用ブランチに差分と生成物を取り込み、現在使用している静的公開方式で公開する。配布用ZIPには生成済みページも含む。
3. ホストが `dictionary/<slug>/index.html` をディレクトリURLで配信し、未知URLではルート `404.html` を **HTTP 404** で配信することを確認する。SPA用の全URL→index.html転送は使用しない。ホスト固有のエラーページ設定が必要な場合は `404.html` を指定する。
4. `/dictionary/`、`/dictionary/abandon`、`/dictionary/environment/`、`/dictionary/存在しない語/` を本番で開く。404本文は未収録メッセージと再検索欄を含む。
5. robots.txtと `/dictionary/sitemap.xml` がHTTP 200で取得できることを確認する。必要に応じてSearch Consoleに辞書sitemapを送信する。インデックス登録・検索順位は保証されない。
6. Service Workerを更新し、既存利用者でも新しい `shared/learning.js` が取得されることを確認する。辞書URLはキャッシュ対象外にして、サイトトップへのオフライン置換を防いでいる。

## 更新と50,000語以上への拡張

同じJSON形式の分割データを更新し、ビルドして生成物も公開する。語数をコードに固定していない。50,000語ならsitemapは複数に分かれ、各閲覧で取得する本文は常に1語分。検索索引のみ語数に比例して増える。単語IDは維持し、再採番しない。

サーバー側には1語1ファイルを配置するため、ホストのファイル数・容量上限は公開前に確認する。50,000語を超える場合はその数の静的ファイルを扱える公開プラン／ホストが必要。ブラウザが50,000ページを一括ロードする構造ではない。

ビルドは前回の生成リスト `data/dictionary-generated.json` を参照して不要な生成ファイルだけを削除する。辞書以外の既存ページは削除しない。語の削除時は既存URLの廃止方針も検討する。

## 検証コマンド

```text
python scripts/build-dictionary.py
python scripts/check-dictionary.py
node tests/dictionary.cjs
node tests/shared-learning.cjs
node tests/dictionary-browser.cjs
node tests/browser-learning.cjs
node tests/word-notes.cjs
```

ブラウザ検証はPlaywrightが必要。必要なら `NODE_PATH` / `PLAYWRIGHT_MODULE` と `CHROME_PATH` を指定する。テストはローカルHTTPサーバーを起動し、外部通信を遮断する。

