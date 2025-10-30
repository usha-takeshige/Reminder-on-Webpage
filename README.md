# Reminder-on-Webpage

Webページリマインダー Chrome拡張機能 - 特定のWebページにアクセスした際に、事前に登録したリマインダーを表示します。

## 機能概要

- 特定のURLにアクセスした時に自動的にリマインダーを表示
- URL前方一致方式で柔軟なマッチング
- 直感的なポップアップUIでリマインダーの登録・管理
- 複数リマインダーの同時表示
- 個別完了・一括閉じる機能

## プロジェクト構造

```
Reminder-on-Webpage/
├── extension/              # Chrome拡張機能本体
│   ├── manifest.json      # Manifest V3設定ファイル
│   ├── popup.html         # 拡張機能ポップアップUI
│   ├── popup.js           # リマインダー登録・管理ロジック
│   ├── popup.css          # ポップアップスタイル
│   ├── content.js         # Webページへのリマインダー表示
│   ├── content.css        # リマインダーポップアップスタイル
│   └── icons/             # 拡張機能アイコン
│       ├── icon16.png     # 16x16アイコン
│       ├── icon48.png     # 48x48アイコン
│       └── icon128.png    # 128x128アイコン
├── docs/                  # ドキュメント
│   └── requirements.md    # 要件定義書
├── CLAUDE.md             # Claude Code用コンテキスト
└── README.md             # このファイル
```

## セットアップ

### Chrome拡張機能の読み込み

1. Chromeで `chrome://extensions/` を開く
2. 右上の「デベロッパーモード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. このプロジェクトの `extension/` フォルダを選択

## 使い方

### リマインダーの登録

1. Chrome拡張機能アイコンをクリック
2. URLフィールドに現在のページURLが自動入力される（編集可能）
3. リマインダー内容を入力
4. 「登録」ボタンをクリック

### リマインダーの表示

- 登録したURLと前方一致するページにアクセスすると、自動的にリマインダーが表示される
- 複数のリマインダーがある場合は、すべて一覧表示される

### リマインダーの操作

**Webページ上:**
- 「完了」ボタン: そのリマインダーをストレージから削除
- 「すべて閉じる」ボタン: ポップアップを非表示（リマインダーは保持）

**拡張機能ポップアップ:**
- 「削除」ボタン: 登録済みリマインダーを削除

## 技術仕様

### URL照合方式

前方一致方式を採用:
```javascript
currentUrl.startsWith(registeredUrl)
```

**例:**
- 登録URL: `https://example.com/shop`
- マッチ: `https://example.com/shop/products`
- マッチ: `https://example.com/shop/cart`
- 非マッチ: `https://example.com/blog`

### データ構造

```javascript
{
  reminders: [
    {
      id: "uuid",                          // ユニークID
      url: "https://example.com/shop",     // 照合用URL
      text: "クーポンコードを入力すること",  // リマインダー内容
      createdAt: "2025-10-31T10:00:00Z"   // 作成日時（ISO 8601）
    }
  ]
}
```

### 使用技術

- Chrome Extensions Manifest V3
- JavaScript (Vanilla)
- HTML/CSS
- chrome.storage.local API
- Content Scripts

### 主要な実装ポイント

1. **セキュリティ**: XSS対策のため、ユーザー入力をサニタイズ
2. **パフォーマンス**: ストレージアクセスは非同期処理
3. **UX**: 適切なバリデーション、フィードバックメッセージ
4. **レスポンシブ**: 画面サイズに応じたレイアウト調整

## 開発

### ファイル構成

**ポップアップ（管理画面）:**
- [popup.html](extension/popup.html) - UI構造
- [popup.css](extension/popup.css) - スタイリング
- [popup.js](extension/popup.js) - ロジック（登録・一覧・削除）

**コンテンツスクリプト（表示機能）:**
- [content.js](extension/content.js) - リマインダー表示・完了処理
- [content.css](extension/content.css) - オーバーレイスタイル

**設定:**
- [manifest.json](extension/manifest.json) - Manifest V3設定

### デバッグ

1. `chrome://extensions/` で拡張機能の詳細を開く
2. 「エラー」セクションでエラーログを確認
3. Content Scriptのログ: ページの開発者ツール（F12）で確認
4. Popup/Background のログ: 拡張機能の「背景ページを検査」から確認

## トラブルシューティング

### リマインダーが表示されない

- URLが前方一致しているか確認
- 開発者ツールのコンソールでエラーを確認
- `chrome.storage.local` にデータが保存されているか確認:
  ```javascript
  chrome.storage.local.get(['reminders'], (result) => {
    console.log(result);
  });
  ```

### 拡張機能が読み込めない

- manifest.json の構文エラーがないか確認
- 必要な権限が設定されているか確認
- アイコンファイルが正しく配置されているか確認

### ポップアップが表示されない

- 拡張機能がインストールされているか確認
- 拡張機能が有効になっているか確認
- エラーログを確認

## ライセンス

このプロジェクトは個人使用・学習目的で作成されています。

## 参考資料

- [Chrome Extensions Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)
- [chrome.storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
- [Content Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)

## 今後の拡張可能性

- カテゴリやタグでの分類
- 優先度設定
- 表示回数制限
- エクスポート/インポート機能
- スヌーズ機能
- 完全一致/ドメイン一致/正規表現対応
- chrome.storage.sync による複数デバイス同期