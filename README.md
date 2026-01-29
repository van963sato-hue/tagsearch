# Prompt Tag Finder (v0.1.2)

ブラウザで動く、プロンプト用タグ検索ツールです。
日本語タグ／英語タグ／カテゴリで検索できます。
NSFWはデフォルト非表示で、UIの「NSFW表示」をONにした時だけ候補に出ます。

## 使い方（ローカル）
- このフォルダをそのまま開き、`index.html` をブラウザで開く
  - ※ Chrome/Edge などではローカルfileのfetch制限が出る場合があります。
    その場合は「ローカルサーバ」か、Netlify / GitHub Pages で開くのが確実です。

## Netlify Drop（おすすめ）
- Netlify Drop にこのフォルダをドラッグ＆ドロップするだけで公開できます。

## データ更新
- `data/tags.v0.1.2.json` を新しい `tags.<version>.json` に差し替え
- `app.js` の `DATA_URL` を更新

## データについて
- 公開配布版は「allow=true」のタグのみ収録しています。
- 未成年・非同意・獣姦・屍体などに該当するものは収録していません。
