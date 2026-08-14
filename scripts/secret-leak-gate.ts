import { execFileSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import path from "path";

type Finding = {
  file: string;
  line: number;
  rule: string;
};

const root = process.cwd();
const excludedFiles = new Set([
  ".env",
  ".env.local",
  ".env.prod.snapshot.2026-05-15",
  "package-lock.json",
  "bun.lock",
  "pnpm-lock.yaml",
  "yarn.lock",
]);
const excludedExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".mp4", ".mov", ".woff", ".woff2", ".exe", ".dll", ".bin"]);

const allowlist = [
  "replace_with_",
  "test-secret",
  "ci-test-secret",
  "ci-release-secret",
  "ci_upstash_placeholder_token",
  "ci_cloudflare_token",
  "00000000000000000000000000000000@example.ingest.sentry.io",
  "sk-1234567890abcdef1234567890abcdef",
  "memoryos-api",
  "memoryos-test",
  "pk_test_replace",
  "sk_test_replace",
  "sk-or-v1_replace",
  "epoch.artifact.token.v1",
  "polar_whs_replace",
];

const rules: Array<{ id: string; pattern: RegExp }> = [
  { id: "cloudflare-token", pattern: /\bcf[a-z0-9_-]{32,}\b/i },
  { id: "openai-openrouter-token", pattern: /\bsk-(?:or-v1-|proj-|live-|test-)?[a-z0-9_-]{24,}\b/i },
  { id: "github-token", pattern: /\bgh[pousr]_[a-z0-9_]{30,}\b/i },
  { id: "slack-token", pattern: /\bxox[baprs]-[a-z0-9-]{20,}\b/i },
  { id: "sentry-dsn", pattern: /https:\/\/[a-f0-9]{24,}@[a-z0-9.-]+\.sentry\.io\/\d+/i },
  { id: "secret-assignment", pattern: /\b[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|PRIVATE_KEY|API_KEY)[A-Z0-9_]*\s*=\s*["']?[^"'\s#]{20,}/i },
];

function isAllowed(line: string): boolean {
  if (line.includes("process.env.")) return true;
  if (line.includes("${")) return true;
  if (line.includes("req.header(") || line.includes("request.headers")) return true;
  if (line.includes("headers.get(") || line.includes("getSecretValue(")) return true;
  return allowlist.some((value) => line.includes(value));
}

function shouldScanFile(filepath: string): boolean {
  const basename = path.basename(filepath);
  if (excludedFiles.has(basename)) return false;
  if (basename.endsWith(".log")) return false;
  if (basename.endsWith(".map")) return false;
  if (excludedExtensions.has(path.extname(filepath).toLowerCase())) return false;
  return true;
}

function repoFiles(): string[] {
  const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);
  const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((file) => {
      return (
        file.startsWith(".github/") ||
        file.startsWith("infra/") ||
        file.startsWith("lib/") ||
        file.startsWith("memoryos-frontend/") ||
        file.startsWith("prisma/") ||
        file.startsWith("scripts/") ||
        file.startsWith("server/") ||
        file.startsWith("tests/")
      );
    });
  return Array.from(new Set([...tracked, ...untracked]))
    .map((file) => path.join(root, file))
    .filter(shouldScanFile);
}

const findings: Finding[] = [];
for (const file of repoFiles()) {
  if (!existsSync(file)) continue;
  const relative = path.relative(root, file).replace(/\\/g, "/");
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    if (isAllowed(line)) return;
    for (const rule of rules) {
      if (rule.id === "secret-assignment" && !/=\s*["'][^"']{20,}["']/.test(line)) {
        continue;
      }
      if (rule.pattern.test(line)) {
        findings.push({ file: relative, line: index + 1, rule: rule.id });
      }
    }
  });
}

if (findings.length > 0) {
  console.error("Secret leak gate found possible committed secrets:");
  for (const finding of findings.slice(0, 50)) {
    console.error(`- ${finding.file}:${finding.line} (${finding.rule})`);
  }
  if (findings.length > 50) {
    console.error(`...and ${findings.length - 50} more findings.`);
  }
  process.exitCode = 1;
} else {
  console.log("Secret leak gate passed.");
}
