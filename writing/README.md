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

## 教員別の課題管理
課題の teacher_id は Supabase Auth の教員UUID。新規課題はログイン中の教員IDを保存し、DBのデフォルトも auth.uid() を使用する。旧writing-managerから作成しても所有者が付く。
課題と提出作文のSELECT/UPDATEは所有者のみ。INSERT時の他人ID指定、UPDATE時の所有者変更もRLSで拒否する。生徒は従来通り公開課題から選択し、確認コードで自分の添削を閲覧する。
導入SQLは teacher-ownership.sql。導入時の登録教員は1人であり、既存2課題をその教員へ引き継いだ。複数教員環境では所有者未設定課題を自動割当せず中断する。新たな先生はSupabase Authアカウント作成とwriting_teachersへの登録が必要。
