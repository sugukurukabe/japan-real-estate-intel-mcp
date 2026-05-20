# External Listing Submission Checklist

**Hub:** [growth-playbook.md](growth-playbook.md)  
**Copy-paste:** [external-listing-copy.md](external-listing-copy.md)  
**Screenshots:** [screenshots/](screenshots/) — `pnpm run build:ui && pnpm run screenshots`

## 1. Anthropic MCP Registry (Official)

- [x] npm `@sugukuru/japan-real-estate-intel-mcp@6.15.1` with `mcpName: io.github.sugukurukabe/japan-real-estate-intel-mcp`
- [x] `mcp-publisher login github` + `publish --file server.json`
- [x] Active on Registry — search: https://registry.modelcontextprotocol.io/v0.1/servers?search=japan-real-estate-intel
- [ ] (Optional) DNS namespace `jp.realestate-mcp/server` — [registry-submission.md](registry-submission.md)
- [x] CI workflow — [.github/workflows/registry-publish.yml](../.github/workflows/registry-publish.yml) (requires `MCP_REGISTRY_TOKEN` secret)

## 2. OpenAI Apps Directory

- [ ] Organization verified — [openai-apps-submission.md](openai-apps-submission.md)
- [ ] Submit via [Platform App Management](https://platform.openai.com/apps-manage)
- [x] Screenshots in `docs/screenshots/`

## 3. awesome-mcp-servers

- [x] PR https://github.com/punkpeye/awesome-mcp-servers/pull/6630
- [ ] Merged — then add badge to README (template in [external-listing-copy.md](external-listing-copy.md))

## 4. Smithery (smithery.ai)

- [ ] Sign in at https://smithery.ai
- [ ] Submit — step-by-step in [external-listing-copy.md#smithery-手順](external-listing-copy.md#smithery-手順)
- [ ] `.\scripts\open-external-listings.ps1`

## 5. mcp.so

- [ ] https://mcp.so/submit — [external-listing-copy.md#mcpso-手順](external-listing-copy.md#mcpso-手順)

## 6. Glama.ai

- [ ] https://glama.ai/mcp/servers — [external-listing-copy.md#glama-手順](external-listing-copy.md#glama-手順)

## 7. Cursor / npm discoverability

- [x] `server.json` / `package.json` at 6.15.1
- [x] `npx @sugukuru/japan-real-estate-intel-mcp`
- [x] GitHub Topics set

## GitHub repository metadata

- [x] Topics: `mcp`, `model-context-protocol`, `real-estate`, `japan`, `aichi`, `nagoya`, `land-price`, `claude`, `chatgpt`, `typescript`
