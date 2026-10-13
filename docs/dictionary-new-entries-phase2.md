# Phase 2：新規30語の試験追加

Phase 1の隔離対象を除き、語義・英語定義・英日例文・語法・コロケーション・主要な意味範囲を個別に確認した30語のみ追加しました。新規3,600語全体の品質保証ではなく、Phase 3は実施していません。

## 追加と保護

- 本番v3.186の13,500語から13,530語へ。元の13,500エントリのID・語源・語義・例文・その他全フィールドはSHA-256照合で不変。
- 新規IDは `sw-13528`～`sw-13557`。候補の仮IDは原本で保持し、`data/dictionary/new-entry-manifest.json`に対応表を記録。
- 既存JSONの末尾へ追加し、既存配列要素の順序・内容を維持。既存語への上書き・統合はなし。
- `inadvertent` の例文の日本語訳1件だけ、不自然な表現を「報告書に意図せず生じた誤りが混乱を招いた。」へ修正。英語例文の意味は維持し、修正前後・理由を対応表に記録。原本JSONは未改変。
- それ以外の語彙本文は原本どおり。新規ID、承認済status、試験追加タグのみ付与。CEFR・英検・頻度は暫定推定のまま。
- 基礎リリース版はv3.186として保持し、metaに独立した新規追加batch・追加数・最新総数を明記。旧release-manifest/progress等の品質強化履歴は上書きしない。
- 別管理160語は参照のみで追加なし。残り3,570語は未追加（隔離467語、その他3,103語）。

## 30語

misallocation, counterargument, counteract, foreseeable, outweigh, adversarial, counterproductive, debrief, deliberative, deplete, overgeneralize, inadvertent, inherently, disincentive, unprecedented, unwarranted, abstruse, adversity, caveat, coercive, entrenched, hinder, impair, impartial, innate, insightful, misconception, overarching, proactive, tenacity。

`debrief`は動詞と名詞を分けて保持。意味が不足するbroaden・streamline等を無理に試験対象へ含めず、別途編集確認対象としました。語法確認の参考：[deliberative](https://dictionary.cambridge.org/dictionary/english/deliberative)、[disincentive](https://dictionary.cambridge.org/dictionary/english/disincentive?topic=discouraging-and-putting-off)、[debrief](https://www.merriam-webster.com/dictionary/debrief)。出典本文や例文を転記してはいません。

## 再現・検証

```sh
python scripts/add-dictionary-pilot.py
python scripts/check-dictionary-additions.py
python tests/dictionary-additions.py
python data/dictionary/validate_dictionary.py
python scripts/build-dictionary.py
python scripts/check-dictionary.py
python tests/dictionary-rendering.py
node tests/dictionary.cjs
node tests/shared-learning.cjs
node tests/dictionary-browser.cjs
```

追加スクリプトは同一内容なら再実行しても二重追加せず、既存IDや見出し衝突時には停止します。不変検査は既存削除・ID変更・語源変更・語義変更・重複・未承認追加を拒否する回帰テスト付きです。

固定されたv3.186との不変検査は、新規追加専用ブランチ／PRのCIで実行します。今後の独立した既存語品質強化を永久に禁止するチェックにはしていません。追加作業の基準が変わる場合は新しいmainとの照合が必要です。

ローカル検証：不変検査と回帰4テスト、全13,530ページ検証、表示回帰6テスト、既存JS・学習・ブラウザテストが成功。新規30語をそれぞれ検索して詳細へ遷移し、320／390／1280pxで全語義・英語定義・英日例文・語法・コロケーション・学習IDを確認しました。既存語の検索・学習遷移・404候補も成功。追加スクリプトの再実行で27辞書JSONの内容が変わらないことも確認しました。

既存のビルダー・検索実装を利用し、生成方式やゲーム・共通UI・Supabaseには変更を加えていません。追加語が既存語の関連語欄に現れる場合、再生成HTMLには新しい詳細ページへのリンクが付きますが、既存語のJSONは不変です。

## 公開範囲

専用ブランチ `codex/dictionary-new-entries-3600` にPhase別コミットを作成し、PRで確認可能にします。mainへマージせず、本番の辞書件数は13,500語のままです。
