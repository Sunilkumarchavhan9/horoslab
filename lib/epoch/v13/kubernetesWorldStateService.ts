import { execFile } from "child_process";
import { promisify } from "util";
import { prisma } from "../../storage/prismaClient";
import { toWorldStateV1 } from "./controlPlane";
import { resolveSoftwareWorldStateScope, type WorldStateScope, WorldStateBoundaryError } from "./softwareWorldStateService";

const execFileAsync = promisify(execFile);
type KubernetesInput = { projectId: string; environmentId: string; contextEnvVar?: string };

function contextArgs(contextEnvVar?: string) {
  if (!contextEnvVar) return [];
  if (!/^EPOCH_V13_KUBERNETES_CONTEXT_[A-Z0-9_]+$/.test(contextEnvVar)) {
    throw new WorldStateBoundaryError("Kubernetes context must use an EPOCH_V13_KUBERNETES_CONTEXT_* environment variable");
  }
  const context = process.env[contextEnvVar]?.trim();
  if (!context) throw new WorldStateBoundaryError(`Kubernetes context variable ${contextEnvVar} is not configured`);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/.test(context)) {
    throw new WorldStateBoundaryError("Kubernetes context contains unsupported characters");
  }
  return ["--context", context];
}

async function kubectl(args: string[]) {
  try {
    const result = await execFileAsync("kubectl", args, { timeout: 15_000, maxBuffer: 4 * 1024 * 1024, windowsHide: true });
    return result.stdout.trim();
  } catch (error) {
    const message = error instanceof Error ? error.message : "kubectl command failed";
    throw new WorldStateBoundaryError(`Kubernetes discovery unavailable: ${message.slice(0, 500)}`);
  }
}

function parseJson(value: string) {
  try { return JSON.parse(value) as Record<string, unknown>; } catch { return { raw: value.slice(0, 2000) }; }
}

function summaries(value: string) {
  const document = parseJson(value);
  const items = Array.isArray(document.items) ? document.items : [];
  return items.slice(0, 500).map((item) => {
    const record = item as Record<string, any>;
    return {
      name: record.metadata?.name ?? null,
      namespace: record.metadata?.namespace ?? null,
      labels: record.metadata?.labels ?? {},
      resourceVersion: record.metadata?.resourceVersion ?? null,
      phase: record.status?.phase ?? null,
      readyReplicas: record.status?.readyReplicas ?? null,
      replicas: record.spec?.replicas ?? null,
      type: record.spec?.type ?? null,
    };
  });
}

export async function discoverEpochKubernetesWorldState(scope: WorldStateScope, input: KubernetesInput) {
  await resolveSoftwareWorldStateScope(scope, input.projectId, input.environmentId);
  const context = contextArgs(input.contextEnvVar);
  const [versionRaw, nodesRaw, podsRaw, deploymentsRaw, servicesRaw] = await Promise.all([
    kubectl([...context, "version", "-o", "json"]),
    kubectl([...context, "get", "nodes", "-o", "json"]),
    kubectl([...context, "get", "pods", "--all-namespaces", "-o", "json"]),
    kubectl([...context, "get", "deployments", "--all-namespaces", "-o", "json"]),
    kubectl([...context, "get", "services", "--all-namespaces", "-o", "json"]),
  ]);
  const observedAt = new Date();
  const snapshot = {
    adapter: "kubernetes",
    version: parseJson(versionRaw),
    nodes: summaries(nodesRaw),
    pods: summaries(podsRaw),
    deployments: summaries(deploymentsRaw),
    services: summaries(servicesRaw),
    capturedAt: observedAt.toISOString(),
  };
  const source = await prisma.epochIntegrationConnection.findFirst({
    where: { workspaceId: scope.workspaceId, environmentId: input.environmentId, provider: { in: ["kubernetes", "k8s"] }, status: { in: ["connected", "syncing", "error"] } },
    select: { id: true },
  });
  const latest = await prisma.epochWorldState.findFirst({ where: { workspaceId: scope.workspaceId, projectId: input.projectId, environmentId: input.environmentId }, orderBy: { version: "desc" }, select: { version: true } });
  const record = await prisma.epochWorldState.create({
    data: { workspaceId: scope.workspaceId, projectId: input.projectId, environmentId: input.environmentId, version: (latest?.version ?? 0) + 1, snapshot: JSON.parse(JSON.stringify(snapshot)), sourceIds: source ? [source.id] : [], freshness: "fresh", correlationId: scope.correlationId, traceId: scope.traceId, observedAt },
  });
  return toWorldStateV1({ id: record.id, workspaceId: record.workspaceId, environment: "software", version: record.version, snapshot, sourceIds: source ? [source.id] : [], freshness: "fresh", observedAt: record.observedAt, createdAt: record.createdAt, updatedAt: record.updatedAt, correlation: { correlationId: scope.correlationId, traceId: scope.traceId } });
}
