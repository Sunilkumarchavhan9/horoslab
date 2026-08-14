import { repoFullNameFromProjectId } from "../continuity/projectScope";
import { listGitHubReposForUser } from "../integrations/githubExecution";
import {
  listGitHubRepoContents,
  readGitHubRepoFile,
  type GitHubRepoEntry,
} from "../integrations/githubRepoBrowser";
import { getCompanyModelConfig } from "../runtime/companyModelProvider";
import { invokeCompanyModelJson } from "../runtime/companyModelChat";
import {
  buildWikiDiagramCacheKey,
  createWikiDiagramCacheEntry,
  getCachedWikiDiagram,
  saveWikiDiagramCache,
  type WikiDiagramCacheEntry,
  type WikiDiagramType,
} from "./wikiDiagramCacheStore";

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

export type WikiDiagramResult = {
  mermaid: string;
  sources: string[];
  title: string;
  diagramType: WikiDiagramType;
  cached: boolean;
  generatedAt: string;
};

export type GenerateWikiDiagramInput = {
  userId: string;
  orgId?: string;
  projectId: string;
  repoFullName?: string;
  branch?: string;
  diagramType: WikiDiagramType;
  refresh?: boolean;
};

type RepoContext = {
  repoFullName: string;
  branch: string;
  rootEntries: GitHubRepoEntry[];
  childrenByDir: Record<string, GitHubRepoEntry[]>;
  readmeExcerpt: string | null;
  packageJson: string | null;
  prismaSchema: string | null;
  knownPaths: Set<string>;
};

const DIAGRAM_TITLES: Record<WikiDiagramType, string> = {
  ui_composition: "Code Entity Mapping: UI Composition",
  data_flow: "Data Flow",
  architecture: "Architecture",
  overview: "Repository Overview",
};

function parseRepoFullName(fullName: string): { owner: string; repo: string } | null {
  if (!fullName.includes("/")) return null;
  const [owner, repo] = fullName.split("/", 2);
  if (!owner?.trim() || !repo?.trim()) return null;
  return { owner: owner.trim(), repo: repo.trim() };
}

function excerptText(text: string, max = 1200): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function collectKnownPaths(
  rootEntries: GitHubRepoEntry[],
  childrenByDir: Record<string, GitHubRepoEntry[]>,
): Set<string> {
  const paths = new Set<string>();
  for (const entry of rootEntries) paths.add(entry.path);
  for (const [dirPath, children] of Object.entries(childrenByDir)) {
    paths.add(dirPath);
    for (const child of children) paths.add(child.path);
  }
  return paths;
}

async function resolveRepoFullName(
  userId: string,
  orgId: string | undefined,
  projectId: string,
  repoFullName?: string,
): Promise<string> {
  if (repoFullName?.trim()) return repoFullName.trim();
  const repos = await listGitHubReposForUser(userId, 40, orgId);
  const resolved = repoFullNameFromProjectId(projectId, repos);
  if (!resolved) {
    throw new Error("Repository not found for projectId.");
  }
  return resolved;
}

