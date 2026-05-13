#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Spawns the MemoryOS Express backend with its own root directory as CWD
 * so that `import "dotenv/config"` inside server/index.ts finds the root
 * .env file correctly.
 *
 * Used by the `dev:all` script so you can run both servers with one command
 * from inside the memoryos-frontend directory:
 *
 *   bun run dev:all
 */
const { spawn } = require("node:child_process");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const isWin = process.platform === "win32";

// tsx binary from the root's node_modules.
const tsxBin = path.join(rootDir, "node_modules", ".bin", "tsx");
const entry = path.join(rootDir, "server", "index.ts");

// On Windows, .cmd shims in node_modules/.bin cannot be spawned directly.
// Use cmd /c as the executable and pass the tsx path + entry as arguments;
// that avoids the DEP0190 "shell: true with args" deprecation warning.
const [cmd, args] = isWin ? ["cmd", ["/c", tsxBin, entry]] : [tsxBin, [entry]];

const proc = spawn(cmd, args, {
  cwd: rootDir, // <-- critical: dotenv reads .env relative to this
  stdio: "inherit", // share stdout/stderr with parent so concurrently can prefix logs
  env: process.env,
});

proc.on("error", (err) => {
  console.error("[start-backend] Failed to launch backend:", err.message);
  process.exit(1);
});

proc.on("exit", (code, signal) => {
  if (code !== null) {
    process.exit(code);
  }
  if (signal) {
    process.kill(process.pid, signal);
  }
});
