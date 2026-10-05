# すし単 作文添削

`/writing/index.html`: 生徒提出、`feedback.html`: 4桁コードで返却済作文を閲覧、`teacher.html`: 先生管理。

writing-manager main (5930cdf4294b7855c1ff589b146163329356ed88) の画面と処理を移植。
接続先は既存の専用Supabase (`ykrjocftuflnkubaxrza`) のまま。課題・提出・添削・確認コードのデータ移行やSQL再実行は不要。
既存の register_writing_student / get_writing_feedback_by_code RPC、writing_teachers、およびテーブルのRLSをそのまま使用。
元リポジトリのsupabase.sqlは現在のRPC等を含まない初期版のため、移植先にはコピーしない。

教師は従来のメール・パスワードで初回ログインが必要。生徒のクラス・番号・氏名の記憶はブラウザのオリジンに依存するため、旧サイトから初めて移ると再入力が必要。4桁コードは同じものを使用。

一括添削は「未添削をコピー → ChatGPTで添削 → JSON貼付 → 一括反映 → 返却」の従来フロー。新規AI API契約は不要。
公開用publishable keyのみを使用し、教師セッションはすし単の他の認証と別キーに保存。
Service Workerはこの機能とSupabase通信をキャッシュしない。
