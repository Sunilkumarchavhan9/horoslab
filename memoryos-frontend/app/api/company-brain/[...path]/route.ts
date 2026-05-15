import { NextResponse, type NextRequest } from "next/server";

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
]);

function backendOrigin(): string {
  const configured = process.env.MEMORYOS_API_ORIGIN?.trim();
  return (configured && configured !== "same-origin" ? configured : "http://localhost:3001").replace(/\/+$/, "");
}

async function proxyCompanyBrainRequest(request: NextRequest, context: RouteContext): Promise<Response> {
  const { path = [] } = await context.params;
  const encodedPath = path.map(encodeURIComponent).join("/");
  const search = request.nextUrl.search;
  const url = `${backendOrigin()}/api/company-brain/${encodedPath}${search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lowered = key.toLowerCase();
    if (!HOP_BY_HOP_HEADERS.has(lowered) && FORWARDED_HEADER_ALLOWLIST.has(lowered)) {
      headers.set(lowered, value);
    }
  });

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const body = hasBody ? new Uint8Array(await request.arrayBuffer()) : undefined;
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

export async function GET(request: NextRequest, context: RouteContext): Promise<Response> {
  return proxyCompanyBrainRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext): Promise<Response> {
  return proxyCompanyBrainRequest(request, context);
}
