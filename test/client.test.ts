import { afterEach, describe, expect, it, vi } from "vitest";
import { OmniforceApiError, OmniforceClient } from "../src/client.js";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const ORIGINAL_KEY = process.env.OMNIFORCE_API_KEY;
const ORIGINAL_BASE = process.env.OMNIFORCE_API_BASE_URL;

afterEach(() => {
  if (ORIGINAL_KEY === undefined) delete process.env.OMNIFORCE_API_KEY;
  else process.env.OMNIFORCE_API_KEY = ORIGINAL_KEY;
  if (ORIGINAL_BASE === undefined) delete process.env.OMNIFORCE_API_BASE_URL;
  else process.env.OMNIFORCE_API_BASE_URL = ORIGINAL_BASE;
});

describe("OmniforceClient", () => {
  it("performs a keyless geo scan and parses JSON", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const client = new OmniforceClient({
      baseUrl: "https://api.example.test/",
      fetchImpl: async (input, init) => {
        calls.push({ url: String(input), init });
        return jsonResponse({ domain: "example.com", scores: { overall: 82 } });
      },
    });

    const result = (await client.geoScan("https://example.com")) as {
      scores: { overall: number };
    };

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://api.example.test/v1/geo/scan");
    expect(calls[0].init?.method).toBe("POST");
    expect(calls[0].init?.body).toBe(JSON.stringify({ url: "https://example.com" }));
    const headers = calls[0].init?.headers as Record<string, string>;
    expect(headers["X-API-Key"]).toBeUndefined();
    expect(result.scores.overall).toBe(82);
  });

  it("sends the API key on authenticated reads", async () => {
    const calls: Array<RequestInit | undefined> = [];
    const client = new OmniforceClient({
      baseUrl: "https://api.example.test",
      apiKey: "omk_test",
      fetchImpl: async (_input, init) => {
        calls.push(init);
        return jsonResponse({ prompts: [] });
      },
    });

    await client.listPrompts();

    const headers = calls[0]?.headers as Record<string, string>;
    expect(headers["X-API-Key"]).toBe("omk_test");
    expect(headers["Authorization"]).toBe("Bearer omk_test");
  });

  it("requires a key for authenticated endpoints", async () => {
    delete process.env.OMNIFORCE_API_KEY;
    const client = new OmniforceClient({
      baseUrl: "https://api.example.test",
      fetchImpl: async () => jsonResponse({}),
    });

    await expect(client.listReports()).rejects.toThrow(/OMNIFORCE_API_KEY/);
  });

  it("throws OmniforceApiError with the server message on failure", async () => {
    const client = new OmniforceClient({
      baseUrl: "https://api.example.test",
      apiKey: "omk_test",
      fetchImpl: async () => jsonResponse({ error: "Tenant not found" }, 404),
    });

    await expect(client.listCompetitors()).rejects.toBeInstanceOf(
      OmniforceApiError
    );
    await expect(client.listCompetitors()).rejects.toThrow("Tenant not found");
  });

  it("reads the account and creates a checkout session", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const client = new OmniforceClient({
      baseUrl: "https://api.example.test",
      apiKey: "omk_test",
      fetchImpl: async (input, init) => {
        calls.push({ url: String(input), init });
        return jsonResponse({ ok: true });
      },
    });

    await client.getAccount();
    await client.createCheckout("growth", "buyer@example.com");

    expect(calls[0].url).toBe("https://api.example.test/v1/public/account");
    expect(calls[0].init?.method).toBeUndefined();
    expect(calls[1].url).toBe("https://api.example.test/v1/public/checkout");
    expect(calls[1].init?.method).toBe("POST");
    expect(JSON.parse(calls[1].init?.body as string)).toEqual({
      tier: "growth",
      email: "buyer@example.com",
    });
  });

  it("omits the email when creating a checkout without one", async () => {
    let body: string | undefined;
    const client = new OmniforceClient({
      baseUrl: "https://api.example.test",
      apiKey: "omk_test",
      fetchImpl: async (_input, init) => {
        body = init?.body as string;
        return jsonResponse({ url: "https://polar.test/x" });
      },
    });

    await client.createCheckout("solo");
    expect(JSON.parse(body as string)).toEqual({ tier: "solo" });
  });

  it("clamps the snapshots limit into a safe range", async () => {
    const urls: string[] = [];
    const client = new OmniforceClient({
      baseUrl: "https://api.example.test",
      apiKey: "omk_test",
      fetchImpl: async (input) => {
        urls.push(String(input));
        return jsonResponse({ runs: [] });
      },
    });

    await client.listSnapshots(0);
    await client.listSnapshots(25);
    expect(urls[0]).toContain("limit=50");
    expect(urls[1]).toContain("limit=25");
  });
});
