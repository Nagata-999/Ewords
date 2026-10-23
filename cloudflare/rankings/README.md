# ランキング D1（本番切り替え済み）

Worker `ewords`、D1 `sushitan`、binding `DB`。
`integrated.mjs` はランキング API と対象ページへのクライアント挿入を担当し、既存 Worker の語源判定は `legacy-worker.mjs` で保持する。
`ranking-client.txt` は `shared/ranking-d1.js` の有効版。両方を同時に更新する。
PIN同期・管理者封印・Supabaseデータは変更していない。

検証: `node --test tests/ranking-d1.test.mjs`。スナップショットを使う場合は `RANKING_SNAPSHOT` を設定する。
Wrangler設定は本番に合わせて更新済み。`BLAST_SIGNING_KEY` は既存Workerのsecretを保持すること。秘密値・データはこのソースに含めない。
旧タブは再読み込みが必要。切り替え後の旧タブからのSupabase書き込みは自動回収しない。
稼働中の変更はCloudflareに直接デプロイ済み。このソース保存のための再デプロイは不要。