async function fetchRepoContext(
  userId: string,
  orgId: string | undefined,
  repoFullName: string,
  branch?: string,
): Promise<RepoContext> {
  const parts = parseRepoFullName(repoFullName);
  if (!parts) throw new Error("Invalid repoFullName.");

  const root = await listGitHubRepoContents({
    userId,
    orgId,
    owner: parts.owner,
    repo: parts.repo,
    path: "",
    ref: branch,
  });

  const childrenByDir: Record<string, GitHubRepoEntry[]> = {};
  const dirsToFetch = root.entries
    .filter((entry) => entry.type === "dir" && WORKSPACE_ROOT_DIRS.has(entry.name.toLowerCase()))
    .slice(0, 10);

  await Promise.all(
    dirsToFetch.map(async (dir) => {
      const result = await listGitHubRepoContents({
        userId,
        orgId,
        owner: parts.owner,
        repo: parts.repo,
        path: dir.path,
        ref: root.ref,
      });
      childrenByDir[dir.path] = result.entries.slice(0, 40);
    }),
  );

  const readmeCandidates = ["README.md", "readme.md", "Readme.md"];
  let readmeExcerpt: string | null = null;
  for (const candidate of readmeCandidates) {
    const hit = root.entries.find((entry) => entry.name === candidate);
    if (!hit) continue;
    try {
      const file = await readGitHubRepoFile({
        userId,
        orgId,
        owner: parts.owner,
        repo: parts.repo,
        path: hit.path,
        ref: root.ref,
      });
      readmeExcerpt = excerptText(file.content, 1500);
      break;
    } catch {
      // skip unreadable readme
    }
  }

  const packageEntry = root.entries.find((entry) => entry.name === "package.json");
  let packageJson: string | null = null;
  if (packageEntry) {
    try {
      const file = await readGitHubRepoFile({
        userId,
        orgId,
        owner: parts.owner,
        repo: parts.repo,
        path: packageEntry.path,
        ref: root.ref,
      });
      packageJson = excerptText(file.content, 2500);
    } catch {
      packageJson = null;
    }
  }

  let prismaSchema: string | null = null;
  const prismaCandidates = ["prisma/schema.prisma", "schema.prisma"];
  for (const candidate of prismaCandidates) {
    try {
      const file = await readGitHubRepoFile({
        userId,
        orgId,
        owner: parts.owner,
        repo: parts.repo,
        path: candidate,
        ref: root.ref,
      });
      prismaSchema = excerptText(file.content, 2500);
      break;
    } catch {
      // try next candidate
    }
  }

  return {
    repoFullName,
    branch: root.ref,
    rootEntries: root.entries,
    childrenByDir,
    readmeExcerpt,
    packageJson,
    prismaSchema,
    knownPaths: collectKnownPaths(root.entries, childrenByDir),
  };
}

function buildCompactRepoContext(context: RepoContext): string {
  const lines: string[] = [
    `Repository: ${context.repoFullName}`,
    `Branch: ${context.branch}`,
    "",
    "Top-level entries:",
    ...context.rootEntries.map((entry) => `- ${entry.type}: ${entry.path}`),
  ];

  for (const [dir, children] of Object.entries(context.childrenByDir)) {
    lines.push("", `${dir}/`);
    for (const child of children.slice(0, 30)) {
      lines.push(`  - ${child.type}: ${child.path}`);
    }
  }

  if (context.readmeExcerpt) {
    lines.push("", "README excerpt:", context.readmeExcerpt);
  }
  if (context.packageJson) {
    lines.push("", "package.json excerpt:", context.packageJson);
  }
  if (context.prismaSchema) {
    lines.push("", "prisma schema excerpt:", context.prismaSchema);
  }

  return lines.join("\n").slice(0, 24_000);
}

function diagramPrompt(diagramType: WikiDiagramType): string {
  const base = `You generate Mermaid diagrams for an operational wiki grounded ONLY in the supplied repository context.
Return JSON: { "mermaid": string, "sources": string[], "title": string }.
Rules:
- Output valid Mermaid ONLY inside the mermaid field (no markdown fences).
- Use flowchart TB or LR with subgraphs:
  subgraph NL["Natural Language"]
  subgraph CE["Code Entity Space"]
- Node labels must reference REAL file paths or symbols from the context when possible.
- sources must be repo-relative file paths cited in the diagram (max 12).
- Keep diagrams readable: 8-18 nodes max.
- Use short labels; prefer path basenames with full path in tooltip-style parentheses if needed.
- Do not invent files not present in the context.`;

  switch (diagramType) {
    case "ui_composition":
      return `${base}
Diagram focus: UI composition — map landing/page routes to React/Vue components (e.g. Landing Page → Home() → Navbar, HeroSection).
Title should be "Code Entity Mapping: UI Composition".`;
    case "data_flow":
      return `${base}
Diagram focus: Data flow — user input → models/API routes → database/env vars (e.g. User Email → Feedback Model → PostgreSQL → DATABASE_URL).
Title should be "Data Flow".`;
    case "architecture":
      return `${base}
Diagram focus: System architecture — frontend, backend, APIs, storage, external services with Natural Language vs Code Entity columns.
Title should be "Architecture".`;
    default:
      return `${base}
Diagram focus: High-level repository overview — major modules and how they connect.
Title should be "Repository Overview".`;
  }
}

