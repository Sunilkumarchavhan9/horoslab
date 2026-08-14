import { connectorUserFilter, resolveRequestOrgId } from "../auth/orgScope";
import {
  listGitHubRepoContents,
  readGitHubRepoFile,
  writeGitHubRepoFile,
  type GitHubRepoEntry,
} from "../integrations/githubRepoBrowser";
import { prisma } from "../storage/prismaClient";
import {
  isSkillsRulesCacheFresh,
  listSkillsRulesCacheForOrg,
  saveSkillsRulesCacheEntry,
  SKILLS_RULES_CACHE_TTL_MS,
  type SkillsRulesCacheEntry,
} from "./skillsRulesCacheStore";

export type DiscoveredSkillsRulesItem = {
  name: string;
  path: string;
  type: "skill" | "rule";
};

export type RepoSkillsRulesSummary = {
  repo: string;
  ref?: string;
  items: DiscoveredSkillsRulesItem[];
  skillCount: number;
  ruleCount: number;
  totalCount: number;
  discoveredAt: string | null;
  stale?: boolean;
  error?: string;
};

const ROOT_RULE_FILES = ["AGENTS.md", "CLAUDE.md"] as const;
const MAX_WALK_DEPTH = 6;

function parseRepoFullName(fullName: string): { owner: string; repo: string } | null {
  if (!fullName.includes("/")) return null;
  const [owner, repo] = fullName.split("/", 2);
  if (!owner?.trim() || !repo?.trim()) return null;
  return { owner: owner.trim(), repo: repo.trim() };
}

function skillNameFromPath(filePath: string): string {
  const segments = filePath.split("/");
  return segments[segments.length - 2] || filePath;
}

function ruleNameFromPath(filePath: string): string {
  const base = filePath.split("/").pop() ?? filePath;
  return base.replace(/\.(mdc?|md|txt|json)$/i, "") || base;
}

export async function isGitHubConnectedForUser(
  userId: string,
  orgId?: string,
): Promise<boolean> {
  const scopedOrgId = resolveRequestOrgId(orgId);
  const row = await prisma.connector.findFirst({
    where: {
      ...connectorUserFilter({ userId, orgId: scopedOrgId }),
      type: "github",
      status: "connected",
    },
  });
  if (!row?.configJson) return false;
  try {
    const config = JSON.parse(row.configJson) as { accessToken?: string };
    return typeof config.accessToken === "string" && config.accessToken.length > 0;
  } catch {
    return false;
  }
}

async function walkSkillsDirectory(input: {
  userId: string;
  orgId?: string;
  owner: string;
  repo: string;
  path: string;
  ref: string;
  items: DiscoveredSkillsRulesItem[];
  depth?: number;
}): Promise<void> {
  if ((input.depth ?? 0) > MAX_WALK_DEPTH) return;
  const result = await listGitHubRepoContents({
    userId: input.userId,
    orgId: input.orgId,
    owner: input.owner,
    repo: input.repo,
    path: input.path,
    ref: input.ref,
  });
  for (const entry of result.entries) {
    if (entry.type === "file" && entry.name === "SKILL.md") {
      input.items.push({
        name: skillNameFromPath(entry.path),
        path: entry.path,
        type: "skill",
      });
    } else if (entry.type === "dir") {
      await walkSkillsDirectory({
        ...input,
        path: entry.path,
        depth: (input.depth ?? 0) + 1,
      });
    }
  }
}

async function walkRulesDirectory(input: {
  userId: string;
  orgId?: string;
  owner: string;
  repo: string;
  path: string;
  ref: string;
  items: DiscoveredSkillsRulesItem[];
  depth?: number;
}): Promise<void> {
  if ((input.depth ?? 0) > MAX_WALK_DEPTH) return;
  const result = await listGitHubRepoContents({
    userId: input.userId,
    orgId: input.orgId,
    owner: input.owner,
    repo: input.repo,
    path: input.path,
    ref: input.ref,
  });
  for (const entry of result.entries) {
    if (entry.type === "file") {
      input.items.push({
        name: ruleNameFromPath(entry.path),
        path: entry.path,
        type: "rule",
      });
    } else if (entry.type === "dir") {
      await walkRulesDirectory({
        ...input,
        path: entry.path,
        depth: (input.depth ?? 0) + 1,
      });
    }
  }
}

