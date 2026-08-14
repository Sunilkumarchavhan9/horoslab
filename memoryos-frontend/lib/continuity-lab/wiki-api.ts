/**
 * Operational Wiki — MemoryOS API loaders (project-state, graph, decisions).
 */

import { consoleApiFetch } from "@/lib/console-api";
import type { DecisionHistoryEntry } from "@/lib/continuity-lab/operational-api";
import {
  fetchDecisionHistory,
  fetchExecutionHistory,
} from "@/lib/continuity-lab/operational-api";
import { excerptReadme } from "@/lib/continuity-lab/wiki-workspace";
import type { WikiSectionId } from "@/lib/continuity-lab/wiki";

export type ProjectStateData = {
  projectId: string;
  briefSummary?: {
    currentGoal?: string;
    whatChangedRecently?: string[];
    openBlockers?: string[];
    nextBestAction?: string;
  };
  activeLoop?: {
    loopId: string;
    goal: string;
    state: string;
    updatedAt: string;
  } | null;
  driftFlag?: boolean;
  driftSummary?: string | null;
  resumeConfidenceScore?: number;
  lastAction?: { action?: string; createdAt?: string } | null;
};

export type GraphNode = {
  id: string;
  type: string;
  label: string;
  confidence: number;
  attributes?: Record<string, unknown>;
};

export type GraphEdge = {
  id: string;
  from: string;
  to: string;
  relation: string;
  confidence: number;
};

export type GraphSummary = {
  nodes?: GraphNode[];
  edges?: GraphEdge[];
  updatedAt?: string | null;
  projectId?: string;
  summary?: {
    nodeTypes?: Record<string, number>;
    avgNodeConfidence?: number;
  };
};

export type RepoIndexStatusValue = "indexed" | "generating" | "not_indexed";

export type RepoIndexStatus = {
  projectId: string;
  fullName: string;
  status: RepoIndexStatusValue;
  indexed: boolean;
  generating: boolean;
  goal: string | null;
  confidence: number | null;
  updatedAt: string | null;
  syncStartedAt?: string | null;
};

export type IndexedReposSummary = {
  total: number;
  indexed: number;
  generating: number;
  repos: RepoIndexStatus[];
};

export type OperationalMapSection = {
  sectionId: WikiSectionId;
  label: string;
  nodeCount: number;
  contractCategories: string[];
  children?: Array<{ id: string; label: string; type: string }>;
};

export type OperationalMapNode = {
  id: string;
  type: string;
  label: string;
  confidence: number;
  contractCategory?: string;
};

export type OperationalMapEdge = {
  id: string;
  from: string;
  to: string;
  relation: string;
  confidence: number;
};

export type OperationalMapPayload = {
  sections: OperationalMapSection[];
  nodes: OperationalMapNode[];
  edges: OperationalMapEdge[];
};

function unwrapData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { data?: unknown };
  return (record.data ?? payload) as T;
}

async function readApiErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const payload = await response.json();
    if (payload && typeof payload === "object") {
      const record = payload as {
        error?: string | { message?: string };
        message?: string;
      };
      if (typeof record.error === "string") return record.error;
      if (record.error && typeof record.error === "object" && record.error.message) {
        return record.error.message;
      }
      if (record.message) return record.message;
      const data = unwrapData<{ error?: string | { message?: string }; message?: string }>(payload);
      if (data) {
        if (typeof data.error === "string") return data.error;
        if (data.error && typeof data.error === "object" && data.error.message) {
          return data.error.message;
        }
        if (data.message) return data.message;
      }
    }
  } catch {
    // Ignore parsing issues and fall back to a generic message.
  }
  return fallback;
}

export async function fetchProjectState(projectId: string): Promise<ProjectStateData | null> {
  const project = projectId.trim();
  if (!project) return null;
  try {
    const res = await consoleApiFetch(
      `/api/memory/project-state?projectId=${encodeURIComponent(project)}`,
    );
    if (!res.ok) return null;
    const payload = await res.json();
    return unwrapData<ProjectStateData>(payload);
  } catch {
    return null;
  }
}

