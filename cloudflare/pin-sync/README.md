# 本番PIN同期（D1）

本番WorkerのランキングD1版を維持したままPIN同期を追加する。共通設定は `../rankings/wrangler.jsonc`。旧ランキング用設定も結合Workerを指すため、PIN版を取り外さない。

本番22モジュールと照合済み。保存配置に合わせ、結合エントリのランキング相対パスのみ変更した。ルート43件・公開変数・DB bindingは本番と一致。

`PIN_AUTH_FAKE_KEY` と `BLAST_SIGNING_KEY` はCloudflare上の既存secretを保持する。秘密値・移行データ・バックアップは含まない。`build-worker-assets.mjs` はルートの2クライアントと通信モジュールをテキスト資産へコピーする。

`profile-schema.sql` と `d1-schema.sql` は構造の保存用。本番DBは移行済みのため再投入しない。Supabaseの旧エンドポイントは426を返す停止版を保存し、旧書き込みを再開しない。今回の保存作業で再デプロイや追加テストは実施しない。
