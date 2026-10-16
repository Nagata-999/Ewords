# しのたん：言葉の違いと思考の学習
## Phase 1 調査（2026-10-16）
基点: 7f37161eda7f5862df623943942672cb7192e7ec
- 全体は静的HTML。トップ index.html の「読みもの」が記事一覧で、ai_english_article.html が既存の読みもののデザイン例。専用CMSはありません。
- shinotan.html はインラインの30秒ゲーム。data/words_master_v2_reviewed.json の synonyms を読み込みます。既存の startGame、handleTap、スコア保存、ランキングを維持します。
- shared/player.js と shared/scores.js がプレイヤー名とSupabaseへのスコア送信を担当します。新モードの時間無制限の成績を既存ランキングへ混ぜません。
- sushigacha/achievement-events.js の answer が共通の実績履歴です。新モードも shinotan としてこのAPIを一回答一回呼びます。専用保存・報酬台帳は作りません。
- 既存のデイリー処理は shinotan.html の正解バルーン監視です。新モード用の確定回答イベントを同じ加算処理につなぎます。誤答、二重クリック、復習の重複加算を防ぎます。
- shared/learning.js は登録された単語単位の苦手管理です。概念ペアを架空の辞書IDとして登録しません。新モードの履歴は共通実績、間違いの再挑戦はその回のメモリ内で扱います。
- shared/shino-review.js の従来モードの復習はそのまま残します。
- sushigacha/gem-system.js、multi-game-lucky-gems.js、site-taskbar.js の既存読み込みを維持します。タスクバー下部余白を確保します。
- sw.js はネットワーク優先。追加アセットは版付きURLにし、JSON取得失敗時には再試行を表示します。
## 変更対象
1. この記録を独立コミット。
2. english-thinking.html を既存記事と同じ配色・レイアウトで追加。index.html と sitemap.xml に登録。
3. shinotan.html にサブコーナーへの導線を追加。shared/shino-thinking.js / .css と data/shino-thinking.json で場面、二択、解説、両語の例文・訳、問い、次の問題を実装。最初は記事の3組。
4. JSONを20組へ拡充。カテゴリ、難易度、用法メモを含む独立スキーマで拡張。
5. 相互リンク、スマートフォン、旧モードと共通記録の回帰検証。tests/shino-thinking.cjs と運用記録を追加。
## 設計
しの単は従来のゲームを主役に保ち、開始ボタンの表記も「しの単」とします。時間制限なしの学習は、しの単の下にあるサブコーナー「シノニムの微妙な違い」に配置します。5問の短いセット、全組、記事の3組を選べます。回答後は解説から問いまで表示し、その下に次へを置きます。音声はブラウザの読み上げ機能のみです。思考の問いに採点は行いません。独立したランキングや通貨は追加しません。
日本語で表現できないという主張、英語学習だけによる思考力向上の断定、語義の絶対的な二分を避けます。追加文章に二連ダッシュは使用しません。

## Phase 2–4 完了
- 記事: 61ec9bb。english-thinking.html、index.html、sitemap.xml。既存記事のスタイルに合わせ、7節、参考辞書、記事3組の開始リンクを追加。
- 基本機能: 0dfbf23。shinotan.html、shared/shino-thinking.js / .css、data/shino-thinking.json、tests/shino-thinking.cjs。
- 20組: 2a3b59c。data/shino-thinking.json。厳密な類義語以外の比較も含み、意味が重なる組は文型・焦点を明示。

## 問題追加手順
data/shino-thinking.json の version:1 と questions 配列を維持して追加します。
- id: 一意な小文字英字とハイフン。公開後は履歴の識別に使うため変更しません。
- words: 2件の {word, meaning}。meaning は日本語で、比較している用法を指定します。
- question: 日本語の場面、または短い英文。どちらも自然に正解になる場合は文脈を絞ります。
- choices: 二つの英単語。answer はそのどちらかと完全一致させます。表示順はランダムです。
- explanation: 違いに加え、重なりや別義など、単純化しすぎない注意を含めます。
- examples: 両語それぞれの {word, en, ja}。例文と訳は編集者が作成します。
- reflection: 人生観や経験を振り返る問い。採点や回答保存は行いません。
- category: 表示用カテゴリー。difficulty: 1〜3の教材内の目安です。CEFR判定ではありません。
- 記事のセットは loneliness-solitude、equality-equity、efficiency-effectiveness の安定IDを使います。
- 100組以上へ増やしても同じ読込方式です。短いセットは5問、全組モードは配列全体を使います。

