# MCP Registry — CI 自動公開

Workflow: [.github/workflows/registry-publish.yml](../.github/workflows/registry-publish.yml)

## トリガー

- GitHub **Release published**（タグ `v*` と `server.json` の `version` が一致すること）
- **workflow_dispatch**（手動）

## セットアップ

1. ローカルで一度ログイン:
   ```bash
   mcp-publisher login github
   ```

2. Registry ドキュメントに従い、CI 用トークンを取得して GitHub に登録:
   - Repository → Settings → Secrets → Actions
   - Name: `MCP_REGISTRY_TOKEN`

3. 手動テスト: Actions → **MCP Registry Publish** → Run workflow

## トークン未設定時

Workflow は **warning でスキップ** し、リリース自体は失敗しません。本番掲載はローカルから:

```bash
mcp-publisher login github
mcp-publisher publish --file server.json
```

## 関連

- [registry-submission.md](./registry-submission.md)
- [growth-playbook.md](./growth-playbook.md)
