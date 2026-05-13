import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

type ConnectorRouteContext = {
  params: Promise<{ connectorPath?: string[] }>;
};
const UPSTREAM_TIMEOUT_MS = 8_000;

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
  const backendUrl = process.env.MEMORYOS_API_ORIGIN || "http://localhost:3001";
  
  // pathArray might be something like ['callback'] or ['notion', 'authorize']
  const targetPath = `/api/connector/${pathArray.join("/")}`;
  const url = new URL(request.url);
  url.href = `${backendUrl}${targetPath}${url.search}`;

  const clerkAuth = await auth();
  const userId = clerkAuth.userId;

  const headers = new Headers(request.headers);
  headers.set("host", new URL(backendUrl).host);
  headers.set("origin", url.origin);
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

  try {
    const runFetch = async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
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
      if (isIdempotent && isRetriableProxyError(error)) {
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
    console.error("[Connector Proxy] Error:", error);
    const normalizedPath = `/${pathArray.join("/")}`;
    const isGet = request.method === "GET";
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
