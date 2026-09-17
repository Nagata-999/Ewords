# 全ゲーム共通・苦手単語復習

## 接続済み
すし単、RUN、すし暗、flow（大文字URLも）、すし斬り、3D。通常プレイと苦手復習の両方で記録する。
ホームの「苦手単語を復習」から各ゲームへ進める。RUN・flow・斬り・3Dでは開始画面のチェックで通常/復習を切り替える。すし単・すし暗は既存の復習ボタンを使用する。

## API と新ゲームの参加
HTMLのゲームスクリプトより前に `shared/word-registry.js` と `shared/learning.js` を読み込む。

```js
const id = SushiLearning.resolveWordId({en: 'available'});
SushiLearning.recordAnswer(id, false, 'sushigiri');
const progress = SushiLearning.getWordProgress(id);
const weak = SushiLearning.getWeakWords(); // 固定ID、語彙、学習集計を含む優先順の配列
const review = SushiLearning.getReviewWords(20);
const stats = SushiLearning.getStats();
const backup = SushiLearning.exportData(); // version、固定ID、元イベント、集計
```

回答済みフラグをゲーム側で確認し、一問一回答の確定箇所で呼ぶ。すし単と斬りでは、初回誤答を1回記録し、同じ問題のやり直し成功は連続正解に数えない。RUNでは表示中の問題を捕捉し、次問を記録しない。3Dの障害物衝突は語彙の間違いとして扱わない。flowは「思い出せた／まだ苦手」を押した場合だけ記録する。

語彙台帳のIDは不変。既存IDの振り直し・使い回しは禁止。新語は末尾に新IDで追加し、既存語の表記変更は同じIDの `aliases` に追加する。元の語彙JSONやゲーム固有データは変更していない。

## 苦手度・克服
`SushiLearning.CONFIG` に調整値を集約した。不正解+30（上限100）。正解-8、連続正解で追加軽減。最後の間違い以降に苦手度0かつ4連続正解・2ゲーム以上、または同一ゲームでも6連続正解で克服。苦手度が高ければさらに正解が必要。再び間違えると苦手に戻る。長期間未復習の優先度は上げるが、保存された苦手度自体は時間だけで増減させない。

復習出題は優先度の高い最大20語から（CONFIG.reviewBatch）。すし暗は一回最大20問。通常ランキングと端末BESTには復習成績を送らない。ゲーム内のスコア・コンボ・効果音・操作性は既存のまま。

## 保存と移行
同じorigin・同じブラウザのlocalStorageを共有する。別端末や別ブラウザとの同期はまだない。SupabaseのDB・RPC・キーに変更はなく、追加SQLは不要。

`sushitan_learning_v1:event:<event_id>` にversion=1のイベントを追記する。各イベントには固定word_id、game_id、correct、count、atがある。イベントIDごとに保存するため複数タブの更新で他の回答を上書きしない。再読込・別タブでも同じイベントから同じ集計を構築する。集計は単語別に再計算し、呼び出し側にはコピーを返す。

旧すし単・すし暗の弱点一覧は初回に取り込む。移行イベントのIDは決定的で、同じ語が複数表記で保存されている場合はミス回数を合算する。移行マーカーは `sushitan_learning_v1:migration:<game>`。元のキーは消さない。すし暗はv2があればv1を重複取込しない。旧履歴にない総正答数・日時は推測せず、旧「一度正解した単語」を新しい克服判定には使わない。

壊れたJSONや未対応versionは保持して警告し、上書きしない。保存が拒否された場合や容量上限では、そのページ内のメモリに記録を継続し警告を表示する。イベントは履歴の根拠として保持し、自動削除しない。長期の大量利用に向けたIndexedDB移行・圧縮は将来のversion migrationで扱える。現時点では容量を超えた新規イベントはページを閉じると失われるため、警告時はexportDataで退避可能。

将来のSupabase同期ではイベントIDを冪等キーとして、認証ユーザーと紐付けて送信する設計。今回、未認証の学習履歴送信やランキングテーブルの流用は行わない。

## デイリークエストの接続口
`sushi-learning-answer` と `sushi-learning-mastered` のCustomEventを発行する。

```js
window.addEventListener('sushi-learning-answer', ({detail}) => {
  // detail.event.id / word_id / game_id / at
  // detail.was_review: 回答前に復習対象だったか
  // detail.mastered: 今回の回答で克服状態へ遷移したか
  // detail.persisted: 永続保存に成功したか
});
```

クエスト側で日付・単語IDの重複を除外して「5語復習」「3語克服」に使える。再読込後の補完はexportDataのイベントで可能。既存クエスト・ジェム台帳への新しい加算は今回追加していない。ホームの「今日」は日本時間0時、既存クエストの6時区切りは保持する。

## 検証
`node tests/shared-learning.cjs`：ID、全語彙解決、保存/再読込、旧データ、表記違い合算、複数タブ相当、破損・保存失敗、未対応version、克服・再発、日本時間日跨ぎ、経過日優先度。

PlaywrightとChromium/Chromeのある環境で、`node tests/browser-learning.cjs [run|sushian|flow|giri|3d|home]` を各々実行する。各実行の冒頭ですし単の通常/復習も検証する。外部サービスは遮断しSupabaseクライアントはスタブに置換するため、本番ランキングを汚さない。`PLAYWRIGHT_MODULE` と `CHROME_PATH` は必要に応じて指定できる。

実ブラウザで通常/復習、単語1件の選択肢、正誤・自己評価、斬りのキー入力、3D WebGL、ホームのリンク・件数・別タブ反映、モバイル幅、PWA共通資産キャッシュを確認した。

追加レビューで、斬りのフィーバー中クリティカル演出（停止72ms、次問70ms）でも次問へ進めるように修正した。回答済みの敵の攻撃を無視し、終了したラウンドを演出タイマーが再開しないこともブラウザ回帰テストで確認している。

既存問題：upstream 43c3931の `sushigacha/avatar-modern.js` 50行付近に構文エラーがあり、RUNで読み込む際に発生する。今回の差分には含めず、ブラウザ検証ではこの既知のファイルのエラーのみを区別する。元の語彙データ・報酬スクリプト群はバイト比較で変更なし。
