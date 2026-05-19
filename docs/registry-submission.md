# MCP Registry Submission Guide

This document describes how to publish Japan Real Estate Intel MCP to the official [Anthropic MCP Registry](https://github.com/modelcontextprotocol/registry).

## Prerequisites

1. **npm package published**: `@sugukuru/japan-real-estate-intel-mcp` must be on npm
2. **Domain ownership**: DNS access to `realestate-mcp.jp`
3. **`mcp-publisher` CLI**: Install globally

Install the official CLI (see [MCP Registry quickstart](https://modelcontextprotocol.io/registry/quickstart)):

- **Homebrew (macOS):** `brew install mcp-publisher`
- **Binary:** download from [modelcontextprotocol/registry releases](https://github.com/modelcontextprotocol/registry/releases)

The npm package `@anthropic-ai/mcp-publisher` is not published; use the binary above.

**Windows:** There is no native `.exe` in registry releases (darwin/linux only). Use WSL, a macOS/Linux CI job, or GitHub Actions to run `mcp-publisher`. Interactive `mcp-publisher login --github` requires a browser on the machine running the CLI.

## Step 1: DNS TXT Verification

The namespace `jp.realestate-mcp/server` requires DNS verification for the domain `realestate-mcp.jp`.

### Add TXT Record

Add the following DNS TXT record to `realestate-mcp.jp`:

| Type | Host | Value |
|------|------|-------|
| TXT | `_mcp-verify` | (value provided by `mcp-publisher verify` command) |

### Verify

```bash
mcp-publisher verify --namespace jp.realestate-mcp
```

Wait for DNS propagation (usually < 5 minutes). The command will confirm when verification succeeds.

## Step 2: Publish to Registry

```bash
mcp-publisher publish --file server.json
```

This reads `server.json` from the repository root and uploads metadata to the registry.

## Step 3: Verify Listing

Check your server appears at:
- https://registry.modelcontextprotocol.io/servers/jp.realestate-mcp/server

## Backup Namespace (GitHub)

If you prefer GitHub-based authentication instead of DNS:

```bash
mcp-publisher login --github
mcp-publisher publish --file server.json --namespace io.github.sugukurukabe/japan-real-estate-intel-mcp
```

This uses GitHub OAuth to verify ownership of the `sugukurukabe` account.

## Updating

After each release:

1. Update `version_detail.version` and `packages[0].version` in `server.json`
2. Keep the `tools` array in sync with what `createServer()` registers (same names, no extras). CI runs `tests/server_json_tools_sync.test.ts` so `pnpm test` must pass before you publish metadata.
3. Run `mcp-publisher publish --file server.json`

If you add or rename an MCP tool in `src/server.ts`, update `server.json` in the same change (or the sync test and Registry listing will drift).

## Troubleshooting

| Issue | Solution |
|-------|----------|
| DNS not propagated | Wait 5-10 min, check with `dig TXT _mcp-verify.realestate-mcp.jp` |
| Package not found on npm | Run `npm publish` first |
| Auth error | Re-run `mcp-publisher login` |
| Schema validation error | Validate `server.json` against the schema at https://registry.modelcontextprotocol.io/schema/server.json |
