# Reminder-on-Webpage

Webページリマインダー Chrome拡張機能 - 特定のWebページにアクセスした際に、事前に登録したリマインダーを表示します。

## 機能概要

- 特定のWebページにアクセスした時に自動的にリマインダーを表示
- **3種類のURL照合方式を選択可能**
  - ドメイン一致: 同じドメインの全ページで表示
  - 前方一致: 指定URLで始まるページで表示
  - 完全一致: 指定URLと完全一致するページのみ表示
- 直感的なポップアップUIでリマインダーの登録・管理
- 複数リマインダーの同時表示
- 個別完了・一括閉じる機能
- **非ブロッキング表示**: 作業を妨げず、画面右上に表示

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
2. URLフィールドに現在のページのドメインが自動入力される（編集可能）
3. URL照合方式を選択
   - **ドメイン一致**（デフォルト）: 同じドメインの全ページで表示
   - **前方一致**: 指定URLで始まるページで表示
   - **完全一致**: 指定URLと完全一致するページのみ表示
4. リマインダー内容を入力
5. 「登録」ボタンをクリック

### リマインダーの表示

- 登録したURLと照合方式に基づいてページにアクセスすると、画面右上にリマインダーが表示される
- 複数のリマインダーがある場合は、すべて一覧表示される
- **非ブロッキング設計**: リマインダー表示中もWebページの操作が可能
- リマインダーを確認しながら、ページのスクロール、クリック、入力などが自由に行える

### リマインダーの操作

**Webページ上:**
- 「完了」ボタン: そのリマインダーをストレージから削除
- 「すべて閉じる」ボタン: ポップアップを非表示（リマインダーは保持）

**拡張機能ポップアップ:**
- 「削除」ボタン: 登録済みリマインダーを削除

## 技術仕様

### URL照合方式

リマインダーごとに3種類の照合方式から選択可能:

#### 1. ドメイン一致（デフォルト）
登録URLと現在のURLのドメイン（プロトコル + ホスト名）を比較

**例:**
- 登録URL: `https://example.com`
- ✓ マッチ: `https://example.com/shop/products`
- ✓ マッチ: `https://example.com/blog`
- ✗ 非マッチ: `https://sub.example.com` (サブドメインは別扱い)
- ✗ 非マッチ: `https://other-site.com`

#### 2. 前方一致
登録URLで始まるすべてのページでマッチ

**例:**
- 登録URL: `https://example.com/shop`
- ✓ マッチ: `https://example.com/shop`
- ✓ マッチ: `https://example.com/shop/products`
- ✗ 非マッチ: `https://example.com/blog`

#### 3. 完全一致
登録URLと完全に一致するページのみマッチ

**例:**
- 登録URL: `https://example.com/page`
- ✓ マッチ: `https://example.com/page`
- ✗ 非マッチ: `https://example.com/page?id=123`
- ✗ 非マッチ: `https://example.com/page/detail`

### データ構造

```javascript
{
  reminders: [
    {
      id: "uuid",                          // ユニークID
      url: "https://example.com",          // 照合用URL
      text: "クーポンコードを入力すること",  // リマインダー内容
      matchType: "domain",                 // 照合方式: "domain" | "prefix" | "exact"
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
5. **非ブロッキング**: リマインダー表示中もページ操作が可能（画面右上に固定表示）

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

- 登録したURL照合方式が適切か確認
  - ドメイン一致: サブドメインは別扱い
  - 前方一致: 登録URLで始まるページのみ
  - 完全一致: URLが完全に一致するページのみ
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
- 正規表現対応の追加
- サブドメイン対応オプション
- chrome.storage.sync による複数デバイス同期