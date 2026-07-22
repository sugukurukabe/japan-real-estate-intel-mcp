# External Listing Submission Checklist

**Hub:** [growth-playbook.md](growth-playbook.md)  
**Copy-paste:** [external-listing-copy.md](external-listing-copy.md)  
**Screenshots:** [screenshots/](screenshots/) — `pnpm run build:ui && pnpm run screenshots`

## 1. Claude Connectors Directory

- [x] コード側の審査対応完了（authless化・title/annotations・outputSchema・resource_linkアーティファクト、v8.0.0） — [claude-connectors-submission.md](claude-connectors-submission.md)
- [ ] Claude.ai Team/Enterprise organization の Directory management 権限で submission portal から申請（壁の手動操作が必要、CI/スクリプトでは代行不可）
- [ ] カルーセルスクリーンショット5枚を再確認（`pnpm run build:ui && pnpm run screenshots`）
- [ ] Pro/Enterprise確認用デモライセンスキーをレビュー用メモに記載（`node scripts/generate-license.js`）

## 2. Anthropic MCP Registry (Official)

- [x] npm `@sugukuru/japan-real-estate-intel-mcp` with `mcpName: io.github.sugukurukabe/japan-real-estate-intel-mcp` (publish after tag; latest npm-published is `6.16.0`, local is `8.0.0` pending release)
- [x] `mcp-publisher login github` + `publish --file server.json`
- [x] Active on Registry — search: https://registry.modelcontextprotocol.io/v0.1/servers?search=japan-real-estate-intel
- [ ] (Optional) DNS namespace `jp.realestate-mcp/server` — [registry-submission.md](registry-submission.md)
- [x] CI workflow — [.github/workflows/registry-publish.yml](../.github/workflows/registry-publish.yml) (requires `MCP_REGISTRY_TOKEN` secret)

## 3. OpenAI Apps Directory

- [ ] Organization verified — [openai-apps-submission.md](openai-apps-submission.md)
- [ ] Submit via [Platform App Management](https://platform.openai.com/apps-manage)
- [x] Screenshots in `docs/screenshots/`

## 4. awesome-mcp-servers

- [x] PR https://github.com/punkpeye/awesome-mcp-servers/pull/6630
- [ ] Merged — then add badge to README (template in [external-listing-copy.md](external-listing-copy.md))

## 5. Smithery (smithery.ai)

- [ ] Sign in at https://smithery.ai
- [ ] Submit — step-by-step in [external-listing-copy.md#smithery-手順](external-listing-copy.md#smithery-手順)
- [ ] `.\scripts\open-external-listings.ps1`

## 6. mcp.so

- [ ] https://mcp.so/submit — [external-listing-copy.md#mcpso-手順](external-listing-copy.md#mcpso-手順)

## 7. Glama.ai（awesome-mcp PR の前提）

- [ ] https://glama.ai/mcp/servers — upload **`Dockerfile.glama`** — [external-listing-copy.md#glama-手順](external-listing-copy.md#glama-手順)
- [ ] Add Glama score badge to awesome-mcp PR #6630 after listing passes

## 8. Cursor / npm discoverability

- [x] `server.json` / `package.json` at `8.0.0`
- [x] `npx @sugukuru/japan-real-estate-intel-mcp`
- [x] GitHub Topics set

## GitHub repository metadata

- [x] Topics: `mcp`, `model-context-protocol`, `real-estate`, `japan`, `aichi`, `nagoya`, `land-price`, `claude`, `chatgpt`, `typescript`