function sanitizeMermaid(raw: string): string {
  return raw
    .replace(/^```(?:mermaid)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function validateSources(sources: string[], knownPaths: Set<string>): string[] {
  const validated: string[] = [];
  for (const source of sources) {
    const path = source.trim().replace(/^\.\//, "");
    if (!path) continue;
    if (knownPaths.has(path)) {
      validated.push(path);
      continue;
    }
    const partial = [...knownPaths].find(
      (known) => known.endsWith(`/${path}`) || known === path || path.endsWith(known),
    );
    if (partial) validated.push(partial);
  }
  return [...new Set(validated)].slice(0, 12);
}

function cacheEntryToResult(entry: WikiDiagramCacheEntry, cached: boolean): WikiDiagramResult {
  return {
    mermaid: entry.mermaid,
    sources: entry.sources,
    title: entry.title,
    diagramType: entry.diagramType,
    cached,
    generatedAt: entry.generatedAt,
  };
}

export async function generateWikiDiagram(
  input: GenerateWikiDiagramInput,
): Promise<WikiDiagramResult> {
  const projectId = input.projectId.trim();
  if (!projectId) throw new Error("projectId is required.");

  const repoFullName = await resolveRepoFullName(
    input.userId,
    input.orgId,
    projectId,
    input.repoFullName,
  );

  const cacheKey = buildWikiDiagramCacheKey({
    userId: input.userId,
    orgId: input.orgId,
    repoFullName,
    branch: input.branch?.trim() || "main",
    diagramType: input.diagramType,
  });

  if (!input.refresh) {
    const cached = await getCachedWikiDiagram(cacheKey);
    if (cached) return cacheEntryToResult(cached, true);
  }

  const companyModel = await getCompanyModelConfig(input.userId, input.orgId);
  if (!companyModel) {
    throw new Error(
      "Company Model is not configured. Open Continuity Lab → Company Model and save your OpenRouter key.",
    );
  }

  const context = await fetchRepoContext(
    input.userId,
    input.orgId,
    repoFullName,
    input.branch,
  );

  const llmResult = await invokeCompanyModelJson<{
    mermaid?: string;
    sources?: string[];
    title?: string;
  }>({
    config: companyModel,
    systemPrompt: diagramPrompt(input.diagramType),
    userMessage: buildCompactRepoContext(context),
    maxTokens: 2000,
    temperature: 0.15,
  });

  const mermaid = sanitizeMermaid(typeof llmResult.mermaid === "string" ? llmResult.mermaid : "");
  if (!mermaid) {
    throw new Error("LLM did not return a valid Mermaid diagram.");
  }

  const sources = validateSources(
    Array.isArray(llmResult.sources) ? llmResult.sources.filter((s) => typeof s === "string") : [],
    context.knownPaths,
  );

  const title =
    typeof llmResult.title === "string" && llmResult.title.trim()
      ? llmResult.title.trim()
      : DIAGRAM_TITLES[input.diagramType];

  const entry = createWikiDiagramCacheEntry({
    cacheKey,
    userId: input.userId,
    orgId: input.orgId,
    projectId,
    repoFullName,
    branch: context.branch,
    diagramType: input.diagramType,
    mermaid,
    sources,
    title,
  });

  await saveWikiDiagramCache(entry);
  return cacheEntryToResult(entry, false);
}
