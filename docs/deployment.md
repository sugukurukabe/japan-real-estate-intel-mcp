# Japan Real Estate Intel MCP — 本番デプロイ手順

このガイドで **10 分以内**に VPS 上に HTTPS 付き本番サーバーを立ち上げられます。

---

## 前提条件

- Ubuntu 22.04 LTS の VPS（Hetzner CX11 / DigitalOcean Droplet / AWS Lightsail など）
- 独自ドメイン（例: `rei.example.com`）
- Docker + Docker Compose がインストール済み
- ドメインの DNS が VPS の IP アドレスを指している

---

## 1. ドメイン設定

Cloudflare または DNS プロバイダのコントロールパネルで：

```
Type: A
Name: rei        (または @)
Value: <VPS の IP アドレス>
TTL: Auto (or 300)
```

**Cloudflare を使う場合**: Proxy status は「DNS only (灰色雲)」にしてください。  
Caddy が直接 Let's Encrypt から証明書を取得するため、Cloudflare Proxy は不要です。

---

## 2. VPS の初期セットアップ

```bash
# Docker インストール（Ubuntu）
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Docker Compose プラグイン確認
docker compose version
```

---

## 3. アプリのデプロイ

```bash
# リポジトリをクローン（または zip を展開）
git clone https://github.com/sugukurukabe/japan-real-estate-intel-mcp.git
cd japan-real-estate-intel-mcp

# 本番環境設定ファイルを作成
cp .env.production.example .env.production
nano .env.production
```

`.env.production` を編集：

```env
API_KEY=ここに強力なランダム文字列を設定   # openssl rand -hex 32 で生成
RATE_LIMIT_MAX=100
SESSION_TIMEOUT_MS=1800000
```

```bash
# Caddyfile のドメインを変更
sed -i 's/your-domain.com/rei.example.com/g' Caddyfile

# ビルドして起動
docker compose up -d --build

# ログ確認
docker compose logs -f

# ヘルスチェック確認
curl https://rei.example.com/health
```

期待されるレスポンス:
```json
{"status":"ok","version":"6.1.0","uptime":42}
```

---

## 4. ChatGPT MCP コネクタへの登録

ChatGPT (GPT-4o 以降) で MCP を使う手順：

1. ChatGPT を開く → **Settings (⚙)** → **Connectors**
2. **"+ Add"** ボタンをクリック
3. 以下を入力:

   | 項目 | 値 |
   |---|---|
   | **Server URL** | `https://rei.example.com/mcp` |
   | **Transport** | Streamable HTTP |
   | **Authentication** | Bearer Token |
   | **Token** | `.env.production` に設定した `API_KEY` の値 |

4. 保存 → 接続テスト

---

## 5. Claude Desktop / Cursor での使い方

`~/Library/Application Support/Claude/claude_desktop_config.json` に追記:

```json
{
  "mcpServers": {
    "japan-re-intel": {
      "type": "streamable-http",
      "url": "https://rei.example.com/mcp",
      "headers": {
        "Authorization": "Bearer <your API_KEY>"
      }
    }
  }
}
```

Cursor の場合は Settings → MCP → Add Server に同様の情報を入力。

---

## 6. ダッシュボード（PWA）のアクセス

ブラウザで開く:

```
https://rei.example.com/dashboard.html
```

**iPad/Android タブレットでのインストール手順**:

- **iPad Safari**: アドレスバー下の「共有」→「ホーム画面に追加」
- **Android Chrome**: アドレスバーの「…」→「ホーム画面に追加」

インストール後はアプリアイコンからフルスクリーンで起動、現地モード（大フォント + QR 共有）が自動で有効になります。

**現地モード URL（ディープリンク）**:
```
https://rei.example.com/dashboard.html?mode=field&area=名古屋市中区
```

---

## 7. 更新手順

```bash
cd japan-real-estate-intel-mcp
git pull
docker compose up -d --build
```

ダウンタイムなしで更新されます（Caddy がヘルスチェック通過後にトラフィックを切り替え）。

---

## 8. トラブルシューティング

| 症状 | 確認コマンド | 対処 |
|---|---|---|
| サーバーが起動しない | `docker compose logs mcp` | `.env.production` の設定確認 |
| HTTPS 証明書が取得できない | `docker compose logs caddy` | DNS の A レコード伝播を待つ（最大24時間） |
| `401 Unauthorized` | リクエストヘッダー確認 | `Authorization: Bearer <API_KEY>` を付与 |
| PDF が文字化けする | `docker exec rei-mcp ls assets/fonts/` | `ipaexg.ttf` が存在するか確認 |
| ポート 80/443 が使えない | `sudo netstat -tlnp | grep -E '80|443'` | 既存 nginx などを停止 |

---

## 9. セキュリティチェックリスト

- [ ] `API_KEY` に 32 文字以上のランダム文字列を使っている
- [ ] `.env.production` を `.gitignore` に追加済み（デフォルトで追加済み）
- [ ] ファイアウォールで 22 (SSH), 80, 443 以外のポートを閉じている
- [ ] 定期的に `docker compose pull && docker compose up -d` で最新版に更新している
