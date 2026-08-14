import { createHash } from "crypto";
import { getMemoryStoreAdapter } from "../adapters/registry";
import { getRecentMemories } from "../memory/recentMemoryStore";
import { scheduleMemoryEmbedding } from "../memory/persistMemoryEmbedding";
import { MEMORY_CONTRACT_VERSION, type Memory } from "../memory/types";
import {
  getLabSkillsRulesSettings,
  recordSkillsRulesCompileStats,
  type SkillsRulesRepoCompileStats,
} from "./labSkillsRulesSettingsStore";
import {
  getSkillsRulesCacheEntry,
  listSkillsRulesCacheForOrg,
} from "./skillsRulesCacheStore";
import { readSkillsRulesFileContent } from "./skillsRulesDiscovery";

export type SkillsRulesCompileResult = {
  orgId: string;
  repos: string[];
  compiledAt: string;
  memoryCount: number;
  skipped: number;
  errors: Array<{ repo: string; path: string; error: string }>;
  statsByRepo: Record<string, SkillsRulesRepoCompileStats>;
};

function skillsRulesMemoryId(orgId: string, repo: string, filePath: string): string {
  const digest = createHash("sha256")
    .update(`${orgId}\0${repo.toLowerCase()}\0${filePath}`)
    .digest("hex")
    .slice(0, 32);
  return `m-skillsrules-${digest}`;
}

function buildSkillsRulesMemory(input: {
  userId: string;
  orgId: string;
  repo: string;
  path: string;
  itemType: "skill" | "rule";
  itemName: string;
  content: string;
  existing?: Memory | null;
}): Memory {
  const now = new Date().toISOString();
  return {
    id: skillsRulesMemoryId(input.orgId, input.repo, input.path),
    userId: input.userId,
    type: "project",
    content: input.content,
    summary: `${input.itemType}: ${input.itemName} (${input.repo})`,
    importanceScore: 0.85,
    confidence: 1,
    source: "import",
    status: "active",
    createdAt: input.existing?.createdAt ?? now,
    updatedAt: now,
    evidenceCount: input.existing?.evidenceCount ?? 1,
    contractVersion: MEMORY_CONTRACT_VERSION,
    contractCategory: "policy",
    operationalTags: ["policy"],
    sourceRef: `github:${input.repo}#${input.path}`,
    files: [input.path],
  };
}

export async function compileSkillsRulesToMemory(input: {
  userId: string;
  orgId: string;
  repoFullName?: string;
  force?: boolean;
}): Promise<SkillsRulesCompileResult> {
  const settings = await getLabSkillsRulesSettings(input.orgId);
  const targetRepos = input.repoFullName
    ? settings.enrolledRepos.filter((repo) => repo === input.repoFullName)
    : settings.enrolledRepos;

  if (input.repoFullName && targetRepos.length === 0) {
    throw new Error(`${input.repoFullName} is not enrolled for skills & rules.`);
  }

  const memoryStore = getMemoryStoreAdapter();
  const errors: SkillsRulesCompileResult["errors"] = [];
  let memoryCount = 0;
  let skipped = 0;
  const statsByRepo: Record<string, SkillsRulesRepoCompileStats> = {};
  const compiledAt = new Date().toISOString();

  const cached =
    targetRepos.length > 0
      ? await listSkillsRulesCacheForOrg(input.orgId, targetRepos)
      : ({} as Record<string, Awaited<ReturnType<typeof getSkillsRulesCacheEntry>>>);

  for (const repo of targetRepos) {
    const entry = cached[repo] ?? await getSkillsRulesCacheEntry(input.orgId, repo);
    if (!entry || entry.items.length === 0) {
      statsByRepo[repo] = {
        lastCompiledAt: compiledAt,
        memoryCount: 0,
      };
      continue;
    }

    let repoMemoryCount = 0;
    for (const item of entry.items) {
      try {
        const file = await readSkillsRulesFileContent({
          userId: input.userId,
          orgId: input.orgId,
          repoFullName: repo,
          path: item.path,
          ref: entry.ref,
        });
        const content = file.content.trim();
        if (!content) {
          skipped += 1;
          continue;
        }

        const memoryId = skillsRulesMemoryId(input.orgId, repo, item.path);
        const recent = await getRecentMemories(input.userId);
        const existingMemory = recent.find((row) => row.id === memoryId) ?? null;

        if (!input.force && existingMemory && existingMemory.content === content) {
          skipped += 1;
          repoMemoryCount += 1;
          continue;
        }

        const memory = buildSkillsRulesMemory({
          userId: input.userId,
          orgId: input.orgId,
          repo,
          path: item.path,
          itemType: item.type,
          itemName: item.name,
          content,
          existing: existingMemory ?? null,
        });
        await memoryStore.saveMemory({ memory });
        scheduleMemoryEmbedding(memory, input.orgId);
        repoMemoryCount += 1;
        memoryCount += 1;
      } catch (error) {
        errors.push({
          repo,
          path: item.path,
          error: error instanceof Error ? error.message : "Could not compile file.",
        });
      }
    }

    statsByRepo[repo] = {
      lastCompiledAt: compiledAt,
      memoryCount: repoMemoryCount,
    };
  }

  if (Object.keys(statsByRepo).length > 0) {
    await recordSkillsRulesCompileStats(input.orgId, statsByRepo);
  }

  return {
    orgId: input.orgId,
    repos: targetRepos,
    compiledAt,
    memoryCount,
    skipped,
    errors,
    statsByRepo,
  };
}

export async function maybeAutoCompileSkillsRules(input: {
  userId: string;
  orgId: string;
  repos: string[];
}): Promise<SkillsRulesCompileResult | null> {
  const settings = await getLabSkillsRulesSettings(input.orgId);
  // #region agent log
  try{const{appendFileSync}=await import('fs');const{join}=await import('path');appendFileSync(join(process.cwd(),'debug-ac70bc.log'),JSON.stringify({sessionId:'ac70bc',location:'skillsRulesCompile.ts:180',message:'maybeAutoCompile check',data:{orgId:input.orgId,autoCompileEnabled:settings.autoCompileEnabled,repoCount:input.repos.length},timestamp:Date.now(),hypothesisId:'H-D'})+'\n');}catch{}
  // #endregion
  if (!settings.autoCompileEnabled || input.repos.length === 0) {
    return null;
  }
  const results: SkillsRulesCompileResult[] = [];
  for (const repo of input.repos) {
    results.push(
      await compileSkillsRulesToMemory({
        userId: input.userId,
        orgId: input.orgId,
        repoFullName: repo,
      }),
    );
  }
  if (results.length === 0) return null;
  const merged = results[0];
  for (let i = 1; i < results.length; i += 1) {
    merged.memoryCount += results[i].memoryCount;
    merged.skipped += results[i].skipped;
    merged.errors.push(...results[i].errors);
    Object.assign(merged.statsByRepo, results[i].statsByRepo);
    merged.repos.push(...results[i].repos.filter((repo) => !merged.repos.includes(repo)));
  }
  return merged;
}