export async function fetchOrgGraph(options?: {
  projectId?: string;
  repoFullName?: string;
}): Promise<GraphSummary | null> {
  try {
    const params = new URLSearchParams();
    if (options?.projectId?.trim()) {
      params.set("projectId", options.projectId.trim());
    }
    if (options?.repoFullName?.trim()) {
      params.set("repos", options.repoFullName.trim());
    }
    const query = params.toString();
    const res = await consoleApiFetch(
      `/api/company-brain/graph${query ? `?${query}` : ""}`,
    );
    if (!res.ok) return null;
    const payload = await res.json();
    return unwrapData<GraphSummary>(payload);
  } catch {
    return null;
  }
}

export async function fetchRepoIndexStatuses(
  repoFullNames?: string[],
): Promise<RepoIndexStatus[]> {
  try {
    const params = new URLSearchParams();
    if (repoFullNames?.length) {
      params.set("repos", repoFullNames.join(","));
    }
    const res = await consoleApiFetch(`/api/connector/index-status?${params.toString()}`);
    if (!res.ok) return [];
    const payload = await res.json();
    const data = unwrapData<{ repos?: RepoIndexStatus[] }>(payload);
    return Array.isArray(data?.repos) ? data.repos : [];
  } catch {
    return [];
  }
}

export async function fetchRepoIndexStatus(
  fullName: string,
  projectId: string,
): Promise<RepoIndexStatus> {
  const statuses = await fetchRepoIndexStatuses([fullName]);
  const hit = statuses.find((entry) => entry.fullName === fullName || entry.projectId === projectId);
  if (hit) return hit;

  const state = await fetchProjectState(projectId);
  const indexed = Boolean(state?.briefSummary?.currentGoal?.trim() || state?.resumeConfidenceScore != null);
  return {
    projectId,
    fullName,
    status: indexed ? "indexed" : "not_indexed",
    indexed,
    generating: false,
    goal: state?.briefSummary?.currentGoal?.trim() || null,
    confidence:
      typeof state?.resumeConfidenceScore === "number" ? state.resumeConfidenceScore : null,
    updatedAt: state?.lastAction?.createdAt ?? state?.activeLoop?.updatedAt ?? null,
  };
}

export async function fetchIndexedReposSummary(): Promise<IndexedReposSummary | null> {
  try {
    const res = await consoleApiFetch("/api/connector/index-status?summary=1");
    if (!res.ok) return null;
    const payload = await res.json();
    return unwrapData<IndexedReposSummary>(payload);
  } catch {
    return null;
  }
}

export async function fetchAllRepoIndexStatuses(): Promise<RepoIndexStatus[]> {
  return fetchRepoIndexStatuses();
}

export async function fetchOperationalMap(projectId: string): Promise<OperationalMapPayload | null> {
  const project = projectId.trim();
  if (!project) return null;
  try {
    const res = await consoleApiFetch(
      `/api/memory/operational-map?projectId=${encodeURIComponent(project)}`,
    );
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<OperationalMapPayload>(payload);
    if (!data) return null;
    return {
      sections: Array.isArray(data.sections) ? data.sections : [],
      nodes: Array.isArray(data.nodes) ? data.nodes : [],
      edges: Array.isArray(data.edges) ? data.edges : [],
    };
  } catch {
    return null;
  }
}

export async function fetchOperationalMapSections(
  projectId: string,
): Promise<OperationalMapSection[]> {
  const map = await fetchOperationalMap(projectId);
  return map?.sections ?? [];
}

export function filterGraphForProject(
  graph: GraphSummary | null,
  projectId: string,
  repoFullName?: string | null,
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  if (!graph) return { nodes: [], edges: [] };
  const nodes = (graph.nodes ?? []) as GraphNode[];
  const edges = (graph.edges ?? []) as GraphEdge[];
  if (graph.projectId?.trim().toLowerCase() === projectId.trim().toLowerCase()) {
    return { nodes, edges };
  }
  const projectKey = projectId.trim().toLowerCase();
  const repoKey = repoFullName?.trim().toLowerCase();
  const filteredNodes = nodes.filter((node) => {
    const label = node.label.toLowerCase();
    const id = node.id.toLowerCase();
    const repository =
      typeof node.attributes?.repository === "string"
        ? node.attributes.repository.toLowerCase()
        : "";
    if (repoKey && (repository === repoKey || label.includes(repoKey))) return true;
    if (label.includes(projectKey) || id.includes(projectKey.replace(/-/g, "_"))) return true;
    return false;
  });
  const nodeIds = new Set(filteredNodes.map((node) => node.id));
  return {
    nodes: filteredNodes,
    edges: edges.filter((edge) => nodeIds.has(edge.from) && nodeIds.has(edge.to)),
  };
}

