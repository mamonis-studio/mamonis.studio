# MAMONIS Admin Panel

WordPressより使いやすい、Cloudflare完結型の管理画面システム。

## 🚀 特徴

- **完全無料**（Cloudflareの無料枠内で運用可能）
- **高速**（エッジで動作）
- **シンプル**（WordPress不要、PHPサーバー不要）
- **セキュア**（セッション認証、CORS対応）
- **MAMONISデザイン**（ダークテーマ、ミニマル）

## 📦 構成

```
mamonis-admin/
├── frontend/
│   └── index.html        # 管理画面UI
├── worker/
│   ├── src/
│   │   └── index.js      # Cloudflare Workers API
│   └── wrangler.toml     # Workers設定
├── schema.sql            # D1データベーススキーマ
└── README.md
```

## 🛠️ セットアップ手順

### 1. Cloudflare アカウント準備

1. [Cloudflare](https://dash.cloudflare.com/) にサインアップ
2. Wrangler CLI をインストール:
   ```bash
   npm install -g wrangler
   wrangler login
   ```

### 2. D1 データベース作成

```bash
# データベース作成
wrangler d1 create mamonis-cms

# 出力されたdatabase_idをwrangler.tomlに設定
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# スキーマ適用
wrangler d1 execute mamonis-cms --file=./schema.sql
```

### 3. Workers デプロイ

```bash
cd worker

# wrangler.toml を編集
# - database_id を設定
# - CORS_ORIGIN を管理画面のURLに変更

# デプロイ
wrangler deploy
```

デプロイ後、Workers の URL が表示される（例: `https://mamonis-admin-api.your-account.workers.dev`）

### 4. フロントエンド設定

`frontend/index.html` を開いて、API_BASE を Workers の URL に変更:

```javascript
const API_BASE = 'https://mamonis-admin-api.your-account.workers.dev';
```

### 5. Cloudflare Pages にデプロイ

```bash
# Pages にアップロード
wrangler pages deploy frontend --project-name=mamonis-admin
```

または、Cloudflare Dashboard から手動でアップロード。

### 6. 初期ユーザー作成

ブラウザで管理画面を開き、最初のログインを試みると初期設定画面が表示される。

または、API で直接作成:

```bash
curl -X POST https://your-api.workers.dev/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-secure-password"}'
```

## 📊 Cloudflare Analytics 連携（オプション）

実際のアクセスデータを表示するには:

1. Cloudflare Dashboard → API Tokens
2. 「Create Token」→ テンプレート「Zone Analytics」を選択
3. 取得した API Token と Zone ID を Workers の環境変数に設定:

```bash
wrangler secret put CLOUDFLARE_API_TOKEN
wrangler secret put CLOUDFLARE_ZONE_ID
```

設定しない場合はデモデータが表示される。

## 🔗 API エンドポイント

### 認証
| Method | Endpoint | 説明 |
|--------|----------|------|
| POST | `/api/auth/setup` | 初期ユーザー作成 |
| POST | `/api/auth/login` | ログイン |
| POST | `/api/auth/logout` | ログアウト |
| GET | `/api/auth/me` | 現在のユーザー情報 |

### コンテンツ管理
| Method | Endpoint | 説明 |
|--------|----------|------|
| GET | `/api/notes` | Note一覧取得 |
| POST | `/api/notes` | Note作成 |
| PUT | `/api/notes/:id` | Note更新 |
| DELETE | `/api/notes/:id` | Note削除 |
| GET | `/api/services` | Services一覧 |
| POST | `/api/services` | Service追加 |
| PUT | `/api/services/:id` | Service更新 |
| DELETE | `/api/services/:id` | Service削除 |
| GET | `/api/apps` | Apps一覧 |
| POST | `/api/apps` | App追加 |

### 設定
| Method | Endpoint | 説明 |
|--------|----------|------|
| GET | `/api/settings` | サイト設定取得 |
| PUT | `/api/settings` | サイト設定更新 |

### 公開API（認証不要）
| Method | Endpoint | 説明 |
|--------|----------|------|
| GET | `/api/public/notes` | 公開記事一覧 |
| GET | `/api/public/services` | サービス一覧 |
| GET | `/api/public/settings` | サイト情報 |

## 🎨 ホームページとの連携

ホームページ側で管理画面のデータを使うには、公開APIを呼び出す:

```javascript
// 例: Noteを取得してホームページに表示
fetch('https://your-api.workers.dev/api/public/notes')
  .then(res => res.json())
  .then(notes => {
    notes.forEach(note => {
      // DOMに追加
    });
  });
```

## 💰 料金

Cloudflareの無料枠内で運用可能:

| サービス | 無料枠 |
|----------|--------|
| Workers | 100,000 リクエスト/日 |
| D1 | 5GB ストレージ、5M 行読み取り/日 |
| Pages | 無制限サイト、500ビルド/月 |
| Analytics API | 無料 |

## 🔒 セキュリティ

- パスワードはSHA-256でハッシュ化（本番ではbcryptを推奨）
- セッショントークンは7日で有効期限切れ
- CORS制限でAPIを保護

## 📝 カスタマイズ

### デザイン変更
`frontend/index.html` の `:root` CSS変数を編集:

```css
:root {
    --bg-primary: #0a0a0a;
    --text-primary: #ffffff;
    /* ... */
}
```

### 機能追加
`worker/src/index.js` にエンドポイントを追加。

---

Made with ❤️ for MAMONIS
