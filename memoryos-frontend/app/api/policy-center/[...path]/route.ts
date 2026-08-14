import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { applyProxyOrgIdHeader } from "@/lib/org-scope-server";
import { createBackendAuthHeader } from "../../_lib/backend-auth";
import { resolveBackendOrigin } from "../../_lib/backend-origin";

type RouteContext = { params: Promise<{ path?: string[] }> };
const HOP_BY_HOP_HEADERS = new Set(["connection", "content-length", "host", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailer", "transfer-encoding", "upgrade"]);
const FORWARDED_HEADER_ALLOWLIST = new Set(["accept", "authorization", "content-type", "x-api-key", "x-request-id"]);

async function proxyPolicyCenterRequest(request: NextRequest, context?: RouteContext): Promise<Response> {
  const params = context?.params ? await context.params : {};
  const encodedPath = (params?.path ?? []).map(encodeURIComponent).join("/");
  const targetUrl = `${resolveBackendOrigin()}/api/policy-center/${encodedPath}${request.nextUrl.search}`;
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lowered = key.toLowerCase();
    if (!HOP_BY_HOP_HEADERS.has(lowered) && FORWARDED_HEADER_ALLOWLIST.has(lowered)) headers.set(lowered, value);
  });
  if (!headers.get("authorization")) {
    const authHeader = await createBackendAuthHeader();
    if (authHeader) headers.set("authorization", authHeader);
  }
  const clerkAuth = await auth();
  applyProxyOrgIdHeader(headers, request, clerkAuth.orgId);
  const response = await fetch(targetUrl, { method: request.method, headers, cache: "no-store" });
  const responseHeaders = new Headers();
  response.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) responseHeaders.set(key, value);
  });
  responseHeaders.set("x-memoryos-proxy-target", targetUrl);
  return new NextResponse(response.body, { status: response.status, statusText: response.statusText, headers: responseHeaders });
}

export async function GET(request: NextRequest, context: RouteContext): Promise<Response> {
  return proxyPolicyCenterRequest(request, context);
}
