/**
 * Operational Wiki — repo tree → Devin-style workspace sidebar sections.
 * Heuristic mapping only; no LLM-generated architecture prose.
 */

export type GitHubRepoEntry = {
  name: string;
  path: string;
  type: "file" | "dir";
};

export type WorkspaceNavChild = {
  id: string;
  label: string;
  path: string;
  type: "file" | "dir";
};

export type WorkspaceNavSection = {
  id: string;
  label: string;
  group: "frontend" | "backend" | "static" | "config";
  dirs: Array<{
    name: string;
    path: string;
    children: WorkspaceNavChild[];
  }>;
};

const FRONTEND_DIRS = new Set([
  "app",
  "components",
  "pages",
  "src",
  "styles",
  "hooks",
  "ui",
  "views",
  "layouts",
  "features",
]);

const BACKEND_DIRS = new Set([
  "lib",
  "server",
  "api",
  "prisma",
  "db",
  "services",
  "routes",
  "middleware",
  "models",
  "controllers",
  "workers",
  "scripts",
]);

const STATIC_DIRS = new Set(["public", "static", "assets", "docs", "content"]);

const CONFIG_FILES = new Set([
  "package.json",
  "tsconfig.json",
  "render.yaml",
  "docker-compose.yml",
  "Dockerfile",
  "next.config.js",
  "next.config.ts",
  "vite.config.ts",
  "turbo.json",
]);

const SECTION_LABELS: Record<WorkspaceNavSection["group"], string> = {
  frontend: "Frontend Architecture",
  backend: "Backend and Data Layer",
  static: "Static Assets",
  config: "Configuration",
};

export function classifyWorkspaceDir(name: string): WorkspaceNavSection["group"] | null {
  const lower = name.toLowerCase();
  if (FRONTEND_DIRS.has(lower)) return "frontend";
  if (BACKEND_DIRS.has(lower)) return "backend";
  if (STATIC_DIRS.has(lower)) return "static";
  return null;
}

export function buildWorkspaceSections(input: {
  rootEntries: GitHubRepoEntry[];
  childrenByDir: Map<string, GitHubRepoEntry[]>;
}): WorkspaceNavSection[] {
  const grouped = new Map<WorkspaceNavSection["group"], WorkspaceNavSection["dirs"]>();

  for (const entry of input.rootEntries) {
    if (entry.type !== "dir") continue;
    const group = classifyWorkspaceDir(entry.name);
    if (!group) continue;

    const children = (input.childrenByDir.get(entry.path) ?? [])
      .slice(0, 12)
      .map(
        (child): WorkspaceNavChild => ({
          id: child.path,
          label: child.name,
          path: child.path,
          type: child.type,
        }),
      );

    const dirs = grouped.get(group) ?? [];
    dirs.push({ name: entry.name, path: entry.path, children });
    grouped.set(group, dirs);
  }

  const configEntries = input.rootEntries
    .filter((entry) => entry.type === "file" && CONFIG_FILES.has(entry.name.toLowerCase()))
    .slice(0, 8)
    .map(
      (entry): WorkspaceNavChild => ({
        id: entry.path,
        label: entry.name,
        path: entry.path,
        type: "file",
      }),
    );

  if (configEntries.length) {
    grouped.set("config", [
      {
        name: "Root",
        path: "",
        children: configEntries,
      },
    ]);
  }

  const order: WorkspaceNavSection["group"][] = ["frontend", "backend", "static", "config"];
  return order
    .filter((group) => (grouped.get(group)?.length ?? 0) > 0)
    .map((group) => ({
      id: group,
      label: SECTION_LABELS[group],
      group,
      dirs: grouped.get(group) ?? [],
    }));
}

export type RepoTreeDiagramNode = {
  id: string;
  label: string;
  path: string;
  type: "file" | "dir";
  group?: WorkspaceNavSection["group"];
  depth: number;
};

