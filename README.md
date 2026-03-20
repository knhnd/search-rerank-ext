# Search Re-Rank Extension

Google の検索結果を並び替える Chrome 拡張。

### TypeScript Setup

TypeScript × Node.js のセットアップ

- プロジェクトルートで `npm init` し `package.json` を作成
- `npm install typescript --save-dev`
- `npm install @types/node --save-dev`
- `tsc init` で TypeScript の設定ファイルである `tsconfig.json` を作成
  - 設定内容は `tsconfig.json` を参照
- `tsc file_name.ts` でトランスパイル
  - プロジェクトルートで `tsc` だけ実行するとプロジェクト内のすべての `.ts` ファイルがトランスパイルされる
  - このとき `tsconfig.json` で指定したディレクトリとビルドファイルが作られる（今回は `dist`）

### Chrome Extension Setup

[公式ドキュメント](https://developer.chrome.com/docs/extensions/get-started?hl=ja)と [Chrome Extensions Tutorial](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world?hl=ja) を参考にすすめる

- `npm i chrome-types` で VSCode の Chrome API オートコンプリートを有効化
- `manifest.json` を作成
  - Chrome 拡張の設定ファイルで必要なことはすべてここに記述

※ TypeScript のビルドによるディレクトリのクリーンアップで `manifest.json` が消えないようにプロジェクトルートなど `dist` 以外に置いておく。

### Webpack Config

TypeScript × Node.js で Chrome 拡張を開発する場合には、`package.json` や `tsconfig.json` だけではモジュールの設定ができないので別途 Webpack の設定が必須

- `npm install webpack`
- `npm install ts-loader`
- プロジェクトルートに `webpack.config.js` を作成
  - Webpack を用いた TypeScript のビルド設定などを記述（詳細はファイルを参照）
- `tsc` の代わりに `npm run build` でビルド

### 動作確認

1. Chrome ブラウザのタブに `chrome://extensions` と入力して拡張機能ページへ移動
2. ページ右上にある「デベロッパーモード」を ON
3. 「パッケージ化さえていない拡張機能を読み込む」をクリック
4. Chrome 拡張のコードが入ったディレクトリを選択しアップロード
   - `tsc` でコンパイルしてできる `dist/chrome-ext` を選択
   - TypeScript をトランスパイルしてできた `.js` ファイル以外に `manifest.json` や `img` があることを確認
5. 拡張機能一覧にアップロードした拡張エラーなく表示されれば OK
6. ブラウザ右上の拡張機能マークを押して作成した拡張を実行
7. ソースコードに変更を加えたら「更新」で反映

#### Contents Script

[コンテンツスクリプト](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts?hl=ja)は、Web ページで実行されるスクリプトで表示中のページを読み取って拡張機能に渡すことができる。

- `manifest.json` にコンテンツスクリプトに関する記述を追加
  - 拡張機能が動作できる Web ページの URL を `matches` に記述
- `content.js` を作成
  - DOM 操作によってページの要素を取得できる
  - DOM はデベロッパツールで確認する

### Links

- [TypeScript](https://www.typescriptlang.org/)
- [TypeScript Deep Dive 日本語版](https://typescript-jp.gitbook.io/deep-dive)
- [Chrome for Developers (Chrome Extensions)](https://developer.chrome.com/docs/extensions?hl=ja)
