"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ContinuityLabCodeEditor } from "@/components/developer-console/continuity-lab-code-editor";
import {
  DEMO_WORKSPACE_TREE,
  getDemoFile,
  type DemoTreeNode,
} from "@/components/developer-console/continuity-lab-demo-workspace";
import {
  computeLineDiff,
  fetchGitHubRepos,
  fetchRepoContents,
  fetchRepoFile,
  type GitHubDirEntry,
  type LabFileChange,
  type RepoRef,
} from "@/lib/continuity-lab-editor";
import {
  desktopListDirectory,
  desktopOpenFolder,
  desktopReadFile,
  isMemoryOsDesktop,
  type LocalFsEntry,
} from "@/lib/memoryos-desktop";
import { cn } from "@/lib/utils";

type OpenFile = {
  path: string;
  original: string;
  current: string;
  ref?: string;
};

type WorkspaceSource = "local" | "github" | "demo";

type ContinuityLabEditorWorkbenchProps = {
  githubConnected: boolean;
  localWorkspaceRoot: string | null;
  onLocalWorkspaceRootChange: (root: string | null) => void;
  savedPaths?: Record<string, string>;
  onFileChangesChange: (changes: LabFileChange[]) => void;
  onActiveFileChange?: (path: string | null) => void;
  onRepoChange?: (repo: RepoRef | null) => void;
};

