#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const frontendRoot = path.join(__dirname, "..");
const nextDir = path.join(frontendRoot, ".next");
const devDir = path.join(nextDir, "dev");
const lockPath = path.join(devDir, "lock");
const routesManifestPath = path.join(devDir, "routes-manifest.json");
const fallbackManifestPath = path.join(devDir, "fallback-build-manifest.json");

const forceReset =
  process.env.RESET_NEXT_CACHE === "1" ||
  process.argv.includes("--reset") ||
  process.argv.includes("--reset-cache");

function isPidRunning(targetPid) {
  try {
    if (process.platform === "win32") {
      const out = execSync(`tasklist /FI "PID eq ${targetPid}" /NH`, {
        encoding: "utf8",
      });
      return out.includes(String(targetPid));
    }
    process.kill(targetPid, 0);
    return true;
  } catch {
    return false;
  }
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function waitForPidsToExit(pids, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (pids.every((pid) => !isPidRunning(pid))) return true;
    sleep(150);
  }
  return pids.every((pid) => !isPidRunning(pid));
}

function psSingleQuote(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function runningNextDevPids() {
  if (process.platform !== "win32") return [];
  try {
    const root = frontendRoot.toLowerCase();
    const command = [
      "$root =",
      psSingleQuote(root),
      ";",
      "Get-CimInstance Win32_Process |",
      "Where-Object {",
      "$_.Name -eq 'node.exe' -and",
      "$_.CommandLine -and",
      "$_.CommandLine.ToLower().Contains($root) -and",
      "$_.CommandLine -like '*next*dist*server*lib*start-server.js*'",
      "} | Select-Object -ExpandProperty ProcessId | ConvertTo-Json -Compress",
    ].join(" ");
    const out = execSync(
      `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ${JSON.stringify(command)}`,
      { encoding: "utf8" },
    ).trim();
    if (!out) return [];
    const parsed = JSON.parse(out);
    return (Array.isArray(parsed) ? parsed : [parsed])
      .map((pid) => Number(pid))
      .filter((pid) => Number.isFinite(pid) && pid > 0 && pid !== process.pid);
  } catch {
    return [];
  }
}

function readLockPid() {
  if (!fs.existsSync(lockPath)) return null;
  const text = fs.readFileSync(lockPath, "utf8");
  const pidMatch =
    text.match(/PID[:\s]+(\d+)/i) || text.match(/"pid"\s*:\s*(\d+)/i);
  return pidMatch ? Number(pidMatch[1]) : null;
}

function runningDevPid() {
  const pid = readLockPid();
  return pid && isPidRunning(pid) ? pid : null;
}

function devCacheLooksPopulated() {
  if (!fs.existsSync(devDir)) return false;
  try {
    const entries = fs.readdirSync(devDir);
    return entries.some((name) => name !== "lock");
  } catch {
    return false;
  }
}

function isCorruptDevCache() {
  if (!fs.existsSync(devDir)) return false;
  if (forceReset) return true;
  if (!devCacheLooksPopulated()) return false;
  const missingRoutes = !fs.existsSync(routesManifestPath);
  const missingFallback = !fs.existsSync(fallbackManifestPath);
  return missingRoutes || missingFallback;
}

function removePathRecursive(targetPath, label) {
  const maxAttempts = process.platform === "win32" ? 8 : 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      fs.rmSync(targetPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
      console.log(`Removed ${label} (${path.relative(frontendRoot, targetPath)}).`);
      return;
    } catch (error) {
      lastError = error;
      const code = error && typeof error === "object" ? error.code : undefined;
      if (!["ENOTEMPTY", "EBUSY", "EPERM", "EACCES"].includes(code)) break;
      sleep(150 * attempt);
    }
  }

  throw lastError;
}

function applyCacheCleanup() {
  const pid = runningDevPid();
  const nextDevPids = runningNextDevPids();
  const activePids = Array.from(
    new Set([pid, ...nextDevPids].filter((value) => Number.isFinite(value))),
  );
  const corrupt = isCorruptDevCache();
  const shouldClean = forceReset || corrupt;

  if (!shouldClean && activePids.length > 0) {
    console.error(
      `Next dev is already running for this frontend (PID${activePids.length === 1 ? "" : "s"} ${activePids.join(", ")}).`,
    );
    console.error(
      "Stop the existing dev server before starting another one; multiple Next dev servers share .next/dev and can corrupt route artifacts.",
    );
    if (process.platform === "win32") {
      console.error(`  taskkill /PID ${activePids.join(" /PID ")} /F`);
    }
    process.exit(1);
  }

  if (!shouldClean) return;

  if (activePids.length > 0) {
    if (corrupt || forceReset) {
      console.warn(
        `[clean-next-dev-lock] Stopping running Next dev (PID${activePids.length === 1 ? "" : "s"} ${activePids.join(", ")}) so cache cleanup can proceed.`,
      );
      try {
        if (process.platform === "win32") {
          execSync(`taskkill /PID ${activePids.join(" /PID ")} /F`, {
            stdio: "pipe",
          });
          waitForPidsToExit(activePids, 5000);
        } else {
          for (const activePid of activePids) process.kill(activePid, "SIGTERM");
          waitForPidsToExit(activePids, 5000);
        }
      } catch (error) {
        console.warn(
          `[clean-next-dev-lock] Failed to stop running Next dev: ${
            error instanceof Error ? error.message : "unknown error"
          }`,
        );
        process.exit(1);
      }
    } else {
    console.warn(
      `[clean-next-dev-lock] Cannot remove .next while Next dev is running (PID${activePids.length === 1 ? "" : "s"} ${activePids.join(", ")}).`,
    );
    if (forceReset || corrupt) {
      console.warn(
        "Stop dev, then run: Remove-Item -Recurse -Force memoryos-frontend\\.next",
      );
      console.warn("Or set RESET_NEXT_CACHE=1 after stopping the server.");
    }
    if (corrupt && !forceReset) {
      console.warn(
        "[clean-next-dev-lock] .next/dev looks corrupted (missing dev manifests).",
      );
    }
      process.exit(forceReset ? 1 : 0);
    }
  }

  if (forceReset && fs.existsSync(nextDir)) {
    removePathRecursive(nextDir, "entire .next cache (RESET_NEXT_CACHE)");
    return;
  }

  if (corrupt && fs.existsSync(devDir)) {
    removePathRecursive(devDir, "corrupted .next/dev cache");
  }
}

applyCacheCleanup();

if (!fs.existsSync(lockPath)) {
  process.exit(0);
}

const pid = readLockPid();

if (pid && isPidRunning(pid)) {
  console.error(
    `Another Next dev server is already running (PID ${pid}). Stop it before starting dev:all.`,
  );
  if (process.platform === "win32") {
    console.error(`  taskkill /PID ${pid} /F`);
  } else {
    console.error(`  kill -9 ${pid}`);
  }
  process.exit(1);
}

fs.unlinkSync(lockPath);
console.log("Removed stale Next dev lock (.next/dev/lock).");
