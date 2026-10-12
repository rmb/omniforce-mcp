/**
 * Minimal client for the OmniForce public API (https://www.omniforce.run/).
 *
 * Read-only by design: every method maps to a GET, except `geoScan`, which hits
 * the keyless `POST /v1/geo/scan` audit endpoint. Authenticated calls send the
 * tenant API key as both `X-API-Key` and `Authorization: Bearer <key>`.
 */

const DEFAULT_BASE_URL = "https://api.omniforce.run";

export interface OmniforceClientOptions {
  /** API base URL. Defaults to OMNIFORCE_API_BASE_URL or https://api.omniforce.run */
  baseUrl?: string;
  /** Tenant API key (`omk_...`). Defaults to OMNIFORCE_API_KEY. */
  apiKey?: string;
  /** Injectable fetch (used by tests). Defaults to the global fetch. */
  fetchImpl?: typeof fetch;
}

export class OmniforceApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "OmniforceApiError";
    this.status = status;
  }
}

export class OmniforceClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: OmniforceClientOptions = {}) {
    this.baseUrl = (
      options.baseUrl ??
      process.env.OMNIFORCE_API_BASE_URL ??
      DEFAULT_BASE_URL
    ).replace(/\/+$/, "");
    this.apiKey = options.apiKey ?? process.env.OMNIFORCE_API_KEY;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  get hasApiKey(): boolean {
    return Boolean(this.apiKey);
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
    requiresKey = true
  ): Promise<T> {
    if (requiresKey && !this.apiKey) {
      throw new Error(
        "OMNIFORCE_API_KEY is not set. Create an API key at " +
          "https://www.omniforce.run/ and set the OMNIFORCE_API_KEY " +
          "environment variable. (The omniforce_geo_scan tool works without a key.)"
      );
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
      ...((options.headers as Record<string, string> | undefined) ?? {}),
    };
    if (options.body) headers["Content-Type"] = "application/json";
    if (this.apiKey) {
      headers["X-API-Key"] = this.apiKey;
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        ...options,
        headers,
      });
    } catch (error) {
      throw new Error(
        `Network error calling ${this.baseUrl}${path}: ${(error as Error).message}`
      );
    }

    const raw = await response.text();
    let data: unknown = undefined;
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        data = raw;
      }
    }

    if (!response.ok) {
      let detail = response.statusText || "Request failed";
      if (data && typeof data === "object" && "error" in data) {
        detail = String((data as { error: unknown }).error);
      } else if (typeof data === "string" && data.trim()) {
        detail = data.trim();
      }
      throw new OmniforceApiError(detail, response.status);
    }

    return data as T;
  }

  /** Keyless, evidence-based GEO/AEO readiness audit of any URL. */
  geoScan(url: string): Promise<unknown> {
    return this.request(
      "/v1/geo/scan",
      { method: "POST", body: JSON.stringify({ url }) },
      false
    );
  }

  /** The authenticated tenant's brand profile. */
  getBrand(): Promise<unknown> {
    return this.request("/v1/public/brand");
  }

  /** Tracked prompts (the queries we monitor across answer engines). */
  listPrompts(): Promise<unknown> {
    return this.request("/v1/public/prompts");
  }

  /** Competitors tracked for this tenant. */
  listCompetitors(): Promise<unknown> {
    return this.request("/v1/public/competitors");
  }

  /** Recent radar/visibility runs (citation snapshots). */
  listSnapshots(limit = 50): Promise<unknown> {
    const safe = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 50;
    return this.request(
      `/v1/public/snapshots?limit=${encodeURIComponent(String(safe))}`
    );
  }

  /** Shareable visibility reports. */
  listReports(): Promise<unknown> {
    return this.request("/v1/public/reports");
  }

  /** Plan, included allotments, current usage, and available upgrade tiers. */
  getAccount(): Promise<unknown> {
    return this.request("/v1/public/account");
  }

  /** Create a hosted checkout link to upgrade the tenant's plan. */
  createCheckout(tier: string, email?: string): Promise<unknown> {
    const body: Record<string, string> = { tier };
    if (email) body.email = email;
    return this.request("/v1/public/checkout", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }
}
