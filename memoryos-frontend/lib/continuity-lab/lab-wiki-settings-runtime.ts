import type { RepoIndexStatus } from "@/lib/continuity-lab/wiki-api";
import type {
  LabWikiEffort,
  LabWikiFrequency,
  LabWikiSettings,
} from "@/lib/continuity-lab/lab-wiki-settings-storage";

export const WIKI_SCHEDULED_REGENERATION_NOTE =
  "Scheduled wiki regeneration from effort and frequency is not wired yet. Changing these settings saves your preferences and shows a re-index hint; a background cron will honor them in a later release.";

export function branchesIndexedFromStatus(entry: RepoIndexStatus | undefined): number {
  if (!entry) return 0;
  if (entry.status === "indexed") return 1;
  return 0;
}

export function formatWikiBranchIndexLabel(
  entry: RepoIndexStatus | undefined,
  stored?: number,
): string {
  const count = stored != null && stored > 0 ? stored : branchesIndexedFromStatus(entry);
  if (entry?.status === "generating" && count === 0) return "Indexing…";
  if (count === 0) return "0 branches indexed";
  return `${count} branch${count === 1 ? "" : "es"} indexed`;
}

export function wikiGenerationScheduleChanged(
  prev: Pick<LabWikiSettings, "effort" | "frequency">,
  next: Pick<LabWikiSettings, "effort" | "frequency">,
): boolean {
  return prev.effort !== next.effort || prev.frequency !== next.frequency;
}

export function shouldShowWikiReindexHint(
  prev: LabWikiSettings | null,
  next: LabWikiSettings,
): boolean {
  if (!prev) return false;
  if (next.frequency === "never") return false;
  return wikiGenerationScheduleChanged(prev, next);
}

export function enrolledRepoSet(settings: LabWikiSettings): Set<string> {
  return new Set(settings.enrolledRepos.map((r) => r.repo));
}

export function filterReposForWikiIndex(
  repoFullNames: string[],
  settings: LabWikiSettings,
): string[] {
  const enrolled = enrolledRepoSet(settings);
  if (enrolled.size === 0) return repoFullNames;
  return repoFullNames.filter((name) => enrolled.has(name));
}

export function wikiEffortLabel(effort: LabWikiEffort): string {
  switch (effort) {
    case "low":
      return "Low (free / fast)";
    case "medium":
      return "Medium ($10–20)";
    case "high":
      return "High ($40–80)";
    case "max":
      return "Max (contact team)";
    default:
      return effort;
  }
}

export function wikiFrequencyLabel(frequency: LabWikiFrequency): string {
  return frequency.charAt(0).toUpperCase() + frequency.slice(1);
}
