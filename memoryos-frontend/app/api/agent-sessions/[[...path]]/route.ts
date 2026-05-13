import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params;
  return proxyRequest(request, path || []);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params;
  return proxyRequest(request, path || []);
}

async function proxyRequest(request: NextRequest, pathArray: string[]) {
  const backendUrl = process.env.MEMORYOS_API_ORIGIN || "http://localhost:3001";
  const targetPath = `/api/agent-sessions${pathArray.length > 0 ? "/" + pathArray.join("/") : ""}`;
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
    try {
      init.body = await request.clone().arrayBuffer();
    } catch (e) {
      console.warn("[Agent Sessions Proxy] Failed to clone body:", e);
    }
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
    console.error("[Agent Sessions Proxy] Error:", error);
    return new Response(JSON.stringify({ error: "Failed to connect to backend" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
