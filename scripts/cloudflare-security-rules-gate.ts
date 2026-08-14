import "dotenv/config";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { z } from "zod";

const root = process.cwd();
const configPath = path.join(root, "infra", "cloudflare", "security-rules.json");

const ruleSchema = z.object({
  id: z.string().min(1),
  phase: z.string().min(1),
  action: z.string().min(1),
  enabled: z.boolean(),
  description: z.string().min(1),
  match: z.string().optional(),
  requestsPerPeriod: z.number().int().positive().optional(),
  periodSeconds: z.number().int().positive().optional(),
  mitigationTimeoutSeconds: z.number().int().positive().optional(),
});

const configSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  rules: z.array(ruleSchema).min(3),
});

function hasEnv(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

if (!existsSync(configPath)) {
  console.error("Missing infra/cloudflare/security-rules.json");
  process.exit(1);
}

const parsed = configSchema.parse(JSON.parse(readFileSync(configPath, "utf8")) as unknown);
const enabledRules = parsed.rules.filter((rule) => rule.enabled);
const hasManagedWaf = enabledRules.some((rule) => rule.phase === "http_request_firewall_managed");
const hasRateLimit = enabledRules.some((rule) => rule.phase === "http_ratelimit" && rule.requestsPerPeriod && rule.periodSeconds);
const hasBotChallenge = enabledRules.some((rule) => /challenge/i.test(rule.action));
const hasCloudflareEnv =
  (hasEnv("CLOUDFLARE_ACCOUNT_ID") || hasEnv("CF_ACCOUNT_ID")) &&
  hasEnv("CLOUDFLARE_API_TOKEN");

const checks = [
  { name: "Cloudflare env", pass: hasCloudflareEnv },
  { name: "Managed WAF rule", pass: hasManagedWaf },
  { name: "API edge rate limit", pass: hasRateLimit },
  { name: "Bot challenge rule", pass: hasBotChallenge },
];

for (const check of checks) {
  console.log(`[${check.pass ? "PASS" : "FAIL"}] ${check.name}`);
}

if (checks.some((check) => !check.pass)) {
  process.exitCode = 1;
}