export function buildRepoTreeDiagramNodes(input: {
  rootEntries: GitHubRepoEntry[];
  childrenByDir: Map<string, GitHubRepoEntry[]>;
  maxDepth?: number;
}): RepoTreeDiagramNode[] {
  const maxDepth = input.maxDepth ?? 2;
  const nodes: RepoTreeDiagramNode[] = [];

  function walk(entries: GitHubRepoEntry[], depth: number, parentGroup?: WorkspaceNavSection["group"]) {
    if (depth > maxDepth) return;
    for (const entry of entries.slice(0, depth === 0 ? 16 : 8)) {
      const group =
        entry.type === "dir" ? (classifyWorkspaceDir(entry.name) ?? parentGroup) : parentGroup;
      nodes.push({
        id: entry.path || entry.name,
        label: entry.name,
        path: entry.path,
        type: entry.type,
        group: group ?? undefined,
        depth,
      });
      if (entry.type === "dir" && depth < maxDepth) {
        const children = input.childrenByDir.get(entry.path) ?? [];
        walk(children, depth + 1, group ?? parentGroup);
      }
    }
  }

  walk(input.rootEntries, 0);
  return nodes;
}

export type TechStackRow = {
  name: string;
  version: string;
  kind: "dependency" | "devDependency" | "runtime";
};

export function parseTechStackFromPackageJson(content: string): TechStackRow[] {
  try {
    const parsed = JSON.parse(content) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      engines?: Record<string, string>;
    };
    const rows: TechStackRow[] = [];
    const priority = [
      "next",
      "react",
      "react-dom",
      "typescript",
      "prisma",
      "@prisma/client",
      "express",
      "tailwindcss",
      "vite",
      "node",
    ];

    const addRows = (deps: Record<string, string> | undefined, kind: TechStackRow["kind"]) => {
      if (!deps) return;
      for (const [name, version] of Object.entries(deps)) {
        rows.push({ name, version, kind });
      }
    };

    addRows(parsed.dependencies, "dependency");
    addRows(parsed.devDependencies, "devDependency");
    if (parsed.engines) {
      for (const [name, version] of Object.entries(parsed.engines)) {
        rows.push({ name: `node (${name})`, version, kind: "runtime" });
      }
    }

    rows.sort((a, b) => {
      const ai = priority.indexOf(a.name);
      const bi = priority.indexOf(b.name);
      if (ai !== -1 || bi !== -1) {
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      }
      return a.name.localeCompare(b.name);
    });

    return rows.slice(0, 14);
  } catch {
    return [];
  }
}

export function excerptReadme(content: string, maxChars = 500): string {
  const trimmed = content.trim();
  if (!trimmed) return "";
  const withoutFrontmatter = trimmed.replace(/^---[\s\S]*?---\s*/, "");
  const plain = withoutFrontmatter
    .replace(/^#+\s+/gm, "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`{1,3}[^`]+`{1,3}/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (plain.length <= maxChars) return plain;
  return `${plain.slice(0, maxChars - 1).trim()}…`;
}

export function parseDeploymentHints(input: {
  packageJson?: string | null;
  renderYaml?: string | null;
}): Array<{ label: string; value: string; path: string }> {
  const hints: Array<{ label: string; value: string; path: string }> = [];

  if (input.packageJson) {
    try {
      const parsed = JSON.parse(input.packageJson) as { scripts?: Record<string, string> };
      const deployKeys = ["deploy", "start", "build", "dev", "preview"];
      for (const key of deployKeys) {
        const script = parsed.scripts?.[key];
        if (script) hints.push({ label: `npm run ${key}`, value: script, path: "package.json" });
      }
    } catch {
      // ignore
    }
  }

  if (input.renderYaml) {
    const serviceMatch = input.renderYaml.match(/^\s*-\s*type:\s*(\w+)/m);
    const nameMatch = input.renderYaml.match(/^\s*name:\s*(.+)$/m);
    if (serviceMatch?.[1]) {
      hints.push({
        label: "Render service type",
        value: serviceMatch[1],
        path: "render.yaml",
      });
    }
    if (nameMatch?.[1]) {
      hints.push({
        label: "Render service name",
        value: nameMatch[1].trim(),
        path: "render.yaml",
      });
    }
  }

  return hints.slice(0, 8);
}