export function ContinuityLabEditorWorkbench({
  githubConnected,
  localWorkspaceRoot,
  onLocalWorkspaceRootChange,
  savedPaths = {},
  onFileChangesChange,
  onActiveFileChange,
  onRepoChange,
}: ContinuityLabEditorWorkbenchProps) {
  const isDesktop = isMemoryOsDesktop();
  const [repos, setRepos] = useState<RepoRef[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [branch, setBranch] = useState("main");
  const [source, setSource] = useState<WorkspaceSource>(() =>
    localWorkspaceRoot ? "local" : !githubConnected ? "demo" : "github",
  );
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(() => new Set());
  const [dirChildren, setDirChildren] = useState<Record<string, GitHubDirEntry[]>>({});
  const [localDirChildren, setLocalDirChildren] = useState<Record<string, LocalFsEntry[]>>({});
  const [loadingPath, setLoadingPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);

  const repo = repos.find((r) => r.fullName === selectedRepo);

  useEffect(() => {
    if (localWorkspaceRoot) setSource("local");
  }, [localWorkspaceRoot]);

  useEffect(() => {
    setOpenFiles((files) =>
      files.map((f) => {
        const saved = savedPaths[f.path];
        if (saved === undefined) return f;
        return { ...f, original: saved, current: saved };
      }),
    );
  }, [savedPaths]);

  const fileChanges = useMemo((): LabFileChange[] => {
    return openFiles
      .filter((f) => f.current !== f.original)
      .map((f) => ({ path: f.path, original: f.original, current: f.current }));
  }, [openFiles]);

  useEffect(() => {
    onFileChangesChange(fileChanges);
  }, [fileChanges, onFileChangesChange]);

  useEffect(() => {
    onActiveFileChange?.(activePath);
  }, [activePath, onActiveFileChange]);

  useEffect(() => {
    if (source === "local") {
      onRepoChange?.(null);
    } else if (source === "demo") {
      onRepoChange?.(null);
    } else {
      onRepoChange?.(repo ?? null);
    }
  }, [source, repo, onRepoChange]);

  const loadRepos = useCallback(async () => {
    if (!githubConnected) return;
    try {
      const list = await fetchGitHubRepos(50);
      setRepos(list);
      setSelectedRepo((prev) => prev || list[0]?.fullName || "");
      setBranch(list[0]?.defaultBranch ?? "main");
    } catch {
      // best-effort
    }
  }, [githubConnected]);

  useEffect(() => {
    void loadRepos();
  }, [loadRepos]);

  const loadLocalDirectory = useCallback(
    async (relativePath: string): Promise<void> => {
      if (!localWorkspaceRoot) return;
      setLoadingPath(relativePath || "/");
      setError(null);
      try {
        const entries = await desktopListDirectory(localWorkspaceRoot, relativePath);
        setLocalDirChildren((c) => ({ ...c, [relativePath]: entries }));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load folder");
      } finally {
        setLoadingPath(null);
      }
    },
    [localWorkspaceRoot],
  );

  useEffect(() => {
    if (source !== "local" || !localWorkspaceRoot) return;
    setLocalDirChildren({});
    setExpandedDirs(new Set());
    void loadLocalDirectory("");
  }, [source, localWorkspaceRoot, loadLocalDirectory]);

  const loadDirectory = useCallback(
    async (path: string): Promise<void> => {
      if (!repo || source !== "github") return;
      setLoadingPath(path || "/");
      setError(null);
      try {
        const { entries, ref } = await fetchRepoContents(repo.owner, repo.name, path, branch);
        setBranch(ref);
        setDirChildren((c) => ({ ...c, [path]: entries }));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load folder");
      } finally {
        setLoadingPath(null);
      }
    },
    [repo, source, branch],
  );

  useEffect(() => {
    if (source !== "github" || !repo) return;
    setBranch(repo.defaultBranch);
    setDirChildren({});
    setExpandedDirs(new Set());
    void fetchRepoContents(repo.owner, repo.name, "", repo.defaultBranch)
      .then(({ entries, ref }) => {
        setBranch(ref);
        setDirChildren({ "": entries });
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Could not load repository");
      });
  }, [repo?.fullName, source]);

  async function handleOpenFolder(): Promise<void> {
    const folder = await desktopOpenFolder();
    if (!folder) return;
    onLocalWorkspaceRootChange(folder);
    setSource("local");
    setOpenFiles([]);
    setActivePath(null);
    setError(null);
  }

  async function openFilePath(path: string): Promise<void> {
    setError(null);
    const existing = openFiles.find((f) => f.path === path);
    if (existing) {
      setActivePath(path);
      return;
    }

    if (source === "demo") {
      const demo = getDemoFile(path);
      if (!demo) return;
      setOpenFiles((files) => [...files, { path, original: demo.content, current: demo.content }]);
      setActivePath(path);
      return;
    }

    if (source === "local" && localWorkspaceRoot) {
      setLoadingPath(path);
      try {
        const content = await desktopReadFile(localWorkspaceRoot, path);
        setOpenFiles((files) => [...files, { path, original: content, current: content }]);
        setActivePath(path);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not open file");
      } finally {
        setLoadingPath(null);
      }
      return;
    }

    if (!repo) return;
    setLoadingPath(path);
    try {
      const { content, ref } = await fetchRepoFile(repo.owner, repo.name, path, branch);
      setBranch(ref);
      setOpenFiles((files) => [...files, { path, original: content, current: content, ref }]);
      setActivePath(path);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open file");
    } finally {
      setLoadingPath(null);
    }
  }

  function toggleDir(path: string): void {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
        if (source === "local" && localWorkspaceRoot && !localDirChildren[path]) {
          void loadLocalDirectory(path);
        } else if (source === "github" && repo && !dirChildren[path]) {
          void loadDirectory(path);
        }
      }
      return next;
    });
  }

  function updateActiveContent(next: string): void {
    if (!activePath) return;
    setOpenFiles((files) =>
      files.map((f) => (f.path === activePath ? { ...f, current: next } : f)),
    );
  }

  function closeTab(path: string, event?: React.MouseEvent): void {
    event?.stopPropagation();
    setOpenFiles((files) => files.filter((f) => f.path !== path));
    if (activePath === path) {
      const remaining = openFiles.filter((f) => f.path !== path);
      setActivePath(remaining[remaining.length - 1]?.path ?? null);
    }
  }

  const activeFile = openFiles.find((f) => f.path === activePath);
  const dirtyCount = fileChanges.length;
  const folderLabel =
    source === "local" && localWorkspaceRoot
      ? localWorkspaceRoot.split(/[/\\]/).pop() ?? localWorkspaceRoot
      : repo
        ? `${repo.fullName} @ ${branch}`
        : "Demo workspace";

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#1e1e1e]">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/[0.08] bg-[#252526] px-2 py-1.5">
        {isDesktop ? (
          <button
            type="button"
            onClick={() => void handleOpenFolder()}
            className="rounded border border-white/10 bg-[#3c3c3c] px-2 py-1 text-xs text-[#ececec] hover:bg-[#454545]"
          >
            Open folder
          </button>
        ) : null}
        <select
          value={source}
          onChange={(e) => {
            const next = e.target.value as WorkspaceSource;
            if (next === "local" && !localWorkspaceRoot && isDesktop) {
              void handleOpenFolder();
              return;
            }
            setSource(next);
            setOpenFiles([]);
            setActivePath(null);
          }}
          className="rounded border border-white/10 bg-[#3c3c3c] px-2 py-1 text-xs text-[#ececec]"
        >
          {isDesktop && localWorkspaceRoot ? <option value="local">Local folder</option> : null}
          {githubConnected ? <option value="github">GitHub</option> : null}
          <option value="demo">Demo</option>
        </select>
        {source === "github" && githubConnected ? (
          <select
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            className="max-w-[180px] truncate rounded border border-white/10 bg-[#3c3c3c] px-2 py-1 text-xs text-[#ececec]"
          >
            {repos.map((r) => (
              <option key={r.fullName} value={r.fullName}>
                {r.fullName}
              </option>
            ))}
          </select>
        ) : null}
        <span className="min-w-0 truncate text-xs text-[#8e8e8e]">{folderLabel}</span>
        {dirtyCount > 0 ? (
          <span className="ml-auto text-xs text-[#f59e0b]">
            {dirtyCount} modified
          </span>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[220px] shrink-0 flex-col border-r border-white/[0.08] bg-[#252526]">
          <p className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-[#8e8e8e]">
            Explorer
          </p>
          <div className="min-h-0 flex-1 overflow-y-auto px-1 pb-2 font-mono text-[12px]">
            {source === "demo" ? (
              <DemoTree
                nodes={DEMO_WORKSPACE_TREE}
                expanded={expandedDirs}
                activePath={activePath}
                onToggle={toggleDir}
                onOpen={openFilePath}
              />
            ) : source === "local" && localWorkspaceRoot ? (
              <LocalTree
                rootEntries={localDirChildren[""] ?? []}
                dirChildren={localDirChildren}
                expanded={expandedDirs}
                loadingPath={loadingPath}
                activePath={activePath}
                onToggle={toggleDir}
                onOpen={openFilePath}
                onLoadRoot={() => void loadLocalDirectory("")}
              />
            ) : source === "github" && repo ? (
              <GitHubTree
                rootEntries={dirChildren[""] ?? []}
                dirChildren={dirChildren}
                expanded={expandedDirs}
                loadingPath={loadingPath}
                activePath={activePath}
                onToggle={toggleDir}
                onOpen={openFilePath}
                onLoadRoot={() => void loadDirectory("")}
              />
            ) : (
              <p className="px-2 py-2 text-xs text-[#8e8e8e]">
                {isDesktop ? "Open a folder to browse local files." : "Connect GitHub or use Demo."}
              </p>
            )}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {openFiles.length > 0 ? (
            <div className="flex shrink-0 overflow-x-auto border-b border-white/[0.08] bg-[#2d2d2d]">
              {openFiles.map((f) => {
                const dirty = f.current !== f.original;
                return (
                  <button
                    key={f.path}
                    type="button"
                    onClick={() => setActivePath(f.path)}
                    className={cn(
                      "group flex max-w-[200px] shrink-0 items-center gap-1 border-r border-white/[0.06] px-3 py-1.5 text-xs",
                      activePath === f.path
                        ? "bg-[#1e1e1e] text-[#ececec]"
                        : "text-[#8e8e8e] hover:bg-[#1e1e1e]/60",
                    )}
                  >
                    <span className="truncate">{f.path.split("/").pop()}</span>
                    {dirty ? <span className="text-[#f59e0b]">●</span> : null}
                    <span
                      role="button"
                      tabIndex={0}
                      className="ml-1 opacity-0 group-hover:opacity-100"
                      onClick={(e) => closeTab(f.path, e)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") closeTab(f.path);
                      }}
                    >
                      ×
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

          {error ? (
            <p className="shrink-0 bg-red-950/50 px-3 py-2 text-xs text-red-300">{error}</p>
          ) : null}

          {activeFile ? (
            <div className="min-h-0 flex-1">
              <div className="border-b border-white/[0.06] px-3 py-1 text-[11px] text-[#8e8e8e]">
                {activeFile.path}
                {activeFile.current !== activeFile.original ? (
                  <span className="ml-2 text-[#f59e0b]">Modified</span>
                ) : null}
              </div>
              <div className="h-[calc(100%-28px)] min-h-[280px]">
                <ContinuityLabCodeEditor
                  path={activeFile.path}
                  value={activeFile.current}
                  onChange={updateActiveContent}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <p className="text-sm text-[#ececec]">Open a file from the explorer</p>
              <p className="mt-2 max-w-sm text-xs text-[#8e8e8e]">
                {source === "local"
                  ? "Save to disk from Review, or propose to GitHub when connected."
                  : "Propose commits in Review — approve before anything hits GitHub."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LocalTree({
  rootEntries,
  dirChildren,
  expanded,
  loadingPath,
  activePath,
  onToggle,
  onOpen,
  onLoadRoot,
  depth = 0,
  parentPath = "",
}: {
  rootEntries: LocalFsEntry[];
  dirChildren: Record<string, LocalFsEntry[]>;
  expanded: Set<string>;
  loadingPath: string | null;
  activePath: string | null;
  onToggle: (path: string) => void;
  onOpen: (path: string) => void;
  onLoadRoot: () => void;
  depth?: number;
  parentPath?: string;
}) {
  useEffect(() => {
    if (depth === 0 && rootEntries.length === 0) onLoadRoot();
  }, [depth, rootEntries.length, onLoadRoot]);

  const entries = depth === 0 ? rootEntries : dirChildren[parentPath] ?? [];

  return (
    <ul className={depth > 0 ? "ml-3" : ""}>
      {entries.map((node) => (
        <li key={node.path}>
          {node.type === "dir" ? (
            <>
              <button
                type="button"
                onClick={() => onToggle(node.path)}
                className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[#cccccc] hover:bg-white/5"
              >
                <span className="text-[10px]">
                  {loadingPath === node.path ? "…" : expanded.has(node.path) ? "▼" : "▶"}
                </span>
                <span className="truncate">{node.name}</span>
              </button>
              {expanded.has(node.path) ? (
                <LocalTree
                  rootEntries={[]}
                  dirChildren={dirChildren}
                  expanded={expanded}
                  loadingPath={loadingPath}
                  activePath={activePath}
                  onToggle={onToggle}
                  onOpen={onOpen}
                  onLoadRoot={onLoadRoot}
                  depth={depth + 1}
                  parentPath={node.path}
                />
              ) : null}
            </>
          ) : (
            <button
              type="button"
              onClick={() => onOpen(node.path)}
              className={cn(
                "flex w-full items-center gap-1 rounded px-2 py-0.5 text-left hover:bg-white/5",
                activePath === node.path ? "bg-[#37373d] text-[#ececec]" : "text-[#cccccc]",
              )}
            >
              <span className="text-[#519aba]">◇</span>
              <span className="truncate">{node.name}</span>
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

function DemoTree({
  nodes,
  expanded,
  activePath,
  onToggle,
  onOpen,
  depth = 0,
}: {
  nodes: DemoTreeNode[];
  expanded: Set<string>;
  activePath: string | null;
  onToggle: (path: string) => void;
  onOpen: (path: string) => void;
  depth?: number;
}) {
  return (
    <ul className={depth > 0 ? "ml-3" : ""}>
      {nodes.map((node) => (
        <li key={node.path}>
          {node.type === "dir" ? (
            <>
              <button
                type="button"
                onClick={() => onToggle(node.path)}
                className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[#cccccc] hover:bg-white/5"
              >
                <span className="text-[10px]">{expanded.has(node.path) ? "▼" : "▶"}</span>
                <span className="truncate">{node.name}</span>
              </button>
              {expanded.has(node.path) && node.children ? (
                <DemoTree
                  nodes={node.children}
                  expanded={expanded}
                  activePath={activePath}
                  onToggle={onToggle}
                  onOpen={onOpen}
                  depth={depth + 1}
                />
              ) : null}
            </>
          ) : (
            <button
              type="button"
              onClick={() => onOpen(node.path)}
              className={cn(
                "flex w-full items-center gap-1 rounded px-2 py-0.5 text-left hover:bg-white/5",
                activePath === node.path ? "bg-[#37373d] text-[#ececec]" : "text-[#cccccc]",
              )}
            >
              <span className="text-[#519aba]">◇</span>
              <span className="truncate">{node.name}</span>
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

function GitHubTree({
  rootEntries,
  dirChildren,
  expanded,
  loadingPath,
  activePath,
  onToggle,
  onOpen,
  onLoadRoot,
  depth = 0,
  parentPath = "",
}: {
  rootEntries: GitHubDirEntry[];
  dirChildren: Record<string, GitHubDirEntry[]>;
  expanded: Set<string>;
  loadingPath: string | null;
  activePath: string | null;
  onToggle: (path: string) => void;
  onOpen: (path: string) => void;
  onLoadRoot: () => void;
  depth?: number;
  parentPath?: string;
}) {
  useEffect(() => {
    if (depth === 0 && rootEntries.length === 0) onLoadRoot();
  }, [depth, rootEntries.length, onLoadRoot]);

  const entries = depth === 0 ? rootEntries : dirChildren[parentPath] ?? [];

  return (
    <ul className={depth > 0 ? "ml-3" : ""}>
      {entries.map((node) => (
        <li key={node.path}>
          {node.type === "dir" ? (
            <>
              <button
                type="button"
                onClick={() => onToggle(node.path)}
                className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[#cccccc] hover:bg-white/5"
              >
                <span className="text-[10px]">
                  {loadingPath === node.path ? "…" : expanded.has(node.path) ? "▼" : "▶"}
                </span>
                <span className="truncate">{node.name}</span>
              </button>
              {expanded.has(node.path) ? (
                <GitHubTree
                  rootEntries={[]}
                  dirChildren={dirChildren}
                  expanded={expanded}
                  loadingPath={loadingPath}
                  activePath={activePath}
                  onToggle={onToggle}
                  onOpen={onOpen}
                  onLoadRoot={onLoadRoot}
                  depth={depth + 1}
                  parentPath={node.path}
                />
              ) : null}
            </>
          ) : (
            <button
              type="button"
              onClick={() => onOpen(node.path)}
              className={cn(
                "flex w-full items-center gap-1 rounded px-2 py-0.5 text-left hover:bg-white/5",
                activePath === node.path ? "bg-[#37373d] text-[#ececec]" : "text-[#cccccc]",
              )}
            >
              <span className="text-[#519aba]">◇</span>
              <span className="truncate">{node.name}</span>
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

export { computeLineDiff };
