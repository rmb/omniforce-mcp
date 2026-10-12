import { afterEach, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { OmniforceClient } from "../src/client.js";
import { createOmniforceHttpServer, type HttpServerOptions } from "../src/http.js";

function stubFetch(): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    const json = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      });
    if (url.endsWith("/v1/geo/scan")) {
      return json({ domain: "example.com", scores: { overall: 82 } });
    }
    if (url.endsWith("/v1/public/prompts")) {
      return json(
        {
          error: "A paid plan is required for this feature.",
          code: "plan_required",
          upgrade_url:
            "https://www.omniforce.run/?utm_source=api&utm_medium=mcp&utm_content=smithery",
        },
        402
      );
    }
    return json({ error: "nope" }, 500);
  }) as typeof fetch;
}

const servers: Server[] = [];

async function start(opts: HttpServerOptions = {}): Promise<string> {
  const server = createOmniforceHttpServer({
    clientFactory: (apiKey) =>
      new OmniforceClient({ apiKey, baseUrl: "https://api.example.test", fetchImpl: stubFetch() }),
    ...opts,
  });
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  return `http://127.0.0.1:${port}`;
}

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map((s) => new Promise<void>((r) => s.close(() => r())))
  );
});

async function connect(base: string, headers?: Record<string, string>) {
  const transport = new StreamableHTTPClientTransport(new URL(`${base}/mcp`), {
    requestInit: headers ? { headers } : undefined,
  });
  const client = new Client({ name: "http-test", version: "0.0.0" });
  await client.connect(transport);
  return client;
}

function textOf(result: { content: Array<{ type: string; text: string }> }): string {
  return result.content[0].text;
}

describe("omniforce-mcp http transport", () => {
  it("serves health and the server card", async () => {
    const base = await start();
    const health = await fetch(`${base}/health`).then((r) => r.json());
    expect(health.status).toBe("ok");

    const card = await fetch(`${base}/.well-known/mcp/server-card.json`).then((r) => r.json());
    expect(card.serverInfo.name).toBe("omniforce-mcp");
    expect(card.tools.length).toBe(8);
  });

  it("lists the 8 tools over streamable HTTP", async () => {
    const base = await start();
    const client = await connect(base);
    try {
      const { tools } = await client.listTools();
      expect(tools.length).toBe(8);
    } finally {
      await client.close();
    }
  });

  it("runs an anonymous geo scan and appends the upsell CTA", async () => {
    const base = await start({ ctaFooter: true });
    const client = await connect(base);
    try {
      const res = await client.callTool({
        name: "omniforce_geo_scan",
        arguments: { url: "https://example.com" },
      });
      const text = textOf(res as { content: Array<{ type: string; text: string }> });
      expect(text).toContain("example.com");
      expect(text).toContain("OmniForce");
    } finally {
      await client.close();
    }
  });

  it("rate-limits anonymous geo scans", async () => {
    const base = await start({ anonDailyLimit: 1, ctaFooter: false });
    const client = await connect(base);
    try {
      await client.callTool({ name: "omniforce_geo_scan", arguments: { url: "https://example.com" } });
      await expect(
        client.callTool({ name: "omniforce_geo_scan", arguments: { url: "https://example.com" } })
      ).rejects.toThrow(/Free scan limit/);
    } finally {
      await client.close();
    }
  });

  it("surfaces the API upgrade_url through a gated tool error", async () => {
    const base = await start();
    const client = await connect(base, { "x-api-key": "omk_test" });
    try {
      const res = await client.callTool({ name: "omniforce_list_prompts", arguments: {} });
      expect((res as { isError?: boolean }).isError).toBe(true);
      expect(textOf(res as { content: Array<{ type: string; text: string }> })).toContain(
        "utm_content=smithery"
      );
    } finally {
      await client.close();
    }
  });
});
