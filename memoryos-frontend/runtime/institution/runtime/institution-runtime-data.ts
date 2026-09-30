"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getDhyraInstitution,
  listDhyraInstitutions,
  readActiveDhyraWorkspaceId,
  type DhyraInstitution,
  type DhyraInstitutionDetail,
  type DhyraInstitutionVersion,
  type DhyraMemoryRecordDetail,
  type DhyraMission,
} from "@/lib/dhyra-api";
import { useInstitutionStore } from "../store";

export type InstitutionCapability = {
  id: string;
  name: string;
  description: string;
  type: string;
  status: "active" | "degraded" | "offline";
};

export type InstitutionDependency = {
  id: string;
  name: string;
  type: string;
  status: "healthy" | "at_risk";
};

export type GenomeTrait = {
  id: string;
  category: string;
  name: string;
  description: string;
  value: string;
};

export type GovernancePolicy = {
  id: string;
  name: string;
  scope: string;
  rules: string[];
  verification: string;
  affectedAgents: number;
  evidenceCount: number;
};

export type HierarchyNode = {
  id: string;
  name: string;
  type: "Business Unit" | "Department" | "Team" | "Agent Pool" | "Mission";
  status: "healthy" | "at_risk";
  children?: HierarchyNode[];
};

export type InstitutionIdentity = {
  name: string;
  version: string;
  mission: string;
  purpose: string;
  owners: string[];
  capabilities: InstitutionCapability[];
  dependencies: InstitutionDependency[];
};

export type InstitutionIntegration = NonNullable<DhyraInstitutionDetail["integrations"]>[number];

function formatCountLabel(value: number, label: string): string {
  return `${value} ${label}${value === 1 ? "" : "s"}`;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return null;
}

function getInstitutionSummary(institution: DhyraInstitutionDetail | DhyraInstitution): string {
  return firstString(institution.summary, institution.template?.name, institution.status) ?? "Live institution record";
}

function deriveOwners(institution: DhyraInstitutionDetail): string[] {
  const metadata = institution.metadata && typeof institution.metadata === "object" ? institution.metadata : null;
  const owners = metadata && Array.isArray((metadata as Record<string, unknown>).owners)
    ? ((metadata as Record<string, unknown>).owners as unknown[]).filter((owner): owner is string => typeof owner === "string" && owner.trim().length > 0)
    : [];
  if (owners.length > 0) return owners;
  return institution.integrations?.slice(0, 2).map((integration) => integration.provider ?? integration.id) ?? [];
}

function deriveCapabilities(institution: DhyraInstitutionDetail, missions: DhyraMission[], integrations: InstitutionIntegration[], memoryRecords: DhyraMemoryRecordDetail[]): InstitutionCapability[] {
  return [
    {
      id: "cap-missions",
      name: "Mission Coverage",
      description: `${formatCountLabel(missions.length, "live mission")} attached to this institution.`,
      type: "runtime capability",
      status: missions.length > 0 ? "active" : "degraded",
    },
    {
      id: "cap-integrations",
      name: "Connector Coverage",
      description: `${formatCountLabel(integrations.length, "connected integration")} feeding live data.`,
      type: "integration capability",
      status: integrations.length > 0 ? "active" : "degraded",
    },
    {
      id: "cap-memory",
      name: "Memory Retention",
      description: `${formatCountLabel(memoryRecords.length, "memory record")} is available for traceability.`,
      type: "memory capability",
      status: memoryRecords.length > 0 ? "active" : "degraded",
    },
    {
      id: "cap-policy",
      name: "Policy Enforcement",
      description: `${formatCountLabel(institution.authorityPolicies?.length ?? 0, "authority policy")} governs this institution.`,
      type: "governance capability",
      status: (institution.authorityPolicies?.length ?? 0) > 0 ? "active" : "degraded",
    },
  ];
}

function deriveDependencies(integrations: InstitutionIntegration[], versions: DhyraInstitutionVersion[]): InstitutionDependency[] {
  const dependencies: InstitutionDependency[] = integrations.map((integration) => ({
    id: integration.id,
    name: integration.provider ?? integration.id ?? "Integration",
    type: integration.provider ?? "integration",
    status: integration.status === "failed" || integration.status === "error" ? "at_risk" : "healthy",
  }));

  if (versions.length > 0) {
    dependencies.unshift({
      id: "dep-version-lineage",
      name: "Version Lineage",
      type: "institution history",
      status: "healthy",
    });
  }

  return dependencies;
}