function findDir(entries: GitHubRepoEntry[], name: string): GitHubRepoEntry | undefined {
  return entries.find((entry) => entry.type === "dir" && entry.name === name);
}

function findFile(entries: GitHubRepoEntry[], name: string): GitHubRepoEntry | undefined {
  return entries.find((entry) => entry.type === "file" && entry.name === name);
}

export async function discoverSkillsRulesInRepo(input: {
  userId: string;
  orgId: string;
  repoFullName: string;
}): Promise<SkillsRulesCacheEntry> {
  const parts = parseRepoFullName(input.repoFullName);
  if (!parts) {
    throw new Error("Invalid repo name. Use owner/repo format.");
  }

  const items: DiscoveredSkillsRulesItem[] = [];
  let ref = "main";

  try {
    const root = await listGitHubRepoContents({
      userId: input.userId,
      orgId: input.orgId,
      owner: parts.owner,
      repo: parts.repo,
      path: "",
    });
    ref = root.ref;

    for (const fileName of ROOT_RULE_FILES) {
      const hit = findFile(root.entries, fileName);
      if (hit) {
        items.push({ name: fileName.replace(/\.md$/i, ""), path: hit.path, type: "rule" });
      }
    }

    const githubDir = findDir(root.entries, ".github");
    if (githubDir) {
      try {
        const githubContents = await listGitHubRepoContents({
          userId: input.userId,
          orgId: input.orgId,
          owner: parts.owner,
          repo: parts.repo,
          path: githubDir.path,
          ref,
        });
        const copilot = findFile(githubContents.entries, "copilot-instructions.md");
        if (copilot) {
          items.push({
            name: "copilot-instructions",
            path: copilot.path,
            type: "rule",
          });
        }
      } catch {
        /* optional path */
      }
    }

    const cursorDir = findDir(root.entries, ".cursor");
    if (cursorDir) {
      try {
        const cursorContents = await listGitHubRepoContents({
          userId: input.userId,
          orgId: input.orgId,
          owner: parts.owner,
          repo: parts.repo,
          path: cursorDir.path,
          ref,
        });
        const skillsDir = findDir(cursorContents.entries, "skills");
        if (skillsDir) {
          await walkSkillsDirectory({
            userId: input.userId,
            orgId: input.orgId,
            owner: parts.owner,
            repo: parts.repo,
            path: skillsDir.path,
            ref,
            items,
          });
        }
        const rulesDir = findDir(cursorContents.entries, "rules");
        if (rulesDir) {
          await walkRulesDirectory({
            userId: input.userId,
            orgId: input.orgId,
            owner: parts.owner,
            repo: parts.repo,
            path: rulesDir.path,
            ref,
            items,
          });
        }
      } catch {
        /* optional path */
      }
    }

    const memoryosDir = findDir(root.entries, ".memoryos");
    if (memoryosDir) {
      try {
        const memoryosContents = await listGitHubRepoContents({
          userId: input.userId,
          orgId: input.orgId,
          owner: parts.owner,
          repo: parts.repo,
          path: memoryosDir.path,
          ref,
        });
        const skillsDir = findDir(memoryosContents.entries, "skills");
        if (skillsDir) {
          await walkSkillsDirectory({
            userId: input.userId,
            orgId: input.orgId,
            owner: parts.owner,
            repo: parts.repo,
            path: skillsDir.path,
            ref,
            items,
          });
        }
      } catch {
        /* optional path */
      }
    }

    const skillCount = items.filter((item) => item.type === "skill").length;
    const ruleCount = items.filter((item) => item.type === "rule").length;
    const discoveredAt = new Date().toISOString();
    return saveSkillsRulesCacheEntry({
      orgId: input.orgId,
      repo: input.repoFullName,
      ref,
      items,
      skillCount,
      ruleCount,
      discoveredAt,
      expiresAt: new Date(Date.now() + SKILLS_RULES_CACHE_TTL_MS).toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to discover skills and rules.";
    const discoveredAt = new Date().toISOString();
    return saveSkillsRulesCacheEntry({
      orgId: input.orgId,
      repo: input.repoFullName,
      ref,
      items: [],
      skillCount: 0,
      ruleCount: 0,
      discoveredAt,
      expiresAt: new Date(Date.now() + SKILLS_RULES_CACHE_TTL_MS).toISOString(),
      error: message,
    });
  }
}

export function toRepoSkillsRulesSummary(
  repo: string,
  entry: SkillsRulesCacheEntry | null,
): RepoSkillsRulesSummary {
  if (!entry) {
    return {
      repo,
      items: [],
      skillCount: 0,
      ruleCount: 0,
      totalCount: 0,
      discoveredAt: null,
      stale: true,
    };
  }
  return {
    repo,
    ref: entry.ref,
    items: entry.items,
    skillCount: entry.skillCount,
    ruleCount: entry.ruleCount,
    totalCount: entry.items.length,
    discoveredAt: entry.discoveredAt,
    stale: !isSkillsRulesCacheFresh(entry),
    error: entry.error,
  };
}

export async function buildSkillsRulesDiscoveryPayload(input: {
  userId: string;
  orgId: string;
  enrolledRepos: string[];
  /** When true, scan GitHub for repos with missing or expired cache before returning. */
  refreshIfStale?: boolean;
  /** Always scan these repos (e.g. newly enrolled). */
  refreshRepos?: string[];
}): Promise<{
  githubConnected: boolean;
  repos: RepoSkillsRulesSummary[];
}> {
  const githubConnected = await isGitHubConnectedForUser(input.userId, input.orgId);
  const enrolled = input.enrolledRepos;

  if (githubConnected && enrolled.length > 0) {
    const toRefresh = new Set<string>();
    for (const repo of input.refreshRepos ?? []) {
      if (enrolled.includes(repo)) toRefresh.add(repo);
    }
    if (input.refreshIfStale) {
      const cached = await listSkillsRulesCacheForOrg(input.orgId, enrolled);
      for (const repo of enrolled) {
        const entry = cached[repo] ?? null;
        if (!entry || !isSkillsRulesCacheFresh(entry)) {
          toRefresh.add(repo);
        }
      }
    }
    if (toRefresh.size > 0) {
      await refreshSkillsRulesForRepos({
        userId: input.userId,
        orgId: input.orgId,
        repos: [...toRefresh],
      });
    }
  }

  const cached = await listSkillsRulesCacheForOrg(input.orgId, enrolled);
  const repos = enrolled.map((repo) => toRepoSkillsRulesSummary(repo, cached[repo] ?? null));
  return { githubConnected, repos };
}

export async function readSkillsRulesFileContent(input: {
  userId: string;
  orgId: string;
  repoFullName: string;
  path: string;
  ref?: string;
}): Promise<{ repo: string; path: string; content: string; ref: string; sha: string | null }> {
  const parts = parseRepoFullName(input.repoFullName);
  if (!parts) {
    throw new Error("Invalid repo name. Use owner/repo format.");
  }
  const file = await readGitHubRepoFile({
    userId: input.userId,
    orgId: input.orgId,
    owner: parts.owner,
    repo: parts.repo,
    path: input.path,
    ref: input.ref,
  });
  return {
    repo: input.repoFullName,
    path: file.path,
    content: file.content,
    ref: file.ref,
    sha: file.sha,
  };
}

export async function writeSkillsRulesFileContent(input: {
  userId: string;
  orgId: string;
  repoFullName: string;
  path: string;
  content: string;
  sha?: string | null;
  ref?: string;
  message?: string;
}): Promise<{
  repo: string;
  path: string;
  content: string;
  ref: string;
  sha: string | null;
  commitUrl: string | null;
}> {
  const parts = parseRepoFullName(input.repoFullName);
  if (!parts) {
    throw new Error("Invalid repo name. Use owner/repo format.");
  }
  const result = await writeGitHubRepoFile({
    userId: input.userId,
    orgId: input.orgId,
    owner: parts.owner,
    repo: parts.repo,
    path: input.path,
    content: input.content,
    sha: input.sha,
    ref: input.ref,
    message: input.message,
  });
  return {
    repo: input.repoFullName,
    path: result.path,
    content: input.content,
    ref: result.ref,
    sha: result.sha,
    commitUrl: result.commitUrl,
  };
}

export async function refreshSkillsRulesForRepos(input: {
  userId: string;
  orgId: string;
  repos: string[];
}): Promise<RepoSkillsRulesSummary[]> {
  const results: RepoSkillsRulesSummary[] = [];
  for (const repo of input.repos) {
    const entry = await discoverSkillsRulesInRepo({
      userId: input.userId,
      orgId: input.orgId,
      repoFullName: repo,
    });
    results.push(toRepoSkillsRulesSummary(repo, entry));
  }
  return results;
}
