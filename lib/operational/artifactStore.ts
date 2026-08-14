import { randomUUID } from "crypto";
import { prisma } from "../storage/prismaClient";

export type OperationalArtifactRecord<T = unknown> = {
  id: string;
  kind: string;
  scope: string;
  name: string;
  status: string;
  data: T;
  createdAt: string;
  updatedAt: string;
};

function parseData<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function toRecord<T>(row: {
  id: string;
  kind: string;
  scope: string;
  name: string;
  status: string;
  dataJson: string;
  createdAt: string;
  updatedAt: string;
}): OperationalArtifactRecord<T> | null {
  const data = parseData<T>(row.dataJson);
  if (data === null) return null;
  return {
    id: row.id,
    kind: row.kind,
    scope: row.scope,
    name: row.name,
    status: row.status,
    data,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function saveOperationalArtifact<T>(input: {
  kind: string;
  name: string;
  data: T;
  status?: string;
  scope?: string | null;
  id?: string;
  now?: string;
}): Promise<OperationalArtifactRecord<T>> {
  const now = input.now ?? new Date().toISOString();
  const scope = input.scope?.trim() ?? "";
  const status = input.status ?? "recorded";
  const row = await prisma.operationalArtifact.upsert({
    where: {
      kind_scope_name: {
        kind: input.kind,
        scope,
        name: input.name,
      },
    },
    create: {
      id: input.id ?? `artifact_${randomUUID()}`,
      kind: input.kind,
      scope,
      name: input.name,
      status,
      dataJson: JSON.stringify(input.data),
      createdAt: now,
      updatedAt: now,
    },
    update: {
      status,
      dataJson: JSON.stringify(input.data),
      updatedAt: now,
    },
  });
  const record = toRecord<T>(row);
  if (!record) throw new Error("operational_artifact_parse_failed");
  return record;
}

export async function getOperationalArtifact<T>(input: {
  kind: string;
  name: string;
  scope?: string | null;
}): Promise<OperationalArtifactRecord<T> | null> {
  const row = await prisma.operationalArtifact.findUnique({
    where: {
      kind_scope_name: {
        kind: input.kind,
        scope: input.scope?.trim() ?? "",
        name: input.name,
      },
    },
  });
  return row ? toRecord<T>(row) : null;
}

export async function getOperationalArtifactById<T>(id: string, kind?: string): Promise<OperationalArtifactRecord<T> | null> {
  const row = await prisma.operationalArtifact.findFirst({ where: { id, ...(kind ? { kind } : {}) } });
  return row ? toRecord<T>(row) : null;
}

export async function listOperationalArtifacts<T>(input: {
  kind: string;
  scope?: string | null;
}): Promise<OperationalArtifactRecord<T>[]> {
  const rows = await prisma.operationalArtifact.findMany({
    where: {
      kind: input.kind,
      ...(input.scope === undefined ? {} : { scope: input.scope?.trim() ?? "" }),
    },
    orderBy: { updatedAt: "desc" },
  });
  return rows.flatMap((row) => {
    const record = toRecord<T>(row);
    return record ? [record] : [];
  });
}

export async function getLatestOperationalArtifact<T>(input: {
  kind: string;
  scope?: string | null;
  namePrefix?: string;
}): Promise<OperationalArtifactRecord<T> | null> {
  const row = await prisma.operationalArtifact.findFirst({
    where: {
      kind: input.kind,
      scope: input.scope?.trim() ?? "",
      ...(input.namePrefix ? { name: { startsWith: input.namePrefix } } : {}),
    },
    orderBy: { updatedAt: "desc" },
  });
  return row ? toRecord<T>(row) : null;
}
