import { getLabEnvironmentSettings } from "./labEnvironmentSettingsStore";

export async function buildEnvironmentContextBlock(input: {
  orgId: string;
  sessionRepo?: string | null;
}): Promise<string | null> {
  const settings = await getLabEnvironmentSettings(input.orgId);
  const sessionRepo = input.sessionRepo?.trim() ?? "";
  const includedRepos = settings.enrolledRepos.filter((row) => row.included);
  if (includedRepos.length === 0 && !settings.blueprintMarkdown?.trim()) {
    return null;
  }

  const repoApplies =
    !sessionRepo ||
    includedRepos.some((row) => row.repo === sessionRepo) ||
    includedRepos.length > 0;

  if (!repoApplies) return null;

  const lines: string[] = ["[Org environment]"];
  const activeSnapshot =
    settings.snapshots.find((row) => row.active) ?? settings.snapshots[0] ?? null;
  if (activeSnapshot) {
    lines.push(
      `Active snapshot: ${activeSnapshot.builtAt} (${activeSnapshot.repoCount} repos).`,
    );
  }
  if (includedRepos.length > 0) {
    lines.push(
      `Clone/setup order: ${includedRepos.map((row) => row.repo).join(" → ")}`,
    );
  }
  if (settings.blueprintMarkdown?.trim()) {
    lines.push("", "Blueprint:", settings.blueprintMarkdown.trim());
  }
  if (sessionRepo) {
    const repoBlueprint = settings.repoBlueprints[sessionRepo];
    if (repoBlueprint?.content?.trim()) {
      lines.push("", `Repo blueprint (${sessionRepo}):`, repoBlueprint.content.trim());
    }
  }
  return lines.join("\n");
}
