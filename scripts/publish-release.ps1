# Tag push → GitHub Release (+ npm if NPM_TOKEN secret is set).
# Local npm: npm login && npm publish from repo root after pnpm build.
param(
  [string]$Version = (Get-Content (Join-Path $PSScriptRoot '..\package.json') -Raw | ConvertFrom-Json).version
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $root

Write-Host "Version: $Version" -ForegroundColor Cyan
Write-Host "1) Tests..." -ForegroundColor Yellow
pnpm test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$tag = "v$Version"
$existing = git tag -l $tag
if ($existing) {
  Write-Host "Tag $tag already exists. Push with: git push origin $tag" -ForegroundColor Yellow
} else {
  git tag -a $tag -m "Release $tag"
  git push origin $tag
  Write-Host "Pushed $tag — watch: gh run list --workflow=release.yml" -ForegroundColor Green
}

Write-Host ""
Write-Host "2) npm (local, if CI has no NPM_TOKEN):" -ForegroundColor Yellow
Write-Host "   npm login"
Write-Host "   npm publish --access public"
Write-Host ""
Write-Host "3) MCP Registry (JWT expired? re-login):" -ForegroundColor Yellow
Write-Host "   .\mcp-publisher.exe login github"
Write-Host "   .\mcp-publisher.exe publish --file server.json"
Write-Host "   # or: gh workflow run registry-publish.yml  (needs MCP_REGISTRY_TOKEN secret)"
Write-Host ""
Write-Host "4) Announce: docs/release-announcement-v$Version.md" -ForegroundColor Yellow
