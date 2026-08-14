import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { applyProxyOrgIdHeader } from "@/lib/org-scope-server";
import { createBackendAuthHeader } from "../../_lib/backend-auth";
import { resolveBackendOrigin } from "../../_lib/backend-origin";
import { resolveOpenHandsRuntimeOrigin } from "../../_lib/openhands-runtime-origin";

export async function POST(request: NextRequest) {
  const authHeader = await createBackendAuthHeader();
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clerkAuth = await auth();
  const backendHeaders = new Headers({ Authorization: authHeader });
  applyProxyOrgIdHeader(backendHeaders, request, clerkAuth.orgId);

  const backendResponse = await fetch(
    `${resolveBackendOrigin()}/api/connector/github/runtime-token`,
    {
      headers: backendHeaders,
      cache: "no-store",
    },
  );

  const backendPayload = (await backendResponse.json().catch(() => null)) as {
    data?: { token?: string; host?: string };
  } | null;
  let token = backendPayload?.data?.token;
  let host = backendPayload?.data?.host ?? "github.com";

  if (!backendResponse.ok || !token) {
    return NextResponse.json(
      {
        ok: false,
        skipped: true,
        reason: "GitHub connector token is not available.",
      },
      { status: 200 },
    );
  }

  // Runtime removed: we cannot attach the token to the removed runtime.
  // The backend connector already saved the token; return success but mark
  // that the runtime attach step was skipped.
  return NextResponse.json(
    {
      ok: true,
      skipped: true,
      reason:
        "OpenHands runtime removed; token saved in backend but not attached to runtime.",
    },
    { status: 200 },
  );
}
