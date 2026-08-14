import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { applyProxyOrgIdHeader } from "@/lib/org-scope-server";
import { createBackendAuthHeader } from "../../_lib/backend-auth";
import { resolveBackendOrigin } from "../../_lib/backend-origin";

const UPSTREAM_TIMEOUT_MS = 8_000;

function isBackendUnavailable(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  const cause = (error as Error & { cause?: { code?: string } }).cause;
  const code = typeof cause?.code === "string" ? cause.code.toLowerCase() : "";
  return (
    message.includes("fetch failed") ||
    message.includes("abort") ||
    message.includes("timeout") ||
    message.includes("econnrefused") ||
    code === "econnrefused" ||
    code === "enotfound"
  );
}

export async function POST(request: NextRequest): Promise<Response> {
  const backendUrl = resolveBackendOrigin();
  const targetPath = "/api/reality-compiler/verify";
  const url = new URL(request.url);
  url.href = `${backendUrl}${targetPath}${url.search}`;

  const clerkAuth = await auth();
  const headers = new Headers(request.headers);
  headers.set("host", new URL(backendUrl).host);
  headers.set("origin", url.origin);
  if (!headers.get("authorization")) {
    const authHeader = await createBackendAuthHeader();
    if (authHeader) headers.set("authorization", authHeader);
  }
  applyProxyOrgIdHeader(headers, request, clerkAuth.orgId);
  if (clerkAuth.userId) {
    headers.set("x-user-id", clerkAuth.userId);
  }

  const bodyText = await request.text();
  const init: RequestInit = {
    method: request.method,
    headers,
    body: bodyText,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(url.toString(), {
        ...init,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("content-encoding");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    if (isBackendUnavailable(error)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Verification backend temporarily unavailable.",
          meta: { proxyFallback: true },
        },
        { status: 503 },
      );
    }
    console.error("[RealityCompiler Verify Proxy] Fatal Error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to connect to backend" },
      { status: 502 },
    );
  }
}