export async function fetchWikiDecisions(
  projectId: string,
  limit = 40,
): Promise<DecisionHistoryEntry[]> {
  return fetchDecisionHistory(projectId, limit);
}

export function decisionsForSection(
  decisions: DecisionHistoryEntry[],
  categories: string[],
): DecisionHistoryEntry[] {
  if (!categories.length) return decisions;
  const set = new Set(categories);
  return decisions.filter((d) => set.has(d.contractCategory));
}

export function latestWikiUpdatedAt(input: {
  projectState: ProjectStateData | null;
  decisions: DecisionHistoryEntry[];
  graphUpdatedAt?: string | null;
}): string | null {
  const candidates: string[] = [];
  if (input.graphUpdatedAt) candidates.push(input.graphUpdatedAt);
  if (input.projectState?.activeLoop?.updatedAt) candidates.push(input.projectState.activeLoop.updatedAt);
  if (input.projectState?.lastAction?.createdAt) candidates.push(input.projectState.lastAction.createdAt);
  for (const d of input.decisions.slice(0, 5)) {
    if (d.updatedAt) candidates.push(d.updatedAt);
  }
  if (!candidates.length) return null;
  return candidates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;
}

const FILE_PATH_PATTERN = /(?:^|[\s"'`(])((?:[\w.-]+\/)+[\w.-]+\.\w{1,8})(?:[\s"'`),]|$)/;

function extractFilePathsFromText(text: string): string[] {
  const found: string[] = [];
  for (const match of text.matchAll(new RegExp(FILE_PATH_PATTERN, "g"))) {
    const path = match[1]?.trim();
    if (path && !found.includes(path)) found.push(path);
  }
  return found;
}

export async function fetchWikiSourcePaths(
  projectId: string,
  decisions: DecisionHistoryEntry[],
): Promise<string[]> {
  const paths = new Set<string>();
  for (const entry of decisions) {
    for (const file of entry.files ?? []) {
      const trimmed = file.trim();
      if (trimmed) paths.add(trimmed);
    }
    if (entry.contractCategory !== "risky_file") continue;
    for (const path of extractFilePathsFromText(`${entry.summary} ${entry.content}`)) {
      paths.add(path);
    }
  }
  try {
    const lineage = await fetchExecutionHistory(projectId, 20);
    for (const item of lineage) {
      for (const file of item.actionMemory.filesChanged) {
        const trimmed = file.trim();
        if (trimmed) paths.add(trimmed);
      }
    }
  } catch {
    // Best-effort — wiki sources still show risky_file paths when lineage fails.
  }
  return [...paths].sort((a, b) => a.localeCompare(b)).slice(0, 24);
}

export function parseSourceRefHref(sourceRef: string | null | undefined): string | null {
  if (!sourceRef?.trim()) return null;
  const urlMatch = sourceRef.match(/\burl=(https?:\/\/[^\s]+)/i);
  if (urlMatch?.[1]) return urlMatch[1];
  const issueMatch = sourceRef.match(/\bissue=([A-Z][A-Z0-9]+-\d+)/i);
  if (issueMatch?.[1]) {
    return `https://jira.atlassian.com/browse/${encodeURIComponent(issueMatch[1])}`;
  }
  return null;
}

export type GitHubRepoEntry = {
  name: string;
  path: string;
  type: "file" | "dir";
  size?: number;
};

export type GitHubRepoBranchEntry = {
  name: string;
  protected: boolean;
  commitSha: string | null;
};

export type GitHubRepoCommitEntry = {
  sha: string;
  message: string;
  authorName: string | null;
  authoredAt: string | null;
};

export type GitHubRepoIssueEntry = {
  number: number;
  title: string;
  state: string;
  updatedAt: string | null;
};

export type GitHubRepoPullRequestEntry = {
  number: number;
  title: string;
  state: string;
  updatedAt: string | null;
};

export type GitHubPullRequestFileEntry = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch: string | null;
};

export type GitHubPullRequestReviewCommentEntry = {
  id: number;
  body: string;
  path: string | null;
  line: number | null;
  side: string | null;
  user: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type GitHubPullRequestReviewEntry = {
  id: number;
  state: string;
  body: string | null;
  submittedAt: string | null;
  user: string | null;
};

export type GitHubPullRequestDetail = {
  number: number;
  title: string;
  state: string;
  body: string | null;
  htmlUrl: string | null;
  baseRef: string | null;
  headRef: string | null;
  headSha: string | null;
  additions: number;
  deletions: number;
  changedFiles: number;
  comments: number;
  reviewComments: number;
  commits: number;
  draft: boolean;
  merged: boolean;
  mergedAt: string | null;
  updatedAt: string | null;
  createdAt: string | null;
  closedAt: string | null;
  files: GitHubPullRequestFileEntry[];
  commentsList: GitHubPullRequestReviewCommentEntry[];
  reviews: GitHubPullRequestReviewEntry[];
  statusState: string | null;
  statusCount: number | null;
};

export type GitHubCreatePullRequestInput = {
  title: string;
  body: string;
  head: string;
  base: string;
  draft?: boolean;
};

export type GitHubCreatePullRequestResult = {
  number: number;
  htmlUrl?: string | null;
  url?: string | null;
  state?: string | null;
  title?: string | null;
};

export async function fetchGitHubRepoBranches(
  owner: string,
  repo: string,
  limit = 100,
): Promise<{ branches: GitHubRepoBranchEntry[]; defaultBranch: string } | null> {
  try {
    const params = new URLSearchParams({ limit: String(limit) });
    const res = await consoleApiFetch(
      `/api/connector/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches?${params.toString()}`,
    );
    if (res.ok) {
      const payload = await res.json();
      const data = unwrapData<{
        branches?: GitHubRepoBranchEntry[];
        defaultBranch?: string;
      }>(payload);
      if (Array.isArray(data?.branches)) {
        return {
          branches: data.branches,
          defaultBranch: data.defaultBranch ?? data.branches[0]?.name ?? "",
        };
      }
    }

    const root = await fetchGitHubRepoContents(owner, repo);
    if (!root?.ref) return null;
    return {
      branches: [{ name: root.ref, protected: false, commitSha: null }],
      defaultBranch: root.ref,
    };
  } catch {
    return null;
  }
}

async function fetchGitHubRepoCollection<T>(
  owner: string,
  repo: string,
  resource: "commits" | "issues" | "pulls",
  limit = 10,
  options?: { throwOnError?: boolean },
): Promise<T[]> {
  try {
    const params = new URLSearchParams({ limit: String(limit) });
    const res = await consoleApiFetch(
      `/api/connector/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${resource}?${params.toString()}`,
    );
    if (!res.ok) {
      if (options?.throwOnError) {
        throw new Error(
          await readApiErrorMessage(
            res,
            `Failed to load ${resource} for ${owner}/${repo} (${res.status})`,
          ),
        );
      }
      return [];
    }
    const payload = await res.json();
    const data = unwrapData<{ items?: T[]; [key: string]: unknown }>(payload);
    if (Array.isArray(data?.items)) return data.items;
    const firstArray = Object.values(data ?? {}).find((value) => Array.isArray(value));
    return Array.isArray(firstArray) ? (firstArray as T[]) : [];
  } catch (error) {
    if (options?.throwOnError) {
      throw error instanceof Error
        ? error
        : new Error(`Failed to load ${resource} for ${owner}/${repo}.`);
    }
    return [];
  }
}

export async function fetchGitHubRepoCommits(
  owner: string,
  repo: string,
  limit = 8,
): Promise<GitHubRepoCommitEntry[]> {
  return fetchGitHubRepoCollection<GitHubRepoCommitEntry>(owner, repo, "commits", limit);
}

export async function fetchGitHubRepoIssues(
  owner: string,
  repo: string,
  limit = 8,
): Promise<GitHubRepoIssueEntry[]> {
  return fetchGitHubRepoCollection<GitHubRepoIssueEntry>(owner, repo, "issues", limit);
}

export async function fetchGitHubRepoPullRequests(
  owner: string,
  repo: string,
  limit = 8,
  options?: { throwOnError?: boolean },
): Promise<GitHubRepoPullRequestEntry[]> {
  return fetchGitHubRepoCollection<GitHubRepoPullRequestEntry>(owner, repo, "pulls", limit, options);
}

export async function fetchGitHubPullRequests(
  owner: string,
  repo: string,
  limit = 8,
  options?: { throwOnError?: boolean },
): Promise<GitHubRepoPullRequestEntry[]> {
  return fetchGitHubRepoPullRequests(owner, repo, limit, options);
}

export async function fetchGitHubPullRequest(
  owner: string,
  repo: string,
  number: number,
  options?: { throwOnError?: boolean },
): Promise<GitHubPullRequestDetail | null> {
  try {
    const res = await consoleApiFetch(
      `/api/connector/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${encodeURIComponent(String(number))}`,
    );
    if (!res.ok) {
      if (options?.throwOnError) {
        throw new Error(
          await readApiErrorMessage(
            res,
            `Failed to load pull request #${number} for ${owner}/${repo} (${res.status})`,
          ),
        );
      }
      return null;
    }
    const payload = await res.json();
    const data = unwrapData<{ pullRequest?: GitHubPullRequestDetail }>(payload);
    return data?.pullRequest ?? null;
  } catch (error) {
    if (options?.throwOnError) {
      throw error instanceof Error
        ? error
        : new Error(`Failed to load pull request #${number} for ${owner}/${repo}.`);
    }
    return null;
  }
}

export async function createGitHubRepoPullRequest(
  owner: string,
  repo: string,
  input: GitHubCreatePullRequestInput,
): Promise<GitHubCreatePullRequestResult | null> {
  try {
    const res = await consoleApiFetch(
      `/api/connector/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls`,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
    if (!res.ok) return null;
    const payload = await res.json().catch(() => null);
    const data = unwrapData<GitHubCreatePullRequestResult>(payload);
    return data ?? (payload as GitHubCreatePullRequestResult) ?? null;
  } catch {
    return null;
  }
}

export type RepoWorkspacePayload = {
  ref: string;
  rootEntries: GitHubRepoEntry[];
  childrenByDir: Record<string, GitHubRepoEntry[]>;
  readme: { path: string; excerpt: string; fullLength: number } | null;
  packageJson: string | null;
  renderYaml: string | null;
};

export function parseRepoFullName(fullName: string): { owner: string; repo: string } | null {
  if (!fullName.includes("/")) return null;
  const [owner, repo] = fullName.split("/", 2);
  if (!owner?.trim() || !repo?.trim()) return null;
  return { owner: owner.trim(), repo: repo.trim() };
}

export async function fetchGitHubRepoContents(
  owner: string,
  repo: string,
  path?: string,
  ref?: string,
): Promise<{ entries: GitHubRepoEntry[]; ref: string } | null> {
  try {
    const params = new URLSearchParams();
    if (path?.trim()) params.set("path", path.trim());
    if (ref?.trim()) params.set("ref", ref.trim());
    const query = params.toString();
    const res = await consoleApiFetch(
      `/api/connector/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents${query ? `?${query}` : ""}`,
    );
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{ entries?: GitHubRepoEntry[]; ref?: string }>(payload);
    if (!data?.entries) return null;
    return { entries: data.entries, ref: data.ref ?? ref ?? "main" };
  } catch {
    return null;
  }
}

export async function fetchGitHubRepoFile(
  owner: string,
  repo: string,
  path: string,
  ref?: string,
): Promise<{ path: string; content: string; ref: string } | null> {
  try {
    const params = new URLSearchParams({ path });
    if (ref?.trim()) params.set("ref", ref.trim());
    const res = await consoleApiFetch(
      `/api/connector/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/file?${params.toString()}`,
    );
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{ path?: string; content?: string; ref?: string }>(payload);
    if (!data?.content) return null;
    return {
      path: data.path ?? path,
      content: data.content,
      ref: data.ref ?? ref ?? "main",
    };
  } catch {
    return null;
  }
}

const WORKSPACE_ROOT_DIRS = new Set([
  "app",
  "components",
  "pages",
  "src",
  "lib",
  "server",
  "api",
  "prisma",
  "public",
  "static",
  "docs",
  "hooks",
  "services",
  "routes",
]);

export async function fetchRepoWorkspace(
  repoFullName: string,
  ref?: string,
): Promise<RepoWorkspacePayload | null> {
  const parts = parseRepoFullName(repoFullName);
  if (!parts) return null;

  const root = await fetchGitHubRepoContents(parts.owner, parts.repo, "", ref);
  if (!root) return null;

  const childrenByDir: Record<string, GitHubRepoEntry[]> = {};
  const dirsToFetch = root.entries
    .filter((entry) => entry.type === "dir" && WORKSPACE_ROOT_DIRS.has(entry.name.toLowerCase()))
    .slice(0, 10);

  await Promise.all(
    dirsToFetch.map(async (dir) => {
      const result = await fetchGitHubRepoContents(parts.owner, parts.repo, dir.path, root.ref);
      if (result?.entries) {
        childrenByDir[dir.path] = result.entries;
      }
    }),
  );

  const readmeCandidates = ["README.md", "readme.md", "Readme.md"];
  let readme: RepoWorkspacePayload["readme"] = null;
  for (const candidate of readmeCandidates) {
    const hit = root.entries.find((entry) => entry.name === candidate);
    if (!hit) continue;
    const file = await fetchGitHubRepoFile(parts.owner, parts.repo, hit.path, root.ref);
    if (file?.content) {
      readme = {
        path: hit.path,
        excerpt: excerptReadme(file.content),
        fullLength: file.content.length,
      };
      break;
    }
  }

  const packageEntry = root.entries.find((entry) => entry.name === "package.json");
  const renderEntry = root.entries.find((entry) => entry.name === "render.yaml");

  const [packageFile, renderFile] = await Promise.all([
    packageEntry
      ? fetchGitHubRepoFile(parts.owner, parts.repo, packageEntry.path, root.ref)
      : Promise.resolve(null),
    renderEntry
      ? fetchGitHubRepoFile(parts.owner, parts.repo, renderEntry.path, root.ref)
      : Promise.resolve(null),
  ]);

  return {
    ref: root.ref,
    rootEntries: root.entries,
    childrenByDir,
    readme,
    packageJson: packageFile?.content ?? null,
    renderYaml: renderFile?.content ?? null,
  };
}

export type WikiDiagramType = "ui_composition" | "data_flow" | "architecture" | "overview";

export type WikiDiagramPayload = {
  mermaid: string;
  sources: string[];
  title: string;
  diagramType: WikiDiagramType;
  cached: boolean;
  generatedAt: string;
};

export async function fetchWikiDiagram(input: {
  projectId: string;
  repoFullName: string;
  branch: string;
  diagramType: WikiDiagramType;
  refresh?: boolean;
}): Promise<{ data: WikiDiagramPayload | null; error: string | null }> {
  const project = input.projectId.trim();
  if (!project) return { data: null, error: "projectId is required" };

  try {
    const params = new URLSearchParams({
      projectId: project,
      diagramType: input.diagramType,
      repoFullName: input.repoFullName,
      branch: input.branch,
    });
    if (input.refresh) params.set("refresh", "1");

    const res = await consoleApiFetch(`/api/memory/wiki-diagram?${params.toString()}`);
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      const record = payload as { error?: string; code?: string } | null;
      return {
        data: null,
        error: record?.error ?? "Could not load AI diagram.",
      };
    }
    const data = unwrapData<WikiDiagramPayload>(payload);
    if (!data?.mermaid) {
      return { data: null, error: "Diagram response was empty." };
    }
    return { data, error: null };
  } catch {
    return { data: null, error: "Could not load AI diagram." };
  }
}

export async function regenerateWikiDiagram(input: {
  projectId: string;
  repoFullName: string;
  branch: string;
  diagramType: WikiDiagramType;
}): Promise<{ data: WikiDiagramPayload | null; error: string | null }> {
  try {
    const res = await consoleApiFetch("/api/memory/wiki-diagram", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        projectId: input.projectId,
        repoFullName: input.repoFullName,
        branch: input.branch,
        diagramType: input.diagramType,
        refresh: true,
      }),
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      const record = payload as { error?: string } | null;
      return {
        data: null,
        error: record?.error ?? "Could not regenerate AI diagram.",
      };
    }
    const data = unwrapData<WikiDiagramPayload>(payload);
    if (!data?.mermaid) {
      return { data: null, error: "Diagram response was empty." };
    }
    return { data, error: null };
  } catch {
    return { data: null, error: "Could not regenerate AI diagram." };
  }
}
