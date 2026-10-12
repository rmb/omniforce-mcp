# Registry submission kit

Everything needed to submit `omniforce-mcp` to the MCP directories. All copy is
factual (no superlatives) so it survives review. Do not include secrets.

## 1. Canonical facts (copy/paste anywhere)

| Field | Value |
|-------|-------|
| Name | OmniForce |
| Display (repo/package) | `omniforce-mcp` |
| GitHub | https://github.com/rmb/omniforce-mcp |
| npm | https://www.npmjs.com/package/@omniforce/mcp |
| Website | https://www.omniforce.run/ |
| Blog | https://www.omniforce.run/blog |
| API health | https://api.omniforce.run/health |
| License | MIT |
| Author | OmniForce (`rmb`) |
| Transport | stdio |
| Install | `npx -y @omniforce/mcp` |

**Assets**
- Icon (SVG): https://www.omniforce.run/icon.svg
- Open Graph image: https://www.omniforce.run/opengraph-image

**Environment variables**
- `OMNIFORCE_API_KEY` — optional; unlocks the tenant-monitoring tools (`omk_…`, created at https://www.omniforce.run/)
- `OMNIFORCE_API_BASE_URL` — optional; default `https://api.omniforce.run`

**Tags / keywords**
`geo`, `aeo`, `ai-search`, `ai-visibility`, `seo`, `marketing`, `analytics`,
`monitoring`, `citations`, `mcp-server`

**Categories (pick per registry)**
- Glama: `Marketing`, `Search`, `AI & Machine Learning`
- mcp.so: `Marketing` / `Search & Data`
- PulseMCP: `marketing`, `search`, `analytics`

### Descriptions at each length

Short (≤80 chars):
> AI-search visibility: GEO audits, tracked prompts, competitors, citations.

Medium (≤160 chars):
> Audit any site's GEO/AI-search readiness and query your tracked prompts,
> competitors, and AI citation runs from any MCP client.

Long:
> OmniForce is a GEO (Generative Engine Optimization) & AI-search visibility
> platform. This MCP server exposes it to any Model Context Protocol client
> (Claude Desktop, Cursor, Cline, Continue): run an evidence-based GEO audit of
> any URL (keyless), and read your tracked prompts, competitors, visibility runs,
> and reports. It also surfaces your plan, usage, and a one-click upgrade link.

### Tools (for capability listings)
`omniforce_geo_scan` (keyless) · `omniforce_get_brand` · `omniforce_list_prompts` ·
`omniforce_list_competitors` · `omniforce_list_snapshots` · `omniforce_list_reports` ·
`omniforce_account` · `omniforce_upgrade`

### Client config (stdio)
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

## 2. Per-registry submission

### Official MCP Registry (primary) — https://registry.modelcontextprotocol.io
- **Why first:** it's the canonical registry; PulseMCP, Glama and others ingest
  it automatically.
- **Identity:** `io.github.rmb/omniforce-mcp` (GitHub OIDC namespace).
- **Requirements (met):** `mcpName` in `package.json` + the package published to
  npm + a valid `server.json` at the repo root (validated locally).
- **Automated:** the **Publish** workflow installs `mcp-publisher`, runs
  `login github-oidc`, and publishes on every release — no secrets required.
- **Manual (if needed):**
  ```bash
  curl -L "https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_$(uname -s | tr '[:upper:]' '[:lower:]')_$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/').tar.gz" | tar xz mcp-publisher
  ./mcp-publisher login github
  ./mcp-publisher publish
  ```
- **Verify:** https://registry.modelcontextprotocol.io/v0/servers?search=omniforce

### Smithery — https://smithery.ai/new  (URL flow)
- **Endpoint:** `https://mcp-oss.omniforce.run/mcp` (Streamable HTTP).
- **Namespace / Server ID:** `omniforce` / `mcp` → `omniforce/mcp`.
- **Status:** live on Coolify at `mcp-oss.omniforce.run` (valid TLS).
- **Config schema** (optional — prompts users for their key; without it the
  keyless `omniforce_geo_scan` still works, rate-limited per IP/day):
  ```json
  {
    "type": "object",
    "properties": {
      "apiKey": {
        "type": "string",
        "title": "OmniForce API Key",
        "description": "Optional. Enables the tracking tools (prompts, competitors, runs, reports). Leave blank to use the keyless GEO scan. Create one at https://www.omniforce.run/.",
        "x-from": { "header": "x-api-key" }
      }
    }
  }
  ```
  No `Bearer` prefix is required — the server reads `x-api-key` directly (it also
  accepts a raw `omk_...` or `Bearer omk_...` in `Authorization`). If you prefer
  the `Authorization` header, use `"x-from": { "header": "x-omniforce-api-key" }`
  with `"x-to": { "header": "Authorization" }`.
- **CLI publish (with schema):**
  ```bash
  smithery mcp publish "https://mcp-oss.omniforce.run/mcp" -n omniforce/mcp \
    --config-schema '{"type":"object","properties":{"apiKey":{"type":"string","title":"OmniForce API Key","x-from":{"header":"x-api-key"}}}}'
  ```
- *(Local MCPB alternative: `npm run mcpb` → `server.mcpb`.)*

### Glama — https://glama.ai/mcp/servers
- **Account:** sign in, then use **Add Server**.
- **Input:** the GitHub repo URL (Glama indexes public repos and reads npm
  download stats). It scans `package.json`/Dockerfile to build and grade the
  server.
- **Repository:** https://github.com/rmb/omniforce-mcp
- **Description:** use the Long description above.
- **Dockerfile:** provided at the repo root (stdio image, verified to run).
- **Badge after indexing:**
  ```md
  [![rmb/omniforce-mcp MCP server](https://glama.ai/mcp/servers/rmb/omniforce-mcp/badge)](https://glama.ai/mcp/servers/rmb/omniforce-mcp)
  ```

### mcp.so — https://mcp.so/submit  (type: MCP Server)
- **No free tier** — submission requires the **$39 one-time** publishing fee
  (instant publish, verified badge, featured placement, dofollow link, DR72).
- Fields if you pay: Repository URL = https://github.com/rmb/omniforce-mcp,
  Name = OmniForce.
- **Recommendation:** skip for now; revisit if the $39 dofollow link is worth it.

### PulseMCP — https://www.pulsemcp.com/submit
- **Paused:** submissions are temporarily closed. PulseMCP advises publishing to
  the **Official MCP Registry** instead and states they will pick servers up
  automatically when they reopen.
- **Action:** nothing to do — publish to the Official Registry (above) and it
  will propagate.

---

## 3. Checklist

- [x] Public repo: https://github.com/rmb/omniforce-mcp
- [x] npm: https://www.npmjs.com/package/@omniforce/mcp (0.1.2 pending release)
- [x] GitHub topics set (mcp, model-context-protocol, geo, …)
- [x] Dockerfile + MCPB bundle (`npm run mcpb` → `server.mcpb`)
- [x] `server.json` + `mcpName` for the Official Registry (validated)
- [x] CI: publish workflow does npm + Official Registry (OIDC) + release asset
- [x] Awesome list PR: https://github.com/punkpeye/awesome-mcp-servers/pull/16249
- [x] Released v0.1.4 (npm + Official MCP Registry + `server.mcpb` asset)
- [x] Official MCP Registry listing: `io.github.rmb/omniforce-mcp` 0.1.4
- [x] Remote Streamable-HTTP endpoint implemented (`Dockerfile.http`, `/mcp`)
- [x] Deployed remote endpoint → `https://mcp-oss.omniforce.run/mcp`
- [x] Smithery — published `https://mcp-oss.omniforce.run/mcp` (`omniforce/mcp`)
- [~] Glama — submitted, under review
- [ ] mcp.so — paid only ($39); skipped
- [~] PulseMCP — paused (auto-ingests the Official Registry when back)
