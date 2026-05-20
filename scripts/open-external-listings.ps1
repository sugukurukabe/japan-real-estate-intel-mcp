# Opens external MCP directory submission pages (login may be required).
$copy = (Join-Path $PSScriptRoot '..\docs\external-listing-copy.md' | Resolve-Path).Path
$playbook = (Join-Path $PSScriptRoot '..\docs\growth-playbook.md' | Resolve-Path).Path

Write-Host ""
Write-Host "=== Japan Real Estate Intel — external listings ===" -ForegroundColor Cyan
Write-Host "Copy-paste: $copy"
Write-Host "Checklist:  $playbook"
Write-Host ""
Write-Host "Registry (done): https://registry.modelcontextprotocol.io/v0.1/servers?search=japan-real-estate-intel"
Write-Host "awesome-mcp PR:  https://github.com/punkpeye/awesome-mcp-servers/pull/6630"
Write-Host ""
Write-Host "Order: 1) Glama (required for awesome-mcp PR)  2) Smithery  3) mcp.so"
Write-Host "Glama Dockerfile: Dockerfile.glama (stdio) — NOT Dockerfile (HTTP)"
Write-Host ""
Write-Host "Opening Glama first, then Smithery, mcp.so, OpenAI apps..."
Start-Process 'https://glama.ai/mcp/servers'
Start-Sleep -Milliseconds 500
Start-Process 'https://smithery.ai'
Start-Sleep -Milliseconds 500
Start-Process 'https://mcp.so/submit'
Start-Sleep -Milliseconds 500
Start-Process 'https://platform.openai.com/apps-manage'
