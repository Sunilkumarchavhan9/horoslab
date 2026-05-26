import { auth } from "@clerk/nextjs/server";
import { SignJWT } from "jose";
import { NextResponse, type NextRequest } from "next/server";
import { isClerkEnabled } from "@/lib/clerk";
import { resolveBackendOrigin } from "../../_lib/backend-origin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
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
]);

const EVENT_STREAM_UPSTREAM_TIMEOUT_MS = 10 * 60_000;

function backendOrigin(): string {
  return resolveBackendOrigin();
}

async function createMemoryAuthHeader(): Promise<string | null> {
  let userId: string | null = null;

  if (isClerkEnabled()) {
    const authState = await auth();
    userId = authState.userId;
  } else {
    userId = process.env.MEMORYOS_DEV_USER_ID?.trim() || "user-demo";
  }

  const secret = process.env.MEMORYOS_JWT_SECRET ?? process.env.JWT_SECRET;
  if (!userId || !secret) return null;

  const issuer =
    process.env.MEMORYOS_JWT_ISSUER ??
    process.env.JWT_ISSUER ??
    "memoryos";
  const audience =
    process.env.MEMORYOS_JWT_AUDIENCE ??
    process.env.JWT_AUDIENCE ??
    "memoryos-api";

  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(secret));

  return `Bearer ${token}`;
}

async function buildHeaders(request: NextRequest): Promise<Headers> {
  const headers = new Headers();

  for (const [key, value] of request.headers.entries()) {
    const lower = key.toLowerCase();
    if (lower.startsWith("x-memoryos-") || FORWARDED_HEADER_ALLOWLIST.has(lower)) {
      headers.set(key, value);
    }
  }

  headers.set("accept", "text/event-stream");

  if (!headers.get("authorization")) {
    const eventToken = request.nextUrl.searchParams.get("token");
    if (eventToken) {
      headers.set("authorization", `Bearer ${eventToken.trim()}`);
    } else {
      const authHeader = await createMemoryAuthHeader();
      if (authHeader) {
        headers.set("authorization", authHeader);
      }
    }
  }

  return headers;
}

function offlineEventStream(detail: string): Response {
  const body = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(
        encoder.encode(
          [
            "retry: 15000",
            "event: memoryos-offline",
            `data: ${JSON.stringify({ status: "offline", detail })}`,
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
      "X-MemoryOS-Proxy-Fallback": "memory-events-offline",
    },
  });
}

export async function GET(request: NextRequest): Promise<Response> {
  const origin = backendOrigin();
  const upstreamUrl = `${origin}/api/memory/events${request.nextUrl.search}`;
  const headers = await buildHeaders(request);
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    EVENT_STREAM_UPSTREAM_TIMEOUT_MS,
  );

  try {
    const response = await fetch(upstreamUrl, {
      method: "GET",
      headers,
      cache: "no-store",
      signal: controller.signal,
    });

    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });
    responseHeaders.set("x-memoryos-proxy-target", upstreamUrl);

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return offlineEventStream(message);
  } finally {
    clearTimeout(timeout);
  }
}
