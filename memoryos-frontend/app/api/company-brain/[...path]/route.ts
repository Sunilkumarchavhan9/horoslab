import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  MEMORYOS_ORG_ID_HEADER,
  applyProxyOrgIdHeader,
} from "@/lib/org-scope-server";
import { createBackendAuthHeader } from "../../_lib/backend-auth";
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
]);

function backendOrigin(): string {
  return resolveBackendOrigin();
}

async function proxyCompanyBrainRequest(
  request: NextRequest,
  context: RouteContext,
): Promise<Response> {
  const { path = [] } = await context.params;
  const encodedPath = path.map(encodeURIComponent).join("/");
  const search = request.nextUrl.search;
  const url = `${backendOrigin()}/api/company-brain/${encodedPath}${search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lowered = key.toLowerCase();
    if (
      !HOP_BY_HOP_HEADERS.has(lowered) &&
      FORWARDED_HEADER_ALLOWLIST.has(lowered)
    ) {
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
  const body = hasBody
    ? new Uint8Array(await request.arrayBuffer())
    : undefined;
  const response = await fetch(url, {
    method: request.method,
    headers,
    body,
    cache: "no-store",
  });

  const responseHeaders = new Headers();
  response.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });
  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
): Promise<Response> {
  return proxyCompanyBrainRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
): Promise<Response> {
  return proxyCompanyBrainRequest(request, context);
}
