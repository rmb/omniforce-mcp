import { describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createOmniforceMcpServer } from "../src/index.js";
import { OmniforceClient } from "../src/client.js";

function stubClient(): OmniforceClient {
  return new OmniforceClient({
    baseUrl: "https://api.example.test",
    apiKey: "omk_test",
    fetchImpl: async (input) => {
      const url = String(input);
      if (url.endsWith("/v1/geo/scan")) {
        return new Response(
          JSON.stringify({ domain: "example.com", scores: { overall: 82 } }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }
      if (url.endsWith("/v1/public/prompts")) {
        return new Response(JSON.stringify({ prompts: [{ text: "best geo tool" }] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      if (url.endsWith("/v1/public/account")) {
        return new Response(
          JSON.stringify({ tier: "starter", paid: true, upgrade: { availableTiers: [] } }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }
      if (url.endsWith("/v1/public/checkout")) {
        return new Response(
          JSON.stringify({ url: "https://polar.test/checkout/growth", tier: "growth" }),
          { status: 201, headers: { "content-type": "application/json" } }
        );
      }
      return new Response(JSON.stringify({ error: "nope" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    },
  });
}

async function connect() {
  const server = createOmniforceMcpServer(stubClient());
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "omniforce-mcp-test", version: "0.0.0" });
  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);
  return { server, client };
}

describe("omniforce-mcp server", () => {
  it("advertises the read-only tools", async () => {
    const { server, client } = await connect();
    try {
      const { tools } = await client.listTools();
      const names = tools.map((t) => t.name).sort();
      expect(names).toEqual(
        [
          "omniforce_account",
          "omniforce_geo_scan",
          "omniforce_get_brand",
          "omniforce_list_competitors",
          "omniforce_list_prompts",
          "omniforce_list_reports",
          "omniforce_list_snapshots",
          "omniforce_upgrade",
        ].sort()
      );
    } finally {
      await client.close();
      await server.close();
    }
  });

  it("runs a geo scan without an API key", async () => {
    const { server, client } = await connect();
    try {
      const result = await client.callTool({
        name: "omniforce_geo_scan",
        arguments: { url: "https://example.com" },
      });
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("example.com");
      expect(text).toContain("82");
    } finally {
      await client.close();
      await server.close();
    }
  });

  it("returns account usage", async () => {
    const { server, client } = await connect();
    try {
      const result = await client.callTool({
        name: "omniforce_account",
        arguments: {},
      });
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("starter");
    } finally {
      await client.close();
      await server.close();
    }
  });

  it("creates an upgrade checkout link", async () => {
    const { server, client } = await connect();
    try {
      const result = await client.callTool({
        name: "omniforce_upgrade",
        arguments: { tier: "growth" },
      });
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("polar.test/checkout/growth");
    } finally {
      await client.close();
      await server.close();
    }
  });

  it("surfaces upstream errors as tool errors", async () => {
    const { server, client } = await connect();
    try {
      const result = await client.callTool({
        name: "omniforce_list_reports",
        arguments: {},
      });
      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("HTTP 500");
    } finally {
      await client.close();
      await server.close();
    }
  });
});
