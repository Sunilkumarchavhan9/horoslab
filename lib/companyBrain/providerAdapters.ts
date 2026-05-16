type ProviderFetchResult = {
  items: Array<Record<string, unknown>>;
  nextCursor?: string;
  checkpointEpochMs: number;
  configPatch?: Record<string, unknown>;
};

type SourceConfig = Record<string, unknown>;

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function extractItemCheckpoint(items: Array<Record<string, unknown>>, fallback: number): number {
  let checkpoint = fallback;
  for (const item of items) {
    const raw = item.updatedAt ?? item.updated_at ?? item.modifiedAt ?? item.lastmodifieddate ?? item.createdAt;
    if (typeof raw === "number" && Number.isFinite(raw)) {
      checkpoint = Math.max(checkpoint, raw);
      continue;
    }
    if (typeof raw === "string") {
      const ms = Date.parse(raw);
      if (!Number.isNaN(ms)) checkpoint = Math.max(checkpoint, ms);
    }
  }
  return checkpoint;
}

function parseNextLinkUrl(linkHeader: string): string {
  const parts = linkHeader.split(",");
  for (const part of parts) {
    const chunk = part.trim();
    if (!chunk.includes("rel=\"next\"")) continue;
    const match = chunk.match(/<([^>]+)>/);
    if (match?.[1]) return match[1];
  }
  return "";
}

async function maybeRefreshAccessToken(config: SourceConfig): Promise<Record<string, unknown>> {
  const refreshEnabled = asBoolean(config.enableTokenRefresh);
  if (!refreshEnabled) return {};
  const refreshUrl = asString(config.tokenRefreshUrl).trim();
  const refreshToken = asString(config.refreshToken).trim();
  const clientId = asString(config.clientId).trim();
  const clientSecret = asString(config.clientSecret).trim();
  if (!refreshUrl || !refreshToken || !clientId || !clientSecret) return {};
  const expiresAt = asNumber(config.tokenExpiresAtEpochMs);
  const now = Date.now();
  if (expiresAt > now + 60_000) return {};
  const form = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });
  const response = await fetch(refreshUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: form.toString(),
  });
  if (!response.ok) {
    throw new Error(`token refresh failed (${response.status})`);
  }
  const payload = await response.json() as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
  };
  const accessToken = typeof payload.access_token === "string" ? payload.access_token : "";
  if (!accessToken) return {};
  const ttlMs = typeof payload.expires_in === "number" && payload.expires_in > 0 ? payload.expires_in * 1000 : 3600_000;
  return {
    accessToken,
    tokenExpiresAtEpochMs: now + ttlMs,
    ...(typeof payload.refresh_token === "string" && payload.refresh_token ? { refreshToken: payload.refresh_token } : {}),
    lastTokenRefreshAt: new Date(now).toISOString(),
  };
}

function authHeaders(config: SourceConfig, accessTokenPatch?: string): HeadersInit {
  const headers: HeadersInit = { Accept: "application/json" };
  const apiKey = asString(config.apiKey).trim();
  const accessToken = accessTokenPatch?.trim() || asString(config.accessToken).trim();
  const bearerToken = accessToken || asString(config.bearerToken).trim();
  const authHeader = asString(config.authHeader).trim() || "Authorization";
  if (apiKey) headers["x-api-key"] = apiKey;
  if (bearerToken) headers[authHeader] = bearerToken.startsWith("Bearer ") ? bearerToken : `Bearer ${bearerToken}`;
  return headers;
}

function withQuery(url: string, params: URLSearchParams): string {
  return `${url}${url.includes("?") ? "&" : "?"}${params.toString()}`;
}

