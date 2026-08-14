import "dotenv/config";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";

const strict = process.argv.includes("--strict");
const databaseUrl = process.env.DATABASE_URL?.trim();
const restoreUrl = process.env.DATABASE_RESTORE_TEST_URL?.trim();

function run(command: string, args: string[], env: NodeJS.ProcessEnv = process.env, input?: Buffer) {
  return spawnSync(command, args, {
    env,
    encoding: "utf8",
    shell: process.platform === "win32",
    input,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function runInPostgresContainer(command: string, args: string[], input?: Buffer) {
  const container = process.env.EPOCH_POSTGRES_TOOLS_CONTAINER?.trim();
  if (!container) return null;
  return spawnSync("docker", ["exec", ...(input ? ["-i"] : []), container, command, ...args], {
    encoding: input ? undefined : "utf8",
    shell: false,
    input,
    stdio: [input ? "pipe" : "ignore", "pipe", "pipe"],
  });
}

function commandExists(command: string): boolean {
  const result = run(process.platform === "win32" ? "where" : "which", [command]);
  return result.status === 0;
}

function fail(message: string): void {
  console.error(`[FAIL] ${message}`);
  process.exitCode = 1;
}

function warn(message: string): void {
  console.warn(`[WARN] ${message}`);
}

function pass(message: string): void {
  console.log(`[PASS] ${message}`);
}

function outputText(value: string | Buffer | undefined): string {
  return value == null ? "" : typeof value === "string" ? value : value.toString("utf8");
}

function postgresCliUrl(value: string): string {
  const url = new URL(value);
  url.searchParams.delete("schema");
  return url.toString();
}

if (!databaseUrl || !/^(postgresql|postgres):\/\//.test(databaseUrl)) {
  fail("DATABASE_URL must be a direct Postgres URL for backup testing.");
  process.exit();
}

const hostToolsAvailable = commandExists("pg_dump") && commandExists("pg_restore");
const containerToolsAvailable = Boolean(process.env.EPOCH_POSTGRES_TOOLS_CONTAINER?.trim()) && commandExists("docker");
if (!hostToolsAvailable && !containerToolsAvailable) {
  const message = "pg_dump and pg_restore must be installed for backup/restore testing.";
  if (strict) {
    fail(message);
  } else {
    warn(`${message} Install PostgreSQL client tools before production deploy.`);
  }
  process.exit();
}

const tempDir = mkdtempSync(path.join(os.tmpdir(), "memoryos-backup-gate-"));
const dumpPath = path.join(tempDir, "memoryos.dump");
const cliDatabaseUrl = postgresCliUrl(databaseUrl);
const cliRestoreUrl = restoreUrl ? postgresCliUrl(restoreUrl) : undefined;

try {
  const dumpArgs = [
    "--format=custom",
    "--no-owner",
    "--no-privileges",
    "--file",
    containerToolsAvailable ? "-" : dumpPath,
    cliDatabaseUrl,
  ];
  const dump = hostToolsAvailable ? run("pg_dump", dumpArgs) : runInPostgresContainer("pg_dump", dumpArgs);
  if (!dump) throw new Error("backup_tool_runner_unavailable");
  if (containerToolsAvailable && dump.status === 0) writeFileSync(dumpPath, dump.stdout as Buffer);
  if (dump.status !== 0) {
    fail(`pg_dump failed: ${outputText(dump.stderr).trim() || outputText(dump.stdout).trim() || "unknown error"}`);
    process.exit();
  }
  pass("Postgres backup dump created.");

  const list = hostToolsAvailable
    ? run("pg_restore", ["--list", dumpPath])
    : runInPostgresContainer("pg_restore", ["--list", "-"], readFileSync(dumpPath));
  if (!list) throw new Error("backup_tool_runner_unavailable");
  if (list.status !== 0) {
    fail(`pg_restore could not read backup: ${outputText(list.stderr).trim() || outputText(list.stdout).trim() || "unknown error"}`);
    process.exit();
  }
  pass("Postgres backup is readable by pg_restore.");

  if (!restoreUrl) {
    const message = "DATABASE_RESTORE_TEST_URL is not set; skipped destructive restore rehearsal.";
    if (strict) {
      fail(message);
    } else {
      warn(message);
    }
    process.exit();
  }

  if (cliRestoreUrl === cliDatabaseUrl) {
    fail("DATABASE_RESTORE_TEST_URL must not equal DATABASE_URL.");
    process.exit();
  }

  const restoreArgs = [
    "--clean",
    "--if-exists",
    "--no-owner",
    "--no-privileges",
    "--dbname",
    cliRestoreUrl!,
    ...(hostToolsAvailable ? [dumpPath] : ["-"]),
  ];
  const restore = hostToolsAvailable
    ? run("pg_restore", restoreArgs)
    : runInPostgresContainer("pg_restore", restoreArgs, readFileSync(dumpPath));
  if (!restore) throw new Error("backup_tool_runner_unavailable");
  if (restore.status !== 0) {
    fail(`pg_restore rehearsal failed: ${outputText(restore.stderr).trim() || outputText(restore.stdout).trim() || "unknown error"}`);
    process.exit();
  }
  pass("Postgres restore rehearsal completed against DATABASE_RESTORE_TEST_URL.");
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
