# すし辞書 β 検証結果

実施日：2026-10-04。対象：辞書 v2.27.0 / 13,500語。
実装元：Nagata-999/Ewords、commit `bdb4220e23778f27f61da4b8be4b4db0fe86ae07`。

## 今回確認したこと

| 項目 | 結果 |
|---|---|
| 辞書トップ検索 | 部分一致候補と完全一致語への移動を実ブラウザで確認 |
| 個別URL・再読み込み | abandon / environment / significant 等で確認 |
| JavaScriptなしの本文 | significant の見出し・日本語語義を確認 |
| スマホ | 390pxの単語ページ、320pxの検索トップで横はみ出しなし。390px画面は目視確認 |
| 内部リンク | 全13,500ページの辞書リンク先を検査。break の語形リンクもクリック確認 |
| この単語を覚える | 辞書専用語 aardvark と既存語 follow で、すし暗への遷移を確認 |
| 学習保存 | 誤答、再読み込み後の履歴維持、正答、再挑戦、苦手復習を確認。単に開いただけでは誤答を追加しない |
| sitemap | 2分割。全13,500単語URLと辞書トップ・A–Z一覧を確認。robots.txtから参照 |
| SEOメタ情報 | 全13,500語の固有canonical、description、OG、JSON-LD、学習カードを検査 |
| 未収録語 | ローカルHTTPサーバーで404ステータス、未収録メッセージ、abndon → abandon候補を確認 |

現在のデータには類義語・反意語が登録されていないため、それらの実データでのクリック確認は対象外。追加された際は同じリンク生成処理が適用される。

## 通過したテスト

- `scripts/check-dictionary.py`：全件の静的HTML・リンク・SEO・sitemap。
- `tests/dictionary.cjs`：検索索引、学習カードの保存、既存IDの再利用、架空の誤答を追加しないこと。
- `tests/dictionary-browser.cjs`：検索、直接アクセス、再読み込み、スマホ、リンク、学習・永続化・復習、404、JavaScript無効時の本文。ページ実行エラーなし。
- `tests/shared-learning.cjs`：既存ID、共通学習、克服・再誤答、複数タブ、既存履歴移行、破損・保存不可。
- `tests/browser-learning.cjs`：既存すし単の通常誤答、苦手復習、共通回答、復習時スコア維持。
- `tests/word-notes.cjs`：2,000語の既存例文、番号対応、解説生成、表示・復習、スマホ20ページ。
- `tests/daily-bridge.cjs`、`tests/idiom-daily-quest.cjs`：Daily Quest連携・重複防止・上限・日付切替。
- `tests/auto-ranking-games.test.cjs`：14ゲームのランキング連携と重複送信防止。
- `tests/player-scores.test.cjs`：プロフィール・既存記録・結果保存と再試行等。
- `tests/sushicross.test.cjs`：既存語彙・出題・結果・ランキング関連。
- `tests/site-quality.cjs`：212の既存スクリプト、アバター描画パターン、ゲームページ、Daily Quest処理。

## 既存テストの不整合

`tests/avatar-v2.cjs` は `#showLegacy` の操作待ちでタイムアウトする。取得時点の未変更アバターソースとテストを別フォルダーに展開して再実行しても、同じ箇所で同じエラーが発生した。辞書実装による新規エラーではないが、このUIテスト全体を通過したとは扱わない。アバター関連のソースは今回の差分に含めていない。

## 本番では未実施

GitHubへの反映、本番デプロイ、本番ホストのディレクトリURL・404設定確認、Search Console送信は未実施。配布ZIPは既存リポジトリに統合する差分であり、サイト全体を含む単独配信ZIPではない。適用・公開は「公開手順.md」を参照。

現在のデータに含まれる既知の仮説明3,333件・仮例文3,600件は表示対象から除外。元JSONを改変せず、代わりの内容も生成していない。
