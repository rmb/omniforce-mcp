# Registry submission copy

Ready-to-paste listings for the MCP directories. Keep fields within each
registry's limits; the copy is deliberately factual (no superlatives) so it
survives review.

## Shared assets

- **Name:** OmniForce
- **Repo:** https://github.com/rmb/omniforce-mcp
- **npm:** https://www.npmjs.com/package/@omniforce/mcp
- **Website:** https://www.omniforce.run/
- **License:** MIT
- **Install:** `npx -y @omniforce/mcp`
- **Categories / tags:** geo, aeo, ai-search, ai-visibility, seo, marketing, analytics, monitoring, citations, mcp-server

**Short description (≤160 chars):**
> Audit any site's GEO/AI-search readiness and query your tracked prompts, competitors, and AI citation runs from any MCP client.

**Long description:**
> OmniForce is a GEO (Generative Engine Optimization) & AI-search visibility
> platform. This MCP server exposes it to any Model Context Protocol client
> (Claude Desktop, Cursor, Cline, Continue): run an evidence-based GEO audit of
> any URL (keyless), and read your tracked prompts, competitors, visibility runs,
> and reports. It also exposes your plan, usage, and a one-click upgrade link.

**Tools:**
`omniforce_geo_scan` (keyless) · `omniforce_get_brand` · `omniforce_list_prompts` ·
`omniforce_list_competitors` · `omniforce_list_snapshots` · `omniforce_list_reports` ·
`omniforce_account` · `omniforce_upgrade`

**Environment:**
- `OMNIFORCE_API_KEY` — optional; enables the tenant-monitoring tools (create at https://www.omniforce.run/)
- `OMNIFORCE_API_BASE_URL` — optional; defaults to `https://api.omniforce.run`

**Client config (stdio):**
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

---

## Smithery — https://smithery.ai/new

- **Type:** stdio (npx)
- **Command:** `npx`
- **Args:** `-y`, `@omniforce/mcp`
- **Name:** OmniForce
- **Description:** use the short description above
- **Homepage:** https://www.omniforce.run/
- **Repository:** https://github.com/rmb/omniforce-mcp
- **Config schema:** `OMNIFORCE_API_KEY` (string, secret, optional), `OMNIFORCE_API_BASE_URL` (string, optional)
- Smithery usually infers config from `package.json`; the server needs no build step at runtime because `dist/` ships in the tarball.

## Glama — https://glama.ai/mcp/servers

- **Submission:** add the GitHub repo (Glama indexes public repos).
- **Repository:** https://github.com/rmb/omniforce-mcp
- **Description:** use the long description above
- **Docker:** Glama can build from an `npx` package; no Dockerfile is required. (Add one only if the reviewer asks.)
- After indexing, Glama issues a badge — add it to the README:
  ```md
  [![rmb/omniforce-mcp MCP server](https://glama.ai/mcp/servers/rmb/omniforce-mcp/badge)](https://glama.ai/mcp/servers/rmb/omniforce-mcp)
  ```

## mcp.so — https://mcp.so/submit

- **Name:** OmniForce
- **Link:** https://github.com/rmb/omniforce-mcp
- **Category:** Search & Data / Marketing
- **Description:** use the short description above
- **Tags:** geo, ai-search, seo, marketing, analytics

## PulseMCP — https://www.pulsemcp.com/submit

- **Name:** OmniForce
- **Server URL / repo:** https://github.com/rmb/omniforce-mcp
- **Description:** use the short description above
- **Tags:** geo, ai-search, marketing, analytics
