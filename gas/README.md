# GAS（Google Apps Script）

`index.html` のフォームから呼び出している Apps Script のソースを管理するディレクトリです。
[clasp](https://github.com/google/clasp) でスクリプトエディタと同期します。

- プロジェクト名: `english-writing-export-batch`（スプレッドシートにバインドされたスクリプト）
- スクリプトID: `1TeXL5VXuJ6IzLXwN3QYNL1lPsx7tWxlwJCGC0aC8ZPjmOUBapqbZ-lrJ`
- Webアプリのデプロイ ID（`index.html` の `gasUrl` で使用中）:
  `AKfycbyZI_HixcbDBdU6BqVpoAf1dKxD2NUmdYhGrlw0o15oUCVseQLenH0wit5RpizsoBjX`

## 初回セットアップ

```bash
npm install -g @google/clasp
clasp login            # 認証情報は ~/.clasprc.json に保存される（コミットしない）
```

事前に https://script.google.com/home/usersettings で「Google Apps Script API」をオンにしてください。

## コードの取り込み（エディタ → リポジトリ）

```bash
cd gas
clasp pull
git add . && git commit -m "Pull GAS source"
```

## 反映（リポジトリ → エディタ）

```bash
cd gas
clasp push
# Webアプリの公開URLを変えずに新しいバージョンを公開する場合
# （-i を付けないと新しいデプロイ＝新しいURLが作られ、index.html の書き換えが必要になる）
clasp deploy -i AKfycbyZI_HixcbDBdU6BqVpoAf1dKxD2NUmdYhGrlw0o15oUCVseQLenH0wit5RpizsoBjX -d "説明"
```

## 注意

- スプレッドシートID・APIキー・メールアドレスなどはコードに直接書かず、
  スクリプトプロパティ（`PropertiesService.getScriptProperties()`）に置いてください。
- エディタで直接編集した場合は、必ず `clasp pull` してからコミットしてください。
