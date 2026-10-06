# すし辞書 v2.44 統合

基準main: `77966b43f6e816bc637f377bda880f83a43f4d56`。
受領ZIPから見出し語27分割、meta、語根・接頭辞索引、廃止ID記録を取り込む。見出し語分割と語源索引は受領ファイルとバイト一致。13,500語のID・word・lemmaを既存mainと照合し、変更なし。本文更新は1,279語。詳細と入力SHA-256は `data/dictionary/integration-v2.44.json`。

## 元データと再生成

`meta.json`は提供元の値を保持する。`previous_version`と`enriched_this_version`は過去版の情報が残っているため、今回の差分数はintegrationレポートを参照する。語根・接頭辞索引のversion=2.42.0も提供元の値である。

ZIPのvalidation.json/checksums.json/index.json/qa_queue.jsonは古い版の情報を含む。提供元の旧検証スクリプトを再実行せず、リポジトリ用の `scripts/dictionary-data.py` で現在のデータから更新する。validationは構造・ID・参照・集計の検査で、言語学的正確さの認証ではない。qa_queueはneeds_enrichmentと既存テンプレート判定による課題一覧であり、全欠点を網羅しない。checksumsはdata/dictionary直下のJSON（checksums自身以外）のSHA-256。

```sh
python scripts/build-dictionary.py
python scripts/check-dictionary.py
python tests/dictionary-data.py
node tests/dictionary.cjs
node tests/shared-learning.cjs
node tests/dictionary-browser.cjs
```

ビルド時にindex/qa_queue/validation/checksumsも更新する。`dictionary-data.py --check`は変更せず整合性だけを検査。ID台帳は既存IDと見出し語の対応、過去の欠番を保持する。新規語追加時は最大IDより大きいIDを付け、台帳も明示的に更新すること。

## 表示

語源505語、語根137、接頭辞41を保持。語源のorigin/history/roots/relatedを静的HTMLに出し、収録済み関連語だけリンクする。未収録関連語23語も文字で保持する。phrases、collocations、語義・例文・usage_noteは元データを維持。既存のdictionary-quality.pyは変更していない。既知の定型説明2,576件・定型例文2,804件は引き続き表示から除外するが、元JSONには残る。

## 検証

ローカルで全13,500ページのSEO・sitemap・内部リンク・語源・語義・表示対象例文・phrases/collocations/語法の保持を検査。ID改変、retired ID、壊れた語源、索引参照、古いチェックサムの破損検出、HTMLエスケープをテスト。共通学習テストとブラウザテスト（検索、直接URL、再読み込み、スマホ、学習保存・苦手復習、404、JavaScript無効、語源リンク）を通過。

辞書以外の既存ソースは変更しない。現在のavatar/profile/sync/writing/classroom関連の変更を維持する。生成物は最新mainを基礎とし、辞書ファイルのみ更新する。
