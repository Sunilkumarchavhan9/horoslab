import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { MEMORYOS_ORG_ID_HEADER, applyProxyOrgIdHeader } from "@/lib/org-scope-server";
import { createBackendAuthHeader } from "../../_lib/backend-auth";
import { resolveBackendOrigin } from "../../_lib/backend-origin";

type RouteContext = {
  params: Promise<{
    runtimePath?: string[];
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
  MEMORYOS_ORG_ID_HEADER,
]);

async function proxyRequest(request: NextRequest, pathSegments: string[]): Promise<NextResponse> {
  const backendUrl = resolveBackendOrigin();
  const path = pathSegments.length > 0 ? `/${pathSegments.join("/")}` : "";
  const target = `${backendUrl}/api/runtime${path}`;
  const url = new URL(request.url);
  const upstream = `${target}${url.search}`;

  const clerkAuth = await auth();
  const backendAuthHeader = await createBackendAuthHeader();
  if (!backendAuthHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const headers = new Headers();
  for (const [key, value] of request.headers.entries()) {
    const lowered = key.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(lowered)) continue;
    if (FORWARDED_HEADER_ALLOWLIST.has(lowered)) headers.set(key, value);
  }
  headers.set("host", new URL(backendUrl).host);
  headers.set("authorization", backendAuthHeader);
  applyProxyOrgIdHeader(headers, request, clerkAuth.orgId);

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      init.body = await request.clone().arrayBuffer();
    } catch {
      // no body
    }
  }

  try {
    const response = await fetch(upstream, init);
    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("content-encoding");
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[Runtime Proxy] Error:", error);
    return NextResponse.json({ error: "Failed to connect to backend" }, { status: 502 });
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { runtimePath } = await context.params;
  return proxyRequest(request, runtimePath ?? []);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { runtimePath } = await context.params;
  return proxyRequest(request, runtimePath ?? []);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { runtimePath } = await context.params;
  return proxyRequest(request, runtimePath ?? []);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { runtimePath } = await context.params;
  return proxyRequest(request, runtimePath ?? []);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { runtimePath } = await context.params;
  return proxyRequest(request, runtimePath ?? []);
}
