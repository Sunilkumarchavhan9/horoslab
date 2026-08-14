import type { Request, Response as ExpressResponse, Router } from "express";
import { readOrgIdFromRequest } from "../../lib/auth/orgScope";
import {
  buildContinuityMeta,
  sendContinuityError,
  sendContinuitySuccess,
} from "../../lib/api/continuityApiResponse";
import type { ContinuityApiScope } from "../../lib/memory/continuityApiService";
import { repoFullNameFromProjectId } from "../../lib/continuity/projectScope";
import {
  listGitHubReposForUser,
} from "../../lib/integrations/githubExecution";
import {
  getRepoIndexStatusEntry,
  listRepoIndexStatuses,
  summarizeIndexedRepos,
} from "../../lib/integrations/repoIndexStatus";
import {
  explainMemoryWhy,
  getContinuityScore,
  getDecisionHistory,
  getExecutionHistory,
  getOperationalMapSections,
  getProjectStateSnapshot,
  getRankedNextActions,
} from "../../lib/memory/continuityApiService";
import { generateWikiDiagram } from "../../lib/memory/wikiDiagramService";
import type { WikiDiagramType } from "../../lib/memory/wikiDiagramCacheStore";
import {
  getLabPreferences,
  patchLabPreferences,
  type LabPreferencesRecord,
} from "../../lib/continuity/labPreferencesStore";
import {
  getLabOrgSettings,
  patchLabOrgSettings,
  type LabOrgSettingsRecord,
} from "../../lib/continuity/labOrgSettingsStore";
import {
  getLabSessionsSettings,
  patchLabSessionsSettings,
  type LabSessionsSettingsRecord,
} from "../../lib/continuity/labSessionsSettingsStore";
import {
  addLabContinuityLabCustomCommand,
  getLabContinuityLabSettings,
  listSlashCommandsForOrg,
  patchLabContinuityLabSettings,
  resetLabContinuityLabCustomCommands,
  type LabContinuityLabSettingsRecord,
} from "../../lib/continuity/labContinuityLabSettingsStore";
import {
  getLabReviewSettings,
  patchLabReviewSettings,
  type LabReviewSettingsRecord,
} from "../../lib/continuity/labReviewSettingsStore";
import {
  getLabDesktopSettings,
  patchLabDesktopSettings,
  toPublicDesktopSettings,
  type LabDesktopSettingsPatch,
  type LabDesktopSettingsRecord,
  type ModelProviderKeyId,
} from "../../lib/continuity/labDesktopSettingsStore";
import {
  getLabShellIntegrationSettings,
  patchLabShellIntegrationSettings,
  type LabShellIntegrationSettingsRecord,
} from "../../lib/continuity/labShellIntegrationSettingsStore";
import {
  getLabWikiSettings,
  patchLabWikiSettings,
  type LabWikiSettingsRecord,
} from "../../lib/continuity/labWikiSettingsStore";
import {
  createLabKnowledgeFolder,
  createLabKnowledgeItem,
  getLabKnowledgeSettings,
  patchLabKnowledgeItem,
  patchLabKnowledgeSettings,
  type LabKnowledgeSettingsRecord,
} from "../../lib/continuity/labKnowledgeSettingsStore";
import {
  createLabPlaybook,
  deleteLabPlaybook,
  getLabPlaybook,
  listLabPlaybooks,
  patchLabPlaybook,
  type CreateLabPlaybookInput,
  type LabPlaybookAgentMode,
  type LabPlaybookRecord,
  type LabPlaybooksList,
  type PatchLabPlaybookInput,
} from "../../lib/continuity/labPlaybooksStore";
import {
  addLabEnvironmentBlueprintFile,
  addLabEnvironmentBlueprintSecret,
  addLabEnvironmentRepoBlueprintFile,
  addLabEnvironmentRepoBlueprintSecret,
  buildLabEnvironmentSnapshot,
  activateLabEnvironmentSnapshot,
  deleteLabEnvironmentSnapshot,
  deleteLabEnvironmentBlueprint,
  getLabEnvironmentSettings,
  importLabEnvironmentBlueprintSecrets,
  importLabEnvironmentRepoBlueprintSecrets,
  patchLabEnvironmentSettings,
  removeEnrolledRepo,
  saveLabEnvironmentBlueprint,
  saveLabEnvironmentRepoBlueprint,
  toPublicEnvironmentSettings,
  type LabEnvironmentSettingsRecord,
  type LabEnvironmentBlueprintSecretType,
} from "../../lib/continuity/labEnvironmentSettingsStore";
import {
  getLabSkillsRulesSettings,
  patchLabSkillsRulesSettings,
  type LabSkillsRulesSettingsRecord,
} from "../../lib/continuity/labSkillsRulesSettingsStore";
import {
  buildSkillsRulesDiscoveryPayload,
  discoverSkillsRulesInRepo,
  readSkillsRulesFileContent,
  refreshSkillsRulesForRepos,
  toRepoSkillsRulesSummary,
  writeSkillsRulesFileContent,
} from "../../lib/continuity/skillsRulesDiscovery";
import {
  compileSkillsRulesToMemory,
  maybeAutoCompileSkillsRules,
} from "../../lib/continuity/skillsRulesCompile";
import { buildSkillsRulesContextBlock } from "../../lib/continuity/skillsRulesContext";
import { buildEnvironmentContextBlock } from "../../lib/continuity/environmentContext";
import {
  createLabSchedule,
  deleteLabSchedule,
  getLabSchedule,
  listLabSchedules,
  patchLabSchedule,
  type CreateLabScheduleInput,
  type LabScheduleRecord,
  type PatchLabScheduleInput,
} from "../../lib/continuity/labSchedulesStore";
import {
  createLabAutomation,
  createLabAutomationRun,
  deleteLabAutomation,
  getLabAutomation,
  listLabAutomationRuns,
  listLabAutomations,
  listRecentLabAutomations,
  patchLabAutomation,
  touchRecentLabAutomation,
  type CreateLabAutomationInput,
  type CreateLabAutomationRunInput,
  type LabAutomationRecord,
  type PatchLabAutomationInput,
} from "../../lib/continuity/labAutomationsStore";
import {
  publishLabAutomationRealtime,
  startLabAutomationRealtimeBridge,
  subscribeLabAutomationRealtime,
} from "../../lib/continuity/labAutomationRealtime";
import {
  enqueueLabAutomationTriggerJob,
  type EnqueueLabAutomationTriggerInput,
} from "../../lib/continuity/labAutomationWorker";
import { asyncHandler } from "../middleware/asyncHandler";

function parseProjectId(req: Request): string | null {
  const raw = req.query.projectId;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }
  return value.trim();
}

function parseLimit(
  req: Request,
  defaultLimit: number,
  maxLimit: number,
): { limit: number } | { error: string } {
  const limitRaw = req.query.limit;
  const value = Array.isArray(limitRaw) ? limitRaw[0] : limitRaw;
  if (value === undefined || value === "") {
    return { limit: defaultLimit };
  }
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return { error: "limit must be a positive integer" };
  }
  return { limit: Math.min(parsed, maxLimit) };
}

function continuityScope(req: Request, projectId: string): ContinuityApiScope {
  const orgId = readOrgIdFromRequest(req) ?? req.authOrgId;
  return {
    userId: req.authUserId,
    orgId: orgId ?? undefined,
    projectId,
  };
}

function continuityMeta(req: Request, startedAt: number, projectId?: string, orgId?: string) {
  return buildContinuityMeta(req, startedAt, {
    projectId,
    orgId,
  });
}

const WIKI_DIAGRAM_TYPES = new Set<WikiDiagramType>([
  "ui_composition",
  "data_flow",
  "architecture",
  "overview",
]);

function parseWikiDiagramType(value: unknown): WikiDiagramType | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim() as WikiDiagramType;
  return WIKI_DIAGRAM_TYPES.has(normalized) ? normalized : null;
}

function labPreferencesPayload(record: LabPreferencesRecord) {
  const { updatedAt, ...preferences } = record;
  return { preferences, updatedAt };
}

function labOrgSettingsPayload(orgId: string, record: LabOrgSettingsRecord) {
  const { updatedAt, ...settings } = record;
  return { orgId, settings, updatedAt };
}

