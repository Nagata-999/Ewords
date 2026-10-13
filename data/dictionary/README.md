# すし辞書 v3.186

このブランチには独立した試験追加 `new-entry-pilot-20261013` の30語を含み、合計は13,530語です。既存v3.186の13,500語は全フィールド不変です。以下は基礎リリースの記録で、追加分のID対応・検証は `new-entry-manifest.json`、`../../docs/dictionary-new-entries-phase2.md`（リポジトリルートからは `docs/dictionary-new-entries-phase2.md`）を参照してください。

全27辞書JSON、13,500語。更新元は `sushitan_dictionary_v3.186_full.zip`（完全版）です。

- ZIP SHA-256: `88dac458af365ae1b64f6a507d9d540f75b5d56d2d76d5a44925be8af082648a`
- リポジトリ v3.57 との比較：更新4,516語、新規・削除・ID変更なし。
- 25辞書JSONを更新。`dictionary-x.json` と `dictionary-other.json` は変更なし。
- ZIPの全データを保持し、既存の実用的な例文197件・語義12件を補完。語源505件と語源参照ファイルを保持。
- ZIPで語義が空になっていた `onomatopoeia` は既存の語義を保持。
- 補完内容と検査結果は `integration-v3.186.json`。

`release-manifest.json` の30語は配布元の v3.185 → v3.186 の強化語数で、リポジトリの v3.57 → v3.186 の差分語数とは異なります。

ZIP内READMEは v3.138、汎用 `validation.json` は v3.184 の古い記載でした。`meta.json`、`progress.json`、`release-manifest.json`、`validation_v3.186.json` の一致するバージョンを採用し、汎用検証結果は統合後に再生成しました。版別監査・検証ファイルは配布元の記録です。

## 生成と検証

リポジトリルートから実行します。

```sh
python data/dictionary/validate_dictionary.py
python scripts/build-dictionary.py
python scripts/check-dictionary.py
python tests/dictionary-rendering.py
node tests/dictionary.cjs
node tests/shared-learning.cjs
```

ブラウザ検証：PlaywrightとChromiumを用意して `node tests/dictionary-browser.cjs`。必要に応じて `CHROME_PATH` を指定します。

HTML・検索索引・sitemapは既存ビルダーで生成します。同一内容のファイルは書き直しません。旧版管理ファイルは履歴として保持しています。

## 内容の未整備箇所

配布元の `quality-audit-v3.186.json` には空の英語定義・例文・コロケーション、訳のないコロケーション、定型文などの編集課題が残っています。独自生成で埋めず、既知の未完成定型文は従来どおり公開表示から除外しています。旧形式の補助 `senses` データも原文のまま保持しています。
