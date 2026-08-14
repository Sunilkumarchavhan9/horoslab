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
const net = require("node:net");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const isWin = process.platform === "win32";
const cmd = isWin ? "cmd" : "npm";
const args = isWin ? ["/c", "npm", "run", "dev"] : ["run", "dev"];

function isPortOpen(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const done = (result) => {
      try {
        socket.destroy();
      } catch {}
      resolve(result);
    };
    socket.setTimeout(800);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
    socket.connect(port, host);
  });
}

(async () => {
  const backendAlreadyRunning = await isPortOpen(3011);
  if (backendAlreadyRunning) {
    console.log(
      "[start-backend] Port 3011 already has a running server. Reusing existing backend.",
    );
    process.exit(0);
  }

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
})();
