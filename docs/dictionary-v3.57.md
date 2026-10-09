# すし辞書 v3.57 更新・検証記録

2026-10-09。更新元: `sushitan_dictionary_v3.57_full.zip`（完全版）。
ZIP SHA-256: `bc8f158ae8deef5ad4b10cb57ca537d6138ec3f284dacfc6367df950724a9b1b`。
適用基準: `ac7bf737f60510c2dd77fb8d920eea1e93f4ed8d`、既存辞書 v2.27.0。
ZIPの README、meta、progress、release-manifest は v3.57 / 13,500語で一致。

## 統合

- 全27辞書JSON、語源の語根・接頭辞JSON、管理情報・変更履歴・付属検証スクリプトを `data/dictionary/` に反映。
- 全13,500語のIDと見出し語を維持。ID重複、空の見出し語、JSON読込エラー、語義・英日例文の必須項目欠損は0件。
- ZIP内の全辞書内容を保持。語源505語分および語根・接頭辞ファイルを保持。
- ZIPに未収録だった既存の良質な例文37組と語義22件を32語に補完。例: call の名詞用法、work の動詞用法、day の「昼」。新しい辞書本文は生成していない。
- 既存の定型例文は復活させず、同じ意味の新しい説明・例文はZIPを優先。補完内容と元ファイルのハッシュは `data/dictionary/integration-v3.57.json` に記録。
- ZIPの `validation.json` 等は配布元の検証記録。統合後の検証結果とは区別する。
- ZIPにない既存ファイルは削除せず、他機能・Supabase・ユーザーデータは変更しない。

## 公開データ

既存の `python scripts/build-dictionary.py` を使用。生成方式・画面・検索コードは変更なし。
13,500単語ページ、辞書トップ、A–Z一覧、検索索引、sitemap 2分割と索引を再生成。
全13,527 URLをsitemapに収録。元のURLと学習用IDを維持。
生成内容が以前と同一のファイルはコミットに含めない。
既存品質フィルターにより定型の英文定義1,794件・例文1,939件を表示から除外。
元JSONの定型文はそのまま保持し、代替文を生成しない。

## 検証

- `python data/dictionary/validate_dictionary.py`: v3.57配布情報・13,500 ID・今回強化40語の整合性。
- `python scripts/check-dictionary.py`: 全13,500ページのcanonical、OG、構造化データ、学習カード、内部リンク、sitemap。
- `node tests/dictionary.cjs`: 索引件数、既存ID、学習カード永続化、架空の誤答を作らないこと。
- `node tests/shared-learning.cjs`: 共通学習・既存ID・永続化・履歴移行・保存エラー処理。
- `node tests/dictionary-browser.cjs`: 部分一致・完全一致検索、再読込、390px/320px、関連リンク、学習・苦手復習、404と近似検索、JavaScriptなしの本文。
- 追加の実ブラウザ検査: achieve / carry over / call / day / home / work の全語義・英日例文・語法・コロケーションを320px・390px・1280pxで検査。活用形 achieved と句動詞の検索、横はみ出しなし、ページ実行エラーなし。
- ZIP内容が統合後データにすべて残ること、補完した例文の存在、語源の一致を全件検査。

ブラウザ検証はローカルHTTP・隔離プロファイル・外部通信遮断で実施。実ユーザーの保存状態は操作しない。

## 残る制約

元データには未完成の定型文、未登録のIPA等が残る。品質フィルターの既存動作を継続し、独自の大量補完は行わない。
語源データは保持するが、既存の静的ページ生成器には語源専用表示がないためUI追加は行わない。
全語義の言語学的監修・Search Console送信・検索エンジンの登録確認は今回の検証対象外。
