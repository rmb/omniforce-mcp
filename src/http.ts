#!/usr/bin/env node
/**
 * Remote (Streamable-HTTP) transport for the OmniForce MCP server.
 *
 * Hosts the same tools as the stdio server at `POST /mcp`, so registries and
 * hosted clients (Smithery, etc.) can connect to a public HTTPS URL.
 *
 * Auth is optional and per-request: send `Authorization: Bearer omk_...` or
 * `x-api-key: omk_...` to unlock the tenant tools. Anonymous callers get the
 * keyless `omniforce_geo_scan` (rate-limited per IP/day) plus an upsell CTA.
 *
 * Extra endpoints: `GET /health`, `GET /.well-known/mcp/server-card.json`.
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { Server } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { OmniforceClient } from "./client.js";
import { VERSION, createOmniforceMcpServer, SERVER_NAME } from "./index.js";

const MAX_BODY_BYTES = 1_000_000;

export interface HttpServerOptions {
  port?: number;
  host?: string;
  path?: string;
  /** Free geo_scan calls per IP per day for anonymous (no key) callers. */
  anonDailyLimit?: number;
  ctaFooter?: boolean;
  signupUrl?: string;
  apiBaseUrl?: string;
  /** Inject a client (tests). Defaults to a real OmniforceClient. */
  clientFactory?: (apiKey?: string) => OmniforceClient;
}

interface Counter {
  date: string;
  count: number;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function clientIp(req: IncomingMessage): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.trim()) return fwd.split(",")[0].trim();
  return req.socket.remoteAddress || "unknown";
}

function keyOf(req: IncomingMessage): string | undefined {
  const auth = String(req.headers["authorization"] || "");
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (match && match[1].startsWith("omk_")) return match[1].trim();
  if (auth.trim().startsWith("omk_")) return auth.trim(); // allow raw key
  const x = req.headers["x-api-key"];
  if (typeof x === "string" && x.trim()) return x.trim();
  return undefined;
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
  });
  res.end(body);
}

function readBody(req: IncomingMessage): Promise<unknown | null> {
  return new Promise((resolve) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        resolve(null);
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf-8");
      if (!raw) return resolve(undefined);
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve(undefined);
      }
    });
    req.on("error", () => resolve(undefined));
  });
}

function isGeoScanCall(body: unknown): boolean {
  const b = body as { method?: string; params?: { name?: string } } | undefined;
  return b?.method === "tools/call" && b?.params?.name === "omniforce_geo_scan";
}

function rpcId(body: unknown): string | number | null {
  const id = (body as { id?: string | number } | undefined)?.id;
  return typeof id === "string" || typeof id === "number" ? id : null;
}

export function createOmniforceHttpServer(options: HttpServerOptions = {}): Server {
  const path = options.path || process.env.MCP_PATH || "/mcp";
  const anonDailyLimit = Number(
    options.anonDailyLimit ?? process.env.OMNIFORCE_ANON_DAILY_LIMIT ?? 10
  );
  const signupUrl =
    options.signupUrl ||
    process.env.OMNIFORCE_SIGNUP_URL ||
    "https://www.omniforce.run/?utm_source=mcp&utm_medium=remote&utm_content=remote";
  const ctaFooter =
    options.ctaFooter ?? (process.env.MCP_CTA_FOOTER || "on") !== "off";
  const makeClient =
    options.clientFactory ||
    ((apiKey?: string) =>
      new OmniforceClient({
        ...(apiKey ? { apiKey } : {}),
        ...(options.apiBaseUrl ? { baseUrl: options.apiBaseUrl } : {}),
      }));

  const counters = new Map<string, Counter>();

  function bump(ip: string): number {
    const d = today();
    const entry = counters.get(ip);
    if (!entry || entry.date !== d) {
      counters.set(ip, { date: d, count: 1 });
      return 1;
    }
    entry.count += 1;
    return entry.count;
  }

  function serverCard() {
    return {
      serverInfo: { name: SERVER_NAME, title: "OmniForce", version: VERSION },
      description:
        "AI-search visibility: GEO audits, tracked prompts, competitors, citations.",
      authentication: { required: false, schemes: [] },
      tools: [
        { name: "omniforce_geo_scan", description: "Audit a website's GEO/AI-search readiness (no API key required)." },
        { name: "omniforce_get_brand", description: "Return the authenticated tenant's brand profile." },
        { name: "omniforce_list_prompts", description: "List tracked prompts across answer engines." },
        { name: "omniforce_list_competitors", description: "List tracked competitors." },
        { name: "omniforce_list_snapshots", description: "List recent AI citation/visibility runs." },
        { name: "omniforce_list_reports", description: "List shareable visibility reports." },
        { name: "omniforce_account", description: "Plan tier, usage, and available upgrades." },
        { name: "omniforce_upgrade", description: "Create a hosted checkout link to upgrade the plan." },
      ],
    };
  }

  return createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, x-api-key, mcp-session-id, mcp-protocol-version, last-event-id"
    );
    res.setHeader("Access-Control-Expose-Headers", "mcp-session-id");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    if (url.pathname === "/health") {
      sendJson(res, 200, { status: "ok", service: SERVER_NAME, version: VERSION });
      return;
    }
    if (url.pathname === "/.well-known/mcp/server-card.json") {
      sendJson(res, 200, serverCard());
      return;
    }
    if (url.pathname !== path) {
      sendJson(res, 404, { error: "not found" });
      return;
    }

    const body = await readBody(req);
    if (body === null) {
      sendJson(res, 413, { error: "payload too large" });
      return;
    }

    const apiKey = keyOf(req);

    if (!apiKey && isGeoScanCall(body)) {
      const used = bump(clientIp(req));
      if (used > anonDailyLimit) {
        sendJson(res, 200, {
          jsonrpc: "2.0",
          id: rpcId(body),
          error: {
            code: -32000,
            message:
              `Free scan limit reached (${anonDailyLimit}/day). Get an API key ` +
              `to keep tracking: ${signupUrl}`,
          },
        });
        return;
      }
    }

    const mcp = createOmniforceMcpServer(makeClient(apiKey), { ctaFooter, signupUrl });
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on("close", () => {
      void transport.close();
      void mcp.close();
    });

    try {
      await mcp.connect(transport);
      await transport.handleRequest(req, res, body as Record<string, unknown>);
    } catch (error) {
      if (!res.headersSent) {
        sendJson(res, 500, {
          jsonrpc: "2.0",
          id: rpcId(body),
          error: { code: -32603, message: `Internal error: ${(error as Error).message}` },
        });
      }
    }
  });
}

export function startHttpServer(options: HttpServerOptions = {}): Server {
  const port = Number(options.port ?? process.env.PORT ?? 8080);
  const host = options.host || process.env.HOST || "0.0.0.0";
  const server = createOmniforceHttpServer(options);
  server.listen(port, host, () => {
    process.stderr.write(`omniforce-mcp http listening on http://${host}:${port}\n`);
  });
  return server;
}

const isMain =
  process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/.*\//, ""));
if (isMain) {
  const server = startHttpServer();
  const shutdown = () => server.close(() => process.exit(0));
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
