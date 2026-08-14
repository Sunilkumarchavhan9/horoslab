import { prisma } from "../storage/prismaClient";
import type { DiscoveredSkillsRulesItem } from "./skillsRulesDiscovery";

export const SKILLS_RULES_CACHE_TTL_MS = 60 * 60 * 1000;

export type SkillsRulesCacheEntry = {
  orgId: string;
  repo: string;
  ref: string;
  items: DiscoveredSkillsRulesItem[];
  skillCount: number;
  ruleCount: number;
  discoveredAt: string;
  expiresAt: string;
  error?: string;
};

function safeParseItems(raw: string): DiscoveredSkillsRulesItem[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as DiscoveredSkillsRulesItem[]) : [];
  } catch {
    return [];
  }
}

function repoKey(repo: string): string {
  return repo.toLowerCase();
}

export function isSkillsRulesCacheFresh(entry: SkillsRulesCacheEntry | null): boolean {
  if (!entry) return false;
  return Date.now() <= new Date(entry.expiresAt).getTime();
}

function toCacheEntry(row: {
  orgId: string;
  repo: string;
  ref: string;
  itemsJson: string;
  skillCount: number;
  ruleCount: number;
  discoveredAt: string;
  expiresAt: string;
  error: string | null;
}): SkillsRulesCacheEntry {
  return {
    orgId: row.orgId,
    repo: row.repo,
    ref: row.ref,
    items: safeParseItems(row.itemsJson),
    skillCount: row.skillCount,
    ruleCount: row.ruleCount,
    discoveredAt: row.discoveredAt,
    expiresAt: row.expiresAt,
    ...(row.error ? { error: row.error } : {}),
  };
}

export async function getSkillsRulesCacheEntry(
  orgId: string,
  repo: string,
): Promise<SkillsRulesCacheEntry | null> {
  const row = await prisma.skillsRulesCache.findUnique({
    where: { orgId_repoKey: { orgId, repoKey: repoKey(repo) } },
  });
  return row ? toCacheEntry(row) : null;
}

export async function saveSkillsRulesCacheEntry(
  entry: SkillsRulesCacheEntry,
): Promise<SkillsRulesCacheEntry> {
  await prisma.skillsRulesCache.upsert({
    where: { orgId_repoKey: { orgId: entry.orgId, repoKey: repoKey(entry.repo) } },
    create: {
      orgId: entry.orgId,
      repo: entry.repo,
      repoKey: repoKey(entry.repo),
      ref: entry.ref,
      itemsJson: JSON.stringify(entry.items),
      skillCount: entry.skillCount,
      ruleCount: entry.ruleCount,
      discoveredAt: entry.discoveredAt,
      expiresAt: entry.expiresAt,
      error: entry.error ?? null,
    },
    update: {
      repo: entry.repo,
      ref: entry.ref,
      itemsJson: JSON.stringify(entry.items),
      skillCount: entry.skillCount,
      ruleCount: entry.ruleCount,
      discoveredAt: entry.discoveredAt,
      expiresAt: entry.expiresAt,
      error: entry.error ?? null,
    },
  });
  return entry;
}

export async function listSkillsRulesCacheForOrg(
  orgId: string,
  repos: string[],
): Promise<Record<string, SkillsRulesCacheEntry | null>> {
  const rows = await prisma.skillsRulesCache.findMany({
    where: {
      orgId,
      repoKey: { in: repos.map(repoKey) },
    },
  });
  const byKey = new Map<string, SkillsRulesCacheEntry>();
  for (const row of rows) {
    byKey.set(row.repoKey, toCacheEntry(row));
  }
  const out: Record<string, SkillsRulesCacheEntry | null> = {};
  for (const repo of repos) {
    out[repo] = byKey.get(repoKey(repo)) ?? null;
  }
  return out;
}

export async function removeSkillsRulesCacheForRepo(
  orgId: string,
  repo: string,
): Promise<void> {
  await prisma.skillsRulesCache.deleteMany({
    where: {
      orgId,
      repoKey: repoKey(repo),
    },
  });
}
