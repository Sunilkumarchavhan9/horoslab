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

export async function GET(request: NextRequest): Promise<Response> {
  const clerkAuth = await auth();
  if (!clerkAuth.userId) {
    return NextResponse.json(
      { ok: false, error: { message: "Unauthorized" } },
      { status: 401 },
    );
  }

  const backendUrl = resolveBackendOrigin();
  const targetPath = "/api/reality-compiler/verifications";
  const url = new URL(request.url);
  url.href = `${backendUrl}${targetPath}${url.search}`;

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

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(url.toString(), {
        method: "GET",
        headers,
        signal: controller.signal,
        cache: "no-store",
      });
    } finally {
      clearTimeout(timeout);
    }
    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (error) {
    if (isBackendUnavailable(error)) {
      return NextResponse.json(
        {
          ok: true,
          data: {
            verifications: [],
            backendAvailable: false,
            warning: "Verification backend temporarily unavailable.",
          },
          meta: { proxyFallback: true },
        },
        { status: 200 },
      );
    }
    console.error("[RealityCompiler Verifications Proxy] Fatal Error:", error);
    return NextResponse.json({ ok: false, error: "Failed to connect to backend" }, { status: 502 });
  }
}