追加後は node tests/shino-thinking.cjs を実行し、スマートフォンで長い文の折り返しを確認します。日本語の追加文章に二連ダッシュを含めません。

## 語義の確認
例文と説明は教材用の独自文章です。特に区別が曖昧になりやすい組を次の辞書で確認しました。
- [Cambridge: solitude](https://dictionary.cambridge.org/us/dictionary/english/solitude)、[APA: loneliness](https://dictionary.apa.org/loneliness)
- [equality](https://dictionary.cambridge.org/dictionary/english/equality)、[equity](https://dictionary.cambridge.org/dictionary/english/equity)
- [efficiency](https://dictionary.cambridge.org/dictionary/english/efficiency)、[effectiveness](https://dictionary.cambridge.org/dictionary/english/effectiveness)
- [sympathy](https://dictionary.cambridge.org/us/dictionary/english/sympathy)、[empathy](https://dictionary.cambridge.org/dictionary/english/empathy)
- [envy](https://dictionary.cambridge.org/us/dictionary/english/envy)、[jealousy](https://dictionary.cambridge.org/us/dictionary/english/jealousy)
- [tolerance](https://dictionary.cambridge.org/us/dictionary/english/tolerance)、[convention](https://dictionary.cambridge.org/us/dictionary/english/convention)
- [take pleasure in](https://dictionary.cambridge.org/dictionary/english/take-pleasure-in)、[confidence](https://dictionary.cambridge.org/dictionary/english/confidence)、[fulfillment](https://dictionary.cambridge.org/dictionary/english/fulfillment)

## Phase 5 検証
- shino-thinking.cjs: 20組以上、ID重複、全必須情報、選択肢、回答の二重処理防止、誤答復習、リンク、デイリー1回加算と20問到達時の一度だけの10ジェムを確認。
- learning-paths.cjs: 既存出題例、復習の重複排除・100組上限・保存不可時、旧ガイド導線、ゲーム広告除外、インラインJS構文を確認。
- achievement-events.test.cjs: 共通実績6テスト通過。
- player-scores.test.cjs: 名前・ゲスト・オフライン再送・送信先・日付繰り越しと247個のインラインスクリプト解析が通過。
- auto-ranking-games.test.cjs: 14種類の保存処理、二重送信防止、復習除外が通過。
- shared-learning.cjs: 既存の単語ID、ゲーム間履歴、習熟、複数タブ、移行、保存失敗のテストが通過。
- ローカルブラウザ: 未ログインで記事→3問→2問正解/1問誤答→誤答1組の復習→完了→従来30秒ゲームの起動を確認。ゲーム→記事のリンクも確認。
- 390px幅と320px幅、1280px幅を確認。320pxでダイアログ内の横はみ出しなし。PCでは比較カードが2列、狭い画面では1列。下部タスクバーより上にダイアログ下端を確保。
- JSON取得に503を返す検証用サーバーでエラー案内を確認し、復旧後の「読み込みを再試行」で問題へ復帰。
- 音声は対応ブラウザの読み上げに依存します。音質や実機スピーカーからの再生は未確認です。
- 新モードの途中経過・誤答キューはメモリ内のみです。回答実績は既存共通台帳に記録します。独自の永続化や通貨処理は追加していません。
- Supabaseの認証・スキーマ・RPCは変更しません。既存モードのオンライン保存はテストで確認し、本番ランキングへの意図的なテスト投稿は行いません。

## 配置の確定（2026-10-16）
しの単の従来の説明・出題例・主導線を復元しました。サブコーナー「シノニムの微妙な違い」は主メニューの下に配置します。記事からはサブコーナーの3組へ直接移動します。トップのしの単紹介も従来ゲームの内容を維持します。問題、学習フロー、共通記録の連携は継続します。