function deriveGenome(institution: DhyraInstitutionDetail, versions: DhyraInstitutionVersion[], missions: DhyraMission[], integrations: InstitutionIntegration[], memoryRecords: DhyraMemoryRecordDetail[]): GenomeTrait[] {
  const templateName = institution.template?.name ?? "Unknown template";
  const latestVersion = versions[0]?.version ?? institution.version ?? "n/a";
  return [
    { id: "trait-core-name", category: "Core", name: "Name", value: institution.name, description: "The live institution name resolved from the backend." },
    { id: "trait-core-version", category: "Core", name: "Version", value: latestVersion, description: "The latest recorded version in the institution lineage." },
    { id: "trait-behavior-status", category: "Behavior", name: "Status", value: institution.status ?? "unknown", description: "The current backend status for this institution." },
    { id: "trait-behavior-mission", category: "Behavior", name: "Mission Coverage", value: String(missions.length), description: "How many missions are currently attached to this institution." },
    { id: "trait-operations-integrations", category: "Operations", name: "Integrations", value: String(integrations.length), description: "Connected live sources backing the institution." },
    { id: "trait-operations-memory", category: "Operations", name: "Memory Records", value: String(memoryRecords.length), description: "Recorded history available for traceability." },
    { id: "trait-cognition-template", category: "Cognition", name: "Template", value: templateName, description: "The active template used to shape this institution." },
    { id: "trait-cognition-summary", category: "Cognition", name: "Summary", value: getInstitutionSummary(institution), description: "A live summary built from the backend institution record." },
  ];
}

function derivePolicies(institution: DhyraInstitutionDetail): GovernancePolicy[] {
  return (institution.authorityPolicies ?? []).map((policy, index) => ({
    id: policy.id,
    name: policy.name ?? `Policy ${index + 1}`,
    scope: institution.name,
    rules: [
      ...(policy.permissions ?? []).map((permission) => `Permission: ${permission}`),
      ...(policy.checks ?? []).map((check) => `Check: ${check}`),
    ].filter((rule) => rule.trim().length > 0),
    verification: policy.canExecute ? "Backend Approval" : policy.needsApproval ? "Human Review" : "Live Guardrail",
    affectedAgents: policy.permissions?.length ?? 0,
    evidenceCount: policy.checks?.length ?? 0,
  }));
}

function buildHierarchy(
  institution: DhyraInstitutionDetail,
  versions: DhyraInstitutionVersion[],
  missions: DhyraMission[],
  integrations: InstitutionIntegration[],
  memoryRecords: DhyraMemoryRecordDetail[],
): HierarchyNode {
  return {
    id: institution.id,
    name: institution.name,
    type: "Business Unit",
    status: institution.status === "archived" ? "at_risk" : "healthy",
    children: [
      {
        id: "hierarchy-template",
        name: institution.template?.name ?? "Institution Template",
        type: "Department",
        status: "healthy",
        children: versions.slice(0, 8).map((version) => ({
          id: version.id,
          name: version.version ?? "Version",
          type: "Mission",
          status: "healthy",
        })),
      },
      {
        id: "hierarchy-missions",
        name: "Missions",
        type: "Department",
        status: missions.length > 0 ? "healthy" : "at_risk",
        children: missions.slice(0, 8).map((mission) => ({
          id: mission.id,
          name: mission.title ?? mission.objective ?? "Mission",
          type: "Mission",
          status: mission.state === "failed" ? "at_risk" : "healthy",
        })),
      },
      {
        id: "hierarchy-integrations",
        name: "Integrations",
        type: "Department",
        status: integrations.length > 0 ? "healthy" : "at_risk",
        children: integrations.slice(0, 8).map((integration) => ({
          id: integration.id,
          name: integration.provider ?? integration.id ?? "Integration",
          type: "Agent Pool",
          status: integration.status === "failed" || integration.status === "error" ? "at_risk" : "healthy",
        })),
      },
      {
        id: "hierarchy-memory",
        name: "Memory",
        type: "Department",
        status: memoryRecords.length > 0 ? "healthy" : "at_risk",
        children: memoryRecords.slice(0, 8).map((record) => ({
          id: record.id,
          name: record.summary ?? record.id,
          type: "Agent Pool",
          status: record.status === "failed" ? "at_risk" : "healthy",
        })),
      },
    ],
  };
}

