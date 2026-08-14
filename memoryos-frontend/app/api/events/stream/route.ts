import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { applyProxyOrgIdHeader } from "@/lib/org-scope-server";
import { createBackendAuthHeader } from "../../_lib/backend-auth";
import { resolveBackendOrigin } from "../../_lib/backend-origin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

function offlineEventStream(detail: string): Response {
  const body = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(
        encoder.encode(
          [
            "retry: 15000",
            "event: overview-offline",
            `data: ${JSON.stringify({ eventType: "overview_offline", status: "offline", detail })}`,
            "",
            "",
          ].join("\n"),
        ),
      );
      controller.close();
    },
  });

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-MemoryOS-Proxy-Fallback": "overview-events-offline",
    },
  });
}

export async function GET(request: NextRequest): Promise<Response> {
  const targetUrl = `${resolveBackendOrigin()}/api/events/stream${request.nextUrl.search}`;
  const headers = new Headers();
  headers.set("accept", "text/event-stream");

  const authHeader = request.headers.get("authorization") ?? await createBackendAuthHeader();
  if (authHeader) headers.set("authorization", authHeader);

  const clerkAuth = await auth();
  applyProxyOrgIdHeader(headers, request, clerkAuth.orgId);

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      headers,
      cache: "no-store",
    });
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
  } catch (error) {
    return offlineEventStream(error instanceof Error ? error.message : "Unknown error");
  }
}