function labSessionsSettingsPayload(record: LabSessionsSettingsRecord) {
  const { updatedAt, ...settings } = record;
  return { settings, updatedAt };
}

function labContinuityLabSettingsPayload(orgId: string, record: LabContinuityLabSettingsRecord) {
  const { updatedAt, ...settings } = record;
  return {
    orgId,
    settings,
    commands: listSlashCommandsForOrg(record),
    updatedAt,
  };
}

function labReviewSettingsPayload(orgId: string, record: LabReviewSettingsRecord) {
  const { updatedAt, ...settings } = record;
  return { orgId, settings, updatedAt };
}

function labDesktopSettingsPayload(orgId: string, record: LabDesktopSettingsRecord) {
  const { updatedAt } = record;
  return {
    orgId,
    settings: toPublicDesktopSettings(record),
    updatedAt,
  };
}

function labShellIntegrationSettingsPayload(
  orgId: string,
  record: LabShellIntegrationSettingsRecord,
) {
  const { updatedAt, ...settings } = record;
  return {
    orgId,
    settings,
    updatedAt,
  };
}

function isModelProviderKeyId(value: unknown): value is ModelProviderKeyId {
  return value === "anthropic" || value === "openrouter";
}

function isPlausibleAnthropicApiKey(key: string): boolean {
  const trimmed = key.trim();
  if (!trimmed || trimmed.length < 20) return false;
  if (!trimmed.startsWith("sk-ant-")) return false;
  if (/\s/.test(trimmed)) return false;
  return true;
}

function isPlausibleOpenRouterProviderKey(key: string): boolean {
  const trimmed = key.trim();
  if (!trimmed || trimmed.length < 20) return false;
  if (!trimmed.startsWith("sk-or-")) return false;
  if (/\s/.test(trimmed)) return false;
  return true;
}

function validateDesktopProviderKeysPatch(
  raw: unknown,
): { keys: Partial<Record<ModelProviderKeyId, string | null>> } | { error: string } {
  if (raw === undefined) return { keys: {} };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { error: "modelProviderKeys must be an object" };
  }
  const record = raw as Record<string, unknown>;
  const keys: Partial<Record<ModelProviderKeyId, string | null>> = {};
  for (const id of ["anthropic", "openrouter"] as const) {
    if (!(id in record)) continue;
    const value = record[id];
    if (value === null || value === "") {
      keys[id] = null;
      continue;
    }
    if (typeof value !== "string" || value.trim().length === 0) {
      return { error: `${id} API key must be a non-empty string or null` };
    }
    const trimmed = value.trim();
    if (id === "anthropic" && !isPlausibleAnthropicApiKey(trimmed)) {
      return {
        error:
          "Anthropic API key looks invalid. Paste a key from console.anthropic.com (starts with sk-ant-).",
      };
    }
    if (id === "openrouter" && !isPlausibleOpenRouterProviderKey(trimmed)) {
      return {
        error:
          "OpenRouter API key looks invalid. Paste a key from openrouter.ai/keys (starts with sk-or-).",
      };
    }
    keys[id] = trimmed;
  }
  return { keys };
}

function labWikiSettingsPayload(orgId: string, record: LabWikiSettingsRecord) {
  const { updatedAt, ...settings } = record;
  return { orgId, settings, updatedAt };
}

function labKnowledgeSettingsPayload(orgId: string, record: LabKnowledgeSettingsRecord) {
  const { updatedAt, ...settings } = record;
  return { orgId, settings, updatedAt };
}

function labPlaybooksListPayload(orgId: string, playbooks: LabPlaybooksList) {
  return { orgId, playbooks };
}

function labPlaybookPayload(orgId: string, playbook: LabPlaybookRecord) {
  return { orgId, playbook };
}

function parseLabPlaybookAgentMode(value: unknown): LabPlaybookAgentMode | undefined {
  return value === "default" || value === "normal" || value === "fast" ? value : undefined;
}

const LAB_ENVIRONMENT_SNAPSHOT_BUILD_NOTE =
  "Records your org environment definition. OpenHands sandbox image rebuild is planned — sessions use enrolled repos and blueprint text today.";

function labEnvironmentSettingsPayload(orgId: string, record: LabEnvironmentSettingsRecord) {
  const publicSettings = toPublicEnvironmentSettings(record);
  const { updatedAt, ...settings } = publicSettings;
  return {
    orgId,
    settings,
    updatedAt,
    snapshotBuildNote: LAB_ENVIRONMENT_SNAPSHOT_BUILD_NOTE,
  };
}

async function labSkillsRulesSettingsPayload(
  orgId: string,
  record: LabSkillsRulesSettingsRecord,
  userId: string,
  options?: { refreshIfStale?: boolean; refreshRepos?: string[] },
) {
  const { updatedAt, ...settings } = record;
  const discovery = await buildSkillsRulesDiscoveryPayload({
    userId,
    orgId,
    enrolledRepos: settings.enrolledRepos,
    refreshIfStale: options?.refreshIfStale,
    refreshRepos: options?.refreshRepos,
  });
  return { orgId, settings, updatedAt, ...discovery };
}

const LAB_SCHEDULES_EXECUTION_NOTE =
  "Schedules are persisted server-side. Automatic cron execution to start agent sessions is not wired yet — use Automations for supported triggers.";

const LAB_AUTOMATIONS_EXECUTION_NOTE =
  "Automations are persisted server-side with brokered real-time events. Trigger jobs are queued for background workers; active session launch uses the Continuity Lab session runtime.";

const AUTOMATION_STREAMS = new Map<string, Set<ExpressResponse>>();
let automationRealtimeInitialized = false;

function labSchedulesListPayload(
  orgId: string,
  schedules: LabScheduleRecord[],
  currentUserId?: string,
) {
  return {
    orgId,
    schedules,
    currentUserId,
    executionStatus: "persist_only" as const,
    executionNote: LAB_SCHEDULES_EXECUTION_NOTE,
  };
}

function labAutomationsListPayload(
  orgId: string,
  automations: LabAutomationRecord[],
  recentAutomations: Awaited<ReturnType<typeof listRecentLabAutomations>>,
  currentUserId?: string,
) {
  return {
    orgId,
    automations,
    recentAutomations,
    currentUserId,
    realtimeStatus: "sse" as const,
    executionStatus: "manual_trigger_supported" as const,
    executionNote: LAB_AUTOMATIONS_EXECUTION_NOTE,
  };
}

function labAutomationPayload(
  orgId: string,
  automation: LabAutomationRecord,
  runs: Awaited<ReturnType<typeof listLabAutomationRuns>> = [],
) {
  return {
    orgId,
    automation,
    runs,
    realtimeStatus: "sse" as const,
    executionStatus: "manual_trigger_supported" as const,
    executionNote: LAB_AUTOMATIONS_EXECUTION_NOTE,
  };
}

