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

## 3. アプリのデプロイ（推奨：ワンコマンド）

VPS（Ubuntu）で以下のコマンドを**1行で実行**するだけで完了します。

```bash
curl -sSL https://raw.githubusercontent.com/sugukurukabe/japan-real-estate-intel-mcp/main/scripts/deploy.sh | bash
```

スクリプトが自動で以下を行います：
- Docker のインストール（未導入の場合）
- リポジトリのクローン／更新
- `.env.production` の自動生成（32文字ランダム `API_KEY` 付き）
- ドメインの入力プロンプトと `Caddyfile` 更新
- `docker compose up -d --build` で起動
- ヘルスチェック URL と次のステップを表示

### 手動デプロイ（上級者向け）

```bash
git clone https://github.com/sugukurukabe/japan-real-estate-intel-mcp.git
cd japan-real-estate-intel-mcp

cp .env.production.example .env.production
nano .env.production          # API_KEY を強力なランダム文字列に変更

# ドメインを置換（例: rei.example.com）
sed -i 's/your-domain.com/rei.example.com/g' Caddyfile

docker compose up -d --build
docker compose logs -f
```

ヘルスチェック:
```bash
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
