# 新規語彙候補：Phase 1

基準は本番公開済み v3.186、main `d231d1c554f3ce0c5055bab5d29c0a9aff9cf1a5` の13,500語。既存データと生成物はこのPhaseでは変更していません。既存全エントリの正規化JSON SHA-256を保存し、以後の不変検証に使います。辞書27ファイルは基準mainのGit blobハッシュとも照合済みです。

## 取得・件数

ユーザー提供 `sushitan_new_candidates_for_codex_20261013.zip` の4 JSONをそのまま `data/dictionary-candidates/20261013/` に保存しました。累積は実測3,600語、直近40語はその内数です。配布元validation記載の3ファイルのSHA-256も一致しました。資料内の旧v3.57への統合指示は採用しません。

別管理160語を `automation/dictionary-new-entries` のコミット `5afab1e936e3fe43db4054d309ae779818c93b6a` で発見。manifestが指定する先頭118語と7追加ファイル42語を読み、160語・160 ID・160見出しであることを確認しました。過去の累積snapshot134語を丸ごと足すと重複するため使用していません。参照用コピーと出典manifestを保持し、今回の追加対象には含めません。

## 全候補の機械検査

- 本番との見出し完全一致・正規化一致・ID衝突：各0。
- 候補内の正規化見出し重複・ID衝突・同一品詞内語義重複：各0。
- 別管理160語との見出し・緩い正規化・ID衝突：各0。
- 空見出し、空日本語義、空英語定義、欠落例文、英日片側欠損、置換文字・既知プレースホルダー：検出0。
- `noun phrase` / `phrasal verb` / `idiom` 等、現行validatorが受け入れない品詞を持つ候補447語。意味の誤りと断定せず、スキーマ変換・個別確認が必要として隔離。
- ハイフン・空白等を除くと一致する候補6組12語、既存熟語欄との一致12語、既存検索別名との一致2語を隔離。既存への自動統合はしません。
- 編集レビューでbroaden・streamlineの別語義不足、anachronisticの英語定義の範囲、interdependentの前置詞説明を再検討対象に追加。
- 重複指摘を除く隔離対象467語、機械検査後の編集確認待ち3,133語。

正規化はUnicode NFKC、小文字化、前後空白除去、連続空白の統一。緩い照合では空白・ハイフン類・アポストロフィを除きます。別綴り、単複、意味の重なり等まで完全に同定するものではありません。

## 品質の扱い

構造検査だけで3,600語すべての翻訳・自然さ・多義性を承認してはいません。残りは個別編集確認待ちです。レベル・頻度は配布元の暫定推定、IPA等の任意項目には未入力があります。試験追加に選んだ語のみ語義・例文・対訳・語法・多義性を個別に確認し、対応表で承認を記録します。隔離原本は改変しません。

語義範囲の照合資料（辞書本文の転載はしていません）：[broaden](https://dictionary.cambridge.org/dictionary/english/broaden)、[streamline](https://dictionary.cambridge.org/dictionary/english/streamline?topic=patterns-and-shapes)、[anachronism](https://dictionary.cambridge.org/dictionary/english/anachronism)。

## 再検証

`python scripts/audit-new-dictionary-candidates.py`

結果：`data/dictionary-candidates/20261013/phase1-audit.json`、`quarantine.json`。原本は非公開の学習索引に自動投入されることはなく、既存ビルダーは引き続き `data/dictionary/dictionary-*.json` だけを読みます。リポジトリは公開のため参照ファイル自体は閲覧可能です。

## このPhaseの変更ファイル

- `scripts/audit-new-dictionary-candidates.py`
- `docs/dictionary-new-entries-phase1.md`
- `data/dictionary-candidates/20261013/` の原本4 JSON、baseline.json、github-160-reference.json、phase1-audit.json、quarantine.json。