function writeAutomationSse(
  res: ExpressResponse,
  event: string,
  payload: Record<string, unknown>,
): void {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function sendAutomationEventToStreams(
  orgId: string,
  event: string,
  payload: Record<string, unknown>,
): void {
  const sinks = AUTOMATION_STREAMS.get(orgId);
  if (!sinks?.size) return;
  for (const sink of Array.from(sinks)) {
    try {
      writeAutomationSse(sink, event, {
        orgId,
        ts: new Date().toISOString(),
        ...payload,
      });
    } catch {
      sinks.delete(sink);
    }
  }
  if (sinks.size === 0) AUTOMATION_STREAMS.delete(orgId);
}

async function broadcastAutomationEvent(
  orgId: string,
  event: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await publishLabAutomationRealtime(orgId, event, payload);
}

function ensureAutomationRealtimeBridge(): void {
  if (automationRealtimeInitialized) return;
  automationRealtimeInitialized = true;
  startLabAutomationRealtimeBridge();
  subscribeLabAutomationRealtime((message) => {
    sendAutomationEventToStreams(message.orgId, message.event, message.payload);
  });
}

function resolveLabOrgId(req: Request): string | undefined {
  return readOrgIdFromRequest(req) ?? req.authOrgId ?? `user:${req.authUserId}`;
}

function resolveLabKnowledgeScopeId(req: Request): string {
  return resolveLabOrgId(req) ?? `user:${req.authUserId}`;
}

function sendMissingLabOrg(res: ExpressResponse, req: Request, startedAt: number): void {
  sendContinuityError(
    res,
    400,
    "missing_org",
    "Organization context is required (x-memoryos-org-id)",
    continuityMeta(req, startedAt),
  );
}

function requestJsonObject(req: Request): Record<string, unknown> | null {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  return body as Record<string, unknown>;
}

export function registerContinuityMemoryRoutes(router: Router): void {
  ensureAutomationRealtimeBridge();

  router.get(
    "/lab-preferences",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const record = await getLabPreferences(req.authUserId);
      sendContinuitySuccess(
        res,
        200,
        labPreferencesPayload(record),
        continuityMeta(req, startedAt),
      );
    }),
  );

  router.patch(
    "/lab-preferences",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const body = req.body;
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "Request body must be a JSON object",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const record = await patchLabPreferences(req.authUserId, body as Partial<LabPreferencesRecord>);
      sendContinuitySuccess(
        res,
        200,
        labPreferencesPayload(record),
        continuityMeta(req, startedAt),
      );
    }),
  );

  router.get(
    "/lab-sessions-settings",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      const record = await getLabSessionsSettings(req.authUserId, orgId);
      sendContinuitySuccess(
        res,
        200,
        labSessionsSettingsPayload(record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.patch(
    "/lab-sessions-settings",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const body = req.body;
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "Request body must be a JSON object",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const orgId = resolveLabOrgId(req);
      const record = await patchLabSessionsSettings(
        req.authUserId,
        body as Partial<Omit<LabSessionsSettingsRecord, "updatedAt">>,
        orgId,
      );
      sendContinuitySuccess(
        res,
        200,
        labSessionsSettingsPayload(record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.get(
    "/lab-org-settings",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const record = await getLabOrgSettings(orgId);
      sendContinuitySuccess(
        res,
        200,
        labOrgSettingsPayload(orgId, record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.patch(
    "/lab-org-settings",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const body = req.body;
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "Request body must be a JSON object",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const record = await patchLabOrgSettings(orgId, body as Partial<LabOrgSettingsRecord>);
      sendContinuitySuccess(
        res,
        200,
        labOrgSettingsPayload(orgId, record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.get(
    "/lab-continuity-lab-settings",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const record = await getLabContinuityLabSettings(orgId);
      sendContinuitySuccess(
        res,
        200,
        labContinuityLabSettingsPayload(orgId, record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.patch(
    "/lab-continuity-lab-settings",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const body = req.body;
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "Request body must be a JSON object",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const payload = body as Record<string, unknown>;
      if (payload.action === "reset_commands") {
        const record = await resetLabContinuityLabCustomCommands(orgId);
        sendContinuitySuccess(
          res,
          200,
          labContinuityLabSettingsPayload(orgId, record),
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      if (payload.action === "add_command") {
        const cmd = payload.command;
        if (!cmd || typeof cmd !== "object" || Array.isArray(cmd)) {
          sendContinuityError(
            res,
            400,
            "invalid_command",
            "command object is required",
            continuityMeta(req, startedAt, undefined, orgId),
          );
          return;
        }
        const input = cmd as { name?: string; description?: string; prompt?: string };
        const result = await addLabContinuityLabCustomCommand(orgId, {
          name: typeof input.name === "string" ? input.name : "",
          description: typeof input.description === "string" ? input.description : "",
          prompt: typeof input.prompt === "string" ? input.prompt : "",
        });
        if ("error" in result) {
          sendContinuityError(
            res,
            400,
            "invalid_command",
            result.error,
            continuityMeta(req, startedAt, undefined, orgId),
          );
          return;
        }
        sendContinuitySuccess(
          res,
          200,
          labContinuityLabSettingsPayload(orgId, result.record),
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const record = await patchLabContinuityLabSettings(
        orgId,
        body as Partial<Omit<LabContinuityLabSettingsRecord, "updatedAt">>,
      );
      sendContinuitySuccess(
        res,
        200,
        labContinuityLabSettingsPayload(orgId, record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.get(
    "/lab-review-settings",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const record = await getLabReviewSettings(orgId);
      sendContinuitySuccess(
        res,
        200,
        labReviewSettingsPayload(orgId, record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.patch(
    "/lab-review-settings",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const body = req.body;
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "Request body must be a JSON object",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const record = await patchLabReviewSettings(
        orgId,
        body as Partial<Omit<LabReviewSettingsRecord, "updatedAt">>,
      );
      sendContinuitySuccess(
        res,
        200,
        labReviewSettingsPayload(orgId, record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.get(
    "/lab-desktop-settings",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const record = await getLabDesktopSettings(orgId);
      sendContinuitySuccess(
        res,
        200,
        labDesktopSettingsPayload(orgId, record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.patch(
    "/lab-desktop-settings",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const body = req.body;
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "Request body must be a JSON object",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const patchBody = body as Record<string, unknown>;
      const keyValidation = validateDesktopProviderKeysPatch(patchBody.modelProviderKeys);
      if ("error" in keyValidation) {
        sendContinuityError(
          res,
          400,
          "invalid_api_key",
          keyValidation.error,
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const partial: LabDesktopSettingsPatch = {};
      if (typeof patchBody.disableTelemetry === "boolean") {
        partial.disableTelemetry = patchBody.disableTelemetry;
      }
      if (Object.keys(keyValidation.keys).length > 0) {
        partial.modelProviderKeys = keyValidation.keys;
      }
      const record = await patchLabDesktopSettings(orgId, partial);
      sendContinuitySuccess(
        res,
        200,
        labDesktopSettingsPayload(orgId, record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.post(
    "/lab-desktop-settings/provider-keys",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const body = req.body;
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "Request body must be a JSON object",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const provider = (body as { provider?: unknown }).provider;
      const apiKey = (body as { apiKey?: unknown }).apiKey;
      if (!isModelProviderKeyId(provider)) {
        sendContinuityError(
          res,
          400,
          "invalid_provider",
          "provider must be anthropic or openrouter",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      if (typeof apiKey !== "string" || apiKey.trim().length === 0) {
        sendContinuityError(
          res,
          400,
          "invalid_api_key",
          "apiKey is required",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const trimmedKey = apiKey.trim();
      if (provider === "anthropic" && !isPlausibleAnthropicApiKey(trimmedKey)) {
        sendContinuityError(
          res,
          400,
          "invalid_api_key",
          "Anthropic API key looks invalid. Paste a key from console.anthropic.com (starts with sk-ant-).",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      if (provider === "openrouter" && !isPlausibleOpenRouterProviderKey(trimmedKey)) {
        sendContinuityError(
          res,
          400,
          "invalid_api_key",
          "OpenRouter API key looks invalid. Paste a key from openrouter.ai/keys (starts with sk-or-).",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const record = await patchLabDesktopSettings(orgId, {
        modelProviderKeys: { [provider]: trimmedKey },
      });
      sendContinuitySuccess(
        res,
        200,
        labDesktopSettingsPayload(orgId, record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.get(
    "/lab-shell-integration-settings",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const record = await getLabShellIntegrationSettings(orgId);
      sendContinuitySuccess(
        res,
        200,
        labShellIntegrationSettingsPayload(orgId, record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.patch(
    "/lab-shell-integration-settings",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const body = req.body;
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "Request body must be a JSON object",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const patchBody = body as Record<string, unknown>;
      const partial: Partial<Omit<LabShellIntegrationSettingsRecord, "updatedAt">> = {};
      if (typeof patchBody.enabled === "boolean") partial.enabled = patchBody.enabled;
      if (typeof patchBody.keybindingTrigger === "string") {
        partial.keybindingTrigger = patchBody.keybindingTrigger;
      }
      if (typeof patchBody.enableComments === "boolean") partial.enableComments = patchBody.enableComments;
      if (typeof patchBody.installCommand === "string") partial.installCommand = patchBody.installCommand;
      if (typeof patchBody.configPath === "string") partial.configPath = patchBody.configPath;
      if (typeof patchBody.hooksPath === "string") partial.hooksPath = patchBody.hooksPath;
      if (patchBody.enabledShells && typeof patchBody.enabledShells === "object" && !Array.isArray(patchBody.enabledShells)) {
        partial.enabledShells = patchBody.enabledShells as LabShellIntegrationSettingsRecord["enabledShells"];
      }
      const record = await patchLabShellIntegrationSettings(orgId, partial);
      sendContinuitySuccess(
        res,
        200,
        labShellIntegrationSettingsPayload(orgId, record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.get(
    "/lab-wiki-settings",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const record = await getLabWikiSettings(orgId);
      sendContinuitySuccess(
        res,
        200,
        labWikiSettingsPayload(orgId, record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.patch(
    "/lab-wiki-settings",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const body = req.body;
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "Request body must be a JSON object",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const record = await patchLabWikiSettings(
        orgId,
        body as Partial<Omit<LabWikiSettingsRecord, "updatedAt">>,
      );
      sendContinuitySuccess(
        res,
        200,
        labWikiSettingsPayload(orgId, record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.get(
    "/lab-knowledge-settings",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabKnowledgeScopeId(req);
      const record = await getLabKnowledgeSettings(orgId);
      sendContinuitySuccess(
        res,
        200,
        labKnowledgeSettingsPayload(orgId, record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.patch(
    "/lab-knowledge-settings",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabKnowledgeScopeId(req);
      const body = req.body;
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "Request body must be a JSON object",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const record = await patchLabKnowledgeSettings(orgId, {
        adminOnlySuggestions:
          typeof body.adminOnlySuggestions === "boolean"
            ? body.adminOnlySuggestions
            : undefined,
      });
      sendContinuitySuccess(
        res,
        200,
        labKnowledgeSettingsPayload(orgId, record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.post(
    "/lab-knowledge-settings/folders",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabKnowledgeScopeId(req);
      const body = req.body;
      const name = body && typeof body === "object" ? String(body.name ?? "").trim() : "";
      if (!name) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "name is required",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const record = await createLabKnowledgeFolder(orgId, {
        name,
        description:
          body && typeof body === "object" && typeof body.description === "string"
            ? body.description
            : null,
        author: req.authUserId,
      });
      sendContinuitySuccess(
        res,
        200,
        labKnowledgeSettingsPayload(orgId, record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.post(
    "/lab-knowledge-settings/items",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabKnowledgeScopeId(req);
      const body = req.body;
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "Request body must be a JSON object",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const content = typeof body.content === "string" ? body.content : "";
      if (!name || !content) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "name and content are required",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const record = await createLabKnowledgeItem(orgId, {
        name,
        content,
        trigger: typeof body.trigger === "string" ? body.trigger : null,
        folderId: typeof body.folderId === "string" ? body.folderId : null,
        repo: typeof body.repo === "string" ? body.repo : null,
        author: req.authUserId,
      });
      sendContinuitySuccess(
        res,
        200,
        labKnowledgeSettingsPayload(orgId, record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.patch(
    "/lab-knowledge-settings/items/:itemId",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabKnowledgeScopeId(req);
      const itemId = String(req.params.itemId ?? "").trim();
      if (!itemId) {
        sendContinuityError(
          res,
          400,
          "invalid_item",
          "itemId is required",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const body = req.body;
      const record = await patchLabKnowledgeItem(orgId, itemId, {
        enabled:
          body && typeof body === "object" && typeof body.enabled === "boolean"
            ? body.enabled
            : undefined,
      });
      sendContinuitySuccess(
        res,
        200,
        labKnowledgeSettingsPayload(orgId, record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.get(
    "/lab-playbooks",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const playbooks = await listLabPlaybooks(orgId);
      sendContinuitySuccess(
        res,
        200,
        labPlaybooksListPayload(orgId, playbooks),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.post(
    "/lab-playbooks",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const body = req.body;
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "Request body must be a JSON object",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const content = typeof body.content === "string" ? body.content : "";
      if (!name || !content.trim()) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "name and content are required",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const playbook = await createLabPlaybook(
        orgId,
        {
          name,
          content,
          macro: typeof body.macro === "string" ? body.macro : null,
          agentMode: parseLabPlaybookAgentMode(body.agentMode),
        } satisfies CreateLabPlaybookInput,
        req.authUserId,
      );
      sendContinuitySuccess(
        res,
        201,
        labPlaybookPayload(orgId, playbook),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.get(
    "/lab-playbooks/:playbookId",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const playbookId = String(req.params.playbookId ?? "").trim();
      const playbook = playbookId ? await getLabPlaybook(orgId, playbookId) : null;
      if (!playbook) {
        sendContinuityError(
          res,
          404,
          "not_found",
          "Playbook not found",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      sendContinuitySuccess(
        res,
        200,
        labPlaybookPayload(orgId, playbook),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.patch(
    "/lab-playbooks/:playbookId",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const playbookId = String(req.params.playbookId ?? "").trim();
      const existing = playbookId ? await getLabPlaybook(orgId, playbookId) : null;
      if (!existing) {
        sendContinuityError(
          res,
          404,
          "not_found",
          "Playbook not found",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      if (existing.readonly) {
        sendContinuityError(
          res,
          403,
          "readonly_playbook",
          "System playbooks are read-only",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const body = req.body;
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "Request body must be a JSON object",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const playbook = await patchLabPlaybook(orgId, playbookId, body as PatchLabPlaybookInput);
      if (!playbook) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "name and content are required",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      sendContinuitySuccess(
        res,
        200,
        labPlaybookPayload(orgId, playbook),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.delete(
    "/lab-playbooks/:playbookId",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const playbookId = String(req.params.playbookId ?? "").trim();
      const existing = playbookId ? await getLabPlaybook(orgId, playbookId) : null;
      if (!existing) {
        sendContinuityError(
          res,
          404,
          "not_found",
          "Playbook not found",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      if (existing.readonly) {
        sendContinuityError(
          res,
          403,
          "readonly_playbook",
          "System playbooks are read-only",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const deleted = await deleteLabPlaybook(orgId, playbookId);
      if (!deleted) {
        sendContinuityError(
          res,
          404,
          "not_found",
          "Playbook not found",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      sendContinuitySuccess(
        res,
        200,
        { orgId, playbookId, deleted: true },
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.get(
    "/lab-environment-settings",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const record = await getLabEnvironmentSettings(orgId);
      sendContinuitySuccess(
        res,
        200,
        labEnvironmentSettingsPayload(orgId, record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.patch(
    "/lab-environment-settings",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const body = req.body;
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "Request body must be a JSON object",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const record = await patchLabEnvironmentSettings(
        orgId,
        body as Partial<Omit<LabEnvironmentSettingsRecord, "updatedAt">>,
      );
      sendContinuitySuccess(
        res,
        200,
        labEnvironmentSettingsPayload(orgId, record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.post(
    "/lab-environment-settings/build-snapshot",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const body = req.body;
      const triggeredBy =
        body && typeof body === "object" && typeof body.triggeredBy === "string"
          ? body.triggeredBy
          : req.authUserId;
      const record = await buildLabEnvironmentSnapshot(orgId, {
        triggeredBy: triggeredBy ?? null,
        trigger: "manual",
      });
      sendContinuitySuccess(
        res,
        200,
        labEnvironmentSettingsPayload(orgId, record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.post(
    "/lab-environment-settings/snapshot/activate",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const body = req.body;
      const snapshotId =
        body && typeof body === "object" && typeof body.snapshotId === "string"
          ? body.snapshotId.trim()
          : "";
      if (!snapshotId) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "snapshotId is required",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const record = await activateLabEnvironmentSnapshot(orgId, snapshotId);
      sendContinuitySuccess(
        res,
        200,
        labEnvironmentSettingsPayload(orgId, record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.delete(
    "/lab-environment-settings/snapshot",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const body = req.body;
      const snapshotId =
        body && typeof body === "object" && typeof body.snapshotId === "string"
          ? body.snapshotId.trim()
          : "";
      if (!snapshotId) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "snapshotId is required",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const record = await deleteLabEnvironmentSnapshot(orgId, snapshotId);
      sendContinuitySuccess(
        res,
        200,
        labEnvironmentSettingsPayload(orgId, record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.post(
    "/lab-environment-settings/save-blueprint",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const body = req.body;
      const content = body && typeof body === "object" && typeof body.content === "string"
        ? body.content
        : "";
      const savedBy =
        body && typeof body === "object" && typeof body.savedBy === "string"
          ? body.savedBy
          : req.authUserId;
      const record = await saveLabEnvironmentBlueprint({ orgId, content, savedBy });
      sendContinuitySuccess(
        res,
        200,
        labEnvironmentSettingsPayload(orgId, record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.delete(
    "/lab-environment-settings/blueprint",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const record = await deleteLabEnvironmentBlueprint(orgId);
      sendContinuitySuccess(
        res,
        200,
        labEnvironmentSettingsPayload(orgId, record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.post(
    "/lab-environment-settings/blueprint-secrets",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const body = req.body;
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "Request body must be a JSON object",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const value = typeof body.value === "string" ? body.value : "";
      const type: LabEnvironmentBlueprintSecretType =
        body.type === "cookie" || body.type === "totp" ? body.type : "key-value";
      if (!name || !value) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "name and value are required",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const record = await addLabEnvironmentBlueprintSecret(orgId, {
        type,
        name,
        value,
        note: typeof body.note === "string" ? body.note : null,
        redacted: body.redacted !== false,
      });
      sendContinuitySuccess(
        res,
        200,
        labEnvironmentSettingsPayload(orgId, record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.post(
    "/lab-environment-settings/blueprint-secrets/import",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const body = req.body;
      const text: string =
        body && typeof body === "object" && typeof body.text === "string" ? body.text : "";
      const redacted = body && typeof body === "object" ? body.redacted !== false : true;
      const lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const hash = line.indexOf("#");
          const main = hash >= 0 ? line.slice(0, hash).trim() : line;
          const note = hash >= 0 ? line.slice(hash + 1).trim() : null;
          const eq = main.indexOf("=");
          if (eq <= 0) return null;
          const name = main.slice(0, eq).trim();
          const value = main.slice(eq + 1).trim();
          if (!name || !value) return null;
          return { name, value, note, redacted };
        })
        .filter((row): row is { name: string; value: string; note: string | null; redacted: boolean } =>
          Boolean(row),
        );
      const record = await importLabEnvironmentBlueprintSecrets(orgId, lines);
      sendContinuitySuccess(
        res,
        200,
        labEnvironmentSettingsPayload(orgId, record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.post(
    "/lab-environment-settings/blueprint-files",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const body = req.body;
      const name = body && typeof body === "object" && typeof body.name === "string" ? body.name.trim() : "";
      const content = body && typeof body === "object" && typeof body.content === "string" ? body.content : "";
      if (!name || !content) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "name and content are required",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      if (Buffer.byteLength(content, "utf8") > 512_000) {
        sendContinuityError(
          res,
          400,
          "file_too_large",
          "File exceeds 512KB limit.",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const record = await addLabEnvironmentBlueprintFile(orgId, { name, content });
      sendContinuitySuccess(
        res,
        200,
        labEnvironmentSettingsPayload(orgId, record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.get(
    "/lab-environment-settings/context",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const repoRaw = req.query.repo;
      const repo = (Array.isArray(repoRaw) ? repoRaw[0] : repoRaw)?.toString().trim() || undefined;
      const context = await buildEnvironmentContextBlock({
        orgId,
        sessionRepo: repo ?? null,
      });
      sendContinuitySuccess(
        res,
        200,
        { orgId, repo: repo ?? null, context },
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.post(
    "/lab-environment-settings/save-repo-blueprint",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const body = req.body;
      const repo = body && typeof body === "object" && typeof body.repo === "string" ? body.repo.trim() : "";
      const content = body && typeof body === "object" && typeof body.content === "string"
        ? body.content
        : "";
      const savedBy =
        body && typeof body === "object" && typeof body.savedBy === "string"
          ? body.savedBy
          : req.authUserId;
      if (!repo) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "repo is required",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const record = await saveLabEnvironmentRepoBlueprint({ orgId, repo, content, savedBy });
      sendContinuitySuccess(
        res,
        200,
        labEnvironmentSettingsPayload(orgId, record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.delete(
    "/lab-environment-settings/enrolled-repo",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const body = req.body;
      const repo = body && typeof body === "object" && typeof body.repo === "string" ? body.repo.trim() : "";
      if (!repo) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "repo is required",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const record = await removeEnrolledRepo(orgId, repo);
      sendContinuitySuccess(
        res,
        200,
        labEnvironmentSettingsPayload(orgId, record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.post(
    "/lab-environment-settings/repo-blueprint-secrets",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const body = req.body;
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "Request body must be a JSON object",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const repo = typeof body.repo === "string" ? body.repo.trim() : "";
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const value = typeof body.value === "string" ? body.value : "";
      if (!repo || !name || !value) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "repo, name and value are required",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const record = await addLabEnvironmentRepoBlueprintSecret(orgId, repo, {
        name,
        value,
        note: typeof body.note === "string" ? body.note : null,
        redacted: body.redacted !== false,
      });
      sendContinuitySuccess(
        res,
        200,
        labEnvironmentSettingsPayload(orgId, record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.post(
    "/lab-environment-settings/repo-blueprint-secrets/import",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const body = req.body;
      const repo = body && typeof body === "object" && typeof body.repo === "string" ? body.repo.trim() : "";
      const text = body && typeof body === "object" && typeof body.text === "string" ? body.text : "";
      const redacted = body && typeof body === "object" ? body.redacted !== false : true;
      if (!repo) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "repo is required",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const lines = text
        .split("\n")
        .map((line: string) => line.trim())
        .filter(Boolean)
        .map((line: string) => {
          const hash = line.indexOf("#");
          const main = hash >= 0 ? line.slice(0, hash).trim() : line;
          const note = hash >= 0 ? line.slice(hash + 1).trim() : null;
          const eq = main.indexOf("=");
          if (eq <= 0) return null;
          const name = main.slice(0, eq).trim();
          const value = main.slice(eq + 1).trim();
          if (!name || !value) return null;
          return { name, value, note, redacted };
        })
        .filter(
          (
            row: { name: string; value: string; note: string | null; redacted: boolean } | null,
          ): row is { name: string; value: string; note: string | null; redacted: boolean } =>
            Boolean(row),
        );
      const record = await importLabEnvironmentRepoBlueprintSecrets(orgId, repo, lines);
      sendContinuitySuccess(
        res,
        200,
        labEnvironmentSettingsPayload(orgId, record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.post(
    "/lab-environment-settings/repo-blueprint-files",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const body = req.body;
      const repo = body && typeof body === "object" && typeof body.repo === "string" ? body.repo.trim() : "";
      const name = body && typeof body === "object" && typeof body.name === "string" ? body.name.trim() : "";
      const content = body && typeof body === "object" && typeof body.content === "string" ? body.content : "";
      if (!repo || !name || !content) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "repo, name and content are required",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      if (Buffer.byteLength(content, "utf8") > 512_000) {
        sendContinuityError(
          res,
          400,
          "file_too_large",
          "File exceeds 512KB limit.",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const record = await addLabEnvironmentRepoBlueprintFile(orgId, repo, { name, content });
      sendContinuitySuccess(
        res,
        200,
        labEnvironmentSettingsPayload(orgId, record),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.get(
    "/lab-skills-rules-settings",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const record = await getLabSkillsRulesSettings(orgId);
      sendContinuitySuccess(
        res,
        200,
        await labSkillsRulesSettingsPayload(orgId, record, req.authUserId, {
          refreshIfStale: true,
        }),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.get(
    "/lab-skills-rules/content",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const repoRaw = req.query.repo;
      const pathRaw = req.query.path;
      const refRaw = req.query.ref;
      const repo = (Array.isArray(repoRaw) ? repoRaw[0] : repoRaw)?.toString().trim();
      const filePath = (Array.isArray(pathRaw) ? pathRaw[0] : pathRaw)?.toString().trim();
      const ref = (Array.isArray(refRaw) ? refRaw[0] : refRaw)?.toString().trim();
      if (!repo || !filePath) {
        sendContinuityError(
          res,
          400,
          "invalid_query",
          "repo and path query parameters are required",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      try {
        const file = await readSkillsRulesFileContent({
          userId: req.authUserId,
          orgId,
          repoFullName: repo,
          path: filePath,
          ref: ref || undefined,
        });
        sendContinuitySuccess(res, 200, file, continuityMeta(req, startedAt, undefined, orgId));
      } catch (error) {
        sendContinuityError(
          res,
          502,
          "github_read_failed",
          error instanceof Error ? error.message : "Could not read file from GitHub.",
          continuityMeta(req, startedAt, undefined, orgId),
        );
      }
    }),
  );

  router.get(
    "/lab-skills-rules/discover",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const repoRaw = req.query.repo;
      const repo = (Array.isArray(repoRaw) ? repoRaw[0] : repoRaw)?.toString().trim();
      if (!repo) {
        sendContinuityError(
          res,
          400,
          "invalid_query",
          "repo query parameter is required (owner/name)",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const entry = await discoverSkillsRulesInRepo({
        userId: req.authUserId,
        orgId,
        repoFullName: repo,
      });
      const compileResult = await maybeAutoCompileSkillsRules({
        userId: req.authUserId,
        orgId,
        repos: [repo],
      });
      sendContinuitySuccess(
        res,
        200,
        {
          orgId,
          repo: toRepoSkillsRulesSummary(repo, entry),
          compile: compileResult,
        },
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.post(
    "/lab-skills-rules/refresh",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const record = await getLabSkillsRulesSettings(orgId);
      const repos = await refreshSkillsRulesForRepos({
        userId: req.authUserId,
        orgId,
        repos: record.enrolledRepos,
      });
      const compileResult = await maybeAutoCompileSkillsRules({
        userId: req.authUserId,
        orgId,
        repos: record.enrolledRepos,
      });
      sendContinuitySuccess(
        res,
        200,
        {
          orgId,
          repos,
          refreshedAt: new Date().toISOString(),
          compile: compileResult,
        },
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.put(
    "/lab-skills-rules/content",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const body = req.body;
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "Request body must be a JSON object",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const repo = typeof body.repo === "string" ? body.repo.trim() : "";
      const filePath = typeof body.path === "string" ? body.path.trim() : "";
      const content = typeof body.content === "string" ? body.content : "";
      const sha = typeof body.sha === "string" ? body.sha : body.sha === null ? null : undefined;
      const ref = typeof body.ref === "string" ? body.ref.trim() : undefined;
      const message = typeof body.message === "string" ? body.message.trim() : undefined;
      if (!repo || !filePath) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "repo and path are required",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const settings = await getLabSkillsRulesSettings(orgId);
      if (!settings.enrolledRepos.includes(repo)) {
        sendContinuityError(
          res,
          403,
          "repo_not_enrolled",
          `${repo} is not enrolled for skills & rules.`,
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      try {
        const saved = await writeSkillsRulesFileContent({
          userId: req.authUserId,
          orgId,
          repoFullName: repo,
          path: filePath,
          content,
          sha,
          ref,
          message,
        });
        await discoverSkillsRulesInRepo({
          userId: req.authUserId,
          orgId,
          repoFullName: repo,
        });
        const compileResult = await maybeAutoCompileSkillsRules({
          userId: req.authUserId,
          orgId,
          repos: [repo],
        });
        sendContinuitySuccess(
          res,
          200,
          { ...saved, compile: compileResult },
          continuityMeta(req, startedAt, undefined, orgId),
        );
      } catch (error) {
        sendContinuityError(
          res,
          502,
          "github_write_failed",
          error instanceof Error ? error.message : "Could not save file to GitHub.",
          continuityMeta(req, startedAt, undefined, orgId),
        );
      }
    }),
  );

  router.post(
    "/lab-skills-rules/compile",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const body = req.body && typeof req.body === "object" && !Array.isArray(req.body)
        ? (req.body as Record<string, unknown>)
        : {};
      const repo = typeof body.repo === "string" ? body.repo.trim() : undefined;
      const force = body.force === true;
      try {
        const result = await compileSkillsRulesToMemory({
          userId: req.authUserId,
          orgId,
          repoFullName: repo || undefined,
          force,
        });
        sendContinuitySuccess(res, 200, result, continuityMeta(req, startedAt, undefined, orgId));
      } catch (error) {
        sendContinuityError(
          res,
          400,
          "compile_failed",
          error instanceof Error ? error.message : "Could not compile skills and rules.",
          continuityMeta(req, startedAt, undefined, orgId),
        );
      }
    }),
  );

  router.get(
    "/lab-skills-rules/context",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const repoRaw = req.query.repo;
      const repo = (Array.isArray(repoRaw) ? repoRaw[0] : repoRaw)?.toString().trim() || undefined;
      try {
        const context = await buildSkillsRulesContextBlock({
          userId: req.authUserId,
          orgId,
          sessionRepo: repo ?? null,
        });
        sendContinuitySuccess(
          res,
          200,
          { orgId, repo: repo ?? null, context },
          continuityMeta(req, startedAt, undefined, orgId),
        );
      } catch (error) {
        sendContinuityError(
          res,
          502,
          "context_failed",
          error instanceof Error ? error.message : "Could not build skills and rules context.",
          continuityMeta(req, startedAt, undefined, orgId),
        );
      }
    }),
  );

  router.patch(
    "/lab-skills-rules-settings",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const body = req.body;
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "Request body must be a JSON object",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const before = await getLabSkillsRulesSettings(orgId);
      const record = await patchLabSkillsRulesSettings(
        orgId,
        body as Partial<Omit<LabSkillsRulesSettingsRecord, "updatedAt">>,
      );
      const addedRepos = record.enrolledRepos.filter(
        (repo) => !before.enrolledRepos.includes(repo),
      );
      sendContinuitySuccess(
        res,
        200,
        await labSkillsRulesSettingsPayload(orgId, record, req.authUserId, {
          refreshIfStale: true,
          refreshRepos: addedRepos,
        }),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.get(
    "/automations/events",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendMissingLabOrg(res, req, startedAt);
        return;
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();

      let sinks = AUTOMATION_STREAMS.get(orgId);
      if (!sinks) {
        sinks = new Set<ExpressResponse>();
        AUTOMATION_STREAMS.set(orgId, sinks);
      }
      sinks.add(res);

      writeAutomationSse(res, "ready", {
        orgId,
        realtimeStatus: "sse",
        connectedAt: new Date().toISOString(),
      });

      const heartbeat = setInterval(() => {
        try {
          writeAutomationSse(res, "ping", {
            orgId,
            ts: new Date().toISOString(),
          });
        } catch {
          clearInterval(heartbeat);
          sinks?.delete(res);
        }
      }, 15_000);

      res.on("close", () => {
        clearInterval(heartbeat);
        const current = AUTOMATION_STREAMS.get(orgId);
        current?.delete(res);
        if (current && current.size === 0) AUTOMATION_STREAMS.delete(orgId);
      });
    }),
  );

  router.get(
    "/automations",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendMissingLabOrg(res, req, startedAt);
        return;
      }
      const scopeRaw = req.query.scope;
      const scope = Array.isArray(scopeRaw) ? scopeRaw[0] : scopeRaw;
      const automations = await listLabAutomations(
        orgId,
        scope === "mine" ? { createdBy: req.authUserId } : undefined,
      );
      const recentAutomations = await listRecentLabAutomations(orgId);
      sendContinuitySuccess(
        res,
        200,
        labAutomationsListPayload(orgId, automations, recentAutomations, req.authUserId),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.post(
    "/automations",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendMissingLabOrg(res, req, startedAt);
        return;
      }
      const body = requestJsonObject(req);
      if (!body) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "Request body must be a JSON object",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }

      try {
        const automation = await createLabAutomation(
          orgId,
          body as CreateLabAutomationInput,
          req.authUserId,
        );
        await touchRecentLabAutomation(orgId, { id: automation.id, name: automation.name });
        const recentAutomations = await listRecentLabAutomations(orgId);
        await broadcastAutomationEvent(orgId, "automation-upserted", {
          automation,
          recentAutomations,
        });
        sendContinuitySuccess(
          res,
          201,
          labAutomationPayload(orgId, automation),
          continuityMeta(req, startedAt, undefined, orgId),
        );
      } catch {
        sendContinuityError(
          res,
          400,
          "invalid_automation",
          "Automation name is required",
          continuityMeta(req, startedAt, undefined, orgId),
        );
      }
    }),
  );

  router.get(
    "/automations/:automationId",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendMissingLabOrg(res, req, startedAt);
        return;
      }
      const automationId = String(req.params.automationId ?? "").trim();
      const automation = automationId ? await getLabAutomation(orgId, automationId) : null;
      if (!automation) {
        sendContinuityError(
          res,
          404,
          "not_found",
          "Automation not found",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const runs = await listLabAutomationRuns(orgId, automation.id);
      sendContinuitySuccess(
        res,
        200,
        labAutomationPayload(orgId, automation, runs),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.patch(
    "/automations/:automationId",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendMissingLabOrg(res, req, startedAt);
        return;
      }
      const automationId = String(req.params.automationId ?? "").trim();
      const body = requestJsonObject(req);
      if (!body) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "Request body must be a JSON object",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const automation = await patchLabAutomation(
        orgId,
        automationId,
        body as PatchLabAutomationInput,
      );
      if (!automation) {
        sendContinuityError(
          res,
          404,
          "not_found",
          "Automation not found",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const recentAutomations = await touchRecentLabAutomation(orgId, {
        id: automation.id,
        name: automation.name,
      });
      await broadcastAutomationEvent(orgId, "automation-upserted", {
        automation,
        recentAutomations,
      });
      sendContinuitySuccess(
        res,
        200,
        labAutomationPayload(orgId, automation),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.delete(
    "/automations/:automationId",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendMissingLabOrg(res, req, startedAt);
        return;
      }
      const automationId = String(req.params.automationId ?? "").trim();
      const removed = automationId ? await deleteLabAutomation(orgId, automationId) : false;
      if (!removed) {
        sendContinuityError(
          res,
          404,
          "not_found",
          "Automation not found",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const recentAutomations = await listRecentLabAutomations(orgId);
      await broadcastAutomationEvent(orgId, "automation-deleted", {
        automationId,
        recentAutomations,
      });
      sendContinuitySuccess(
        res,
        200,
        { orgId, automationId, deleted: true },
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.post(
    "/automations/:automationId/touch",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendMissingLabOrg(res, req, startedAt);
        return;
      }
      const automationId = String(req.params.automationId ?? "").trim();
      const automation = automationId ? await getLabAutomation(orgId, automationId) : null;
      if (!automation) {
        sendContinuityError(
          res,
          404,
          "not_found",
          "Automation not found",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const recentAutomations = await touchRecentLabAutomation(orgId, {
        id: automation.id,
        name: automation.name,
      });
      await broadcastAutomationEvent(orgId, "automation-recent-updated", {
        automationId: automation.id,
        recentAutomations,
      });
      sendContinuitySuccess(
        res,
        200,
        { orgId, automationId: automation.id, recentAutomations },
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.post(
    "/automations/:automationId/runs",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendMissingLabOrg(res, req, startedAt);
        return;
      }
      const automationId = String(req.params.automationId ?? "").trim();
      const body = requestJsonObject(req) ?? {};
      const run = await createLabAutomationRun(
        orgId,
        automationId,
        req.authUserId,
        body as CreateLabAutomationRunInput,
      );
      if (!run) {
        sendContinuityError(
          res,
          404,
          "not_found",
          "Automation not found",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      await broadcastAutomationEvent(orgId, "automation-run-created", {
        automationId,
        run,
      });
      sendContinuitySuccess(
        res,
        201,
        { orgId, automationId, run },
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.get(
    "/lab-schedules",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const scopeRaw = req.query.scope;
      const scope = Array.isArray(scopeRaw) ? scopeRaw[0] : scopeRaw;
      const schedules = await listLabSchedules(
        orgId,
        scope === "mine" ? { createdBy: req.authUserId } : undefined,
      );
      sendContinuitySuccess(
        res,
        200,
        labSchedulesListPayload(orgId, schedules, req.authUserId),
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.post(
    "/lab-schedules",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const body = req.body;
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "Request body must be a JSON object",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      try {
        const schedule = await createLabSchedule(
          orgId,
          body as CreateLabScheduleInput,
          req.authUserId,
        );
        sendContinuitySuccess(
          res,
          201,
          {
            orgId,
            schedule,
            executionStatus: "persist_only" as const,
            executionNote: LAB_SCHEDULES_EXECUTION_NOTE,
          },
          continuityMeta(req, startedAt, undefined, orgId),
        );
      } catch {
        sendContinuityError(
          res,
          400,
          "invalid_schedule",
          "Schedule name is required",
          continuityMeta(req, startedAt, undefined, orgId),
        );
      }
    }),
  );

  router.patch(
    "/lab-schedules/:scheduleId",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const scheduleId = String(req.params.scheduleId ?? "").trim();
      if (!scheduleId) {
        sendContinuityError(
          res,
          400,
          "invalid_params",
          "scheduleId is required",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const body = req.body;
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "Request body must be a JSON object",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const schedule = await patchLabSchedule(orgId, scheduleId, body as PatchLabScheduleInput);
      if (!schedule) {
        sendContinuityError(
          res,
          404,
          "not_found",
          "Schedule not found",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      sendContinuitySuccess(
        res,
        200,
        {
          orgId,
          schedule,
          executionStatus: "persist_only" as const,
          executionNote: LAB_SCHEDULES_EXECUTION_NOTE,
        },
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.delete(
    "/lab-schedules/:scheduleId",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const scheduleId = String(req.params.scheduleId ?? "").trim();
      if (!scheduleId) {
        sendContinuityError(
          res,
          400,
          "invalid_params",
          "scheduleId is required",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      const removed = await deleteLabSchedule(orgId, scheduleId);
      if (!removed) {
        sendContinuityError(
          res,
          404,
          "not_found",
          "Schedule not found",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      sendContinuitySuccess(
        res,
        200,
        { orgId, scheduleId, deleted: true },
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.get(
    "/lab-schedules/:scheduleId",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const scheduleId = String(req.params.scheduleId ?? "").trim();
      const schedule = scheduleId ? await getLabSchedule(orgId, scheduleId) : null;
      if (!schedule) {
        sendContinuityError(
          res,
          404,
          "not_found",
          "Schedule not found",
          continuityMeta(req, startedAt, undefined, orgId),
        );
        return;
      }
      sendContinuitySuccess(
        res,
        200,
        {
          orgId,
          schedule,
          executionStatus: "persist_only" as const,
          executionNote: LAB_SCHEDULES_EXECUTION_NOTE,
        },
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.get(
    "/review/enrolled-repos",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = resolveLabOrgId(req);
      if (!orgId) {
        sendContinuityError(
          res,
          400,
          "missing_org",
          "Organization context is required (x-memoryos-org-id)",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const record = await getLabReviewSettings(orgId);
      const { updatedAt, ...settings } = record;
      const currentUserId = req.authUserId;
      sendContinuitySuccess(
        res,
        200,
        {
          orgId,
          enrolledRepos: record.enrolledRepos,
          enrolledUsers: record.enrolledUsers,
          settings,
          currentUserId,
          currentUserEnrolled: record.enrolledUsers.some((user) => user.id === currentUserId),
          updatedAt,
          automationStatus: "enrollment_only" as const,
          automationNote:
            "Repo and user enrollment is stored server-side. Batch PR review on GitHub webhooks is not wired yet.",
        },
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.get(
    "/project-state",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const projectId = parseProjectId(req);
      if (!projectId) {
        sendContinuityError(
          res,
          400,
          "invalid_query",
          "projectId query parameter is required",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const scope = continuityScope(req, projectId);
      const data = await getProjectStateSnapshot(scope);
      sendContinuitySuccess(res, 200, data, continuityMeta(req, startedAt, projectId, scope.orgId));
    }),
  );

  router.get(
    "/next-actions",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const projectId = parseProjectId(req);
      if (!projectId) {
        sendContinuityError(
          res,
          400,
          "invalid_query",
          "projectId query parameter is required",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const limitParsed = parseLimit(req, 10, 30);
      if ("error" in limitParsed) {
        sendContinuityError(res, 400, "invalid_query", limitParsed.error, continuityMeta(req, startedAt));
        return;
      }
      const scope = continuityScope(req, projectId);
      const actions = await getRankedNextActions(scope, limitParsed.limit);
      sendContinuitySuccess(
        res,
        200,
        { actions, count: actions.length },
        continuityMeta(req, startedAt, projectId, scope.orgId),
      );
    }),
  );

  router.get(
    "/decision-history",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const projectId = parseProjectId(req);
      if (!projectId) {
        sendContinuityError(
          res,
          400,
          "invalid_query",
          "projectId query parameter is required",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const limitParsed = parseLimit(req, 20, 50);
      if ("error" in limitParsed) {
        sendContinuityError(res, 400, "invalid_query", limitParsed.error, continuityMeta(req, startedAt));
        return;
      }
      const scope = continuityScope(req, projectId);
      const decisions = await getDecisionHistory(scope, limitParsed.limit);
      sendContinuitySuccess(
        res,
        200,
        { decisions, count: decisions.length },
        continuityMeta(req, startedAt, projectId, scope.orgId),
      );
    }),
  );

  router.get(
    "/continuity-score",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const projectId = parseProjectId(req);
      if (!projectId) {
        sendContinuityError(
          res,
          400,
          "invalid_query",
          "projectId query parameter is required",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const scope = continuityScope(req, projectId);
      const score = await getContinuityScore(scope);
      sendContinuitySuccess(res, 200, score, continuityMeta(req, startedAt, projectId, scope.orgId));
    }),
  );

  router.get(
    "/why",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const memoryIdRaw = req.query.memoryId;
      const memoryIdValue = Array.isArray(memoryIdRaw) ? memoryIdRaw[0] : memoryIdRaw;
      const memoryId =
        typeof memoryIdValue === "string" && memoryIdValue.trim().length > 0
          ? memoryIdValue.trim()
          : null;
      if (!memoryId) {
        sendContinuityError(
          res,
          400,
          "invalid_query",
          "memoryId query parameter is required",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const projectId = parseProjectId(req) ?? "default";
      const scope = continuityScope(req, projectId);
      const data = await explainMemoryWhy(scope, memoryId);
      if (!data) {
        sendContinuityError(
          res,
          404,
          "not_found",
          "Memory not found",
          continuityMeta(req, startedAt, scope.projectId, scope.orgId),
        );
        return;
      }
      sendContinuitySuccess(res, 200, data, continuityMeta(req, startedAt, scope.projectId, scope.orgId));
    }),
  );

  router.get(
    "/index-status",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = readOrgIdFromRequest(req) ?? req.authOrgId ?? undefined;
      const fullNameRaw = req.query.fullName;
      const fullNameValue = Array.isArray(fullNameRaw) ? fullNameRaw[0] : fullNameRaw;
      const fullName =
        typeof fullNameValue === "string" && fullNameValue.trim().includes("/")
          ? fullNameValue.trim()
          : null;
      const projectId = parseProjectId(req);

      if (fullName) {
        const entry = await getRepoIndexStatusEntry(req.authUserId, fullName, orgId);
        sendContinuitySuccess(
          res,
          200,
          { repos: [entry], count: 1 },
          continuityMeta(req, startedAt, entry.projectId, orgId),
        );
        return;
      }

      if (projectId) {
        let resolvedFullName: string | null = null;
        try {
          const repos = await listGitHubReposForUser(req.authUserId, 60, orgId);
          resolvedFullName = repoFullNameFromProjectId(projectId, repos);
        } catch {
          resolvedFullName = null;
        }
        if (!resolvedFullName) {
          sendContinuityError(
            res,
            404,
            "not_found",
            "Repository not found for projectId",
            continuityMeta(req, startedAt, projectId, orgId),
          );
          return;
        }
        const entry = await getRepoIndexStatusEntry(req.authUserId, resolvedFullName, orgId);
        sendContinuitySuccess(
          res,
          200,
          { repos: [entry], count: 1 },
          continuityMeta(req, startedAt, projectId, orgId),
        );
        return;
      }

      const repos = await listRepoIndexStatuses(req.authUserId, orgId);
      sendContinuitySuccess(
        res,
        200,
        { repos, count: repos.length },
        continuityMeta(req, startedAt, undefined, orgId),
      );
    }),
  );

  router.get(
    "/index-status/summary",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const orgId = readOrgIdFromRequest(req) ?? req.authOrgId ?? undefined;
      const summary = await summarizeIndexedRepos(req.authUserId, orgId);
      sendContinuitySuccess(res, 200, summary, continuityMeta(req, startedAt, undefined, orgId));
    }),
  );

  router.get(
    "/operational-map",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const projectId = parseProjectId(req);
      if (!projectId) {
        sendContinuityError(
          res,
          400,
          "invalid_query",
          "projectId query parameter is required",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const scope = continuityScope(req, projectId);
      const data = await getOperationalMapSections(scope);
      sendContinuitySuccess(res, 200, data, continuityMeta(req, startedAt, projectId, scope.orgId));
    }),
  );

  router.get(
    "/execution-history",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const projectId = parseProjectId(req);
      if (!projectId) {
        sendContinuityError(
          res,
          400,
          "invalid_query",
          "projectId query parameter is required",
          continuityMeta(req, startedAt),
        );
        return;
      }
      const limitParsed = parseLimit(req, 20, 100);
      if ("error" in limitParsed) {
        sendContinuityError(res, 400, "invalid_query", limitParsed.error, continuityMeta(req, startedAt));
        return;
      }
      const sourceId =
        typeof req.query.sourceId === "string" && req.query.sourceId.trim().length > 0
          ? req.query.sourceId.trim()
          : undefined;
      const scope = continuityScope(req, projectId);
      const data = await getExecutionHistory(scope, limitParsed.limit, sourceId);
      sendContinuitySuccess(res, 200, data, continuityMeta(req, startedAt, projectId, scope.orgId));
    }),
  );

  router.post(
    "/wiki-diagram",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const body = req.body as Record<string, unknown> | undefined;
      const projectId =
        typeof body?.projectId === "string" && body.projectId.trim()
          ? body.projectId.trim()
          : parseProjectId(req);
      if (!projectId) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "projectId is required",
          continuityMeta(req, startedAt),
        );
        return;
      }

      const diagramType = parseWikiDiagramType(body?.diagramType);
      if (!diagramType) {
        sendContinuityError(
          res,
          400,
          "invalid_body",
          "diagramType must be ui_composition, data_flow, architecture, or overview",
          continuityMeta(req, startedAt, projectId),
        );
        return;
      }

      const orgId = readOrgIdFromRequest(req) ?? req.authOrgId ?? undefined;
      try {
        const data = await generateWikiDiagram({
          userId: req.authUserId,
          orgId,
          projectId,
          repoFullName:
            typeof body?.repoFullName === "string" ? body.repoFullName.trim() : undefined,
          branch: typeof body?.branch === "string" ? body.branch.trim() : undefined,
          diagramType,
          refresh: body?.refresh === true,
        });
        sendContinuitySuccess(res, 200, data, continuityMeta(req, startedAt, projectId, orgId));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not generate wiki diagram.";
        const code = message.includes("Company Model") ? "company_model_missing" : "wiki_diagram_failed";
        sendContinuityError(
          res,
          code === "company_model_missing" ? 503 : 502,
          code,
          message,
          continuityMeta(req, startedAt, projectId, orgId),
        );
      }
    }),
  );

  router.get(
    "/wiki-diagram",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const projectId = parseProjectId(req);
      if (!projectId) {
        sendContinuityError(
          res,
          400,
          "invalid_query",
          "projectId query parameter is required",
          continuityMeta(req, startedAt),
        );
        return;
      }

      const diagramType = parseWikiDiagramType(req.query.diagramType);
      if (!diagramType) {
        sendContinuityError(
          res,
          400,
          "invalid_query",
          "diagramType must be ui_composition, data_flow, architecture, or overview",
          continuityMeta(req, startedAt, projectId),
        );
        return;
      }

      const orgId = readOrgIdFromRequest(req) ?? req.authOrgId ?? undefined;
      const refresh = req.query.refresh === "1" || req.query.refresh === "true";
      const repoFullName =
        typeof req.query.repoFullName === "string" ? req.query.repoFullName.trim() : undefined;
      const branch = typeof req.query.branch === "string" ? req.query.branch.trim() : undefined;

      try {
        const data = await generateWikiDiagram({
          userId: req.authUserId,
          orgId,
          projectId,
          repoFullName,
          branch,
          diagramType,
          refresh,
        });
        sendContinuitySuccess(res, 200, data, continuityMeta(req, startedAt, projectId, orgId));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not generate wiki diagram.";
        const code = message.includes("Company Model") ? "company_model_missing" : "wiki_diagram_failed";
        sendContinuityError(
          res,
          code === "company_model_missing" ? 503 : 502,
          code,
          message,
          continuityMeta(req, startedAt, projectId, orgId),
        );
      }
    }),
  );
}
