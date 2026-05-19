# Opens external MCP directory submission pages (login may be required).
$repo = 'https://github.com/sugukurukabe/japan-real-estate-intel-mcp'
$copy = Join-Path $PSScriptRoot '..\docs\external-listing-copy.md' | Resolve-Path

Write-Host "Copy text from: $copy"
Write-Host "awesome-mcp PR: https://github.com/punkpeye/awesome-mcp-servers/pull/6630"
Start-Process 'https://smithery.ai'
Start-Process 'https://mcp.so/submit'
Start-Process 'https://glama.ai/mcp/servers'
