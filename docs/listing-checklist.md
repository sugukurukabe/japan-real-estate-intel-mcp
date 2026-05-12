# External Listing Submission Checklist

After completing the v6.11.0 release, submit to these directories.

## 1. Anthropic MCP Registry (Official)

- [ ] Publish npm package: `npm publish`
- [ ] DNS TXT verify: See [docs/registry-submission.md](registry-submission.md)
- [ ] `mcp-publisher publish --file server.json`
- Registry URL: https://github.com/modelcontextprotocol/registry

## 2. OpenAI Apps Directory

- [ ] Organization verified on [OpenAI Platform Dashboard](https://platform.openai.com/settings/organization/general)
- [ ] Submit via [Platform App Management](https://platform.openai.com/apps-manage)
- [ ] Required info:
  - App name: **Japan Real Estate Intel**
  - Logo: `assets/logo-512.png`
  - MCP URL: `https://realestate-mcp.jp/mcp`
  - Privacy Policy URL: `https://realestate-mcp.jp/privacy-policy.html`
  - Terms of Service URL: `https://realestate-mcp.jp/terms.html`
  - Screenshots: from `docs/screenshots/`
  - Test prompts: from [docs/test-prompts.md](test-prompts.md)
  - CSP domains: `tile.openstreetmap.org`, `unpkg.com`, `cdnjs.cloudflare.com`, `basemaps.cartocdn.com`

## 3. awesome-mcp-servers

- [ ] Fork https://github.com/punkpeye/awesome-mcp-servers
- [ ] Add entry under "Real Estate" or "Data Analysis":

```markdown
- [Japan Real Estate Intel](https://github.com/sugukuru/japan-real-estate-intel-mcp) - Cross-analyze land prices, disaster risk, population, foot traffic, and more across 10 Japanese prefectures. Renovation yield, contract support, and portfolio optimization.
```

- [ ] Submit PR

## 4. Smithery (smithery.ai)

- [ ] Visit https://smithery.ai and sign in with GitHub
- [ ] Click "Add Server" and enter the npm package name or repository URL
- [ ] Fill in description and tags: `real-estate`, `japan`, `land-price`, `investment`

## 5. mcp.so

- [ ] Visit https://mcp.so/submit
- [ ] Provide repository URL and description

## 6. Glama.ai

- [ ] Visit https://glama.ai/mcp/servers
- [ ] Submit repository URL via their submission form

## 7. Cursor MCP Marketplace

- [ ] Ensure `server.json` and `package.json` `mcpName` are consistent
- [ ] The npm-published package should be auto-discoverable
- [ ] Add `cursor://` deep link to README (done in v6.11.0)
