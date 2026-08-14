import "dotenv/config";
import { SignJWT } from "jose";

export function argValue(name: string): string | undefined {
  const exact = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(exact));
  if (match) return match.slice(exact.length);
  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0) return process.argv[index + 1];
  return undefined;
}

export function getBaseUrl(): string {
  return (argValue("base-url") ?? process.env.MEMORYOS_BASE_URL ?? "http://localhost:3011").replace(/\/+$/, "");
}

export function getConfiguredToken(): string | undefined {
  return argValue("token") ?? process.env.MEMORYOS_API_KEY ?? process.env.MEMORYOS_API_TOKEN;
}

export function getToken(): string {
  const token = getConfiguredToken();
  if (!token) {
    throw new Error("Missing MEMORYOS_API_KEY or MEMORYOS_API_TOKEN.");
  }
  return token;
}

function isLocalMemoryOsUrl(baseUrl: string): boolean {
  try {
    const parsed = new URL(baseUrl);
    return ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
  } catch {
    return false;
  }
}

async function createLocalCodexJwt(baseUrl: string): Promise<string | undefined> {
  if (!isLocalMemoryOsUrl(baseUrl) && process.env.MEMORYOS_ALLOW_LOCAL_CODEX_AUTH !== "1") {
    return undefined;
  }

  const secret = process.env.MEMORYOS_JWT_SECRET ?? process.env.JWT_SECRET;
  if (!secret) return undefined;

  const userId =
    argValue("user-id") ??
    process.env.MEMORYOS_CODEX_USER_ID ??
    process.env.CODEX_MEMORYOS_USER_ID ??
    "codex-local";
  const issuer = process.env.MEMORYOS_JWT_ISSUER ?? process.env.JWT_ISSUER;
  const audience = process.env.MEMORYOS_JWT_AUDIENCE ?? process.env.JWT_AUDIENCE;
  let jwt = new SignJWT({
    scope: "memoryignition:outcome",
    agent: "codex",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("10m");

  if (issuer) jwt = jwt.setIssuer(issuer);
  if (audience) jwt = jwt.setAudience(audience);

  return jwt.sign(new TextEncoder().encode(secret));
}

async function getBearerToken(baseUrl: string, preferLocalJwt = false): Promise<string> {
  if (!preferLocalJwt) {
    const configured = getConfiguredToken();
    if (configured) return configured;
  }

  const localJwt = await createLocalCodexJwt(baseUrl);
  if (localJwt) return localJwt;

  const configured = getConfiguredToken();
  if (configured) return configured;

  throw new Error(
    "Missing MEMORYOS_API_KEY or MEMORYOS_API_TOKEN. For local dev, set MEMORYOS_JWT_SECRET/JWT_SECRET so Codex can create a short-lived local saver token.",
  );
}

function getOrgHeader(): Record<string, string> {
  const orgId = argValue("org-id") ?? process.env.MEMORYOS_ORG_ID ?? process.env.CODEX_MEMORYOS_ORG_ID;
  return orgId ? { "x-memoryos-org-id": orgId } : {};
}

async function postWithBearer(
  baseUrl: string,
  route: string,
  body: Record<string, unknown>,
  token: string,
): Promise<Response> {
  return fetch(`${baseUrl}${route}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...getOrgHeader(),
    },
    body: JSON.stringify(body),
  });
}

export async function requestMemoryOs(route: string, body: Record<string, unknown>): Promise<unknown> {
  const baseUrl = getBaseUrl();
  let response = await postWithBearer(baseUrl, route, body, await getBearerToken(baseUrl));

  if (response.status === 401 && getConfiguredToken() && await createLocalCodexJwt(baseUrl)) {
    response = await postWithBearer(baseUrl, route, body, await getBearerToken(baseUrl, true));
  }

  const payload = (await response.json().catch(() => null)) as {
    data?: unknown;
    error?: { message?: string } | string;
    message?: string;
  } | null;

  if (!response.ok) {
    const message =
      typeof payload?.error === "string" ? payload.error : payload?.error?.message ?? payload?.message;
    throw new Error(message ?? `${route} returned ${response.status}`);
  }

  return payload;
}

export async function postMemoryOs(route: string, body: Record<string, unknown>): Promise<unknown> {
  return requestMemoryOs(route, body);
}

export async function invokeMemoryOs(name: string, input: Record<string, unknown>): Promise<unknown> {
  const payload = await requestMemoryOs("/api/mcp/invoke", {
    name,
    input,
  });
  const normalized = payload as { data?: { result?: unknown } };
  return normalized?.data?.result ?? payload;
}

export async function getMemoryIgnitionBrief(input: Record<string, unknown>): Promise<unknown> {
  const payload = await requestMemoryOs("/api/memory/memoryignition/brief", input);
  const normalized = payload as { data?: unknown };
  return normalized?.data ?? payload;
}

export async function saveMemoryIgnitionOutcome(input: Record<string, unknown>): Promise<unknown> {
  const payload = await requestMemoryOs("/api/memory/memoryignition/outcome", input);
  const normalized = payload as { data?: unknown };
  return normalized?.data ?? payload;
}
