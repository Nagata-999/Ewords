# 共通学習履歴：調査・設計（upstream 43c3931）

## 既存構造
|対象|単語|正誤・復習入口|
|---|---|---|
|sushitan.html|data/words_master_v2_reviewed.json / 2026語 {en,jp,synonyms,antonyms}|handleTap, handleReviewTap, recordMistake, availableReviewWords|
|sushi_run.html|埋込 WORDS {en,jp,pos}|success / fail。currentWord は回答前に次問へ進むため active question を別途保持|
|sushian.html|埋込 VOCAB {id,word,meaning} / 2026語|answer（session.answeredで一度だけ）、startWeakReview|
|sushiflow.html, SushiFlow.html|data/words_master.json / 3440語 {word,ja,...}|自動表示のみ。明示的な自己評価を追加|
|sushigiri.html|data/words_master_v1.json の先頭2000語|hitComplete / enemyAttack / 入力不一致。一問の初回誤入力だけ不正解、誤入力後の完成は正解にしない|
|sushi-run3D.html|埋込 WORDS を en で重複除去|resolveAnswer、障害物衝突は語彙不正解にしない|

すし暗の id 1〜2026 と reviewed v2 の英単語順は全件一致。英語の正規化後の重複は v1/v2 とも0件。v1 には追加1414語がある。v1 の配列順は異なる。元のデータは変更せず、固定台帳 shared/word-registry.js に sushian:0001〜2026、追加語 extra:0001〜1414 を固定する。正規化文字列はIDの解決にのみ使用し、保存キーは固定ID。台帳の並べ替えでIDは変わらない。表記変更は既存IDに aliases を追加する。

## 保存・共通機能
学習記録は localStorage。すし単 sushitan_word_review_v1、すし暗 sushian:v2:learningState（旧v1あり）。元のキーは残して一度だけ共通領域に取り込む。旧すし暗のmasteredは一度正解の指標であり、共通の「克服」に移行しない。
ランキングはSupabase scoresとdaily_high_scores、およびsave_high_score / save_score_with_daily / get_daily_high_scores。すし単core系、RUN wordrush、3D wordrush3d、斬り sushi_slash。既存通信・DBは変更しない。復習モードの記録は通常ランキング・端末BESTに混ぜない。
index.html と sushigacha/{daily-quest-click-bridge,daily-quest-links,gem-system,game-gem-bridge,multi-game-lucky-gems,sushitan-lucky-gems,run-gem-pickups,site-taskbar}.js が共通報酬・UI。ログイン台帳 sushitan_login_bonus_v1、進行 sushitan_daily_active_v1。クエスト日は既存の午前6時区切り。学習統計の「今日」は日本時間0時。報酬台帳には直接書き込まない。学習イベントを将来のクエスト用に発行する。
sw.js は network-first。新しい台帳・スクリプトも同一originで提供しPWAキャッシュに加える。

## 追加・変更範囲
shared/word-registry.js（固定語彙台帳）、shared/learning.js（唯一の履歴操作API）、shared/review-ui.js（共通モード選択）、tests/shared-learning.cjs、各6ゲーム（flowの大文字別名も。大文字版にはホームへの戻るリンクがない差分を保持）、index.html、sw.js。元語彙JSON・Supabase・報酬JSは変更しない。

## 主なリスクと対策
- RUNの回答対象と次問の取り違え：activeQuestionを捕捉。
- 1語だけの復習：誤答候補は通常語彙から、無限再抽選を廃止。
- タイマー/連打の重複記録：既存ロックを利用し、斬りには一問フラグ。
- flowの表示を正答と誤認：自己評価した場合のみ記録。
- 旧キーの再取込・データ消失：移行マーカー、元キー保持、壊れた形式は上書きしない。
- 複数タブ：全環境でイベント単位の独立キーに追記し、read-modify-writeの上書き競合を防止。変更があった単語だけ集計を再計算。
- 保存不可：一時メモリで継続し警告。将来versionは読取専用扱い。
- ゲームごとの変数スコープ：ゲーム内に小さい呼出しを入れ、グローバル関数の後付け置換を避ける。

段階ごとにモジュールテスト、スクリプト構文検査、ブラウザで通常/復習を確認して進める。
