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

### Smithery — https://smithery.ai/new
- **Account:** required (sign in with GitHub or email).
- **Important:** Smithery's *URL* flow needs **Streamable HTTP** hosting; its
  *Local* flow needs an **MCPB bundle** — a plain `npx` package is NOT accepted
  on its own. Two options:
  1. **Local (MCPB):** build the bundle with `npm run mcpb` → `server.mcpb`
     (manifest at repo root, spec 0.3) and upload it.
  2. **URL (recommended, later):** stand up a remote Streamable-HTTP endpoint
     (e.g. `https://mcp.omniforce.run/mcp`) and publish that URL. Optionally
     serve `/.well-known/mcp/server-card.json` for metadata.
- **CLI alternative:** `smithery mcp publish ./server.mcpb -n omni/omniforce-mcp`
- **Config schema:** `OMNIFORCE_API_KEY` (string, secret, optional)
- **Verification:** after publishing, Settings → Verification.
- **Status:** `server.mcpb` builds and runs (verified). CI attaches it to each
  GitHub Release.

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
- **Form fields:** `Repository URL *` and `Name`.
  - Repository URL: https://github.com/rmb/omniforce-mcp
  - Name: OmniForce
- **Free path:** submitted to the review queue.
- **Paid path (optional):** $39 one-time — instant publish, verified badge,
  featured placement, and a **dofollow** project link (DR72 domain).
- **Recommendation:** start free; consider the $39 fast-track if review stalls.

### PulseMCP — https://www.pulsemcp.com/submit
- **Form fields:** Name, URL (GitHub repo), Description; may also ask for tags.
  - Name: OmniForce
  - URL: https://github.com/rmb/omniforce-mcp
  - Description: use the Medium description above.
  - Tags: geo, ai-search, marketing, analytics
- **Note:** the page blocks automated fetches; verify exact fields in-browser.

---

## 3. Checklist

- [x] Public repo: https://github.com/rmb/omniforce-mcp
- [x] npm: https://www.npmjs.com/package/@omniforce/mcp (0.1.1)
- [x] GitHub topics set (mcp, model-context-protocol, geo, …)
- [x] Awesome list PR: https://github.com/punkpeye/awesome-mcp-servers/pull/16249
- [ ] Smithery (needs MCPB bundle or remote URL)
- [ ] Glama (repo + optional Dockerfile)
- [ ] mcp.so (repo URL + name)
- [ ] PulseMCP (name + repo URL + description)
- [ ] Optional: Dockerfile for Glama / self-host
- [ ] Optional: remote Streamable-HTTP endpoint for Smithery + future listings
