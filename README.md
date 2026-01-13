# Kindle Highlights → Readwise (Amazon.co.jp) Chrome拡張（MVP）

Amazon.co.jp版のKindleノートブック（`read.amazon.co.jp`）を開いている状態で、表示中の本のハイライトを抽出し、Readwise APIへ送信するChrome拡張（Manifest v3）です。

## できること（現状）

- Amazon.co.jp / Amazon.com のKindleノートブック上で、**表示中の本**のハイライトを抽出
- ReadwiseのAPIへ **highlight** として送信（`source_type: kindle` / `category: books`）
- ノートブックのライブラリ一覧から **一括取り込み**（順番に遷移して各本を取り込み）
- Readwise側に同一書籍がある場合、既存ハイライト（テキスト＋位置）と突き合わせて **重複をスキップ**

## まだできないこと（MVPなので未対応）

- ライブラリ全冊の一括取り込み
- 取り込み済み判定・差分同期
- 章/見出しなどの高度なメタデータ

## 使い方（ローカルで読み込み）

1. Chromeで `chrome://extensions/` を開く
2. 右上の「デベロッパーモード」をON
3. 「パッケージ化されていない拡張機能を読み込む」→ このリポジトリの `extension/` フォルダを選択
4. 拡張の「詳細」→「拡張機能のオプション」から **Readwise API Token** を保存  
   - Tokenは `https://readwise.io/access_token` から取得できます
5. Kindleノートブックを開く  
   - 例: `https://read.amazon.co.jp/kp/notebook`（ログインが必要）
6. 取り込みたい本を表示した状態で、拡張アイコン → 「このページから取り込み」
7. ライブラリ一覧を開いた状態なら、拡張アイコン → 「ライブラリを一括取り込み」

## 開発メモ

- 本体: `extension/`
  - `contentScript.js`: KindleノートブックDOMからハイライト抽出（セレクタは複数フォールバック）
  - `background.js`: Readwise API送信（バッチ分割してPOST）
  - `popup.html/js`: 取り込みボタンUI
  - `options.html/js`: Token保存/検証
