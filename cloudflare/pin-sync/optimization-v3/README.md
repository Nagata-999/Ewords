# 実績同期の差分取得・集計

2026-11-09、本番D1の既存2,804件を100件単位で移行しました。元履歴は削除していません。完了フラグ1、feed最終連番2,804を確認しています。元履歴から計算した集計値との照合を1回実行し、不一致0件でした。

Worker `ewords` はバージョン `5825d5a0` へ反映済みです。変更前は `2cae5ef1`。本番に直接編集されていたプロフィール処理（learning_revision省略への対応）とbridge配信経路を維持しました。

## ファイルの対応

- `pin-sync/activity-store.mjs` → Worker `pin-auth-poc/activity-store.mjs`
- `pin-sync/profile-store.mjs` → Worker `pin-auth-poc/profile-store.mjs`
- `pin-sync/rewards.mjs` → Worker `pin-auth-poc/rewards.mjs`
- `pin-sync/sync-http.mjs` → Worker `pin-auth-poc/sync-http.mjs`
- `pin-sync/pin-worker.mjs` → Worker `pin-auth-poc/pin-worker.mjs`
- `bridge.js` → Worker `pin-auth-poc/assets/bridge.txt`（リポジトリの `cloudflare/pin-sync/assets/bridge.txt` にも保存）
- `transport.js` → Pages `sushigacha/achievement-transport.js`

これは変更したモジュールの保存先です。認証・ランキング等の全Workerソースを含む独立したデプロイパッケージではありません。WorkerはCloudflareで直接編集されており、mainへのマージだけではWorkerファイルは更新されません。

## 動作

実績保存前後のSELECTを省略し、同じIDの内容矛盾はINSERT内のトリガーで拒否します。サーバー連番による差分受信で、遅れて届いた他端末の記録にも対応します。端末保存成功後にだけ受信済み位置を更新します。旧クライアント・旧サーバーへの互換性を残しています。

全正解数、単語ゲーム、TOEIC、1日のゲーム種類数の実績判定は集計値1行を読みます。コンボ等の順序に依存する判定は変更していません。

本番リリースでは `PIN_SYNC_OPTIMIZED` が文字列 `false` 以外なら新方式を使います。これは移行完了後にのみデプロイした設定です。`false`にすると従来の読み取り方式へ戻ります。必要ならWorkerバージョン `2cae5ef1` へ戻せます。集計トリガーは継続するため、書き込み処理自体の問題は別途対処が必要です。

## 移行・検証の範囲

初期移行のSQLは本番適用済みです。再実行しないでください。分割移行関数は管理用で、ゲーム・ログイン・定期タスクから自動実行しません。

テストはローカルのSQLite `:memory:`で6件成功。本番では必要なスキーマ確認、分割移行、進捗確認、1回の集計照合だけを行い、ゲームや同期APIを繰り返し呼ぶ負荷試験は行っていません。削減率の実測はまだありません。

読み取り削減の代わりに、feedと集計維持の書き込み・容量は増えます。初回の差分同期では全履歴を取り込み、以後は追加分のみになります。全端末を一斉に再読み込みする必要はありません。

feedの連番を再作成・初期化しないでください。元イベントは追記専用で、UPDATE/DELETEを拒否するトリガーがあります。将来アカウント削除を実装する場合は関連する集計・feed・端末カーソルも扱う設計が必要です。
