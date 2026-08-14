import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { applyProxyOrgIdHeader } from "@/lib/org-scope-server";
import { createBackendAuthHeader } from "../../_lib/backend-auth";
import { resolveBackendOrigin } from "../../_lib/backend-origin";

type RouteContext = { params: Promise<{ sdkPath?: string[] }> };

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

const FORWARDED_HEADERS = new Set([
  "accept",
  "authorization",
  "content-type",
  "x-api-key",
  "x-request-id",
]);

async function proxySdkRequest(request: NextRequest, context: RouteContext) {
  const { sdkPath = [] } = await context.params;
  const path = sdkPath.map(encodeURIComponent).join("/");
  const targetUrl = `${resolveBackendOrigin()}/api/sdk/${path}${request.nextUrl.search}`;
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    const lowered = key.toLowerCase();
    if (!HOP_BY_HOP_HEADERS.has(lowered) && FORWARDED_HEADERS.has(lowered)) {
      headers.set(lowered, value);
    }
  });

  if (!headers.get("authorization")) {
    const authHeader = await createBackendAuthHeader();
    if (authHeader) headers.set("authorization", authHeader);
  }

  const clerkAuth = await auth();
  applyProxyOrgIdHeader(headers, request, clerkAuth.orgId);
  const body = request.method === "GET" || request.method === "HEAD"
    ? undefined
    : new Uint8Array(await request.arrayBuffer());

  let response: Response;
  try {
    response = await fetch(targetUrl, { method: request.method, headers, body, cache: "no-store" });
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : "Backend runtime unavailable";
    return NextResponse.json(
      { ok: false, error: { code: "SDK_BACKEND_UNAVAILABLE", message: `SDK backend is unavailable at ${resolveBackendOrigin()}. ${detail}` } },
      { status: 503, headers: { "cache-control": "no-store", "x-memoryos-proxy-target": targetUrl } },
    );
  }

  const responseHeaders = new Headers();
  response.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) responseHeaders.set(key, value);
  });
  responseHeaders.set("x-memoryos-proxy-target", targetUrl);
  return new NextResponse(response.body, { status: response.status, statusText: response.statusText, headers: responseHeaders });
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxySdkRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxySdkRequest(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxySdkRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxySdkRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxySdkRequest(request, context);
}
