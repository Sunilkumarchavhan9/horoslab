import { NextResponse, type NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{
    memoryPath?: string[];
  }>;
};

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const FORWARDED_HEADER_ALLOWLIST = new Set([
  "accept",
  "authorization",
  "content-type",
  "x-api-key",
  "x-request-id",
]);
const DEFAULT_UPSTREAM_TIMEOUT_MS = 20_000;
const METERED_GET_PATHS = new Set<string>([
  "/retrieve/explain",
]);

function resolveTimeoutMs(pathSegments: string[], method: string): number {
  const path = `/${pathSegments.join("/")}`;
  if (method === "POST" && (path === "/handoff" || path === "/resume")) return 35_000;
  if (method === "POST" && path === "/contract/validate") return 15_000;
  if (method === "GET" && (path === "/requests" || path === "/list" || path === "/insights")) return 25_000;
  return DEFAULT_UPSTREAM_TIMEOUT_MS;
}

function backendOrigin(): string {
  const configured = process.env.MEMORYOS_API_ORIGIN?.trim();
  return (configured && configured !== "same-origin" ? configured : "http://localhost:3001").replace(/\/+$/, "");
}

function isRetriableProxyError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("econnreset") ||
    message.includes("socket hang up") ||
    message.includes("etimedout") ||
    message.includes("fetch failed") ||
    message.includes("network")
  );
}

async function forwardMemoryRequest(
  request: NextRequest,
  url: string,
  headers: Headers,
  body: BodyInit | undefined,
  timeoutMs: number,
): Promise<globalThis.Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function forwardMemoryRequestWithRetry(
  request: NextRequest,
  url: string,
  headers: Headers,
  body: BodyInit | undefined,
  timeoutMs: number,
  pathSegments: string[],
): Promise<globalThis.Response> {
  try {
    return await forwardMemoryRequest(request, url, headers, body, timeoutMs);
  } catch (error) {
    const isIdempotent = request.method === "GET" || request.method === "HEAD";
    const normalizedPath = `/${pathSegments.join("/")}`;
    const isMeteredGetPath = METERED_GET_PATHS.has(normalizedPath);
    if (isIdempotent && !isMeteredGetPath && isRetriableProxyError(error)) {
      return forwardMemoryRequest(request, url, headers, body, timeoutMs);
    }
    throw error;
  }
}

async function proxyMemoryRequest(request: NextRequest, context: RouteContext): Promise<Response> {
  const { memoryPath = [] } = await context.params;
  const path = memoryPath.map(encodeURIComponent).join("/");
  const search = request.nextUrl.search;
  const origin = backendOrigin();
  const url = `${origin}/api/memory/${path}${search}`;
  const timeoutMs = resolveTimeoutMs(memoryPath, request.method);

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lowered = key.toLowerCase();
    if (
      !HOP_BY_HOP_HEADERS.has(lowered) &&
      (FORWARDED_HEADER_ALLOWLIST.has(lowered) || lowered.startsWith("x-memoryos-"))
    ) {
      headers.set(lowered, value);
    }
  });

  let response: globalThis.Response;
  try {
    const hasBody = request.method !== "GET" && request.method !== "HEAD";
    const body = hasBody ? new Uint8Array(await request.arrayBuffer()) : undefined;
    response = await forwardMemoryRequestWithRetry(request, url, headers, body, timeoutMs, memoryPath);
  } catch (error) {
    const normalizedPath = `/${memoryPath.join("/")}`;
    const isGet = request.method === "GET";
    if (isGet && normalizedPath === "/requests") {
      return NextResponse.json(
        {
          requests: [],
          count: 0,
          filters: {
            type: "all",
            status: "All",
            range: "all",
            limit: 200,
          },
          warning: "memory_requests_temporarily_unavailable",
        },
        { status: 200 },
      );
    }
    if (isGet && normalizedPath === "/insights") {
      return NextResponse.json(
        {
          totalsByType: { profile: 0, preference: 0, learning: 0, project: 0, episodic: 0 },
          totalsByStatus: { active: 0, stale: 0, contradicted: 0, archived: 0, merged: 0 },
          topSkills: [],
          activeProjects: [],
          recentMilestones: [],
          warning: "memory_insights_temporarily_unavailable",
        },
        { status: 200 },
      );
    }
    if (isGet && normalizedPath === "/list") {
      return NextResponse.json(
        {
          memories: [],
          count: 0,
          warning: "memory_list_temporarily_unavailable",
        },
        { status: 200 },
      );
    }
    return NextResponse.json(
      {
        error: "MemoryOS backend proxy failed",
        detail: error instanceof Error ? error.message : "Unknown proxy error",
        target: url,
      },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();
  response.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });
  responseHeaders.set("x-memoryos-proxy-target", response.url || url);

  const normalizedPath = `/${memoryPath.join("/")}`;
  if (request.method === "GET" && normalizedPath === "/requests" && response.status >= 500) {
    return NextResponse.json(
      {
        requests: [],
        count: 0,
        filters: {
          type: "all",
          status: "All",
          range: "all",
          limit: 200,
        },
        warning: "memory_requests_upstream_5xx",
      },
      { status: 200 },
    );
  }

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export async function GET(request: NextRequest, context: RouteContext): Promise<Response> {
  return proxyMemoryRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext): Promise<Response> {
  return proxyMemoryRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext): Promise<Response> {
  return proxyMemoryRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext): Promise<Response> {
  return proxyMemoryRequest(request, context);
}
