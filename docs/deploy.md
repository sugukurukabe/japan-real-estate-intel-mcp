# デプロイガイド

## 前提条件

- Docker 24+ / Docker Compose v2
- Node.js 20+ (ローカルビルド時)

## Option A: VPS + Caddy (推奨: 独自ドメインあり)

```bash
# 1. .env.production を作成
cp .env.production.example .env.production
# API_KEY を設定

# 2. (Caddyfile には realestate-mcp.jp が設定済み。ドメインを変更する場合は Caddyfile の 1 行目を編集)

# 3. 起動
docker compose --profile caddy up -d --build

# 4. 確認
curl https://realestate-mcp.jp/health
```

Caddy が Let's Encrypt 証明書を自動取得します。ポート 80/443 を開放してください。

## Option B: CloudFlare Tunnel (NAT 背後 / パブリック IP 不要)

```bash
# 1. CloudFlare ダッシュボードでトンネルを作成
#    Zero Trust > Access > Tunnels > Create
#    Public hostname: realestate-mcp.jp → http://mcp:3100

# 2. .env.production にトンネルトークンを設定
cp .env.production.example .env.production
# TUNNEL_TOKEN=eyJ...

# 3. 起動
docker compose --profile tunnel up -d --build

# 4. 確認
curl https://realestate-mcp.jp/health
```

## ChatGPT Custom GPT 接続

```
MCP Server URL: https://realestate-mcp.jp/mcp
Authentication: API Key (X-Api-Key header)
```

## Claude Desktop 接続

`claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "japan-real-estate-intel": {
      "url": "https://realestate-mcp.jp/mcp",
      "headers": { "X-Api-Key": "your-api-key" }
    }
  }
}
```

## ヘルスチェック

```bash
# Docker 内部
docker compose exec mcp wget -qO- http://127.0.0.1:3100/health

# 外部
curl -s https://realestate-mcp.jp/health | jq
```

## ログ確認

```bash
docker compose logs -f mcp          # MCP サーバーログ
docker compose logs -f caddy        # Caddy ログ (Option A)
docker compose logs -f cloudflared  # Tunnel ログ (Option B)
```

## データボリュームとシーディング

Docker Compose は `rei_data` と `rei_sqlite` の named volume を使用します。

**初回起動時の注意**: Dockerfile は `COPY data /app/data` で CSV をイメージにバンドルしますが、named volume がマウントされると **ボリュームの内容が優先** されます。初回は空のため、コンテナ起動後にデータが `/app/data` に見えません。

```bash
# 方法 A: bind mount（推奨: ホストの data/ を直接マウント）
# docker-compose.yml を編集:
#   volumes:
#     - ./data:/app/data:ro    # named volume の代わりに

# 方法 B: named volume にシード
docker compose up -d
docker compose cp ./data/. mcp:/app/data/
docker compose restart mcp

# 方法 C: コンテナ内でデータ取得
docker compose exec mcp npm run data:fetch:all
```

**Usage / License SQLite** (`rei_sqlite:/app/db`):
- `usage.sqlite`（Free プランの月間クォータ）と `licenses.sqlite`（Stripe 発行ライセンス）は初回アクセス時に自動生成されます
- バックアップ: `docker compose cp mcp:/app/db/usage.sqlite ./backup/` / `docker compose cp mcp:/app/db/licenses.sqlite ./backup/`
- 復元: `docker compose cp ./backup/usage.sqlite mcp:/app/db/` / `docker compose cp ./backup/licenses.sqlite mcp:/app/db/`

> 本サーバーは Claude 公式ディレクトリ向けに **認証不要（authless）の公開コネクタ** として動作します。OAuth は実装していません。Pro/Enterprise 機能はライセンスキー（`X-License-Key` ヘッダー、ECDSA署名オフライン検証）で解放します。

**生成アーティファクト（レポート/CSV/Excel）** (`rei_sqlite:/app/db/artifacts`):
- `generate_area_report` の PDF、`compare_prefectures` の Excel、`portfolio_optimizer` の CSV などは `resource_link` として返却され、`ARTIFACT_TTL_HOURS`（デフォルト24時間）で自動削除されます
- `docker-compose.yml` は `ARTIFACT_DIR=/app/db/artifacts` を明示的に設定し、メタデータDB（`artifacts.sqlite`、デフォルトで既に `/app/db` 配下）とファイル本体を同じ named volume 内に置くことで、コンテナ再作成後もTTL内のダウンロードリンクが有効なままになるようにしています
- バックアップ/復元は不要（TTLで自然に消える設計）ですが、必要な場合は `docker compose cp mcp:/app/db/artifacts ./backup/`

## デプロイ後の動作確認（SQLite依存機能）

v8.0.0で、`Dockerfile`の`--ignore-scripts`と名前付きボリュームの権限設定に起因して、**`better-sqlite3`のネイティブバインディングが本番イメージ内で一度も正しく動作していなかった**不具合を修正しました（`/health`は正常応答するため見逃されやすい）。影響範囲: Freeプランの月間クォータ・ライセンスキー保存・ダウンロードアーティファクト（PDF/CSV/Excel）が全て失敗（クォータ/使用量は無言でメモリのみにフォールバックし、アーティファクト系は例外を投げてツールエラーになる）。

デプロイ後、以下で実際に直っているか確認してください:

```bash
# コンテナがrei（非root）ユーザーで/app/dbに書き込めるか確認
docker compose exec mcp node -e "
const { saveArtifact, getArtifact } = require('./dist/artifacts.js');
const m = saveArtifact('smoke test', 'smoke.txt', 'text/plain');
console.log(getArtifact(m.id)?.data.toString('utf-8'));
"
# 'smoke test' が出力されればOK。SqliteError や bindings エラーが出た場合は
# pnpm-workspace.yaml の onlyBuiltDependencies と Dockerfile の chown 済みか確認。

docker compose exec mcp ls -la /app/db/   # rei:rei 所有であること（root:root ならボリューム再作成が必要）
```

## アップデート

```bash
docker compose --profile <caddy|tunnel> down
git pull
docker compose --profile <caddy|tunnel> up -d --build
```

## ドメイン変更手順

新しいドメイン `foo.example.com` に乗り換える場合:

```bash
# 1. 新ドメインの DNS A レコードを VPS の IP に向ける
# 2. Caddyfile の 1 行目を編集
#    realestate-mcp.jp, www.realestate-mcp.jp {
#    → foo.example.com, www.foo.example.com {

# 3. Caddy をリロード（コンテナ再起動不要、証明書は自動取得）
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile

# 4. Claude Desktop / ChatGPT の接続 URL を新ドメインに更新
```

旧証明書は `caddy_data` ボリュームに残りますが無害です。
