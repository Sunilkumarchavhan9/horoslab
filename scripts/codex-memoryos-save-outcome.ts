import "dotenv/config";
import { readFileSync } from "fs";
import path from "path";
import { argValue, saveMemoryIgnitionOutcome } from "./codex-memoryos-http";

function readPayloadFromArgs(): Record<string, unknown> {
  const inline = argValue("payload-json");
  if (inline) {
    return JSON.parse(inline) as Record<string, unknown>;
  }

  const file = argValue("payload-file");
  if (file) {
    const absolutePath = path.resolve(file);
    return JSON.parse(readFileSync(absolutePath, "utf8")) as Record<string, unknown>;
  }

  throw new Error("Provide --payload-json '{...}' or --payload-file path/to/outcome.json.");
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value.map(String).map((item) => item.trim()).filter(Boolean);
  return items.length ? items : undefined;
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
}

function normalizeOutcomePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = { ...payload };
  const outcome = firstString(payload.outcome, payload.summary, payload.message);
  const lesson = firstString(payload.future_agent_lesson, payload.lesson, payload.futureLesson);
  const task = firstString(payload.repo_or_task, payload.task, payload.task_intent);
  const status = firstString(payload.outcome_status, payload.status);
  const filesTouched = stringArray(payload.files_touched) ?? stringArray(payload.filesChanged);
  const testsPassed = stringArray(payload.tests_passed) ?? stringArray(payload.tests);
  const testsFailed = stringArray(payload.tests_failed);

  if (outcome) {
    normalized.outcome = outcome;
    normalized.message ??= outcome;
  }
  if (lesson) normalized.future_agent_lesson = lesson;
  if (task) {
    normalized.repo_or_task ??= task;
    normalized.task_intent ??= task;
  }
  if (status) normalized.outcome_status = status;
  if (filesTouched) normalized.files_touched = filesTouched;
  if (testsPassed) normalized.tests_passed = testsPassed;
  if (testsFailed) normalized.tests_failed = testsFailed;
  normalized.what_worked ??= firstString(payload.what_worked, payload.worked, outcome);
  normalized.what_failed ??= firstString(payload.what_failed, payload.failed, "No blocking failure recorded.");
  normalized.agent_id ??= firstString(payload.agent_id, payload.agentId, "codex");
  normalized.target_agent ??= firstString(payload.target_agent, payload.targetAgent, "codex");
  normalized.target_format ??= firstString(payload.target_format, payload.targetFormat, "codex-cli");

  return normalized;
}

async function main(): Promise<void> {
  const payload = normalizeOutcomePayload(readPayloadFromArgs());
  const result = await saveMemoryIgnitionOutcome(payload);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
