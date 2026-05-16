import "dotenv/config";

type Check = { key: string; required: boolean; pass: boolean; notes?: string };

const value = (k: string) => process.env[k]?.trim() ?? "";
const has = (k: string) => value(k).length > 0;

const checks: Check[] = [
  { key: "NEXT_PUBLIC_SENTRY_DSN", required: true, pass: has("NEXT_PUBLIC_SENTRY_DSN") },
  { key: "NEXT_PUBLIC_SENTRY_ENVIRONMENT", required: true, pass: has("NEXT_PUBLIC_SENTRY_ENVIRONMENT") },
  { key: "NEXT_PUBLIC_DD_APPLICATION_ID", required: true, pass: has("NEXT_PUBLIC_DD_APPLICATION_ID") },
  { key: "NEXT_PUBLIC_DD_CLIENT_TOKEN", required: true, pass: has("NEXT_PUBLIC_DD_CLIENT_TOKEN") },
  { key: "NEXT_PUBLIC_DD_SITE", required: true, pass: has("NEXT_PUBLIC_DD_SITE") },
  { key: "NEXT_PUBLIC_DD_SERVICE", required: true, pass: has("NEXT_PUBLIC_DD_SERVICE") },
  { key: "NEXT_PUBLIC_DD_ENV", required: true, pass: has("NEXT_PUBLIC_DD_ENV") },
  {
    key: "NEXT_PUBLIC_DD_SESSION_SAMPLE_RATE",
    required: true,
    pass: has("NEXT_PUBLIC_DD_SESSION_SAMPLE_RATE"),
    notes: "Use 0-100",
  },
  {
    key: "NEXT_PUBLIC_DD_SESSION_REPLAY_SAMPLE_RATE",
    required: true,
    pass: has("NEXT_PUBLIC_DD_SESSION_REPLAY_SAMPLE_RATE"),
    notes: "Use 0-100",
  },
];

let failed = 0;
console.log("Observability env check (frontend):\n");
for (const c of checks) {
  const status = c.pass ? "OK" : "MISSING";
  const suffix = c.notes ? ` (${c.notes})` : "";
  console.log(`- [${status}] ${c.key}${suffix}`);
  if (!c.pass) failed += 1;
}

console.log("");
if (failed > 0) {
  console.error(`Missing ${failed} required frontend observability env value(s).`);
  process.exit(1);
}

console.log("All required frontend observability env values are present.");
