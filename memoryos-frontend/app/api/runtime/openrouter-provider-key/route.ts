import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { applyProxyOrgIdHeader } from "@/lib/org-scope-server";
import { createBackendAuthHeader } from "../../_lib/backend-auth";
import { resolveBackendOrigin } from "../../_lib/backend-origin";
import {
  buildOpenRouterLlmPayload,
  fetchRuntimeLlmSettings,
  pushLlmSettingsToOpenHandsRuntime,
  resolveBootstrapOpenRouterModel,
  runtimeReportsLlmApiKey,
  shouldPushOpenRouterKeyToRuntime,
} from "../../_lib/openhands-llm-settings";
import {
  isPlausibleOpenRouterApiKey,
  readPlatformOpenRouterApiKey,
} from "../../_lib/openrouter-env";

type RuntimeConfigPayload = {
  data?: {
    apiKey?: string;
    model?: string;
    baseUrl?: string | null;
    providerName?: string | null;
  };
};

async function loadUserOpenRouterConfig(
  request: NextRequest,
): Promise<RuntimeConfigPayload["data"] | null> {
  const authHeader = await createBackendAuthHeader();
  if (!authHeader) return null;

  const clerkAuth = await auth();
  const backendHeaders = new Headers({ Authorization: authHeader });
  applyProxyOrgIdHeader(backendHeaders, request, clerkAuth.orgId);

  const backendResponse = await fetch(
    `${resolveBackendOrigin()}/api/connector/openrouter/runtime-config`,
    { headers: backendHeaders, cache: "no-store" },
  );

  if (!backendResponse.ok) return null;
  const payload = (await backendResponse.json().catch(() => null)) as RuntimeConfigPayload;
  return payload?.data ?? null;
}

/**
 * Pushes the user's saved OpenRouter key (or optional platform default) into
 * OpenHands runtime settings. Primary UX is Company Model → Save in Continuity Lab.
 */
export async function POST(request: NextRequest) {
  const force =
    request.nextUrl.searchParams.get("force") === "1" ||
    request.nextUrl.searchParams.get("force") === "true";

  const settings = await fetchRuntimeLlmSettings();
  const userConfig = await loadUserOpenRouterConfig(request);
  const userApiKey = userConfig?.apiKey?.trim() || null;
  const platformApiKey = readPlatformOpenRouterApiKey();
  const apiKeyForPush =
    (isPlausibleOpenRouterApiKey(userApiKey) ? userApiKey : null) || platformApiKey;

  if (
    !shouldPushOpenRouterKeyToRuntime(settings, userApiKey, { force }) &&
    runtimeReportsLlmApiKey(settings)
  ) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "LLM API key already set on Continuity Labs runtime.",
    });
  }

  const apiKey = apiKeyForPush;
  if (!apiKey) {
    const runtimeKeyLooksBad = settings?.llm_api_key_set && !force;
    return NextResponse.json({
      ok: false,
      skipped: true,
      reason: runtimeKeyLooksBad
        ? "Continuity Labs has an invalid API key stored. Open Company Model, paste your OpenRouter key from https://openrouter.ai/keys, and click Save company model."
        : "No OpenRouter API key saved. In Continuity Lab, open Company Model, paste your key from https://openrouter.ai/keys, and click Save company model.",
    });
  }

  const model = userConfig?.model?.trim() || resolveBootstrapOpenRouterModel(settings);
  const llm = buildOpenRouterLlmPayload(apiKey, model, {
    baseUrl: userConfig?.baseUrl,
    providerName: userConfig?.providerName,
  });

  const result = await pushLlmSettingsToOpenHandsRuntime(llm);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, skipped: true, reason: result.reason },
      { status: 200 },
    );
  }

  return NextResponse.json({
    ok: true,
    model: llm.model,
    source: userApiKey ? "user" : "platform",
    llm_api_key_set: result.llm_api_key_set ?? true,
  });
}
