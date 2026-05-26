/** In-browser demo workspace when GitHub is not connected. */
export type DemoTreeNode = {
  name: string;
  path: string;
  type: "file" | "dir";
  children?: DemoTreeNode[];
};

export type DemoWorkspaceFile = {
  path: string;
  content: string;
  language: string;
};

const FILES: DemoWorkspaceFile[] = [
  {
    path: "README.md",
    language: "markdown",
    content: `# MemoryOS Workbench (demo)

Connect **GitHub** in the developer console to browse a real repository.

This demo shows Editor mode with Company Brain context:
- Edit files locally in the browser
- Review changes in the right panel
- Propose commits with approval gates
`,
  },
  {
    path: "memoryos-frontend/components/developer-console/continuity-lab-session-view.tsx",
    language: "typescript",
    content: `// MemoryOS Continuity Lab — session shell
// Switch Agent ↔ Editor in the header.
// Company context flows from Slack, Jira, GitHub memories.

export function ContinuityLabSessionView() {
  // Agent mode: threads + chat + review
  // Editor mode: file tree + Monaco + review
}
`,
  },
  {
    path: "lib/company-brain.ts",
    language: "typescript",
    content: `/** Company Brain pillars: ingest, structure, execute, continue, operate */
export const COMPANY_BRAIN_PILLARS = [
  { id: "ingest", label: "Ingest" },
  { id: "continue", label: "Continue" },
];
`,
  },
];

function buildTree(files: DemoWorkspaceFile[]): DemoTreeNode[] {
  const root: DemoTreeNode[] = [];
  for (const file of files) {
    const segments = file.path.split("/");
    const fileName = segments.pop()!;
    let nodes = root;
    let pathSoFar = "";
    for (const segment of segments) {
      pathSoFar = pathSoFar ? `${pathSoFar}/${segment}` : segment;
      let dir = nodes.find((n) => n.name === segment && n.type === "dir");
      if (!dir) {
        dir = { name: segment, path: pathSoFar, type: "dir", children: [] };
        nodes.push(dir);
      }
      nodes = dir.children!;
    }
    nodes.push({ name: fileName, path: file.path, type: "file" });
  }
  const sortNodes = (list: DemoTreeNode[]): DemoTreeNode[] =>
    [...list]
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
      .map((n) => (n.children ? { ...n, children: sortNodes(n.children) } : n));
  return sortNodes(root);
}

export const DEMO_WORKSPACE_TREE = buildTree(FILES);

export function getDemoFile(path: string): DemoWorkspaceFile | undefined {
  return FILES.find((f) => f.path === path);
}

export function languageForPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    json: "json",
    md: "markdown",
    css: "css",
    py: "python",
    rs: "rust",
    go: "go",
  };
  return map[ext] ?? "plaintext";
}
