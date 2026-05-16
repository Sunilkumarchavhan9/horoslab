import "dotenv/config";

type Check = { key: string; required: boolean; pass: boolean; notes?: string };

const value = (k: string) => process.env[k]?.trim() ?? "";
const has = (k: string) => value(k).length > 0;

const checks: Check[] = [
  { key: "SENTRY_DSN", required: true, pass: has("SENTRY_DSN") },
  { key: "SENTRY_ENVIRONMENT", required: true, pass: has("SENTRY_ENVIRONMENT") },
  { key: "DD_ENV", required: true, pass: has("DD_ENV") },
  { key: "DD_SERVICE", required: true, pass: has("DD_SERVICE") },
  { key: "DD_TRACE_ENABLED", required: true, pass: has("DD_TRACE_ENABLED") },
  {
    key: "DD_TRACE_AGENT_URL",
    required: true,
    pass: has("DD_TRACE_AGENT_URL"),
    notes: "Example: http://<agent-host>:8126",
  },
  { key: "NEXT_PUBLIC_SENTRY_DSN", required: false, pass: has("NEXT_PUBLIC_SENTRY_DSN") },
  { key: "NEXT_PUBLIC_DD_APPLICATION_ID", required: false, pass: has("NEXT_PUBLIC_DD_APPLICATION_ID") },
  { key: "NEXT_PUBLIC_DD_CLIENT_TOKEN", required: false, pass: has("NEXT_PUBLIC_DD_CLIENT_TOKEN") },
];

let failed = 0;
console.log("Observability env check:\n");
for (const c of checks) {
  const status = c.pass ? "OK" : c.required ? "MISSING" : "SKIP";
  const suffix = c.notes ? ` (${c.notes})` : "";
  console.log(`- [${status}] ${c.key}${suffix}`);
  if (!c.pass && c.required) failed += 1;
}

console.log("");
if (failed > 0) {
  console.error(`Missing ${failed} required observability env value(s).`);
  process.exit(1);
}

console.log("All required observability env values are present.");
