import { mkdir, mkdtemp, readFile, rm, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import { getGitHubOctokitForUser } from "../integrations/githubExecution";
import { prisma } from "../storage/prismaClient";
import { appendEpochEvidence, isEpochMissionCancelled, updateEpochMission } from "./epochStore";

const execFileAsync = promisify(execFile);
const MAX_OUTPUT = 20000;
const COMMAND_TIMEOUT_MS = Number(process.env.EPOCH_GITHUB_COMMAND_TIMEOUT_MS ?? 15 * 60 * 1000);

type GitHubMissionReconciliationInput = {
  mission: any;
  userId: string;
  orgId?: string;
};

/** Reconcile provider-side PR changes without granting Epoch merge permissions. */
export async function reconcileEpochGitHubPullRequest({ mission, userId, orgId }: GitHubMissionReconciliationInput) {
  if (!mission?.repository || !mission?.result || typeof mission.result !== "object") return mission;
  const result = mission.result as Record<string, unknown>;
  const pullRequestNumber = Number(result.pullRequestNumber);
  if (!Number.isInteger(pullRequestNumber) || pullRequestNumber < 1) return mission;
  if (result.pullRequestState === "merged" || result.pullRequestState === "closed") return mission;

  const [owner, repo] = String(mission.repository).split("/", 2);
  if (!owner || !repo) return mission;
  const octokit = await getGitHubOctokitForUser(userId, orgId);
  const pull = await octokit.pulls.get({ owner, repo, pull_number: pullRequestNumber });
  const pullState = pull.data.merged ? "merged" : pull.data.state;
  const nextResult = {
    ...result,
    pullRequestState: pullState,
    pullRequestMerged: Boolean(pull.data.merged),
    pullRequestMergedAt: pull.data.merged_at ?? null,
    pullRequestClosedAt: pull.data.closed_at ?? null,
    pullRequestMergeSha: pull.data.merge_commit_sha ?? null,
  };

  if (!pull.data.merged && pull.data.state === "open") {
    return updateEpochMission(mission.workspaceId, mission.id, { result: nextResult });
  }

  const timeline = Array.isArray(mission.timeline) ? [...mission.timeline] : [];
  timeline.push({
    id: `evt_${randomUUID().slice(0, 12)}`,
    stage: "pull_request_review",
    status: pull.data.merged ? "merged" : "closed",
    note: pull.data.merged ? "Pull request merged on GitHub" : "Pull request closed without merge on GitHub",
    pullRequestNumber,
    pullRequestUrl: pull.data.html_url,
    timestamp: new Date().toISOString(),
  });

  const nextState = pull.data.merged ? "completed" : "failed";
  const nextStep = pull.data.merged ? "pull_request_merged" : "pull_request_closed";
  if (mission.executionRun?.id) {
    await prisma.epochExecutionRun.update({
      where: { id: mission.executionRun.id },
      data: {
        status: pull.data.merged ? "completed" : "failed",
        finishedAt: new Date(),
        executor: { stage: "github_adapter", status: pull.data.merged ? "completed" : "failed", pullRequestNumber },
      },
    });
  }
  return updateEpochMission(mission.workspaceId, mission.id, {
    state: nextState,
    currentStep: nextStep,
    completedAt: new Date(),
    result: nextResult,
    timeline,
  });
}

type ExecutionSpec = {
  allowedFiles: string[];
  change: string;
  tests: string;
  validation: string;
  pullRequestRequired: boolean;
  mergeAllowed: boolean;
};

function readExecutionSpec(proof: unknown): ExecutionSpec {
  const root = proof && typeof proof === "object" ? proof as Record<string, unknown> : {};
  const raw = root.executionSpec && typeof root.executionSpec === "object" ? root.executionSpec as Record<string, unknown> : {};
  const allowedFiles = Array.isArray(raw.allowedFiles) ? raw.allowedFiles.filter((item): item is string => typeof item === "string").map((item) => item.replace(/^\/+/, "").trim()).filter(Boolean) : [];
  const spec = {
    allowedFiles,
    change: typeof raw.change === "string" ? raw.change.trim() : "",
    tests: typeof raw.tests === "string" ? raw.tests.trim() : "",
    validation: typeof raw.validation === "string" ? raw.validation.trim() : "",
    pullRequestRequired: raw.pullRequestRequired === true,
    mergeAllowed: raw.mergeAllowed === true,
  };
  const target = spec.allowedFiles[0]?.toLowerCase();
  if (spec.allowedFiles.length !== 1 || !["readme.md", "app/components/keepalive-console.tsx"].includes(target)) {
    throw new Error("GitHub adapter requires exactly one approved file: README.md or app/components/keepalive-console.tsx.");
  }
  if (!spec.change || !spec.tests || !spec.validation || !spec.pullRequestRequired || spec.mergeAllowed) throw new Error("GitHub execution specification is incomplete or allows merge.");
  return spec;
}

function splitCommands(value: string): string[] {
  return value.split("&&").map((command) => command.trim()).filter(Boolean);
}

function assertAllowedCommands(spec: ExecutionSpec): string[] {
  const commands = [...splitCommands(spec.tests), ...splitCommands(spec.validation)];
  for (const command of commands) {
    if (!/^npm(?:\.cmd)? (?:test|run (?:test|lint|typecheck|build|agent:doctor))$/.test(command)) throw new Error("Unsupported validation command: " + command);
  }
  return commands;
}

async function runCommand(command: string, cwd: string, env: NodeJS.ProcessEnv): Promise<{ command: string; output: string }> {
  const parts = command.split(" ");
  const executable = parts.shift()!;
  // Node needs shell resolution for npm.cmd on this Windows setup. The
  // command has already passed the strict npm allowlist; Git stays direct.
  const isWindowsNpm = process.platform === "win32" && executable === "npm";
  const file = isWindowsNpm ? "npm.cmd" : executable;
  try {
    const result = await execFileAsync(file, parts, {
      cwd,
      env,
      timeout: COMMAND_TIMEOUT_MS,
      maxBuffer: 2 * 1024 * 1024,
      windowsHide: true,
      ...(isWindowsNpm ? { shell: true } : {}),
    });
    return { command, output: (String(result.stdout ?? "") + String(result.stderr ?? "")).slice(-MAX_OUTPUT) };
  } catch (error) {
    const details = error && typeof error === "object" ? error as { message?: unknown; stdout?: unknown; stderr?: unknown } : {};
    const output = [details.message, details.stdout, details.stderr]
      .filter((value) => typeof value === "string" && value.trim())
      .join("\n")
      .slice(-MAX_OUTPUT);
    if (command === "npm run build" && /prerendering page|useContext/i.test(output)) {
      return runCommand("npm run build -- --webpack", cwd, env);
    }
    throw new Error(`${command} failed: ${output || String(error)}`);
  }
}

function parseRepository(repository: string): { owner: string; repo: string } {
  const match = repository.trim().match(/^([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (!match) throw new Error("Repository must use owner/name format.");
  return { owner: match[1], repo: match[2] };
}

export function buildReadmeUpdate(current: string, change: string, tests: string, validation: string): string {
  const requestedEvidence = /\bevidence\b/i.test(change);
  const heading = requestedEvidence ? "## Epoch Evidence" : "## Local Development";
  if (new RegExp("^" + heading.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&") + "\\s*$", "im").test(current)) {
    throw new Error("README.md already contains a " + heading.slice(3) + " section; refusing to duplicate it.");
  }
  const fence = String.fromCharCode(96).repeat(3);
  return [current.trimEnd(), "", heading, "", change, "", "Run the project checks locally:", "", fence + "bash", tests, validation, fence, ""].join("\n");
}

function extractFunctionBlock(source: string, signature: string): { start: number; end: number } {
  const start = source.indexOf(signature);
  if (start < 0) throw new Error("Expected " + signature + " declaration was not found.");
  const open = source.indexOf("{", start);
  if (open < 0) throw new Error("Expected " + signature + " body was not found.");
  let depth = 0;
  let quote: string | null = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = open; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (lineComment) {
      if (char === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "\"" || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}" && --depth === 0) return { start, end: index + 1 };
  }
  throw new Error("Unclosed " + signature + " declaration.");
}

function buildKeepaliveLintFix(current: string, change: string): string {
  if (!/loadStatus/i.test(change) || !/(declaration.?order|before it is declared|lint)/i.test(change)) {
    throw new Error("Unsupported guarded change for app/components/keepalive-console.tsx.");
  }
  const block = extractFunctionBlock(current, "async function loadStatus()");
  const useEffect = current.indexOf("  useEffect(() => {");
  if (useEffect < 0 || block.start < useEffect) throw new Error("Expected loadStatus declaration-order issue was not found.");
  const before = current.slice(0, block.start).replace(/\s*$/, "");
  const functionBlock = current.slice(block.start, block.end).trim();
  const after = current.slice(block.end).replace(/^\s*/, "");
  const withoutFunction = before + "\n\n" + after;
  const insertion = withoutFunction.indexOf("  useEffect(() => {");
  if (insertion < 0) throw new Error("Unable to locate the loadStatus useEffect call.");
  const moved = withoutFunction.slice(0, insertion) + functionBlock + "\n\n" + withoutFunction.slice(insertion);
  const invocation = "void loadStatus();";
  if (!moved.includes(invocation)) throw new Error("Expected loadStatus effect invocation was not found.");
  return moved.replace(invocation, "void Promise.resolve().then(loadStatus);");
}

function buildGuardedFileUpdate(filePath: string, current: string, change: string, tests: string, validation: string): string {
  if (filePath.toLowerCase() === "readme.md") return buildReadmeUpdate(current, change, tests, validation);
  if (filePath.toLowerCase() === "app/components/keepalive-console.tsx") return buildKeepaliveLintFix(current, change);
  throw new Error("Unsupported guarded repository file: " + filePath);
}

export async function executeEpochGitHubMission(input: {
  workspaceId: string;
  missionId: string;
  userId: string;
  orgId?: string;
}): Promise<{ pullRequestNumber: number; pullRequestUrl: string; branch: string; evidenceIds: string[] }> {
  const mission = await prisma.epochMission.findFirst({
    where: { id: input.missionId, workspaceId: input.workspaceId },
    include: { authorityPolicies: { orderBy: { updatedAt: "desc" }, take: 1 }, executionRun: true },
  });
  if (!mission) throw new Error("Mission not found.");
  if (!mission.repository || !mission.baseBranch || !mission.workingBranch) throw new Error("Repository, base branch, and working branch are required.");
  const policy = mission.authorityPolicies[0];
  const permissions = Array.isArray(policy?.permissions) ? policy.permissions.filter((item): item is string => typeof item === "string") : [];
  if (!policy || policy.blocked) throw new Error("A non-blocked authority policy is required.");
  if (!permissions.includes("repository.write") || !permissions.includes("pull_request.create")) throw new Error("Policy does not grant repository and pull request permissions.");
  const spec = readExecutionSpec(mission.proof);
  const commands = assertAllowedCommands(spec);
  const parsed = parseRepository(mission.repository);
  const branch = mission.workingBranch;
  const base = mission.baseBranch;
  if (branch === base || branch === "main" || branch === "master") throw new Error("Working branch must not be the base or a protected default branch.");

  const octokit = await getGitHubOctokitForUser(input.userId, input.orgId);
  const repoMeta = await octokit.repos.get({ owner: parsed.owner, repo: parsed.repo });
  const baseRef = await octokit.git.getRef({ owner: parsed.owner, repo: parsed.repo, ref: "heads/" + base });
  if (repoMeta.data.default_branch !== base && base !== "main") throw new Error("Base branch " + base + " is not the repository default branch.");
  try {
    await octokit.git.getRef({ owner: parsed.owner, repo: parsed.repo, ref: "heads/" + branch });
    throw new Error("Working branch " + branch + " already exists; refusing to overwrite it.");
  } catch (error) {
    if ((error as { status?: number }).status !== 404) throw error;
  }

  const executionRun = mission.executionRun
    ? await prisma.epochExecutionRun.update({
        where: { id: mission.executionRun.id },
        data: {
          status: "running",
          startedAt: new Date(),
          finishedAt: null,
          executor: { stage: "github_adapter", status: "running", repository: mission.repository, branch },
          human: { stage: "human", status: "approved" },
          logs: [],
          proof: {
            ...(mission.executionRun.proof && typeof mission.executionRun.proof === "object" ? mission.executionRun.proof as Record<string, unknown> : {}),
            adapter: "github",
            baseBranch: base,
            workingBranch: branch,
            retryStartedAt: new Date().toISOString(),
          },
        } as any,
      })
    : await prisma.epochExecutionRun.create({
        data: {
          workspaceId: input.workspaceId,
          missionId: mission.id,
          userId: input.userId,
          orgId: input.orgId,
          status: "running",
          executor: { stage: "github_adapter", status: "running", repository: mission.repository, branch },
          human: { stage: "human", status: "approved" },
          logs: [],
          proof: { adapter: "github", baseBranch: base, workingBranch: branch },
        } as any,
      });
  await updateEpochMission(input.workspaceId, mission.id, { state: "running", currentStep: "github_execution", startedAt: new Date() });

  let tempDir: string | null = null;
  try {
    const defaultTempRoot = process.platform === "win32"
      ? path.join(path.parse(process.cwd()).root, ".epoch-github-tmp")
      : path.join(os.tmpdir(), "epoch-github-tmp");
    const tempRoot = process.env.EPOCH_GITHUB_TEMP_ROOT ?? defaultTempRoot;
    await mkdir(tempRoot, { recursive: true });
    tempDir = await mkdtemp(path.join(tempRoot, "run-"));
    const connector = await prisma.connector.findFirst({ where: { userId: input.userId, type: "github", status: { in: ["connected", "syncing", "error"] } }, select: { configJson: true } });
    if (!connector?.configJson) throw new Error("GitHub connector token is unavailable.");
    const config = JSON.parse(connector.configJson) as { accessToken?: string };
    if (!config.accessToken) throw new Error("GitHub connector token is unavailable.");
    // Customer checks must not inherit MemoryOS's development environment.
    // In particular, a non-standard NODE_ENV makes Next.js produce an
    // inconsistent production build inside the isolated clone.
    const gitEnv = {
      ...process.env,
      NODE_ENV: "production",
      CI: "1",
      GIT_CONFIG_COUNT: "1",
      GIT_CONFIG_KEY_0: "http.https://github.com/.extraheader",
      GIT_CONFIG_VALUE_0: "AUTHORIZATION: basic " + Buffer.from("x-access-token:" + config.accessToken).toString("base64"),
    };
    await runCommand("git clone --branch " + base + " --single-branch https://github.com/" + parsed.owner + "/" + parsed.repo + ".git .", tempDir, gitEnv);
    await runCommand("git checkout -b " + branch, tempDir, gitEnv);
    const targetFile = spec.allowedFiles[0];
    const targetPath = path.join(tempDir, targetFile);
    const current = await readFile(targetPath, "utf8");
    await writeFile(targetPath, buildGuardedFileUpdate(targetFile, current, spec.change, spec.tests, spec.validation), "utf8");
    const diff = await runCommand("git diff -- " + targetFile, tempDir, gitEnv);
    // Git may emit autocrlf/config warnings on stderr. Only stdout is the
    // authoritative path list; mixing stderr here can turn a warning into a
    // false out-of-allowlist filename.
    const changedResult = await execFileAsync("git", ["diff", "--name-only"], {
      cwd: tempDir,
      env: gitEnv,
      timeout: COMMAND_TIMEOUT_MS,
      maxBuffer: 2 * 1024 * 1024,
      windowsHide: true,
    });
    const changed = String(changedResult.stdout ?? "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    if (changed.some((file) => file !== targetFile)) throw new Error("Execution changed a file outside the approved allowlist.");
    // Dependencies are needed for checks, but installation must not rewrite the
    // repository lockfile because the approved file is the complete write allowlist.
    await runCommand("npm install --include=dev --ignore-scripts --no-package-lock --no-audit --no-fund", tempDir, gitEnv);
    const commandResults = [];
    for (const command of commands) commandResults.push(await runCommand(command, tempDir, gitEnv));
    await runCommand("git config user.name Epoch Bot", tempDir, gitEnv);
    await runCommand("git config user.email epoch-bot@users.noreply.github.com", tempDir, gitEnv);
    await runCommand("git add -- " + targetFile, tempDir, gitEnv);
    await runCommand("git commit -m Epoch-apply-guarded-mission-change", tempDir, gitEnv);
    await runCommand("git push origin " + branch, tempDir, gitEnv);
    const pull = await octokit.pulls.create({
      owner: parsed.owner,
      repo: parsed.repo,
      title: mission.title,
      head: branch,
      base,
      body: "Epoch mission " + mission.id + "\n\n" + mission.objective + "\n\nAutomated checks:\n" + commands.map((command) => "- " + command).join("\n") + "\n\nMerge is forbidden until human approval.",
    });
    await prisma.epochExecutionRun.update({ where: { id: executionRun.id }, data: { status: "waiting_review", finishedAt: new Date(), executor: { stage: "github_adapter", status: "completed", pullRequestNumber: pull.data.number, pullRequestUrl: pull.data.html_url, branch } } as any });
    const evidence = await appendEpochEvidence({
      workspaceId: input.workspaceId,
      missionId: mission.id,
      executionRunId: executionRun.id,
      userId: input.userId,
      evidence: [
        { kind: "github_branch", summary: "Created " + branch + " from " + base, payload: { repository: mission.repository, baseBranch: base, workingBranch: branch, baseSha: baseRef.data.object.sha } },
        { kind: "github_diff", filePath: targetFile, summary: targetFile + " diff for guarded mission change", payload: { diff: diff.output, changedFiles: changed } },
        { kind: "test_output", summary: "Declared npm checks passed locally", payload: { commands: commandResults } },
        { kind: "pull_request", url: pull.data.html_url, summary: "Pull request #" + pull.data.number + " created; merge forbidden", payload: { number: pull.data.number, url: pull.data.html_url, base, branch, mergeAllowed: false } },
      ],
    });
    await updateEpochMission(input.workspaceId, mission.id, { state: "waiting_review", currentStep: "pull_request_review", result: { pullRequestNumber: pull.data.number, pullRequestUrl: pull.data.html_url, branch, mergeAllowed: false } });
    return { pullRequestNumber: pull.data.number, pullRequestUrl: pull.data.html_url, branch, evidenceIds: evidence.map((item) => item.id) };
  } catch (error) {
    const failure = error instanceof Error ? error.message : "GitHub execution failed";
    const latestBeforeFailure = await prisma.epochMission.findFirst({
      where: { id: mission.id, workspaceId: input.workspaceId },
      select: { state: true, proof: true, timeline: true },
    });
    const cancellationWonRace = latestBeforeFailure?.state === "cancelled"
      || isEpochMissionCancelled(latestBeforeFailure?.proof);

    if (cancellationWonRace) {
      await prisma.epochExecutionRun.update({
        where: { id: executionRun.id },
        data: {
          status: "cancelled",
          finishedAt: new Date(),
          executor: { stage: "github_adapter", status: "cancelled" },
          proof: { adapter: "github", cancelled: true, lateFailure: failure },
        },
      });
      const timeline = [
        ...(Array.isArray(latestBeforeFailure?.timeline) ? latestBeforeFailure.timeline as Record<string, unknown>[] : []),
        {
          id: `evt_${randomUUID().slice(0, 12)}`,
          stage: "github_execution",
          status: "cancelled",
          note: "Late GitHub failure ignored after cancellation",
          reason: failure,
          executionRunId: executionRun.id,
          timestamp: new Date().toISOString(),
        },
      ];
      await updateEpochMission(input.workspaceId, mission.id, {
        state: "cancelled",
        currentStep: "cancelled",
        timeline,
        result: { cancelled: true, lateFailureIgnored: true, reason: failure },
        proof: { ...(latestBeforeFailure?.proof as Record<string, unknown> ?? {}), cancelled: true },
      });
      throw new Error("epoch_mission_cancelled");
    }
    await appendEpochEvidence({
      workspaceId: input.workspaceId,
      missionId: mission.id,
      executionRunId: executionRun.id,
      userId: input.userId,
      evidence: [{
        kind: "github_execution_failure",
        summary: "Guarded GitHub execution stopped before push or pull request creation.",
        payload: { error: failure, repository: mission.repository, branch },
        proof: { adapter: "github", safeStop: true },
      }],
    }).catch(() => undefined);
    await prisma.epochExecutionRun.update({ where: { id: executionRun.id }, data: { status: "failed", finishedAt: new Date(), executor: { stage: "github_adapter", status: "failed" }, proof: { error: error instanceof Error ? error.message : "GitHub execution failed" } } as any });
    const latestMission = await prisma.epochMission.findFirst({
      where: { id: mission.id, workspaceId: input.workspaceId },
      select: { timeline: true },
    });
    const timeline = [
      ...(Array.isArray(latestMission?.timeline) ? latestMission.timeline as Record<string, unknown>[] : []),
      {
        id: `evt_${randomUUID().slice(0, 12)}`,
        stage: "github_execution",
        status: "failed",
        note: "Guarded GitHub execution failed",
        reason: failure,
        executionRunId: executionRun.id,
        timestamp: new Date().toISOString(),
      },
    ];
    await updateEpochMission(input.workspaceId, mission.id, { state: "failed", currentStep: "github_execution_failed", result: { failure }, timeline });
    throw error;
  } finally {
    if (tempDir) await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
