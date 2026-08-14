import "dotenv/config";
import { spawn } from "child_process";
import {
  buildCodexMemoryOsPrompt,
  buildCodexSessionImportContent,
} from "../lib/integrations/codexBridge";
import { writeEngineeringSignalExportUpload } from "../lib/integrations/engineeringSignalUpload";
import {
  argValue,
  getMemoryIgnitionBrief,
  invokeMemoryOs,
  postMemoryOs,
  saveMemoryIgnitionOutcome,
} from "./codex-memoryos-http";

function isToolError(value: unknown): value is { error: string } {
  return typeof value === "object" && value !== null && typeof (value as { error?: unknown }).error === "string";
}

function runCodexExec(prompt: string): Promise<{ stdout: string; stderr: string; status: number | null }> {
  return new Promise((resolve, reject) => {
    const args = ["exec", "-"];
    const sandbox = argValue("sandbox");
    if (sandbox) args.push("--sandbox", sandbox);
    if (argValue("json") === "true") args.push("--json");
    const child = spawn("codex", args, {
      stdio: ["pipe", "pipe", "pipe"],
      shell: process.platform === "win32",
    });
    let stdout = "";
    let stderr = "";
    child.stdin.on("error", reject);
    child.stdin.write(prompt);
    child.stdin.end();
    child.stdout.on("data", (chunk: Buffer) => {
      const text = chunk.toString("utf8");
      stdout += text;
      process.stdout.write(text);
    });
    child.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString("utf8");
      stderr += text;
      process.stderr.write(text);
    });
    child.on("error", reject);
    child.on("close", (status) => resolve({ stdout, stderr, status }));
  });
}

async function main(): Promise<void> {
  const task = argValue("task") ?? process.argv.slice(2).filter((arg) => !arg.startsWith("--")).join(" ");
  if (!task.trim()) {
    throw new Error("Provide --task \"...\" or a task argument.");
  }

  const threadId = argValue("thread-id") ?? `codex-${Date.now()}`;
  const project = argValue("project") ?? "MemoryOS";
  const briefInput = {
    question: task,
    task,
    project,
    threadId,
    agent_id: argValue("agent-id") ?? "codex",
    risk_level: argValue("risk-level") ?? "medium",
    mode: "resume",
  };
  let brief: unknown;
  let briefUsedDirectFallback = false;
  try {
    brief = await invokeMemoryOs("memoryignition_get_brief", briefInput);
    if (isToolError(brief)) {
      throw new Error(brief.error);
    }
  } catch (error) {
    console.warn(
      "[MemoryOS] MCP brief unavailable; using direct /api/memory/memoryignition/brief fallback.",
      error instanceof Error ? error.message : String(error),
    );
    brief = await getMemoryIgnitionBrief(briefInput);
    briefUsedDirectFallback = true;
  }
  const prompt = buildCodexMemoryOsPrompt({ task, brief });
  console.log("[MemoryOS] Streaming MemoryIgnition brief to Codex through stdin.");
  const result = await runCodexExec(prompt);
  const outcomeStatus = result.status === 0 ? "success" : "failed";

  const outcomeInput = {
    threadId,
    message: `Codex completed task: ${task}`,
    modelResponse: result.stdout.trim() || result.stderr.trim() || "Codex finished without captured output.",
    outcome: result.status === 0 ? "Codex run completed." : `Codex run exited with status ${result.status}.`,
    outcome_status: outcomeStatus,
    tool_calls: briefUsedDirectFallback
      ? ["codex exec", "POST /api/memory/memoryignition/brief", "POST /api/memory/memoryignition/outcome"]
      : ["codex exec", "memoryignition_get_brief", "memoryignition_save_outcome"],
    risk_level: argValue("risk-level") ?? "medium",
  };

  try {
    await invokeMemoryOs("memoryignition_save_outcome", outcomeInput);
  } catch (error) {
    console.warn(
      "[MemoryOS] MCP outcome unavailable; using direct /api/memory/memoryignition/outcome fallback.",
      error instanceof Error ? error.message : String(error),
    );
    await saveMemoryIgnitionOutcome(outcomeInput);
  }

  if (argValue("write-source") !== "false") {
    const content = buildCodexSessionImportContent({
      task,
      threadId,
      project,
      status: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      outcomeStatus,
    });
    const upload = writeEngineeringSignalExportUpload({
      type: "codex_chats",
      rootPath: argValue("codex-source-root"),
      filename: `${threadId}.md`,
      content,
    });
    await postMemoryOs("/api/connector/codex_chats/connect", { rootPath: upload.rootPath });
    if (argValue("sync-source") !== "false") {
      await postMemoryOs("/api/connector/codex_chats/sync", {});
    }
    console.log(`\n[MemoryOS] Codex source written: ${upload.absolutePath}`);
    console.log("[MemoryOS] View it in Company Sources -> Codex app, then Company Brain / MemoryIgnition after sync.");
  }

  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
