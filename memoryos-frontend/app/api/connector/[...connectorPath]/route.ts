import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { SignJWT } from "jose";
import { isClerkEnabled } from "@/lib/clerk";
import { resolveBackendOrigin } from "../../_lib/backend-origin";

type ConnectorRouteContext = {
  params: Promise<{ connectorPath?: string[] }>;
};
const UPSTREAM_TIMEOUT_MS = 45_000;
const EVENT_STREAM_UPSTREAM_TIMEOUT_MS = 10 * 60_000;

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

function offlineEventStream(detail: string): Response {
  const body = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(
        encoder.encode(
          [
            "retry: 15000",
            "event: connector-offline",
            `data: ${JSON.stringify({ status: "offline", detail })}`,
            "",
            "",
          ].join("\n"),
        ),
      );
      controller.close();
    },
  });

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-MemoryOS-Proxy-Fallback": "connector-events-offline",
    },
  });
}

async function createConnectorAuthHeader(): Promise<string | null> {
  let userId: string | null = null;

  if (isClerkEnabled()) {
    const authState = await auth();
    userId = authState.userId;
  } else {
    userId = process.env.MEMORYOS_DEV_USER_ID?.trim() || "user-demo";
  }

  const secret = process.env.MEMORYOS_JWT_SECRET ?? process.env.JWT_SECRET;
  if (!userId || !secret) return null;

  const issuer =
    process.env.MEMORYOS_JWT_ISSUER ??
    process.env.JWT_ISSUER ??
    "memoryos";
  const audience =
    process.env.MEMORYOS_JWT_AUDIENCE ??
    process.env.JWT_AUDIENCE ??
    "memoryos-api";

  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(secret));

  return `Bearer ${token}`;
}

export async function GET(
  request: NextRequest,
  { params }: ConnectorRouteContext
) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams?.connectorPath || []);
}

export async function POST(
  request: NextRequest,
  { params }: ConnectorRouteContext
) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams?.connectorPath || []);
}

export async function PUT(
  request: NextRequest,
  { params }: ConnectorRouteContext
) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams?.connectorPath || []);
}

export async function DELETE(
  request: NextRequest,
  { params }: ConnectorRouteContext
) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams?.connectorPath || []);
}

async function proxyRequest(request: NextRequest, pathArray: string[]) {
  const backendUrl = resolveBackendOrigin();
  
  // pathArray might be something like ['callback'] or ['notion', 'authorize']
  const targetPath = `/api/connector/${pathArray.join("/")}`;
  const url = new URL(request.url);
  url.href = `${backendUrl}${targetPath}${url.search}`;

  const clerkAuth = await auth();
  const userId = clerkAuth.userId;

  const headers = new Headers(request.headers);
  headers.set("host", new URL(backendUrl).host);
  headers.set("origin", url.origin);
  const normalizedPath = `/${pathArray.join("/")}`;
  if (normalizedPath === "/events" && !headers.get("authorization")) {
    const eventToken = url.searchParams.get("token");
    if (eventToken && eventToken.trim().length > 0) {
      headers.set("authorization", `Bearer ${eventToken.trim()}`);
    } else {
      const authHeader = await createConnectorAuthHeader();
      if (authHeader) {
        headers.set("authorization", authHeader);
      }
    }
  }
  if (userId) {
    headers.set("x-user-id", userId);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.clone().arrayBuffer();
  }

  const isConnectorSyncRequest =
    request.method === "POST" && /^\/[^/]+\/sync$/.test(normalizedPath);

  if (isConnectorSyncRequest) {
    void (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10 * 60_000);
      try {
        const response = await fetch(url.toString(), { ...init, signal: controller.signal });
        await response.arrayBuffer().catch(() => undefined);
        if (!response.ok) {
          console.warn("[Connector Proxy] Background sync returned", response.status, url.toString());
        }
      } catch (error) {
        console.error("[Connector Proxy] Background sync failed:", error);
      } finally {
        clearTimeout(timeout);
      }
    })();

    return new Response(JSON.stringify({
      data: {
        message: "Sync queued.",
      },
      meta: {
        proxyQueued: true,
      },
    }), {
      status: 202,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const runFetch = async () => {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        normalizedPath === "/events" ? EVENT_STREAM_UPSTREAM_TIMEOUT_MS : UPSTREAM_TIMEOUT_MS,
      );
      try {
        return await fetch(url.toString(), { ...init, signal: controller.signal });
      } finally {
        clearTimeout(timeout);
      }
    };

    let response: Response;
    try {
      response = await runFetch();
    } catch (error) {
      const isIdempotent = request.method === "GET" || request.method === "HEAD";
      if (isIdempotent && normalizedPath !== "/events" && isRetriableProxyError(error)) {
        response = await runFetch();
      } else {
        throw error;
      }
    }
    
    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("content-encoding");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    const isGet = request.method === "GET";
    if (isGet && normalizedPath === "/events") {
      return offlineEventStream(error instanceof Error ? error.message : "Unknown proxy error");
    }
    console.error("[Connector Proxy] Error:", error);
    if (isGet && (normalizedPath === "/" || normalizedPath === "")) {
      return new Response(
        JSON.stringify({
          data: {
            connectors: [],
            backendAvailable: false,
            warning: "Connector backend temporarily unavailable.",
          },
          meta: {
            proxyFallback: true,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    if (isGet && normalizedPath === "/health") {
      return new Response(
        JSON.stringify({
          data: {
            diagnostics: [],
            backendAvailable: false,
            warning: "Connector health temporarily unavailable.",
          },
          meta: {
            proxyFallback: true,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    return new Response(JSON.stringify({
      error: "Failed to connect to backend",
      detail: error instanceof Error ? error.message : "Unknown proxy error",
      target: url.toString(),
    }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
