import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { MEMORYOS_ORG_ID_HEADER, applyProxyOrgIdHeader } from "@/lib/org-scope-server";
import { resolveBackendOrigin } from "../../_lib/backend-origin";

type RouteContext = {
  params: Promise<{ path?: string[] }>;
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
  "x-memoryos-agent-id",
  "x-memoryos-agent-session-id",
  "x-memoryos-goal-id",
]);

async function proxyAgentRequest(
  request: NextRequest,
  context: RouteContext,
): Promise<Response> {
  const { path = [] } = await context.params;
  const encodedPath = path.map(encodeURIComponent).join("/");
  const search = request.nextUrl.search;
  const url = `${resolveBackendOrigin()}/api/agent/${encodedPath}${search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lowered = key.toLowerCase();
    if (!HOP_BY_HOP_HEADERS.has(lowered) && FORWARDED_HEADER_ALLOWLIST.has(lowered)) {
      headers.set(lowered, value);
    }
  });

  const clerkAuth = await auth();
  if (clerkAuth.userId) {
    headers.set("x-user-id", clerkAuth.userId);
  }
  applyProxyOrgIdHeader(headers, request, clerkAuth.orgId);

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  try {
    const response = await fetch(url, init);
    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("content-encoding");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[ProductAgent Proxy] Error:", error);
    return NextResponse.json(
      { error: "Failed to connect to backend" },
      { status: 502 },
    );
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyAgentRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyAgentRequest(request, context);
}
