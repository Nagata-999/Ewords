# 管理者機能の緊急封印（2026-10-22）

目的は管理者チェックに由来するSupabase通信の停止。DBデータ・SQL・RLS・課金設定は変更しない。

## 停止範囲

- `index.html` の管理者リンクを非表示・操作不可にする。
- `admin/` の4画面は元の画面とスクリプト参照をtemplate内に保存。停止案内のみ表示し、管理者コードをロードしない。
- 6本の既存管理者スクリプトも起動前にフラグを確認。認証、パスワード設定、集計、診断、iframe、タイマーを開始しない。
- `shared/usage-analytics.js` は保存領域アクセス・イベント登録・定期取得・初回送信より前にreturn。未送信キューも再送しない。
- `usage-admin` / `usage-record` はAuth照会・DBクライアント生成より前に503を返す。
- `sushi-id-sync` は `usage_record` のみPIN・プロフィール照会より前に503。他のアクションは維持する。
- 管理者チェック関連にRealtime購読は見つからなかった。タイマーは収集、管理者の期限切れ、試作表示の各起動ガードで止まる。
- PWAキャッシュを更新。収集スクリプトはネットワーク取得に失敗しても古いキャッシュへ戻さず、空のスクリプトで停止する。

`writing/teacher.*` は別Supabaseプロジェクトの作文課題・添削機能であり、今回の利用状況チェックとは別機能のため変更しない。ランキング・PIN同期・ジェム・実績・学習処理も維持する。

## 適用手順

1. `supabase/functions/_shared/admin-feature.ts` を含め、`usage-admin`、`usage-record`、`sushi-id-sync` の3関数を既存の設定のままデプロイする。DBマイグレーションは不要。
2. Web側を公開する。`sw.js` を含めて反映する。
3. 管理者が開いたままの旧タブを閉じて再読み込みする。旧ページ内で既に起動したJavaScriptはソース更新だけでは停止しない。
4. 新しい管理者画面でSupabaseリクエスト0件を確認する。旧クライアントから残る専用API要求について、関数の503応答とDB呼出しがないことを確認する。

ソース変更やPR作成だけでは、本番のEdge FunctionsとWebには反映されない。既存Egress使用量は減らず、一般機能の通信は継続するため、無料枠のアクセス制限回避自体は保証しない。

## 将来の復活

通信量を見直した後に、以下を変更して再デプロイする。

1. `admin/feature.js` の `enabled: false` を `true` にする。
2. `shared/usage-analytics.js` の `ADMIN_USAGE_ENABLED` を `true` にする。
3. `supabase/functions/_shared/admin-feature.ts` の同名フラグを `true` にし、3関数をデプロイする。
4. ホームの管理者リンクの `hidden inert aria-hidden tabindex` と `display:none` を解除する。関連アセットのバージョンとSWキャッシュ名を更新する。

URLやlocalStorageでフラグを切り替える経路は設けていない。既存画面・API・SQL・DBデータは保持する。停止期間の利用記録は収集しない。

## 検証

- `node --test tests/admin-disabled.test.cjs`：通信・タイマー・保存領域・DOM初期化の副作用なし、専用APIと旧usage_recordでDB生成なし。
- `node tests/admin-disabled-browser.cjs`（Playwright）：直接URL5通り、ゲスト/PINの送信待ちキュー、16分経過と離脱を再現し外部通信0件。
- 既存管理者テストは隔離したfixture内だけでフラグを有効化し、復活時の認証・集計・診断・テスト画面も維持されることを検証する。
- 通常PIN同期の既存テストは封印フラグfalseで実行する。既存のusage_record権限テストのみ復活fixtureとしてtrueにする。
- 本番DBのアクセスログを計測した結果ではなく、ローカルのブラウザー観測とDB呼出しを拒否するテストによる検証。
