import { NextResponse } from "next/server";
import { resolveBackendOrigin } from "@/app/api/_lib/backend-origin";

export async function GET(): Promise<Response> {
  try {
    const response = await fetch(`${resolveBackendOrigin()}/api/reality-compiler/status`, { cache: "no-store" });
    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: { "content-type": response.headers.get("content-type") ?? "application/json" },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "backend_unavailable" }, { status: 503 });
  }
}