export async function fetchSupportProvider(config: SourceConfig): Promise<ProviderFetchResult> {
  const tokenPatch = await maybeRefreshAccessToken(config);
  const freshAccessToken = typeof tokenPatch.accessToken === "string" ? tokenPatch.accessToken : undefined;
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
    const response = await fetch(withQuery(baseUrl, params), { headers: authHeaders(config, freshAccessToken) });
    if (!response.ok) throw new Error(`zendesk fetch failed (${response.status})`);
    const payload = await response.json() as {
      tickets?: Array<Record<string, unknown>>;
      meta?: { after_cursor?: string; has_more?: boolean };
    };
    const items = Array.isArray(payload.tickets) ? payload.tickets : [];
    const checkpointEpochMs = extractItemCheckpoint(items, Date.now());
    return {
      items,
      ...(payload.meta?.has_more && payload.meta.after_cursor ? { nextCursor: payload.meta.after_cursor } : {}),
      checkpointEpochMs,
      ...(Object.keys(tokenPatch).length ? { configPatch: tokenPatch } : {}),
    };
  }

  if (provider === "freshdesk") {
    const domain = asString(config.domain);
    const baseUrl = asString(config.apiUrl) || (domain ? `https://${domain}.freshdesk.com/api/v2/tickets` : "");
    if (!baseUrl) throw new Error("freshdesk requires apiUrl or domain");
    const params = new URLSearchParams({ per_page: "50" });
    if (sinceEpochMs > 0) params.set("updated_since", new Date(sinceEpochMs).toISOString());
    if (cursor) params.set("page", cursor);
    const response = await fetch(withQuery(baseUrl, params), { headers: authHeaders(config, freshAccessToken) });
    if (!response.ok) throw new Error(`freshdesk fetch failed (${response.status})`);
    const payload = await response.json() as Array<Record<string, unknown>>;
    const items = Array.isArray(payload) ? payload : [];
    const nextFromHeader = parseNextLinkUrl(response.headers.get("link") ?? "");
    const nextPage = nextFromHeader || (items.length >= 50 ? String(Number(cursor || "1") + 1) : "");
    return {
      items,
      ...(nextPage ? { nextCursor: nextPage } : {}),
      checkpointEpochMs: extractItemCheckpoint(items, Date.now()),
      ...(Object.keys(tokenPatch).length ? { configPatch: tokenPatch } : {}),
    };
  }

  throw new Error("unsupported support provider; use zendesk or freshdesk");
}

export async function fetchCrmProvider(config: SourceConfig): Promise<ProviderFetchResult> {
  const tokenPatch = await maybeRefreshAccessToken(config);
  const freshAccessToken = typeof tokenPatch.accessToken === "string" ? tokenPatch.accessToken : undefined;
  const provider = asString(config.provider).toLowerCase();
  const cursor = asString(config.cursor);
  const sinceEpochMs = asNumber(config.lastCheckpointEpochMs);

  if (provider === "hubspot") {
    const baseUrl = asString(config.apiUrl) || "https://api.hubapi.com/crm/v3/objects/contacts";
    const useSearchApi = baseUrl.includes("/search");
    let response: Response;
    if (useSearchApi) {
      const body = {
        limit: 50,
        ...(cursor ? { after: cursor } : {}),
        ...(sinceEpochMs > 0
          ? {
              filterGroups: [
                {
                  filters: [
                    { propertyName: "lastmodifieddate", operator: "GT", value: String(sinceEpochMs) },
                  ],
                },
              ],
            }
          : {}),
      };
      response = await fetch(baseUrl, {
        method: "POST",
        headers: { ...authHeaders(config, freshAccessToken), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      const params = new URLSearchParams({ limit: "50" });
      if (cursor) params.set("after", cursor);
      response = await fetch(withQuery(baseUrl, params), { headers: authHeaders(config, freshAccessToken) });
    }
    if (!response.ok) throw new Error(`hubspot fetch failed (${response.status})`);
    const payload = await response.json() as {
      results?: Array<Record<string, unknown>>;
      paging?: { next?: { after?: string } };
    };
    const items = Array.isArray(payload.results) ? payload.results : [];
    return {
      items,
      nextCursor: payload.paging?.next?.after,
      checkpointEpochMs: extractItemCheckpoint(items, Date.now()),
      ...(Object.keys(tokenPatch).length ? { configPatch: tokenPatch } : {}),
    };
  }

  throw new Error("unsupported crm provider; use hubspot");
}

export async function fetchDbProvider(config: SourceConfig): Promise<ProviderFetchResult> {
  const tokenPatch = await maybeRefreshAccessToken(config);
  const freshAccessToken = typeof tokenPatch.accessToken === "string" ? tokenPatch.accessToken : undefined;
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
    const response = await fetch(withQuery(baseUrl, params), { headers: authHeaders(config, freshAccessToken) });
    if (!response.ok) throw new Error(`${provider} db fetch failed (${response.status})`);
    const payload = await response.json() as {
      rows?: Array<Record<string, unknown>>;
      nextCursor?: string;
      checkpointEpochMs?: number;
    };
    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    return {
      items: rows,
      ...(payload.nextCursor ? { nextCursor: payload.nextCursor } : {}),
      checkpointEpochMs:
        typeof payload.checkpointEpochMs === "number"
          ? payload.checkpointEpochMs
          : extractItemCheckpoint(rows, Date.now()),
      ...(Object.keys(tokenPatch).length ? { configPatch: tokenPatch } : {}),
    };
  }

  throw new Error("unsupported db provider; use postgres or mysql");
}
