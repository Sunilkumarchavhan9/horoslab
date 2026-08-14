"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createEpochInstitution,
  createEpochMission,
  getEpochMission,
  listEpochInstitutions,
  listEpochMissions,
  listEpochTemplates,
  readActiveEpochWorkspaceId,
  resolveActiveEpochWorkspaceId,
  runEpochMission,
  decideEpochMissionCandidates,
  sendEpochMissionTelemetry,
  verifyEpochMissionWindow,
  type EpochInstitution,
  type EpochMissionDetail,
  type EpochMissionRunResult,
  type EpochTemplate,
} from "@/lib/epoch-api";
import {
  formatRelativeTime,
  missionPlanner,
  missionProgress,
  missionRisk,
  type MissionRow,
} from "../../../components/mission-control/missions/active/types";

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

function formatDate(value?: string | null): string {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString();
}

function formatDuration(startedAt?: string | null, completedAt?: string | null): string {
  if (!startedAt || !completedAt) return "Pending";
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return "Pending";
  const totalSeconds = Math.max(0, Math.round((end - start) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

export type MissionTemplateCard = {
  id: string;
  title: string;
  category: string;
  objective: string;
  runtime: string;
  roles: string[];
  policies: string[];
  authority: string;
  template: EpochTemplate;
};

export type MissionHistoryCard = {
  id: string;
  missionName: string;
  institution: string;
  owner: string;
  date: string;
  duration: string;
  status: "PASS" | "FAIL";
  nodes: { label: string; time: string; status: "success" | "error" | "pending" }[];
  mission: EpochMissionDetail;
};

export function buildMissionRow(mission: EpochMissionDetail): MissionRow {
  const planner = mission.executionRun?.planner as
    | {
        planner?: unknown;
        plan?: unknown;
      }
    | undefined;
  const planSteps = Array.isArray(planner?.plan) ? planner.plan.length : 0;
  const evidenceCount = Array.isArray(mission.evidence) ? mission.evidence.length : 0;

  return {
    id: mission.id,
    name: mission.title ?? mission.objective ?? "Untitled mission",
    institution: mission.institution?.name ?? "Unknown institution",
    planner: missionPlanner(mission),
    status: (mission.state ?? "draft").toLowerCase(),
    risk: missionRisk(mission),
    progress: missionProgress(mission),
    started: formatRelativeTime(mission.startedAt ?? mission.updatedAt),
    workers: planSteps > 0 ? planSteps : mission.executionRun ? 1 : 0,
    evidence: evidenceCount,
    executionStatus: mission.executionRun?.status ?? (mission.state === "running" ? "running" : "idle"),
    verificationDecision: mission.verificationRun?.finalDecision ?? (mission.state === "completed" ? "PASS" : mission.state === "failed" ? "FAIL" : "pending"),
  };
}

export function buildMissionTemplateCard(template: EpochTemplate): MissionTemplateCard {
  const definition = (template.definition ?? {}) as Record<string, unknown>;
  const category = template.category ?? "General";
  const runtime = firstString(definition.runtime, template.version ? `v${template.version}` : null) ?? "Live";
  const roles = asStringArray(definition.roles ?? definition.agents ?? definition.requiredRoles);
  const policies = asStringArray(definition.policies ?? definition.checks ?? definition.rules);
  const authority = firstString(definition.authority, template.proof && typeof template.proof === "object" ? (template.proof as Record<string, unknown>).authority : null) ?? "Epoch Planner";

  return {
    id: template.id,
    title: template.name,
    category,
    objective: template.description ?? "",
    runtime,
    roles,
    policies,
    authority,
    template,
  };
}

export function buildMissionHistoryCard(mission: EpochMissionDetail): MissionHistoryCard | null {
  const status = (mission.verificationRun?.finalDecision ?? "").toUpperCase();
  const finalStatus: "PASS" | "FAIL" | null =
    status === "PASS" ? "PASS" : status === "FAIL" ? "FAIL" : mission.state === "completed" ? "PASS" : mission.state === "failed" ? "FAIL" : null;

  if (!finalStatus) return null;

  const events = Array.isArray(mission.timeline) ? mission.timeline : [];
  const fallbackStatus: "success" | "error" = finalStatus === "PASS" ? "success" : "error";
  const nodes =
    events.length > 0
      ? events.map((event, index) => {
          const normalizedStatus = (event.status ?? "").toLowerCase();
          const status: "success" | "error" | "pending" =
            normalizedStatus === "completed" || normalizedStatus === "issued"
              ? "success"
              : normalizedStatus === "blocked" || normalizedStatus === "failed"
                ? "error"
                : "pending";

          return {
            label: event.note ?? event.stage ?? `Step ${index + 1}`,
            time: event.timestamp ? new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Unknown",
            status,
          };
        })
      : [
          {
            label: mission.state === "completed" ? "Mission completed" : "Mission failed",
            time: formatDate(mission.completedAt ?? mission.updatedAt),
            status: fallbackStatus,
          },
        ];

  return {
    id: mission.id,
    missionName: mission.title ?? mission.objective ?? "Untitled mission",
    institution: mission.institution?.name ?? "Unknown institution",
    owner: missionPlanner(mission),
    date: formatDate(mission.completedAt ?? mission.updatedAt),
    duration: formatDuration(mission.startedAt ?? mission.executionRun?.startedAt ?? null, mission.completedAt ?? mission.executionRun?.finishedAt ?? null),
    status: finalStatus,
    nodes,
    mission,
  };
}

export function useMissionRuntimeData() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(() => readActiveEpochWorkspaceId());
  const [missions, setMissions] = useState<EpochMissionDetail[]>([]);
  const [institutions, setInstitutions] = useState<EpochInstitution[]>([]);
  const [templates, setTemplates] = useState<EpochTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const syncWorkspace = () => {
      const cachedWorkspaceId = readActiveEpochWorkspaceId();
      if (cachedWorkspaceId) {
        setWorkspaceId(cachedWorkspaceId);
        return;
      }

      void resolveActiveEpochWorkspaceId()
        .then(setWorkspaceId)
        .catch(() => setWorkspaceId(null));
    };
    window.addEventListener("focus", syncWorkspace);
    syncWorkspace();
    return () => window.removeEventListener("focus", syncWorkspace);
  }, []);

  const refresh = useCallback(async () => {
    if (!workspaceId) {
      setError("No active Epoch workspace is available.");
      setMissions([]);
      setInstitutions([]);
      setTemplates([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [missionRows, institutionRows] = await Promise.all([
        listEpochMissions(workspaceId),
        listEpochInstitutions(workspaceId),
      ]);
      setMissions(missionRows);
      setInstitutions(institutionRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Mission runtime data.");
    } finally {
      setLoading(false);
    }

    try {
      const templateRows = await listEpochTemplates(workspaceId).catch(() => []);
      setTemplates(templateRows);
    } catch {
      setTemplates([]);
    }
  }, [workspaceId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const missionRows = useMemo(() => missions.map(buildMissionRow), [missions]);
  const templateCards = useMemo(() => templates.map(buildMissionTemplateCard), [templates]);
  const historyCards = useMemo(() => missions.map(buildMissionHistoryCard).filter((item): item is MissionHistoryCard => Boolean(item)), [missions]);

  const createMission = useCallback(
    async (input: {
      institutionId: string;
      title: string;
      objective: string;
      budgetCents?: number;
      deadlineAt?: string;
      plan?: string[];
      authority?: Record<string, unknown>;
      proof?: Record<string, unknown>;
    }) => {
      if (!workspaceId) {
        throw new Error("No active Epoch workspace is available.");
      }
      const mission = await createEpochMission(workspaceId, input);
      await refresh();
      return mission;
    },
    [refresh, workspaceId],
  );

  const ensureSoftwareReleaseInstitution = useCallback(async () => {
    const existing = institutions[0];
    if (existing) return existing;
    if (!workspaceId) {
      throw new Error("No active Epoch workspace is available.");
    }

    const created = await createEpochInstitution(workspaceId, {
      name: "Software Release",
      category: "Engineering",
      version: "1.0",
      summary: "Plans, executes, verifies, settles, and learns from software releases.",
      metadata: { source: "mission-runtime", workflow: "software-release" },
      proof: { createdBy: "user-action" },
    });
    setInstitutions((current) => current.some((item) => item.id === created.id) ? current : [created, ...current]);
    return created;
  }, [institutions, workspaceId]);

  const executeMission = useCallback(
    async (
      missionId: string,
      input?: {
        evidence?: Array<{
          kind: string;
          url?: string;
          filePath?: string;
          contentType?: string;
          summary?: string;
          payload?: Record<string, unknown>;
          proof?: Record<string, unknown>;
        }>;
        checklist?: string[];
        humanApproval?: "approved" | "rejected" | "review";
        confidence?: number;
        output?: Record<string, unknown>;
        approvals?: string[];
        notes?: string;
      },
    ): Promise<EpochMissionRunResult> => {
      if (!workspaceId) {
        throw new Error("No active Epoch workspace is available.");
      }
      const result = await runEpochMission(workspaceId, missionId, input);
      await refresh();
      return result;
    },
    [refresh, workspaceId],
  );

  const getMission = useCallback(
    async (missionId: string) => {
      if (!workspaceId) return null;
      return getEpochMission(workspaceId, missionId);
    },
    [workspaceId],
  );

  const decideMission = useCallback(async (missionId: string, input: { evaluations: Array<Record<string, unknown>>; objectives?: Array<{ metric: string; direction: "minimize" | "maximize"; weight: number }> }) => {
    if (!workspaceId) throw new Error("No active Epoch workspace is available.");
    const decision = await decideEpochMissionCandidates(workspaceId, missionId, input);
    await refresh();
    return decision;
  }, [refresh, workspaceId]);

  const sendMissionTelemetry = useCallback(async (missionId: string, input: { workerId: string; measurements: Record<string, number>; evidenceIds?: string[]; observedAt?: string }) => {
    if (!workspaceId) throw new Error("No active Epoch workspace is available.");
    return sendEpochMissionTelemetry(workspaceId, missionId, input);
  }, [workspaceId]);

  const verifyMissionWindow = useCallback(async (missionId: string, input: { measurements: Record<string, number>; constraints: Array<Record<string, unknown>>; evidenceIds: string[]; requiredWindowSeconds: number; observedWindowSeconds: number }) => {
    if (!workspaceId) throw new Error("No active Epoch workspace is available.");
    const result = await verifyEpochMissionWindow(workspaceId, missionId, input);
    await refresh();
    return result;
  }, [refresh, workspaceId]);

  return {
    workspaceId,
    loading,
    error,
    missions,
    missionRows,
    institutions,
    templates,
    templateCards,
    historyCards,
    refresh,
    ensureSoftwareReleaseInstitution,
    createMission,
    executeMission,
    getMission,
    decideMission,
    sendMissionTelemetry,
    verifyMissionWindow,
  };
}
