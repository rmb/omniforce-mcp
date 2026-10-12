#!/usr/bin/env node
/**
 * OmniForce MCP server.
 *
 * Exposes OmniForce's GEO / AI-search visibility data to any Model Context
 * Protocol client (Claude Desktop, Cursor, Cline, Continue, ...).
 *
 * Read-only by design. The `omniforce_geo_scan` tool is keyless; every other
 * tool reads the authenticated tenant's data and needs OMNIFORCE_API_KEY.
 *
 * Website: https://www.omniforce.run/
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { OmniforceApiError, OmniforceClient } from "./client.js";

export const VERSION = "0.1.1";
export const SERVER_NAME = "omniforce-mcp";

type ToolResult = {
  isError?: boolean;
  content: Array<{ type: "text"; text: string }>;
};

function textResult(data: unknown): ToolResult {
  const text =
    typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return { content: [{ type: "text", text }] };
}

function errorResult(message: string): ToolResult {
  return { isError: true, content: [{ type: "text", text: message }] };
}

export function createOmniforceMcpServer(client?: OmniforceClient): McpServer {
  const server = new McpServer({ name: SERVER_NAME, version: VERSION });

  const withClient = async (
    label: string,
    fn: (c: OmniforceClient) => Promise<unknown>
  ): Promise<ToolResult> => {
    try {
      return textResult(await fn(client ?? new OmniforceClient()));
    } catch (error) {
      if (error instanceof OmniforceApiError) {
        return errorResult(`${label} failed (HTTP ${error.status}): ${error.message}`);
      }
      return errorResult(`${label} failed: ${(error as Error).message}`);
    }
  };

  server.registerTool(
    "omniforce_geo_scan",
    {
      title: "GEO scan",
      description:
        "Audit a website's AI-search (GEO/AEO) readiness. Returns an " +
        "evidence-based score with per-dimension findings. No API key required.",
      inputSchema: {
        url: z
          .string()
          .describe("Absolute URL to audit, e.g. https://example.com"),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ url }) => withClient("GEO scan", (c) => c.geoScan(url))
  );

  server.registerTool(
    "omniforce_get_brand",
    {
      title: "Get brand profile",
      description: "Return the authenticated tenant's brand profile.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => withClient("Get brand profile", (c) => c.getBrand())
  );

  server.registerTool(
    "omniforce_list_prompts",
    {
      title: "List tracked prompts",
      description:
        "List the queries OmniForce monitors across answer engines (ChatGPT, " +
        "Perplexity, Gemini, Google AI Overviews).",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => withClient("List tracked prompts", (c) => c.listPrompts())
  );

  server.registerTool(
    "omniforce_list_competitors",
    {
      title: "List competitors",
      description: "List competitors tracked for the authenticated tenant.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => withClient("List competitors", (c) => c.listCompetitors())
  );

  server.registerTool(
    "omniforce_list_snapshots",
    {
      title: "List visibility runs",
      description:
        "List recent radar runs — AI citation/visibility snapshots over time.",
      inputSchema: {
        limit: z
          .number()
          .int()
          .positive()
          .max(200)
          .optional()
          .describe("Maximum number of runs to return (default 50)."),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ limit }) =>
      withClient("List visibility runs", (c) => c.listSnapshots(limit ?? 50))
  );

  server.registerTool(
    "omniforce_list_reports",
    {
      title: "List reports",
      description: "List shareable visibility reports for the tenant.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => withClient("List reports", (c) => c.listReports())
  );

  server.registerTool(
    "omniforce_account",
    {
      title: "Account & usage",
      description:
        "Return the tenant's plan tier, included allotments, current usage, " +
        "and the available upgrade tiers.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => withClient("Get account", (c) => c.getAccount())
  );

  server.registerTool(
    "omniforce_upgrade",
    {
      title: "Upgrade plan",
      description:
        "Create a hosted checkout link to upgrade the OmniForce plan " +
        "(solo, starter, growth, scale). Returns a URL the user can open to pay. " +
        "Use when a requested feature is blocked by the current plan.",
      inputSchema: {
        tier: z
          .enum(["solo", "starter", "growth", "scale"])
          .describe("Plan tier to upgrade to."),
        email: z
          .string()
          .email()
          .optional()
          .describe(
            "Billing email. Required only if the account has no owner email on file."
          ),
      },
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    async ({ tier, email }) =>
      withClient("Create upgrade link", (c) => c.createCheckout(tier, email))
  );

  return server;
}

async function main(): Promise<void> {
  const server = createOmniforceMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].replace(/.*\//, ""))
) {
  main().catch((error) => {
    process.stderr.write(`Fatal MCP error: ${(error as Error)?.message ?? error}\n`);
    process.exit(1);
  });
}
