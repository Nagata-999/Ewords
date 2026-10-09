# 実績同期の修正と適用手順

## 修正内容

- プロフィール同期と報酬受取を端末内で直列化し、処理中の獲得・消費を未同期イベントとして保持する。
- サーバー保存は更新時刻・元の ledger・learning が一致した場合だけ更新する。競合時は再読込して再試行する。
- 表示履歴の1000件制限とは別にイベントIDを保持し、再送による二重加算を防ぐ。累計獲得ジェムと最長ログイン連続日数を保持する。
- 実績報酬イベントはサーバー受取処理だけが発行する。補填処理は追加しない。
- ランクの解放と選択を分離し、選択色・論理更新番号・端末IDを同期する。ゲーム最高スコアは最大値を同期する。
- 以下11ゲームで回答直後に正誤を記録する: sushitan / shinotan / antonitan / sushi_idiom / toeic / sushi_blast / sushicross / sushitalk / sukaishi / sushi_quiz / sushigiri。共有学習イベントを使う他ゲームは共通フックで記録する。クイズの対戦相手の回答は自分の実績に加算しない。
- PC・スマホで実績画面、色選択、受取不可状態、獲得演出を検証した。

## 本番適用状況（2026-10-10）

ユーザーの本番適用許可を受け、3つのSQL関数と sushi-id-sync v28 を適用済み。条件付き保存RPCの存在・anon実行不可・service_role実行可能を本番で確認した。新規の有料サービスは不要。以下は適用順序。

1. 現行 Edge Function と下記2つの既存報酬関数の定義を保存する。
2. `supabase/review/save-profile-if-current.sql` を適用する。新しい条件付き保存RPCは service_role にのみ実行を許可する。
3. `supabase/review/claim-profile-milestone.sql` と `supabase/review/claim-login-streak.sql` を適用する。既存の排他制御・受取記録・加算処理は保持する。
4. `supabase/functions/sushi-id-sync/index.ts` を既存プロジェクトの sushi-id-sync に配備する。手順2のRPCが必要なので、先にEdgeだけを配備しない。
5. フロントエンドを公開し、2端末で回答・獲得・消費・色選択・実績受取を確認する。同一実績の再受取とイベント再送で残高が増えないことを確認する。

SQLは supabase/review に保存したレビューソース。Supabaseの achievement_sync_integrity_20261010 マイグレーションで適用済み。問題があれば保存したEdge・既存報酬関数を戻す。追加RPCやJSON内のIDは残しても旧版の動作を妨げない。データを削除して戻さない。

## 検証

Node.js 24:

```sh
node --test tests/achievement-*.test.cjs
node tests/shared-learning.cjs
```

`tests/achievement-rpc.cjs` は PGLITE_MODULE で指定した @electric-sql/pglite@0.3.14 を使い、使い捨てPostgresで3つのSQL・受取の一意性・競合・実行権限を検証する。CIにも登録済み。本番DBに書き込まない。

`tests/achievement-browser.cjs` と `tests/taskbar-gem-effects.cjs` は PLAYWRIGHT_MODULE と CHROME_PATH を指定して実行する。前者のスクリーンショット出力先は ACHIEVEMENT_SCREENSHOT_DIR で指定できる。

## 制約

修正前に既に切り捨てられた一般ジェムイベントID・累計履歴は復元できない。既存履歴から安全に開始し、推測による補填は行わない。イベントID保存は今後増加するため、実運用でJSONサイズを監視する。既存のジェム獲得入力の信頼モデルや、複数端末によるオフライン消費の仕様は変更していない。

既存 sushicross 単体テストのcanvasモック不足は残っているため、リポジトリ全テスト成功とはしていない。

デイリー・ログボ追加検証: 受取中の古い同期応答でも残高・受取済み・最長記録を維持。タスクバー単独/Gem APIあり/演出読込遅延のPC・スマホで、4クエスト40＋コンプリート50＋ログボ10＝100ジェムの獲得イベント、同期の再送、再読込、同日の再受取防止を確認する。
