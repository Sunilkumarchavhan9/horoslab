import { NextResponse, type NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{
    doctorPath?: string[];
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
]);

function backendOrigin(): string {
  const configured = process.env.MEMORYOS_API_ORIGIN?.trim();
  return (configured && configured !== "same-origin" ? configured : "http://localhost:3001").replace(/\/+$/, "");
}

async function forwardRequest(
  request: NextRequest,
  url: string,
  headers: Headers,
  body: string | undefined,
): Promise<globalThis.Response> {
  return fetch(url, {
    method: request.method,
    headers,
    body,
    cache: "no-store",
  });
}

async function proxyDoctorRequest(request: NextRequest, context: RouteContext): Promise<Response> {
  const { doctorPath = [] } = await context.params;
  const path = doctorPath.map(encodeURIComponent).join("/");
  const search = request.nextUrl.search;
  const origin = backendOrigin();
  // Backend mounts the memory-doctor router at `/api/memory/doctor` (see server/app.ts).
  // The browser calls `/api/memory-doctor/*`; this proxy translates that to the actual backend path.
  const url = `${origin}/api/memory/doctor/${path}${search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lowered = key.toLowerCase();
    if (
      !HOP_BY_HOP_HEADERS.has(lowered) &&
      (FORWARDED_HEADER_ALLOWLIST.has(lowered) || lowered.startsWith("x-memoryos-"))
    ) {
      headers.set(lowered, value);
    }
  });

  let response: globalThis.Response;
  try {
    const hasBody = request.method !== "GET" && request.method !== "HEAD";
    const body = hasBody ? await request.text() : undefined;
    response = await forwardRequest(request, url, headers, body);
  } catch (error) {
    return NextResponse.json(
      {
        error: "MemoryOS memory-doctor proxy failed",
        detail: error instanceof Error ? error.message : "Unknown proxy error",
        target: url,
      },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();
  response.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });
  responseHeaders.set("x-memoryos-proxy-target", response.url || url);

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export async function GET(request: NextRequest, context: RouteContext): Promise<Response> {
  return proxyDoctorRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext): Promise<Response> {
  return proxyDoctorRequest(request, context);
}
