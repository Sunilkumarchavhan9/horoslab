import { getEpochIntegration, listEpochIntegrations, upsertEpochIntegration, updateEpochIntegration } from "../epochStore";

const CONNECTOR_PROFILES = [
  {
    provider: "github",
    name: "GitHub",
    status: "supported",
    surfaces: ["repositories", "pull_requests", "issues", "actions"],
    missionValue: "Code, review, release, and traceability workflows.",
    missionPatterns: ["review a pull request", "inspect release evidence", "trace failing workflow logs"],
    authorityNeeds: ["repository read", "pull request review", "workflow log access"],
    evidenceKinds: ["pull_request_url", "workflow_run_url", "release_artifact"],
  },
  {
    provider: "slack",
    name: "Slack",
    status: "supported",
    surfaces: ["messages", "channels", "approvals"],
    missionValue: "Human approvals, notifications, and mission status routing.",
    missionPatterns: ["request a human approval", "announce mission progress", "capture approval evidence"],
    authorityNeeds: ["channel read", "message send", "thread reply"],
    evidenceKinds: ["message_url", "thread_url", "approval_capture"],
  },
  {
    provider: "linear",
    name: "Linear",
    status: "supported",
    surfaces: ["issues", "projects", "cycles"],
    missionValue: "Work tracking, mission handoffs, and follow-up tasks.",
    missionPatterns: ["open a follow-up issue", "update a project cycle", "link execution work to a ticket"],
    authorityNeeds: ["issue read", "issue write", "project read"],
    evidenceKinds: ["issue_url", "project_url", "cycle_url"],
  },
  {
    provider: "crm",
    name: "CRM",
    status: "supported",
    surfaces: ["accounts", "deals", "contacts"],
    missionValue: "Customer and account context for mission execution.",
    missionPatterns: ["pull account context", "log a mission outcome", "update a customer-facing record"],
    authorityNeeds: ["account read", "deal update", "contact read"],
    evidenceKinds: ["account_url", "deal_url", "contact_url"],
  },
  {
    provider: "browser",
    name: "Browser",
    status: "supported",
    surfaces: ["navigation", "screenshots", "form_actions"],
    missionValue: "Live evidence capture and interactive execution.",
    missionPatterns: ["capture a screenshot", "verify a live flow", "complete a browser workflow"],
    authorityNeeds: ["navigation", "form interaction", "screenshot capture"],
    evidenceKinds: ["screenshot", "page_url", "form_submission"],
  },
  {
    provider: "openai",
    name: "OpenAI",
    status: "supported",
    surfaces: ["chat", "reasoning", "tool_calls"],
    missionValue: "Model-driven execution, planning, and verification.",
    missionPatterns: ["generate a mission plan", "review evidence", "draft an explanation"],
    authorityNeeds: ["model invocation", "tool use", "response logging"],
    evidenceKinds: ["prompt", "response", "tool_call"],
  },
  {
    provider: "anthropic",
    name: "Anthropic",
    status: "supported",
    surfaces: ["chat", "reasoning", "tool_calls"],
    missionValue: "Alternative model provider for execution and review.",
    missionPatterns: ["generate a mission plan", "review evidence", "draft an explanation"],
    authorityNeeds: ["model invocation", "tool use", "response logging"],
    evidenceKinds: ["prompt", "response", "tool_call"],
  },
] as const;

export async function summarizeIntegrationService(workspaceId: string) {
  const integrations = await listEpochIntegrations({ workspaceId });
  const providerSummary = Object.fromEntries(
    CONNECTOR_PROFILES.map((profile) => {
      const scoped = integrations.filter((item) => item.provider === profile.provider);
      return [
        profile.provider,
        {
          profile,
          missionGuide: {
            provider: profile.provider,
            missionPatterns: profile.missionPatterns,
            authorityNeeds: profile.authorityNeeds,
            evidenceKinds: profile.evidenceKinds,
          },
          total: scoped.length,
          connected: scoped.filter((item) => item.status === "connected").length,
          paused: scoped.filter((item) => item.status === "paused").length,
        },
      ];
    }),
  );
  return {
    workspaceId,
    counts: {
      integrations: integrations.length,
      connected: integrations.filter((item) => item.status === "connected").length,
      paused: integrations.filter((item) => item.status === "paused").length,
    },
    providers: providerSummary,
    supportedConnectors: CONNECTOR_PROFILES,
    recent: integrations.slice(0, 10),
  };
}

export async function getIntegration(workspaceId: string, integrationId: string) {
  return getEpochIntegration(workspaceId, integrationId);
}

export function getSupportedConnectorProfiles() {
  return CONNECTOR_PROFILES;
}

export function getSupportedConnectorProfile(provider: string) {
  return CONNECTOR_PROFILES.find((profile) => profile.provider === provider) ?? null;
}

export function getSupportedConnectorMissionGuide(provider: string) {
  const profile = getSupportedConnectorProfile(provider);
  if (!profile) return null;
  return {
    provider: profile.provider,
    name: profile.name,
    missionPatterns: profile.missionPatterns,
    authorityNeeds: profile.authorityNeeds,
    evidenceKinds: profile.evidenceKinds,
  };
}

export async function upsertIntegration(input: Parameters<typeof upsertEpochIntegration>[0]) {
  return upsertEpochIntegration(input);
}

export async function updateIntegration(
  workspaceId: string,
  integrationId: string,
  input: Parameters<typeof updateEpochIntegration>[2],
) {
  return updateEpochIntegration(workspaceId, integrationId, input);
}
