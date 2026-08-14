import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isClerkEnabled } from "@/lib/clerk";
import { applyProxyOrgIdHeader } from "@/lib/org-scope-server";
import { createBackendAuthHeader } from "../../_lib/backend-auth";
import { resolveBackendOrigin } from "../../_lib/backend-origin";

type RouteContext = {
  params: Promise<{
    memoryPath?: string[];
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
const DEFAULT_UPSTREAM_TIMEOUT_MS = 15_000;
const METERED_GET_PATHS = new Set<string>([
  "/retrieve/explain",
]);

function resolveTimeoutMs(pathSegments: string[], method: string): number {
  const path = `/${pathSegments.join("/")}`;
  if (method === "GET" && path === "/events") return 5_000;
  if (method === "GET" && path === "/automations/events") return 10 * 60_000;
  if (path.startsWith("/memoryignition/")) return 120_000;
  if (path.startsWith("/company-brain/inheritance-spine")) return 60_000;
  if (path.startsWith("/company-brain/")) return 30_000;
  if (method === "POST" && (path === "/handoff" || path === "/resume" || path === "/resume/brief")) return 45_000;
  if (method === "POST" && path === "/contract/validate") return 15_000;
  if (path === "/wiki-diagram") return 90_000;
  if (method === "POST" && path === "/lab-skills-rules/refresh") return 60_000;
  if (method === "GET" && path === "/lab-skills-rules/discover") return 30_000;
  if (method === "GET" && path === "/lab-skills-rules-settings") return 60_000;
  if (method === "PATCH" && path === "/lab-skills-rules-settings") return 60_000;
  if (method === "GET" && path === "/lab-skills-rules/content") return 15_000;
  if ((method === "PUT" || method === "PATCH") && path === "/lab-skills-rules/content") return 30_000;
  if (method === "GET" && path === "/lab-environment-settings") return 15_000;
  if (method === "PATCH" && path === "/lab-environment-settings") return 15_000;
  if (method === "POST" && path === "/lab-environment-settings/build-snapshot") return 30_000;
  if (method === "GET" && path === "/lab-environment-settings/context") return 15_000;
  if (method === "POST" && path === "/lab-environment-settings/save-blueprint") return 30_000;
  if (method === "DELETE" && path === "/lab-environment-settings/blueprint") return 15_000;
  if (method === "POST" && path === "/lab-environment-settings/blueprint-secrets") return 15_000;
  if (method === "POST" && path === "/lab-environment-settings/blueprint-secrets/import")
    return 30_000;
  if (method === "POST" && path === "/lab-environment-settings/blueprint-files") return 30_000;
  if (method === "GET" && path === "/lab-shell-integration-settings") return 15_000;
  if (method === "PATCH" && path === "/lab-shell-integration-settings") return 15_000;
  if (method === "POST" && path === "/lab-skills-rules/compile") return 120_000;
  if (method === "GET" && path === "/lab-skills-rules/context") return 60_000;
  if (method === "GET" && (path === "/requests" || path === "/list" || path === "/insights" || path === "/timeline")) return 20_000;
  return DEFAULT_UPSTREAM_TIMEOUT_MS;
}

function backendOrigin(): string {
  return resolveBackendOrigin();
}

function isRetriableProxyError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("econnreset") ||
    message.includes("socket hang up") ||
    message.includes("etimedout") ||
    message.includes("fetch failed") ||
    message.includes("network")
  );
}

async function forwardMemoryRequest(
  request: NextRequest,
  url: string,
  headers: Headers,
  body: BodyInit | undefined,
  timeoutMs: number,
): Promise<globalThis.Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function forwardMemoryRequestWithRetry(
  request: NextRequest,
  url: string,
  headers: Headers,
  body: BodyInit | undefined,
  timeoutMs: number,
  pathSegments: string[],
): Promise<globalThis.Response> {
  try {
    return await forwardMemoryRequest(request, url, headers, body, timeoutMs);
  } catch (error) {
    const isIdempotent = request.method === "GET" || request.method === "HEAD";
    const normalizedPath = `/${pathSegments.join("/")}`;
    const isMeteredGetPath = METERED_GET_PATHS.has(normalizedPath);
    const isEventStream = normalizedPath === "/events" || normalizedPath === "/automations/events";
    if (isIdempotent && !isEventStream && !isMeteredGetPath && isRetriableProxyError(error)) {
      return forwardMemoryRequest(request, url, headers, body, timeoutMs);
    }
    throw error;
  }
}

