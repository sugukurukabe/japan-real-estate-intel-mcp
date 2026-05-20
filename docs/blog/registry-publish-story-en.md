# Beyond MLIT API wrappers: publishing a 33-tool Japanese real estate MCP to the official Registry

**Repo:** https://github.com/sugukurukabe/japan-real-estate-intel-mcp  
**Registry:** `io.github.sugukurukabe/japan-real-estate-intel-mcp`  
**Install:** `npx @sugukuru/japan-real-estate-intel-mcp`

---

## TL;DR

Most Japan real estate MCP servers wrap the MLIT API. **Japan Real Estate Intel** ships **10 prefectures of bundled CSV data**, **33 workflow tools** (reports, renovation yield, contract support, arbitrage triangulation), and a **PWA dashboard** — now listed on the [MCP Registry](https://registry.modelcontextprotocol.io/v0.1/servers?search=japan-real-estate-intel).

---

## What we built

- Cross-analysis: land price × disaster × foot traffic × education × corporate density
- `detect_arbitrage_signals` — rosenka × official land price × transactions
- Interactive map: https://realestate-mcp.jp/dashboard.html?prefecture=aichi
- Remote MCP: `https://realestate-mcp.jp/mcp`

---

## Registry pitfalls (save you an hour)

1. **Schema** — Use `https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json`. Description max **100 chars**. Use `registryType` + `identifier`, not legacy field names.

2. **npm `mcpName`** — Must match Registry `name` when using GitHub auth. Bump npm version after changing `mcpName`.

3. **JWT expiry** — Re-run `mcp-publisher login github` before `publish`.

4. **404 on browser URL** — Single-server GET may 404; verify with search API:
   `GET /v0.1/servers?search=japan-real-estate-intel`

---

## Show HN / Reddit title ideas

- *I built an MCP server for Japanese real estate workflows (not just MLIT API)*
- *33-tool MCP for land price, risk, and Nagoya district analysis — now on the official Registry*

**Link:** GitHub repo + dashboard GIF in README.

---

## Related

- [competitive-positioning.md](../competitive-positioning.md)
- [growth-playbook.md](../growth-playbook.md)
