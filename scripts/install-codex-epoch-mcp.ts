import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { buildCodexMemoryOsMcpConfig } from "../lib/integrations/codexBridge";

function argValue(name: string): string | undefined {
  const exact = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(exact));
  if (match) return match.slice(exact.length);
  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0) return process.argv[index + 1];
  return undefined;
}

const projectRoot = path.resolve(argValue("cwd") ?? process.cwd());
const baseUrl = argValue("base-url") ?? process.env.EPOCH_BASE_URL ?? "http://localhost:3011";
const codexDir = path.join(projectRoot, ".codex");
const configPath = path.join(codexDir, "config.toml");
const skillPath = path.join(codexDir, "skills", "memoryignition", "SKILL.md");
const markerStart = "# >>> epoch-codex-mcp";
const markerEnd = "# <<< epoch-codex-mcp";
const block = [
  markerStart,
  buildCodexMemoryOsMcpConfig({
    cwd: projectRoot,
    baseUrl,
  }).trimEnd(),
  markerEnd,
  "",
].join("\n");

mkdirSync(codexDir, { recursive: true });
const existing = existsSync(configPath) ? readFileSync(configPath, "utf8") : "";
const pattern = new RegExp(`${markerStart}[\\s\\S]*?${markerEnd}\\n?`, "m");
const next = pattern.test(existing)
  ? existing.replace(pattern, block)
  : `${existing.trimEnd()}${existing.trim() ? "\n\n" : ""}${block}`;

writeFileSync(configPath, next, "utf8");

console.log(JSON.stringify({
  ok: true,
  configPath,
  skillPath,
  skillInstalled: existsSync(skillPath),
  baseUrl,
  mcpServer: "epoch",
  next: [
    "Set EPOCH_API_KEY or EPOCH_API_TOKEN in your shell.",
    "Restart Codex app/IDE or run /mcp in the Codex TUI to verify the epoch server.",
    "Use the project-scoped MemoryIgnition skill for Codex chat tasks in this repo.",
  ],
}, null, 2));
