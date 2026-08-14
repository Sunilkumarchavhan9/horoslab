/** Shared repo ↔ projectId helpers for wiki and continuity APIs. */

export function projectIdFromRepo(fullName: string): string {
  return fullName.replace(/\//g, "-").toLowerCase();
}

export function repoFullNameFromProjectId(
  projectId: string,
  repos: Array<{ fullName: string } | string>,
): string | null {
  const normalized = projectId.trim().toLowerCase();
  for (const entry of repos) {
    const fullName = typeof entry === "string" ? entry : entry.fullName;
    if (projectIdFromRepo(fullName) === normalized) {
      return fullName;
    }
  }
  return null;
}

export function projectMatchesMemory(projectId: string, memory: {
  summary?: string;
  content?: string;
  developerSignals?: { projectArea?: string[] };
}): boolean {
  const projectKey = projectId.trim().toLowerCase();
  if (!projectKey) return false;
  const projectAreas = memory.developerSignals?.projectArea ?? [];
  if (
    projectAreas.some((area) => area.trim().toLowerCase() === projectKey) ||
    projectAreas.some((area) => area.toLowerCase().includes(projectKey))
  ) {
    return true;
  }
  const haystack = `${memory.summary ?? ""} ${memory.content ?? ""}`.toLowerCase();
  return haystack.includes(projectKey);
}
