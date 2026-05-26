import { getOrCreateMemoryTokenWithRetry } from "@/lib/memory-token";

export type LabFileChange = {
  path: string;
  original: string;
  current: string;
};

export type RepoRef = {
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
};

export type GitHubDirEntry = {
  name: string;
  path: string;
  type: "file" | "dir";
  size?: number;
};

async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getOrCreateMemoryTokenWithRetry({ attempts: 2, delayMs: 200 });
  if (!token) throw new Error("Missing auth token");
  return fetch(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

export async function fetchGitHubRepos(limit = 40): Promise<RepoRef[]> {
  const res = await authFetch(`/api/connector/github/repos?limit=${limit}`);
  if (!res.ok) throw new Error("Could not load repositories");
  const payload = (await res.json()) as {
    data?: { repos?: Array<{ fullName: string; owner: string; name: string; defaultBranch: string }> };
  };
  return (payload.data?.repos ?? []).map((r) => ({
    fullName: r.fullName,
    owner: r.owner,
    name: r.name,
    defaultBranch: r.defaultBranch,
  }));
}

export async function fetchRepoContents(
  owner: string,
  repo: string,
  path: string,
  ref?: string,
): Promise<{ entries: GitHubDirEntry[]; ref: string }> {
  const qs = new URLSearchParams();
  if (path) qs.set("path", path);
  if (ref) qs.set("ref", ref);
  const res = await authFetch(
    `/api/connector/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents?${qs}`,
  );
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(err?.error ?? `List failed (${res.status})`);
  }
  const payload = (await res.json()) as {
    data?: { entries?: GitHubDirEntry[]; ref?: string };
  };
  return {
    entries: payload.data?.entries ?? [],
    ref: payload.data?.ref ?? "main",
  };
}

export async function fetchRepoFile(
  owner: string,
  repo: string,
  path: string,
  ref?: string,
): Promise<{ content: string; ref: string }> {
  const qs = new URLSearchParams({ path });
  if (ref) qs.set("ref", ref);
  const res = await authFetch(
    `/api/connector/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/file?${qs}`,
  );
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(err?.error ?? `Read failed (${res.status})`);
  }
  const payload = (await res.json()) as { data?: { content?: string; ref?: string } };
  return {
    content: payload.data?.content ?? "",
    ref: payload.data?.ref ?? "main",
  };
}

export function computeLineDiff(original: string, current: string): { added: number; removed: number } {
  const oLines = original.split("\n");
  const cLines = current.split("\n");
  const removed = oLines.filter((l, i) => cLines[i] !== l).length;
  const added = cLines.filter((l, i) => oLines[i] !== l).length;
  return { added, removed };
}

export async function proposeFileCommit(input: {
  owner: string;
  repo: string;
  path: string;
  content: string;
  branch?: string;
}): Promise<{ id: string }> {
  const res = await authFetch("/api/connector/github/execution/propose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind: "brief_file_commit",
      owner: input.owner,
      repo: input.repo,
      filePath: input.path,
      body: input.content,
      baseBranch: input.branch,
    }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(err?.error ?? `Propose failed (${res.status})`);
  }
  const payload = (await res.json()) as { data?: { proposal?: { id: string } } };
  const id = payload.data?.proposal?.id;
  if (!id) throw new Error("No proposal id returned");
  return { id };
}
