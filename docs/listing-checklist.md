# External Listing Submission Checklist

Copy-paste text: [external-listing-copy.md](external-listing-copy.md)  
Screenshots: [screenshots/](screenshots/) (run `pnpm run build:ui && pnpm run screenshots`)

## 1. Anthropic MCP Registry (Official)

- [x] Publish npm package: `@sugukuru/japan-real-estate-intel-mcp@6.15.0` on npm
- [ ] DNS TXT verify: See [registry-submission.md](registry-submission.md) — add `_mcp-verify` on `realestate-mcp.jp`, then `mcp-publisher verify --namespace jp.realestate-mcp`
- [ ] `mcp-publisher publish --file server.json` (or GitHub namespace below)
- **Alternative (no DNS):** `mcp-publisher login --github` then `mcp-publisher publish --file server.json --namespace io.github.sugukurukabe/japan-real-estate-intel-mcp`
- Registry URL (when live): https://registry.modelcontextprotocol.io/servers/jp.realestate-mcp/server

## 2. OpenAI Apps Directory

- [ ] Organization verified on [OpenAI Platform Dashboard](https://platform.openai.com/settings/organization/general)
- [ ] Submit via [Platform App Management](https://platform.openai.com/apps-manage)
- [x] Screenshots ready in `docs/screenshots/`
- [ ] Required info (see [external-listing-copy.md](external-listing-copy.md#openai-apps-directory)):
  - App name: **Japan Real Estate Intel**
  - Logo: `assets/logo-512.png`
  - MCP URL: `https://realestate-mcp.jp/mcp`
  - Privacy Policy URL: `https://realestate-mcp.jp/privacy-policy.html`
  - Terms of Service URL: `https://realestate-mcp.jp/terms.html`
  - Test prompts: [test-prompts.md](test-prompts.md)

## 3. awesome-mcp-servers

- [x] Fork https://github.com/punkpeye/awesome-mcp-servers
- [x] Add entry under "Real Estate" (text in [external-listing-copy.md](external-listing-copy.md#awesome-mcp-servers-pr-用))
- [x] Submit PR — https://github.com/punkpeye/awesome-mcp-servers/pull/6630

## 4. Smithery (smithery.ai)

- [ ] Visit https://smithery.ai and sign in with GitHub
- [ ] Add Server → `@sugukuru/japan-real-estate-intel-mcp` or repo URL
- [ ] Tags / description: [external-listing-copy.md](external-listing-copy.md#smithery-smitheryai)

## 5. mcp.so

- [ ] Visit https://mcp.so/submit
- [ ] Repository URL + description from [external-listing-copy.md](external-listing-copy.md#mcpso)

## 6. Glama.ai

- [ ] Visit https://glama.ai/mcp/servers
- [ ] Submit repository URL (see [external-listing-copy.md](external-listing-copy.md#glamaai))

## 7. Cursor MCP Marketplace

- [x] `server.json` and `package.json` version aligned at 6.15.0
- [x] npm-published package discoverable via `npx @sugukuru/japan-real-estate-intel-mcp`
- [x] `cursor://` deep link in README

## GitHub repository metadata

- [x] Add Topics: `mcp`, `model-context-protocol`, `real-estate`, `japan`, `aichi`, `nagoya`, `land-price`, `claude`, `chatgpt`, `typescript`
