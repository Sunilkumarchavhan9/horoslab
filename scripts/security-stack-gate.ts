import "dotenv/config";
import { existsSync, readFileSync } from "fs";
import path from "path";

type Check = {
  name: string;
  pass: boolean;
  detail: string;
  severity: "blocker" | "warning";
};

const strict = process.argv.includes("--strict");
const root = process.cwd();

function hasEnv(key: string): boolean {
  return Boolean(process.env[key]?.trim());
}

function fileExists(filepath: string): boolean {
  return existsSync(path.join(root, filepath));
}

function read(filepath: string): string {
  return readFileSync(path.join(root, filepath), "utf8");
}

function push(checks: Check[], check: Check): void {
  checks.push(check);
}

const checks: Check[] = [];
const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
const schema = fileExists("prisma/schema.prisma") ? read("prisma/schema.prisma") : "";

push(checks, {
  name: "Auth: Clerk",
  pass: hasEnv("CLERK_SECRET_KEY") || hasEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"),
  detail: "CLERK_SECRET_KEY or NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is configured.",
  severity: "blocker",
});

push(checks, {
  name: "Edge protection: Cloudflare",
  pass: hasEnv("CLOUDFLARE_ACCOUNT_ID") || hasEnv("CF_ACCOUNT_ID") || hasEnv("CLOUDFLARE_API_TOKEN"),
  detail: "Cloudflare account/API env is configured for edge protection/deploy automation.",
  severity: "warning",
});

push(checks, {
  name: "Rate limiting: Cloudflare + Upstash Redis",
  pass: hasEnv("UPSTASH_REDIS_REST_URL") && hasEnv("UPSTASH_REDIS_REST_TOKEN"),
  detail: "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are configured.",
  severity: "blocker",
});

push(checks, {
  name: "Database: Postgres",
  pass: /^(postgresql|postgres|prisma|prisma\+postgres):\/\//.test(databaseUrl),
  detail: "DATABASE_URL points to Postgres/Neon or Prisma Accelerate.",
  severity: "blocker",
});

push(checks, {
  name: "ORM: Prisma",
  pass: fileExists("prisma/schema.prisma") && fileExists("lib/storage/prismaClient.ts"),
  detail: "Prisma schema and shared Prisma client exist.",
  severity: "blocker",
});

push(checks, {
  name: "Secrets: Infisical",
  pass: fileExists(".infisical.json") && (hasEnv("INFISICAL_PROJECT_ID") || hasEnv("INFISICAL_TOKEN") || !strict),
  detail: "Infisical project config exists; strict mode also requires INFISICAL_PROJECT_ID or INFISICAL_TOKEN.",
  severity: "blocker",
});

push(checks, {
  name: "Error monitoring: Sentry",
  pass: hasEnv("SENTRY_DSN") || hasEnv("NEXT_PUBLIC_SENTRY_DSN"),
  detail: "SENTRY_DSN or NEXT_PUBLIC_SENTRY_DSN is configured.",
  severity: "warning",
});

push(checks, {
  name: "Code security: Dependabot",
  pass: fileExists(".github/dependabot.yml"),
  detail: "Dependabot config is present.",
  severity: "blocker",
});

push(checks, {
  name: "Code security: Semgrep",
  pass: fileExists(".github/workflows/semgrep.yml") && fileExists(".semgrep.yml"),
  detail: "Semgrep workflow and local rules are present.",
  severity: "blocker",
});

push(checks, {
  name: "Internal trust: AuditLog",
  pass: schema.includes("model AuditLog"),
  detail: "Prisma AuditLog model exists.",
  severity: "blocker",
});

push(checks, {
  name: "Internal trust: AgentBlackBox",
  pass: schema.includes("model AgentBlackBoxRecord"),
  detail: "Prisma AgentBlackBoxRecord model exists.",
  severity: "blocker",
});

push(checks, {
  name: "Internal trust: Compliance Evidence Room",
  pass: schema.includes("model ComplianceEvidenceItem"),
  detail: "Prisma ComplianceEvidenceItem model exists.",
  severity: "blocker",
});

const failures = checks.filter((check) => !check.pass);
for (const check of checks) {
  const marker = check.pass ? "PASS" : check.severity === "blocker" ? "FAIL" : "WARN";
  console.log(`[${marker}] ${check.name} - ${check.detail}`);
}

const blockingFailures = failures.filter((check) => check.severity === "blocker");
if (strict ? failures.length > 0 : blockingFailures.length > 0 && process.env.CI === "true") {
  process.exitCode = 1;
}
