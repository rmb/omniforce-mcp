# omniforce-mcp

[![npm version](https://img.shields.io/npm/v/@omniforce/mcp.svg)](https://www.npmjs.com/package/@omniforce/mcp)
[![license](https://img.shields.io/npm/l/@omniforce/mcp.svg)](./LICENSE)
[![rmb/omniforce-mcp MCP server](https://glama.ai/mcp/servers/rmb/omniforce-mcp/badges/score.svg)](https://glama.ai/mcp/servers/rmb/omniforce-mcp)
[![ghcr](https://img.shields.io/badge/docker-ghcr.io%2Frmb%2Fomniforce--mcp-blue)](https://github.com/rmb/omniforce-mcp/pkgs/container/omniforce-mcp)

Listed on [Smithery](https://smithery.ai/server/omniforce/mcp) and the
[Official MCP Registry](https://registry.modelcontextprotocol.io/v0/servers?search=omniforce)
(`io.github.rmb/omniforce-mcp`).

A [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server for
**[OmniForce](https://www.omniforce.run/)** — the GEO & AI-search visibility
platform. It lets any MCP client (Claude Desktop, Cursor, Cline, Continue, …)
audit a site's AI-search readiness and read your tracked prompts, competitors,
visibility runs, and reports without leaving the chat.

> OmniForce helps brands get cited by ChatGPT, Perplexity, Gemini, and Google AI
> Overviews, and tracks AI citations and decay over time — [omniforce.run](https://www.omniforce.run/).

## Tools

| Tool | Auth | What it does |
|------|------|--------------|
| `omniforce_geo_scan` | none | Audit a URL's GEO/AEO readiness → evidence-based score + findings. |
| `omniforce_get_brand` | API key | The tenant's brand profile. |
| `omniforce_list_prompts` | API key | Queries monitored across answer engines. |
| `omniforce_list_competitors` | API key | Competitors tracked for the tenant. |
| `omniforce_list_snapshots` | API key | Recent radar runs (citation/visibility snapshots). |
| `omniforce_list_reports` | API key | Shareable visibility reports. |
| `omniforce_account` | API key | Plan tier, included allotments, current usage, available upgrades. |
| `omniforce_upgrade` | API key | Create a hosted checkout link to upgrade the plan. |

`omniforce_geo_scan` is **keyless** — install the server and it works
immediately. The other tools read tenant data and need an API key.

## Quick start

No install required — run it with `npx`:

```jsonc
// Claude Desktop: ~/Library/Application Support/Claude/claude_desktop_config.json
// Cursor: ~/.cursor/mcp.json
{
  "mcpServers": {
    "omniforce": {
      "command": "npx",
      "args": ["-y", "@omniforce/mcp"],
      "env": {
        "OMNIFORCE_API_KEY": "omk_your_key"
      }
    }
  }
}
```

`OMNIFORCE_API_KEY` is optional — omit the `env` block to use only the keyless
`omniforce_geo_scan` tool. Create a key at
[omniforce.run](https://www.omniforce.run/).

### VS Code / Cline / Continue

```jsonc
{
  "mcpServers": {
    "omniforce": {
      "command": "npx",
      "args": ["-y", "@omniforce/mcp"],
      "env": { "OMNIFORCE_API_KEY": "omk_your_key" }
    }
  }
}
```

## Configuration

| Env var | Required | Default | Purpose |
|---------|----------|---------|---------|
| `OMNIFORCE_API_KEY` | for tenant tools | — | Tenant API key (`omk_...`). |
| `OMNIFORCE_API_BASE_URL` | no | `https://api.omniforce.run` | Override the API base URL. |

## From source

```bash
npm install
npm run build
node dist/index.js        # speaks MCP over stdio
npm test                  # vitest
```

## Remote (HTTP) endpoint

Run the same tools over Streamable HTTP for registries and hosted clients:

```bash
PORT=8080 OMNIFORCE_API_BASE_URL=https://api.omniforce.run npm run start:http
# or:
docker build -f Dockerfile.http -t omniforce-mcp-http . && docker run -p 8080:8080 omniforce-mcp-http
```

- `POST /mcp` — Streamable HTTP (MCP)
- `GET /health`, `GET /.well-known/mcp/server-card.json`

Auth is **per request**: send `Authorization: Bearer omk_...` (or `x-api-key`) to
use the tenant tools. Anonymous callers get the keyless `omniforce_geo_scan`,
rate-limited per IP/day (`OMNIFORCE_ANON_DAILY_LIMIT`, default 10) plus an upsell
link; set `MCP_CTA_FOOTER=off` to disable the footer.

## Example prompts

- "Run a GEO scan on https://example.com and summarize the top 3 fixes."
- "List my tracked prompts and competitors."
- "Pull my last 20 visibility runs and tell me where citations are decaying."
- "What plan am I on and how much of my quota is left?"
- "I want to track another competitor — what would I need to upgrade to?"

## Plans & upgrades

`omniforce_geo_scan` is free and keyless. The monitoring tools (prompts,
competitors, runs, reports, account) read tenant data and work on any plan.
When a request needs a higher tier, call `omniforce_account` to see the current
plan and usage, then `omniforce_upgrade` with a tier
(`solo` · `starter` · `growth` · `scale`) to generate a Polar checkout link the
user can open to pay. See [omniforce.run](https://www.omniforce.run/).

## Security

Read-only. The server never writes to your account and only sends your API key to
the configured OmniForce API base URL. Nothing else is transmitted.

## License

MIT — see [LICENSE](./LICENSE).
