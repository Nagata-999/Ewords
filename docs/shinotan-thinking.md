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
3. shinotan.html に主導線を追加。shared/shino-thinking.js / .css と data/shino-thinking.json で場面、二択、解説、両語の例文・訳、問い、次の問題を実装。最初は記事の3組。
4. JSONを20組へ拡充。カテゴリ、難易度、用法メモを含む独立スキーマで拡張。
5. 相互リンク、スマートフォン、旧モードと共通記録の回帰検証。tests/shino-thinking.cjs と運用記録を追加。
## 設計
時間制限なしの学習を主ボタンにし、既存の30秒チャレンジは同じページに残します。5問の短いセット、全組、記事の3組を選べます。回答後は解説から問いまで表示し、その下に次へを置きます。音声はブラウザの読み上げ機能のみです。思考の問いに採点は行いません。独立したランキングや通貨は追加しません。
日本語で表現できないという主張、英語学習だけによる思考力向上の断定、語義の絶対的な二分を避けます。追加文章に二連ダッシュは使用しません。
