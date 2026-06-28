# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 6.x     | ✅ Active  |
| 5.x     | ⚠️ Bug fixes only |
| < 5.0   | ❌ No longer supported |

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities as public GitHub Issues.**

### Option 1: GitHub Private Security Advisory (Preferred)

1. Go to the [Security tab](https://github.com/sugukurukabe/japan-real-estate-intel-mcp/security) of this repository
2. Click **"Report a vulnerability"**
3. Fill in the advisory form with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Option 2: Direct Contact

Email: **See the [GitHub profile](https://github.com/sugukurukabe) for contact info**

### What to Expect

| Timeline | Action |
|----------|--------|
| Within 48 hours | Acknowledgement of receipt |
| Within 7 days | Initial assessment and severity triage |
| Within 30 days | Patch or mitigation published |
| Within 90 days | Public disclosure (coordinated with reporter) |

## Scope

This project is an **MCP server** that serves as a data analysis layer over Japanese public datasets. The following areas are in scope:

- Remote code execution via MCP tool inputs
- Authentication bypass for the HTTP mode (`API_KEY` header)
- Injection vulnerabilities (CSV/JSON parsing, file path traversal)
- Dependency vulnerabilities in production dependencies

**Out of scope:**
- Inaccuracies in sample/mock data (open a regular issue)
- Issues requiring physical access to the server
- Denial-of-service via legitimate tool calls (rate limiting is in place)

## Security Measures in Place (v6.15.2)

- `helmet` middleware sets security-related HTTP headers on all HTTP mode responses
- Request body limited to 10 MB (`express.json({ limit: '10mb' })`)
- Optional `API_KEY` authentication for HTTP mode
- Session timeout (30 minutes idle)
- Graceful shutdown on SIGTERM/SIGINT
- Weekly CodeQL analysis via GitHub Actions
- `npm audit --prod` in CI pipeline

## Known Limitations

- Sample data files (`data/*/`) are **mock/synthetic data** and do not represent real-world conditions
- The stdio transport does not support authentication (relies on OS-level process isolation)
- Rate limiting is enabled by default (express-rate-limit, configurable via env)
- Sentry error tracking opt-in via SENTRY_DSN
- X-Request-ID tracing on all HTTP requests
- Content Security Policy enabled for static UI paths
