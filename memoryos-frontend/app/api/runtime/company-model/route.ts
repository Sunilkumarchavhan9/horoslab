import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { applyProxyOrgIdHeader } from "@/lib/org-scope-server";
import { createBackendAuthHeader } from "../../_lib/backend-auth";
import { resolveBackendOrigin } from "../../_lib/backend-origin";
import {
  buildOpenRouterLlmPayload,
  fetchRuntimeLlmSettings,
  pushLlmSettingsToOpenHandsRuntime,
} from "../../_lib/openhands-llm-settings";
import { isPlausibleOpenRouterApiKey } from "../../_lib/openrouter-env";

const DEFAULT_COMPANY_MODEL = "openrouter/pareto-code";

export async function GET(request: NextRequest) {
  const authHeader = await createBackendAuthHeader();
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clerkAuth = await auth();
  const backendHeaders = new Headers({ Authorization: authHeader });
  applyProxyOrgIdHeader(backendHeaders, request, clerkAuth.orgId);

  const backendResponse = await fetch(
    `${resolveBackendOrigin()}/api/connector/openrouter/runtime-config`,
    { headers: backendHeaders, cache: "no-store" },
  );

  if (!backendResponse.ok) {
    const runtime = await fetchRuntimeLlmSettings();
    return NextResponse.json({
      data: {
        model: runtime?.llm_model ?? null,
        providerName: null,
        baseUrl: null,
        apiKeySet: Boolean(runtime?.llm_api_key_set),
      },
    });
  }

  const payload = (await backendResponse.json().catch(() => null)) as {
    data?: {
      model?: string;
      providerName?: string | null;
      baseUrl?: string | null;
    };
  } | null;
  const saved = payload?.data;
  const runtime = await fetchRuntimeLlmSettings();

  return NextResponse.json({
    data: {
      model: saved?.model ?? runtime?.llm_model ?? null,
      providerName: saved?.providerName ?? null,
      baseUrl: saved?.baseUrl ?? null,
      apiKeySet: true,
    },
  });
}

export async function PUT(request: NextRequest) {
  const authHeader = await createBackendAuthHeader();
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body) {
    return NextResponse.json(
      { error: "Model id is required." },
      { status: 400 },
    );
  }

  let requestedModel =
    typeof body.model === "string" && body.model.trim()
      ? body.model.trim()
      : "";

  const apiKey =
    typeof body.apiKey === "string" && body.apiKey.trim()
      ? body.apiKey.trim()
      : null;
  if (apiKey && !isPlausibleOpenRouterApiKey(apiKey)) {
    return NextResponse.json(
      {
        error:
          "OpenRouter API key looks invalid. Paste a key from https://openrouter.ai/keys (starts with sk-or-v1-).",
      },
      { status: 400 },
    );
  }

  const clerkAuth = await auth();
  const backendHeaders = new Headers({
    Authorization: authHeader,
    "Content-Type": "application/json",
  });
  applyProxyOrgIdHeader(backendHeaders, request, clerkAuth.orgId);
  let existingModel = "";
  let existingApiKey = "";

  const existingConfigResponse = await fetch(
    `${resolveBackendOrigin()}/api/connector/openrouter/runtime-config`,
    { headers: backendHeaders, cache: "no-store" },
  );
  if (existingConfigResponse.ok) {
    const configPayload = (await existingConfigResponse
      .json()
      .catch(() => null)) as { data?: { model?: string; apiKey?: string } } | null;
    existingModel =
      typeof configPayload?.data?.model === "string"
        ? configPayload.data.model.trim()
        : "";
    existingApiKey =
      typeof configPayload?.data?.apiKey === "string"
        ? configPayload.data.apiKey.trim()
        : "";
  }

  if (!requestedModel) {
    if (existingModel) requestedModel = existingModel;
  }

  if (!requestedModel) {
    requestedModel = DEFAULT_COMPANY_MODEL;
  }

  if (!apiKey && !existingApiKey) {
    return NextResponse.json(
      {
        data: {
          model: requestedModel,
          providerName:
            typeof body.providerName === "string" ? body.providerName.trim() : null,
          baseUrl:
            typeof body.baseUrl === "string" ? body.baseUrl.trim() || null : null,
          apiKeySet: false,
        },
        runtimeSync: {
          ok: false,
          reason:
            "OpenRouter API key not configured yet. Add your key in Company Model settings, then retry runtime sync.",
        },
      },
      { status: 200 },
    );
  }

  const backendResponse = await fetch(
    `${resolveBackendOrigin()}/api/connector/openrouter/company-model`,
    {
      method: "PUT",
      headers: backendHeaders,
      body: JSON.stringify({
        ...body,
        model: requestedModel,
      }),
      cache: "no-store",
    },
  );

  const payload = await backendResponse.json().catch(() => null);
  if (!backendResponse.ok) {
    return NextResponse.json(payload ?? { error: "Save failed." }, {
      status: backendResponse.status,
    });
  }

  const saved = (payload as { data?: Record<string, unknown> } | null)?.data;
  const savedModel =
    typeof saved?.model === "string" ? saved.model.trim() : requestedModel;

  let savedApiKey = apiKey;
  if (!savedApiKey && existingApiKey && isPlausibleOpenRouterApiKey(existingApiKey)) {
    savedApiKey = existingApiKey;
  }

  if (!savedApiKey) {
    return NextResponse.json(
      {
        ...(payload ?? {}),
        runtimeSync: {
          ok: false,
          reason:
            "Saved to your account but no API key was available to sync to Continuity Labs runtime.",
        },
      },
      { status: 200 },
    );
  }

  const llm = buildOpenRouterLlmPayload(savedApiKey, savedModel, {
    baseUrl:
      typeof body.baseUrl === "string"
        ? body.baseUrl.trim() || null
        : body.baseUrl === null
          ? null
          : typeof saved?.baseUrl === "string"
            ? saved.baseUrl
            : null,
    providerName:
      typeof body.providerName === "string"
        ? body.providerName.trim()
        : typeof saved?.providerName === "string"
          ? saved.providerName
          : undefined,
  });

  const runtimeSync = await pushLlmSettingsToOpenHandsRuntime(llm);
  if (!runtimeSync.ok) {
    return NextResponse.json(
      {
        ...(payload ?? {}),
        runtimeSync: {
          ok: false,
          reason:
            runtimeSync.reason ??
            "Saved to your account but Continuity Labs runtime did not accept the API key.",
        },
      },
      { status: 200 },
    );
  }

  return NextResponse.json({
    ...(payload ?? {}),
    runtimeSync: {
      ok: true,
      llm_api_key_set: runtimeSync.llm_api_key_set ?? true,
    },
  });
}

export async function POST(request: NextRequest) {
  return PUT(request);
}