async function proxyMemoryRequest(request: NextRequest, context: RouteContext): Promise<Response> {
  const { memoryPath = [] } = await context.params;
  const path = memoryPath.map(encodeURIComponent).join("/");
  const search = request.nextUrl.search;
  const origin = backendOrigin();
  const url = `${origin}/api/memory/${path}${search}`;
  const timeoutMs = resolveTimeoutMs(memoryPath, request.method);

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
  const normalizedPath = `/${memoryPath.join("/")}`;
  const tokenAuthEventPath =
    normalizedPath === "/events" || normalizedPath === "/automations/events";
  if (tokenAuthEventPath && !headers.get("authorization")) {
    const eventToken = request.nextUrl.searchParams.get("token");
    if (eventToken && eventToken.trim().length > 0) {
      headers.set("authorization", `Bearer ${eventToken.trim()}`);
    }
  }
  if (!headers.get("authorization")) {
    const authHeader = await createBackendAuthHeader();
    if (authHeader) {
      headers.set("authorization", authHeader);
    }
  }

  if (isClerkEnabled()) {
    const clerkAuth = await auth();
    applyProxyOrgIdHeader(headers, request, clerkAuth.orgId);
  } else {
    applyProxyOrgIdHeader(headers, request, null);
  }

  let response: globalThis.Response;
  try {
    const hasBody = request.method !== "GET" && request.method !== "HEAD";
    const body = hasBody ? new Uint8Array(await request.arrayBuffer()) : undefined;
    response = await forwardMemoryRequestWithRetry(request, url, headers, body, timeoutMs, memoryPath);
  } catch (error) {
    const isGet = request.method === "GET";
    if (isGet && normalizedPath === "/requests") {
      return NextResponse.json(
        {
          requests: [],
          count: 0,
          filters: {
            type: "all",
            status: "All",
            range: "all",
            limit: 200,
          },
          warning: "memory_requests_temporarily_unavailable",
        },
        { status: 200 },
      );
    }
    if (isGet && normalizedPath === "/insights") {
      return NextResponse.json(
        {
          totalsByType: { profile: 0, preference: 0, learning: 0, project: 0, episodic: 0 },
          totalsByStatus: { active: 0, stale: 0, contradicted: 0, archived: 0, merged: 0 },
          topSkills: [],
          activeProjects: [],
          recentMilestones: [],
          warning: "memory_insights_temporarily_unavailable",
        },
        { status: 200 },
      );
    }
    if (isGet && normalizedPath === "/list") {
      return NextResponse.json(
        {
          memories: [],
          count: 0,
          warning: "memory_list_temporarily_unavailable",
        },
        { status: 200 },
      );
    }
    if (isGet && normalizedPath === "/timeline") {
      return NextResponse.json(
        {
          events: [],
          count: 0,
          warning: "memory_timeline_temporarily_unavailable",
        },
        { status: 200 },
      );
    }
    if (isGet && normalizedPath === "/billing") {
      return NextResponse.json(
        {
          workspaceName: "memoryos",
          currentPlan: "Free",
          usage: {
            tokenLimit: 1_000_000,
            tokenUsed: 0,
            searchLimit: 10_000,
            searchUsed: 0,
            resetInDays: 30,
          },
          seats: {
            activeMembers: 1,
            pendingInvites: 0,
            seatLimit: 1,
          },
          connectorSyncUsage: {
            used: 0,
            limit: 1_000,
          },
          invoices: [],
          events: [],
          checkout: {
            configured: false,
            provider: "none",
            portalUrl: null,
          },
          warning: "memory_billing_temporarily_unavailable",
        },
        { status: 200 },
      );
    }
    if (request.method === "POST" && normalizedPath === "/resume") {
      return NextResponse.json(
        {
          summary: "",
          nextAction: "MemoryOS backend is temporarily unavailable. Restart the backend and retry resume generation.",
          evidence: [],
          warning: "memory_resume_temporarily_unavailable",
        },
        { status: 200 },
      );
    }
    if (request.method === "POST" && normalizedPath === "/handoff") {
      return NextResponse.json(
        {
          handoff: "",
          summary: "MemoryOS backend is temporarily unavailable. Restart the backend and retry handoff generation.",
          warning: "memory_handoff_temporarily_unavailable",
        },
        { status: 200 },
      );
    }
    return NextResponse.json(
      {
        error: "MemoryOS backend proxy failed",
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

  if (request.method === "GET" && normalizedPath === "/requests" && response.status >= 500) {
    return NextResponse.json(
      {
        requests: [],
        count: 0,
        filters: {
          type: "all",
          status: "All",
          range: "all",
          limit: 200,
        },
        warning: "memory_requests_upstream_5xx",
      },
      { status: 200 },
    );
  }

  if (response.status === 402 && request.method === "POST" && normalizedPath === "/retrieve") {
    return NextResponse.json(
      {
        memories: [],
        count: 0,
        warning: "memory_retrieve_quota_unavailable",
      },
      {
        status: 200,
        headers: {
          "x-memoryos-upstream-status": "402",
          "x-memoryos-warning": "memory_retrieve_quota_unavailable",
        },
      },
    );
  }

  if (response.status === 402 && request.method === "POST" && normalizedPath === "/handoff") {
    return NextResponse.json(
      {
        summary: "Company memory handoff is unavailable because the workspace memory quota is exhausted.",
        currentState: "",
        openLoops: [],
        recommendedNextActions: [],
        keyMemories: [],
        warning: "memory_handoff_quota_unavailable",
      },
      {
        status: 200,
        headers: {
          "x-memoryos-upstream-status": "402",
          "x-memoryos-warning": "memory_handoff_quota_unavailable",
        },
      },
    );
  }

  if (response.status === 402 && request.method === "POST" && normalizedPath === "/resume/brief") {
    return NextResponse.json(
      {
        data: null,
        brief: null,
        warning: "memory_resume_brief_quota_unavailable",
      },
      {
        status: 200,
        headers: {
          "x-memoryos-upstream-status": "402",
          "x-memoryos-warning": "memory_resume_brief_quota_unavailable",
        },
      },
    );
  }

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export async function GET(request: NextRequest, context: RouteContext): Promise<Response> {
  return proxyMemoryRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext): Promise<Response> {
  return proxyMemoryRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext): Promise<Response> {
  return proxyMemoryRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext): Promise<Response> {
  return proxyMemoryRequest(request, context);
}
