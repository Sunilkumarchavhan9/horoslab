import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { resolveBackendOrigin } from "../_lib/backend-origin";

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
  if (userId) {
    headers.set("x-user-id", userId);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
  };

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
    console.error("[Connector Proxy] Error:", error);
    return new Response(JSON.stringify({ error: "Failed to connect to backend" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
