import { prisma } from "../storage/prismaClient";

const TTL_MS = 24 * 60 * 60 * 1000;

export type WikiDiagramType = "ui_composition" | "data_flow" | "architecture" | "overview";

export type WikiDiagramCacheEntry = {
  cacheKey: string;
  userId: string;
  orgId?: string;
  projectId: string;
  repoFullName: string;
  branch: string;
  diagramType: WikiDiagramType;
  mermaid: string;
  sources: string[];
  title: string;
  generatedAt: string;
  expiresAt: string;
};

function safeParseSources(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function toWikiDiagramCacheEntry(row: {
  cacheKey: string;
  userId: string;
  orgId: string | null;
  projectId: string;
  repoFullName: string;
  branch: string;
  diagramType: string;
  mermaid: string;
  sourcesJson: string;
  title: string;
  generatedAt: string;
  expiresAt: string;
}): WikiDiagramCacheEntry {
  return {
    cacheKey: row.cacheKey,
    userId: row.userId,
    ...(row.orgId ? { orgId: row.orgId } : {}),
    projectId: row.projectId,
    repoFullName: row.repoFullName,
    branch: row.branch,
    diagramType: row.diagramType as WikiDiagramType,
    mermaid: row.mermaid,
    sources: safeParseSources(row.sourcesJson),
    title: row.title,
    generatedAt: row.generatedAt,
    expiresAt: row.expiresAt,
  };
}

export function buildWikiDiagramCacheKey(input: {
  userId: string;
  orgId?: string;
  repoFullName: string;
  branch: string;
  diagramType: WikiDiagramType;
}): string {
  const org = input.orgId?.trim() || "personal";
  return `${org}:${input.userId}:${input.repoFullName.toLowerCase()}:${input.branch}:${input.diagramType}`;
}

export async function getCachedWikiDiagram(
  cacheKey: string,
): Promise<WikiDiagramCacheEntry | null> {
  const row = await prisma.wikiDiagramCache.findUnique({ where: { cacheKey } });
  const hit = row ? toWikiDiagramCacheEntry(row) : null;
  if (!hit) return null;
  if (Date.now() > new Date(hit.expiresAt).getTime()) return null;
  return hit;
}

export async function saveWikiDiagramCache(entry: WikiDiagramCacheEntry): Promise<void> {
  await prisma.wikiDiagramCache.upsert({
    where: { cacheKey: entry.cacheKey },
    create: {
      cacheKey: entry.cacheKey,
      userId: entry.userId,
      orgId: entry.orgId ?? null,
      projectId: entry.projectId,
      repoFullName: entry.repoFullName,
      branch: entry.branch,
      diagramType: entry.diagramType,
      mermaid: entry.mermaid,
      sourcesJson: JSON.stringify(entry.sources),
      title: entry.title,
      generatedAt: entry.generatedAt,
      expiresAt: entry.expiresAt,
    },
    update: {
      userId: entry.userId,
      orgId: entry.orgId ?? null,
      projectId: entry.projectId,
      repoFullName: entry.repoFullName,
      branch: entry.branch,
      diagramType: entry.diagramType,
      mermaid: entry.mermaid,
      sourcesJson: JSON.stringify(entry.sources),
      title: entry.title,
      generatedAt: entry.generatedAt,
      expiresAt: entry.expiresAt,
    },
  });
}

export function createWikiDiagramCacheEntry(input: {
  cacheKey: string;
  userId: string;
  orgId?: string;
  projectId: string;
  repoFullName: string;
  branch: string;
  diagramType: WikiDiagramType;
  mermaid: string;
  sources: string[];
  title: string;
}): WikiDiagramCacheEntry {
  const generatedAt = new Date().toISOString();
  return {
    ...input,
    generatedAt,
    expiresAt: new Date(Date.now() + TTL_MS).toISOString(),
  };
}
