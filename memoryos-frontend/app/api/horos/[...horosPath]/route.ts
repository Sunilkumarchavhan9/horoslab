import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { applyProxyOrgIdHeader } from "@/lib/org-scope-server";
import { createBackendAuthHeader } from "../../_lib/backend-auth";
import { resolveBackendOrigin } from "../../_lib/backend-origin";

type RouteContext = {
  params: Promise<{
    horosPath?: string[];
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

async function proxyHorosRequest(request: NextRequest, context: RouteContext): Promise<Response> {
  const { horosPath = [] } = await context.params;
  const encodedPath = horosPath.map(encodeURIComponent).join("/");
  const targetUrl = `${resolveBackendOrigin()}/api/horos/${encodedPath}${request.nextUrl.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lowered = key.toLowerCase();
    if (!HOP_BY_HOP_HEADERS.has(lowered) && FORWARDED_HEADER_ALLOWLIST.has(lowered)) {
      headers.set(lowered, value);
    }
  });

  if (!headers.get("authorization")) {
    const authHeader = await createBackendAuthHeader();
    if (authHeader) {
      headers.set("authorization", authHeader);
    }
  }

  const clerkAuth = await auth();
  applyProxyOrgIdHeader(headers, request, clerkAuth.orgId);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const body = hasBody ? new Uint8Array(await request.arrayBuffer()) : undefined;

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });
  } catch (cause) {
    // Next.js can become ready a few seconds before the local runtime server.
    // Retry once so startup does not turn a temporary race into a page crash.
    await new Promise((resolve) => setTimeout(resolve, 250));
    try {
      response = await fetch(targetUrl, {
        method: request.method,
        headers,
        body,
        cache: "no-store",
      });
    } catch {
      const detail = cause instanceof Error ? cause.message : "Backend runtime unavailable";
      return NextResponse.json(
        { ok: false, error: { code: "HOROS_BACKEND_UNAVAILABLE", message: `HOROS backend is unavailable at ${resolveBackendOrigin()}. ${detail}` } },
        { status: 503, headers: { "cache-control": "no-store", "x-memoryos-proxy-target": targetUrl } },
      );
    }
  }

  const responseHeaders = new Headers();
  response.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });
  responseHeaders.set("x-memoryos-proxy-target", targetUrl);

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export async function GET(request: NextRequest, context: RouteContext): Promise<Response> {
  return proxyHorosRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext): Promise<Response> {
  return proxyHorosRequest(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext): Promise<Response> {
  return proxyHorosRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext): Promise<Response> {
  return proxyHorosRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext): Promise<Response> {
  return proxyHorosRequest(request, context);
}
