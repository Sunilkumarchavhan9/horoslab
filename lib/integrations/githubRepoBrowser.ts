import { Octokit } from "@octokit/rest";
import { prisma } from "../storage/prismaClient";

const MAX_FILE_BYTES = 512_000;

async function octokitForUser(userId: string): Promise<Octokit> {
  const row = await prisma.connector.findFirst({
    where: { userId, type: "github", status: "connected" },
  });
  if (!row?.configJson) {
    throw new Error("GitHub is not connected. Connect GitHub in Connected Intelligence Sources first.");
  }
  let token: string | null = null;
  try {
    const config = JSON.parse(row.configJson) as { accessToken?: string };
    token = typeof config.accessToken === "string" ? config.accessToken : null;
  } catch {
    token = null;
  }
  if (!token) {
    throw new Error("GitHub is not connected. Connect GitHub in Connected Intelligence Sources first.");
  }
  return new Octokit({ auth: token });
}

export type GitHubRepoEntry = {
  name: string;
  path: string;
  type: "file" | "dir";
  size?: number;
};

export async function listGitHubRepoContents(input: {
  userId: string;
  owner: string;
  repo: string;
  path?: string;
  ref?: string;
}): Promise<{ entries: GitHubRepoEntry[]; ref: string }> {
  const octokit = await octokitForUser(input.userId);
  const { data: repoMeta } = await octokit.repos.get({
    owner: input.owner.trim(),
    repo: input.repo.trim(),
  });
  const ref = input.ref?.trim() || repoMeta.default_branch || "main";
  const path = (input.path ?? "").replace(/^\//, "");

  const { data } = await octokit.repos.getContent({
    owner: input.owner.trim(),
    repo: input.repo.trim(),
    path: path || undefined,
    ref,
  });

  const items = Array.isArray(data) ? data : [data];
  const entries: GitHubRepoEntry[] = items
    .map((item) => ({
      name: item.name,
      path: item.path,
      type: item.type === "dir" ? ("dir" as const) : ("file" as const),
      size: item.size,
    }))
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  return { entries, ref };
}

export async function readGitHubRepoFile(input: {
  userId: string;
  owner: string;
  repo: string;
  path: string;
  ref?: string;
}): Promise<{ path: string; content: string; ref: string; sha: string | null }> {
  const octokit = await octokitForUser(input.userId);
  const { data: repoMeta } = await octokit.repos.get({
    owner: input.owner.trim(),
    repo: input.repo.trim(),
  });
  const ref = input.ref?.trim() || repoMeta.default_branch || "main";
  const path = input.path.replace(/^\//, "");

  const { data } = await octokit.repos.getContent({
    owner: input.owner.trim(),
    repo: input.repo.trim(),
    path,
    ref,
  });

  if (Array.isArray(data) || data.type !== "file") {
    throw new Error("Path is not a file.");
  }
  if (typeof data.size === "number" && data.size > MAX_FILE_BYTES) {
    throw new Error(`File is too large to open in the browser IDE (${data.size} bytes).`);
  }
  if (!("content" in data) || typeof data.content !== "string") {
    throw new Error("Could not read file content.");
  }

  const content = Buffer.from(data.content, "base64").toString("utf8");
  return {
    path: data.path,
    content,
    ref,
    sha: typeof data.sha === "string" ? data.sha : null,
  };
}
