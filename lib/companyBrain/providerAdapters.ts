type ProviderFetchResult = {
  items: Array<Record<string, unknown>>;
  nextCursor?: string;
  checkpointEpochMs: number;
};

type SourceConfig = Record<string, unknown>;

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function authHeaders(config: SourceConfig): HeadersInit {
  const headers: HeadersInit = { Accept: "application/json" };
  const apiKey = asString(config.apiKey).trim();
  const bearerToken = asString(config.bearerToken).trim();
  const authHeader = asString(config.authHeader).trim() || "Authorization";
  if (apiKey) headers["x-api-key"] = apiKey;
  if (bearerToken) headers[authHeader] = bearerToken.startsWith("Bearer ") ? bearerToken : `Bearer ${bearerToken}`;
  return headers;
}

function withQuery(url: string, params: URLSearchParams): string {
  return `${url}${url.includes("?") ? "&" : "?"}${params.toString()}`;
}

export async function fetchSupportProvider(config: SourceConfig): Promise<ProviderFetchResult> {
  const provider = asString(config.provider).toLowerCase();
  const cursor = asString(config.cursor);
  const sinceEpochMs = asNumber(config.lastCheckpointEpochMs);

  if (provider === "zendesk") {
    const subdomain = asString(config.subdomain);
    const baseUrl = asString(config.apiUrl) || (subdomain ? `https://${subdomain}.zendesk.com/api/v2/tickets.json` : "");
    if (!baseUrl) throw new Error("zendesk requires apiUrl or subdomain");
    const params = new URLSearchParams({ per_page: "50" });
    if (cursor) params.set("page[after]", cursor);
    if (sinceEpochMs > 0) params.set("start_time", String(Math.floor(sinceEpochMs / 1000)));
    const response = await fetch(withQuery(baseUrl, params), { headers: authHeaders(config) });
    if (!response.ok) throw new Error(`zendesk fetch failed (${response.status})`);
    const payload = await response.json() as {
      tickets?: Array<Record<string, unknown>>;
      meta?: { after_cursor?: string };
    };
    return {
      items: Array.isArray(payload.tickets) ? payload.tickets : [],
      nextCursor: payload.meta?.after_cursor,
      checkpointEpochMs: Date.now(),
    };
  }

  if (provider === "freshdesk") {
    const domain = asString(config.domain);
    const baseUrl = asString(config.apiUrl) || (domain ? `https://${domain}.freshdesk.com/api/v2/tickets` : "");
    if (!baseUrl) throw new Error("freshdesk requires apiUrl or domain");
    const params = new URLSearchParams({ per_page: "50" });
    if (sinceEpochMs > 0) params.set("updated_since", new Date(sinceEpochMs).toISOString());
    if (cursor) params.set("page", cursor);
    const response = await fetch(withQuery(baseUrl, params), { headers: authHeaders(config) });
    if (!response.ok) throw new Error(`freshdesk fetch failed (${response.status})`);
    const payload = await response.json() as Array<Record<string, unknown>>;
    const nextPage = payload.length >= 50 ? String(Number(cursor || "1") + 1) : "";
    return {
      items: Array.isArray(payload) ? payload : [],
      ...(nextPage ? { nextCursor: nextPage } : {}),
      checkpointEpochMs: Date.now(),
    };
  }

  throw new Error("unsupported support provider; use zendesk or freshdesk");
}

export async function fetchCrmProvider(config: SourceConfig): Promise<ProviderFetchResult> {
  const provider = asString(config.provider).toLowerCase();
  const cursor = asString(config.cursor);
  const sinceEpochMs = asNumber(config.lastCheckpointEpochMs);

  if (provider === "hubspot") {
    const baseUrl = asString(config.apiUrl) || "https://api.hubapi.com/crm/v3/objects/contacts";
    const params = new URLSearchParams({ limit: "50" });
    if (cursor) params.set("after", cursor);
    if (sinceEpochMs > 0) params.set("updatedAfter", String(sinceEpochMs));
    const response = await fetch(withQuery(baseUrl, params), { headers: authHeaders(config) });
    if (!response.ok) throw new Error(`hubspot fetch failed (${response.status})`);
    const payload = await response.json() as {
      results?: Array<Record<string, unknown>>;
      paging?: { next?: { after?: string } };
    };
    return {
      items: Array.isArray(payload.results) ? payload.results : [],
      nextCursor: payload.paging?.next?.after,
      checkpointEpochMs: Date.now(),
    };
  }

  throw new Error("unsupported crm provider; use hubspot");
}

export async function fetchDbProvider(config: SourceConfig): Promise<ProviderFetchResult> {
  const provider = asString(config.provider).toLowerCase();
  const cursor = asString(config.cursor);
  const sinceEpochMs = asNumber(config.lastCheckpointEpochMs);

  // In production, DB pull is typically done via an internal read API endpoint.
  // This adapter standardizes that shape for postgres/mysql backends.
  if (provider === "postgres" || provider === "mysql") {
    const baseUrl = asString(config.apiUrl);
    if (!baseUrl) throw new Error(`${provider} db adapter requires apiUrl`);
    const params = new URLSearchParams({ limit: "100" });
    if (cursor) params.set("cursor", cursor);
    if (sinceEpochMs > 0) params.set("since", new Date(sinceEpochMs).toISOString());
    const response = await fetch(withQuery(baseUrl, params), { headers: authHeaders(config) });
    if (!response.ok) throw new Error(`${provider} db fetch failed (${response.status})`);
    const payload = await response.json() as {
      rows?: Array<Record<string, unknown>>;
      nextCursor?: string;
      checkpointEpochMs?: number;
    };
    return {
      items: Array.isArray(payload.rows) ? payload.rows : [],
      ...(payload.nextCursor ? { nextCursor: payload.nextCursor } : {}),
      checkpointEpochMs:
        typeof payload.checkpointEpochMs === "number" ? payload.checkpointEpochMs : Date.now(),
    };
  }

  throw new Error("unsupported db provider; use postgres or mysql");
}
