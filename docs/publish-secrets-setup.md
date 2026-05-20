# Release secrets — npm & MCP Registry

CI が **タグ `v*`** push で Release を作ります。npm / Registry は Secrets がないとスキップされます。

## NPM_TOKEN（GitHub Actions → npm publish）

1. https://www.npmjs.com → Access Tokens → **Granular** or Classic **Automation**
2. GitHub → `japan-real-estate-intel-mcp` → **Settings → Secrets and variables → Actions**
3. **New repository secret:** `NPM_TOKEN` = トークン値
4. タグを push: `git tag v6.15.2 && git push origin v6.15.2`（または `.\scripts\publish-release.ps1`）

ローカルのみ:

```powershell
npm login
npm publish --access public
```

## MCP_REGISTRY_TOKEN

1. ローカル: `.\mcp-publisher.exe login github`（ブラウザ認証）
2. Registry ドキュメントに従い CI 用トークンを取得
3. GitHub Secret: `MCP_REGISTRY_TOKEN`
4. **Actions → MCP Registry Publish → Run workflow** または Release `published` 後に自動

JWT 期限切れエラー `token is expired` のときは **login をやり直して** Secret を更新。

## 確認

```powershell
npm view @sugukuru/japan-real-estate-intel-mcp version
curl.exe -s "https://registry.modelcontextprotocol.io/v0.1/servers?search=japan-real-estate-intel"
```
