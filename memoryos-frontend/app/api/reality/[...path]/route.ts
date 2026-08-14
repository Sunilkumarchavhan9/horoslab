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

async function proxy(request: NextRequest, method: string): Promise<Response> {
  const clerkAuth = await auth();
  const path = request.nextUrl.pathname.replace(/^\/api\/reality/, "");
  const backendUrl = resolveBackendOrigin();
  const targetUrl = new URL(`/api/reality${path}${request.nextUrl.search}`, backendUrl);

  const headers = new Headers(request.headers);
  headers.set("host", new URL(backendUrl).host);
  headers.set("origin", targetUrl.origin);
  if (!headers.get("authorization")) {
    const authHeader = await createBackendAuthHeader();
    if (authHeader) headers.set("authorization", authHeader);
  }
  applyProxyOrgIdHeader(headers, request, clerkAuth.orgId);
  if (clerkAuth.userId) {
    headers.set("x-user-id", clerkAuth.userId);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const response = await fetch(targetUrl.toString(), {
      method,
      headers,
      body: method === "GET" || method === "DELETE" ? undefined : await request.text(),
      signal: controller.signal,
      cache: "no-store",
    });
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
        { ok: false, error: { message: "Reality backend temporarily unavailable." } },
        { status: 503 },
      );
    }
    console.error(`[Reality Proxy] ${method} ${request.nextUrl.pathname} failed:`, error);
    return NextResponse.json({ ok: false, error: { message: "Failed to connect to reality backend" } }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: NextRequest): Promise<Response> {
  return proxy(request, "GET");
}

export async function POST(request: NextRequest): Promise<Response> {
  return proxy(request, "POST");
}

export async function PUT(request: NextRequest): Promise<Response> {
  return proxy(request, "PUT");
}

export async function PATCH(request: NextRequest): Promise<Response> {
  return proxy(request, "PATCH");
}

export async function DELETE(request: NextRequest): Promise<Response> {
  return proxy(request, "DELETE");
}