export function useInstitutionRuntimeData() {
  const { selectedEntity, selectEntity } = useInstitutionStore();
  const [workspaceId, setWorkspaceId] = useState<string | null>(() => readActiveDhyraWorkspaceId());
  const [institutions, setInstitutions] = useState<DhyraInstitution[]>([]);
  const [institution, setInstitution] = useState<DhyraInstitutionDetail | null>(null);
  const [versions, setVersions] = useState<DhyraInstitutionVersion[]>([]);
  const [missions, setMissions] = useState<DhyraMission[]>([]);
  const [integrations, setIntegrations] = useState<InstitutionIntegration[]>([]);
  const [memoryRecords, setMemoryRecords] = useState<DhyraMemoryRecordDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const syncWorkspace = () => setWorkspaceId(readActiveDhyraWorkspaceId());
    window.addEventListener("focus", syncWorkspace);
    syncWorkspace();
    return () => window.removeEventListener("focus", syncWorkspace);
  }, []);

  const refresh = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false);
      setError("No active Dhyra workspace is available.");
      setInstitutions([]);
      setInstitution(null);
      setVersions([]);
      setMissions([]);
      setIntegrations([]);
      setMemoryRecords([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const liveInstitutions = await listDhyraInstitutions(workspaceId);
      setInstitutions(liveInstitutions);

      const activeInstitutionId = liveInstitutions[0]?.id ?? null;
      if (!activeInstitutionId) {
        setInstitution(null);
        setVersions([]);
        setMissions([]);
        setIntegrations([]);
        setMemoryRecords([]);
        return;
      }

      const detail = await getDhyraInstitution(workspaceId, activeInstitutionId);
      setInstitution(detail);
      setVersions(detail.versions ?? []);
      setMissions(detail.missions ?? []);
      setIntegrations(detail.integrations ?? []);
      setMemoryRecords(detail.memoryRecords ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load institution runtime data.");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const identity = useMemo<InstitutionIdentity>(() => {
    if (!institution) {
      return {
        name: "No institution selected",
        version: "n/a",
        mission: "Create an institution to see live backend data.",
        purpose: "Institution runtime data will appear here when a workspace has an institution.",
        owners: [],
        capabilities: [],
        dependencies: [],
      };
    }

    const latestVersion = versions[0]?.version ?? institution.version ?? "n/a";
    const missionsLabel = formatCountLabel(missions.length, "mission");
    const integrationsLabel = formatCountLabel(integrations.length, "integration");
    const recordsLabel = formatCountLabel(memoryRecords.length, "memory record");

    return {
      name: institution.name,
      version: latestVersion,
      mission: institution.summary ?? "Live institutional summary from the backend.",
      purpose: institution.template?.name ?? "Backend-backed institution record",
      owners: deriveOwners(institution),
      capabilities: deriveCapabilities(institution, missions, integrations, memoryRecords).map((capability) => ({
        ...capability,
        description:
          capability.id === "cap-missions"
            ? `${missionsLabel} attached to this institution.`
            : capability.id === "cap-integrations"
              ? `${integrationsLabel} feeding live data.`
              : capability.id === "cap-memory"
                ? `${recordsLabel} is available for traceability.`
                : capability.description,
      })),
      dependencies: deriveDependencies(integrations, versions),
    };
  }, [institution, integrations, memoryRecords, missions, versions]);

  const genome = useMemo(() => (institution ? deriveGenome(institution, versions, missions, integrations, memoryRecords) : []), [institution, integrations, memoryRecords, missions, versions]);
  const governance = useMemo(() => (institution ? derivePolicies(institution) : []), [institution]);
  const hierarchy = useMemo(() => (institution ? buildHierarchy(institution, versions, missions, integrations, memoryRecords) : null), [institution, integrations, memoryRecords, missions, versions]);

  const selectedItem = useMemo(() => {
    if (!selectedEntity) return null;
    return (
      identity.capabilities.find((item) => item.id === selectedEntity) ??
      identity.dependencies.find((item) => item.id === selectedEntity) ??
      genome.find((item) => item.id === selectedEntity) ??
      governance.find((item) => item.id === selectedEntity) ??
      (function findNode(node: HierarchyNode | null): HierarchyNode | null {
        if (!node) return null;
        if (node.id === selectedEntity) return node;
        for (const child of node.children ?? []) {
          const found = findNode(child);
          if (found) return found;
        }
        return null;
      })(hierarchy)
    );
  }, [governance, genome, hierarchy, identity.capabilities, identity.dependencies, selectedEntity]);

  return {
    workspaceId,
    loading,
    error,
    institutions,
    institution,
    versions,
    missions,
    integrations,
    memoryRecords,
    identity,
    genome,
    governance,
    hierarchy,
    selectedEntity,
    selectedItem,
    selectEntity,
    refresh,
  };
}
