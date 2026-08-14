import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { applyProxyOrgIdHeader } from "@/lib/org-scope-server";
import { createBackendAuthHeader } from "../_lib/backend-auth";
import { resolveBackendOrigin } from "../_lib/backend-origin";

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

export async function GET(request: NextRequest) {
  const backendUrl = resolveBackendOrigin();
  const targetPath = `/api/connector`;
  const url = new URL(request.url);
  url.href = `${backendUrl}${targetPath}${url.search}`;

  const clerkAuth = await auth();
  const userId = clerkAuth.userId;

  const headers = new Headers(request.headers);
  headers.set("host", new URL(backendUrl).host);
  headers.set("origin", url.origin);
  if (!headers.get("authorization")) {
    const authHeader = await createBackendAuthHeader();
    if (authHeader) headers.set("authorization", authHeader);
  }
  applyProxyOrgIdHeader(headers, request, clerkAuth.orgId);
  if (userId) {
    headers.set("x-user-id", userId);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
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
    console.error("[Connector Proxy] Fatal Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to connect to backend" }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
