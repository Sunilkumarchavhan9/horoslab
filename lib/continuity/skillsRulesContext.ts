import { getLabSkillsRulesSettings } from "./labSkillsRulesSettingsStore";
import { getSkillsRulesCacheEntry } from "./skillsRulesCacheStore";
import { readSkillsRulesFileContent } from "./skillsRulesDiscovery";

export const SKILLS_RULES_CONTEXT_MAX_CHARS = 12_000;

function resolveReferencePath(raw: string): string | null {
  const trimmed = raw.trim();
  const match = trimmed.match(/^@([A-Za-z0-9_./-]+\.md[a-z]?)\s*$/i);
  return match?.[1] ?? null;
}

async function readItemContent(input: {
  userId: string;
  orgId: string;
  repo: string;
  path: string;
  ref: string;
}): Promise<string | null> {
  try {
    const file = await readSkillsRulesFileContent({
      userId: input.userId,
      orgId: input.orgId,
      repoFullName: input.repo,
      path: input.path,
      ref: input.ref,
    });
    const referencePath = resolveReferencePath(file.content);
    if (referencePath && referencePath !== input.path) {
      const resolved = await readSkillsRulesFileContent({
        userId: input.userId,
        orgId: input.orgId,
        repoFullName: input.repo,
        path: referencePath,
        ref: file.ref || input.ref,
      });
      return resolved.content.trim() || null;
    }
    return file.content.trim() || null;
  } catch {
    return null;
  }
}

function truncateContext(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars - 64)}\n\n… [truncated for session context]`;
}

export async function buildSkillsRulesContextBlock(input: {
  userId: string;
  orgId: string;
  sessionRepo?: string | null;
  maxChars?: number;
}): Promise<string | null> {
  const settings = await getLabSkillsRulesSettings(input.orgId);
  if (settings.enrolledRepos.length === 0) return null;

  const maxChars = input.maxChars ?? SKILLS_RULES_CONTEXT_MAX_CHARS;
  const sessionRepo = input.sessionRepo?.trim() ?? "";
  const repos =
    sessionRepo && settings.enrolledRepos.includes(sessionRepo)
      ? [sessionRepo]
      : sessionRepo
        ? []
        : settings.enrolledRepos;

  if (repos.length === 0) return null;

  const sections: string[] = [];
  for (const repo of repos) {
    const entry = await getSkillsRulesCacheEntry(input.orgId, repo);
    if (!entry || entry.items.length === 0) continue;

    const repoSections: string[] = [];
    for (const item of entry.items) {
      const content = await readItemContent({
        userId: input.userId,
        orgId: input.orgId,
        repo,
        path: item.path,
        ref: entry.ref,
      });
      if (!content) continue;
      repoSections.push(
        `### ${item.type.toUpperCase()}: ${item.name}\nPath: \`${item.path}\`\n\n${content}`,
      );
    }

    if (repoSections.length > 0) {
      sections.push(`## Repository: ${repo}\n\n${repoSections.join("\n\n---\n\n")}`);
    }
  }

  if (sections.length === 0) return null;
  const body = truncateContext(sections.join("\n\n"), maxChars);
  return `[Org skills & rules]\nFollow these repository skills and rules when working in enrolled repos.\n\n${body}`;
}
