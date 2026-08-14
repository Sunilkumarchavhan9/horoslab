import { execFile } from "child_process";
import { promisify } from "util";
import { prisma } from "../../storage/prismaClient";
import { toWorldStateV1 } from "./controlPlane";
import { resolveSoftwareWorldStateScope, type WorldStateScope, WorldStateBoundaryError } from "./softwareWorldStateService";

const execFileAsync = promisify(execFile);

type DockerInput = { projectId: string; environmentId: string; contextEnvVar?: string };

function contextArgs(contextEnvVar?: string) {
  if (!contextEnvVar) return [];
  if (!/^EPOCH_V13_DOCKER_CONTEXT_[A-Z0-9_]+$/.test(contextEnvVar)) {
    throw new WorldStateBoundaryError("Docker context must use an EPOCH_V13_DOCKER_CONTEXT_* environment variable");
  }
  const context = process.env[contextEnvVar]?.trim();
  if (!context) throw new WorldStateBoundaryError(`Docker context variable ${contextEnvVar} is not configured`);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/.test(context)) {
    throw new WorldStateBoundaryError("Docker context contains unsupported characters");
  }
  return ["--context", context];
}

async function docker(args: string[]) {
  try {
    const result = await execFileAsync("docker", args, { timeout: 10_000, maxBuffer: 2 * 1024 * 1024, windowsHide: true });
    return result.stdout.trim();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Docker command failed";
    throw new WorldStateBoundaryError(`Docker discovery unavailable: ${message.slice(0, 500)}`);
  }
}

function parseJsonLines(value: string) {
  return value.split(/\r?\n/).filter(Boolean).slice(0, 500).map((line) => {
    try { return JSON.parse(line) as Record<string, unknown>; } catch { return { raw: line.slice(0, 500) }; }
  });
}

export async function discoverEpochDockerWorldState(scope: WorldStateScope, input: DockerInput) {
  await resolveSoftwareWorldStateScope(scope, input.projectId, input.environmentId);
  const context = contextArgs(input.contextEnvVar);
  const [versionRaw, infoRaw, containersRaw, imagesRaw] = await Promise.all([
    docker([...context, "version", "--format", "{{json .}}"]),
    docker([...context, "info", "--format", "{{json .}}"]),
    docker([...context, "ps", "-a", "--format", "{{json .}}"]),
    docker([...context, "images", "--format", "{{json .}}"]),
  ]);
  const observedAt = new Date();
  const parseObject = (value: string) => {
    try { return JSON.parse(value) as Record<string, unknown>; } catch { return { raw: value.slice(0, 2000) }; }
  };
  const snapshot = {
    adapter: "docker",
    version: parseObject(versionRaw),
    info: parseObject(infoRaw),
    containers: parseJsonLines(containersRaw),
    images: parseJsonLines(imagesRaw),
    capturedAt: observedAt.toISOString(),
  };
  const source = await prisma.epochIntegrationConnection.findFirst({
    where: { workspaceId: scope.workspaceId, environmentId: input.environmentId, provider: { in: ["docker", "container"] }, status: { in: ["connected", "syncing", "error"] } },
    select: { id: true },
  });
  const latest = await prisma.epochWorldState.findFirst({
    where: { workspaceId: scope.workspaceId, projectId: input.projectId, environmentId: input.environmentId },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  const record = await prisma.epochWorldState.create({
    data: {
      workspaceId: scope.workspaceId,
      projectId: input.projectId,
      environmentId: input.environmentId,
      version: (latest?.version ?? 0) + 1,
      snapshot: JSON.parse(JSON.stringify(snapshot)),
      sourceIds: source ? [source.id] : [],
      freshness: "fresh",
      correlationId: scope.correlationId,
      traceId: scope.traceId,
      observedAt,
    },
  });
  return toWorldStateV1({
    id: record.id,
    workspaceId: record.workspaceId,
    environment: "software",
    version: record.version,
    snapshot,
    sourceIds: source ? [source.id] : [],
    freshness: "fresh",
    observedAt: record.observedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    correlation: { correlationId: scope.correlationId, traceId: scope.traceId },
  });
}
