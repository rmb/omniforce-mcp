# omniforce-mcp

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

## Example prompts

- "Run a GEO scan on https://example.com and summarize the top 3 fixes."
- "List my tracked prompts and competitors."
- "Pull my last 20 visibility runs and tell me where citations are decaying."

## Security

Read-only. The server never writes to your account and only sends your API key to
the configured OmniForce API base URL. Nothing else is transmitted.

## License

MIT — see [LICENSE](./LICENSE).
