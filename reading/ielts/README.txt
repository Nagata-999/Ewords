IELTS v2.1.1 SET2 修正版

重要：
このZIPの中には「ielts」フォルダを入れていません。
ZIPを解凍すると index.html / reading.html / css / js / data が直接出ます。

アップロード先：
公開中の /reading/ielts/ を開き、
ZIPから出た中身をすべてそこへアップロードして上書きしてください。

正しい配置：
reading/ielts/index.html
reading/ielts/reading.html
reading/ielts/css/reading.css
reading/ielts/js/library.js
reading/ielts/js/reading.js
reading/ielts/data/manifest.json
reading/ielts/data/2-1.json
reading/ielts/data/2-2.json
reading/ielts/data/2-3.json

間違った配置：
reading/ielts/ielts/index.html
↑ この二重フォルダになると、公開ページは古いファイルを読み続けます。

アップロード後：
Cloudflare Pagesのデプロイ完了を待ち、
Ctrl + F5で強制再読み込みしてください。
