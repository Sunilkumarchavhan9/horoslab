import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { resolveBackendOrigin } from "../../_lib/backend-origin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams?.path || []);
}

async function proxyRequest(request: NextRequest, pathArray: string[]) {
  const backendUrl = resolveBackendOrigin();
  const targetPath = `/api/preflight/${pathArray.join("/")}`;
  const url = new URL(request.url);
  url.href = `${backendUrl}${targetPath}${url.search}`;

  const clerkAuth = await auth();
  const userId = clerkAuth.userId;

  const headers = new Headers(request.headers);
  headers.set("host", new URL(backendUrl).host);
  headers.set("origin", url.origin);
  if (userId) {
    headers.set("x-user-id", userId);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.clone().arrayBuffer();
  }

  try {
    const response = await fetch(url.toString(), init);
    
    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("content-encoding");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[Preflight Proxy] Error:", error);
    return new Response(JSON.stringify({ error: "Failed to connect to backend" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
