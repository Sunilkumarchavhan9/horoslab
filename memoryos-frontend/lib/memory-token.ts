const TOKEN_STORAGE_KEYS = [
  "memoryos.apiToken",
  "memoryos_api_token",
  "memoryos.devToken",
  "MEMORYOS_API_TOKEN",
] as const;

const TOKEN_BRIDGE_UNAUTHORIZED_COOLDOWN_MS = Math.max(
  1_000,
  Number(process.env.NEXT_PUBLIC_MEMORYOS_TOKEN_UNAUTHORIZED_COOLDOWN_MS ?? 2_500),
);

let tokenBridgeRequest: Promise<string | null> | null = null;
let tokenBridgeUnauthorizedUntil = 0;

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const payloadSegment = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
    const decoded = window.atob(payloadSegment);
    const parsed = JSON.parse(decoded) as unknown;
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }

  return null;
}

function isTokenLikelyValid(token: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    return false;
  }

  const exp = payload.exp;
  if (typeof exp !== "number" || !Number.isFinite(exp)) {
    return false;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  return exp > nowSeconds + 15;
}

export function clearStoredMemoryTokens(): void {
  if (typeof window === "undefined") {
    return;
  }

  for (const key of TOKEN_STORAGE_KEYS) {
    window.localStorage.removeItem(key);
  }
}

export function readMemoryTokenFromStorage(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  for (const key of TOKEN_STORAGE_KEYS) {
    const value = window.localStorage.getItem(key);
    if (value && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

export function writeMemoryTokenToStorage(token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = token.trim();
  if (!normalized) {
    return;
  }

  window.localStorage.setItem("memoryos.apiToken", normalized);
}

export async function fetchMemoryTokenFromBridge(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  if (Date.now() < tokenBridgeUnauthorizedUntil) {
    return null;
  }

  if (tokenBridgeRequest) {
    return tokenBridgeRequest;
  }

  tokenBridgeRequest = fetchMemoryTokenFromBridgeOnce().finally(() => {
    tokenBridgeRequest = null;
  });
  return tokenBridgeRequest;
}

async function fetchMemoryTokenFromBridgeOnce(): Promise<string | null> {
  let response: Response;
  try {
    response = await fetch("/api/memory/token", {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
      },
    });
  } catch {
    return null;
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      tokenBridgeUnauthorizedUntil = Date.now() + TOKEN_BRIDGE_UNAUTHORIZED_COOLDOWN_MS;
    }
    return null;
  }

  tokenBridgeUnauthorizedUntil = 0;

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    return null;
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "token" in payload &&
    typeof (payload as { token: unknown }).token === "string"
  ) {
    const token = (payload as { token: string }).token.trim();
    if (!token) {
      return null;
    }
    writeMemoryTokenToStorage(token);
    return token;
  }

  return null;
}

export async function getOrCreateMemoryTokenWithRetry(options?: {
  attempts?: number;
  delayMs?: number;
}): Promise<string | null> {
  const attempts = Math.max(1, options?.attempts ?? 3);
  const delayMs = Math.max(0, options?.delayMs ?? 300);

  for (let index = 0; index < attempts; index += 1) {
    const token = await getOrCreateMemoryToken();
    if (token) {
      return token;
    }

    if (index < attempts - 1 && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return null;
}

export async function warmMemoryTokenBridge(): Promise<void> {
  await getOrCreateMemoryTokenWithRetry({ attempts: 3, delayMs: 250 });
}

export async function getOrCreateMemoryToken(): Promise<string | null> {
  const existing = readMemoryTokenFromStorage();
  if (existing && isTokenLikelyValid(existing)) {
    return existing;
  }

  if (existing) {
    clearStoredMemoryTokens();
  }

  return fetchMemoryTokenFromBridge();
}
