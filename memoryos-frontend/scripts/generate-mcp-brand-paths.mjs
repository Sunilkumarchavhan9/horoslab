/**
 * One-off generator: extends catalog-brand-paths from simple-icons (MIT).
 * Run: node scripts/generate-mcp-brand-paths.mjs
 */
import * as si from "simple-icons";
import { writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(
  __dirname,
  "../components/continuity-lab/brand-icons/catalog-brand-paths.ts",
);

/** simple-icons slug → catalog path id */
const SLUG_TO_ID = {
  atlassian: "atlassian",
  playwright: "playwright",
  cloudflare: "cloudflare",
  circleci: "circleci",
  vercel: "vercel",
  netlify: "netlify",
  posthog: "posthog",
  prisma: "prisma",
  pulumi: "pulumi",
  supabase: "supabase",
  perplexity: "perplexity",
  elasticsearch: "elasticsearch",
  grafana: "grafana",
  heroku: "heroku",
  airtable: "airtable",
  snyk: "snyk",
  dbt: "dbt",
  paypal: "paypal",
  square: "square",
  zapier: "zapier",
  metabase: "metabase",
  replicate: "replicate",
  sonarqube: "sonarqube",
  looker: "looker",
  googlebigquery: "bigquery",
  mysql: "mysql",
  googlemaps: "google-maps",
  firebase: "firestore",
  amazonredshift: "amazon-redshift",
  amazonwebservices: "aws",
  googlecloudspanner: "spanner",
  googlecloud: "google-cloud",
  snowflake: "snowflake",
  stripe: "stripe",
  hubspot: "hubspot",
  slack: "slack",
  notion: "notion",
  sentry: "sentry",
  linear: "linear",
  figma: "figma",
  datadog: "datadog",
  docker: "docker",
  redis: "redis",
  postgresql: "postgresql",
  mongodb: "mongodb",
  asana: "asana",
  intercom: "intercom",
  discord: "discord",
  terraform: "terraform",
  kubernetes: "kubernetes",
  confluence: "confluence",
  pagerduty: "pagerduty",
  gitlab: "gitlab",
  github: "github",
  bitbucket: "bitbucket",
  microsoftteams: "microsoft-teams",
  microsoftsqlserver: "sql-server",
  googledatastudio: "looker-studio",
};

/** Brands not in simple-icons — minimal single-path marks (MIT-compatible shapes). */
const CUSTOM_PATHS = {
  playwright: {
    d: "M4 2h6l2 3h8v15H4V2zm3 4v11h2V6H7zm4 0v11h2V6h-2zm4 0v8l3-1.5V6h-3z",
    fill: "#2EAD33",
  },
  context7: {
    d: "M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.2 6.5 3.6L12 11.4 5.5 7.8 12 4.2zM5 9.3l7 3.9 7-3.9V15l-7 3.9L5 15V9.3z",
    fill: "#6366F1",
  },
  deepwiki: {
    d: "M6 3h12v2H8v14H6V3zm2 4h10v2H8V7zm0 4h8v2H8v-2zm0 4h6v2H8v-2z",
    fill: "#38BDF8",
  },
  browserless: {
    d: "M4 4h16v12H4V4zm2 2v8h12V6H6zm2 2h8v4H8V8z",
    fill: "#FF6B35",
  },
  firecrawl: {
    d: "M12 2c-2 3-6 4-6 8a6 6 0 1012 0c0-4-4-5-6-8zm0 14a4 4 0 01-4-4c0-2.5 2.5-3.5 4-6 1.5 2.5 4 3.5 4 6a4 4 0 01-4 4z",
    fill: "#F97316",
  },
  fireflies: {
    d: "M12 3a5 5 0 00-5 5v2H5v8h14v-8h-2v-2a5 5 0 00-5-5zm0 2a3 3 0 013 3v2H9V8a3 3 0 013-3z",
    fill: "#FFCD00",
  },
  granola: {
    d: "M6 8h12l-1 10H7L6 8zm2 2v6h8v-6H8zm1-4h6l1 2H8l1-2z",
    fill: "#8B5CF6",
  },
  jam: {
    d: "M8 4h8l2 4v12H6V8l2-4zm2 3v11h4V7h-4z",
    fill: "#FF3B7A",
  },
  corridor: {
    d: "M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2z",
    fill: "#22C55E",
  },
  cortex: {
    d: "M12 2 4 6v12l8 4 8-4V6l-8-4zm0 3.5L17 8v8l-5 2.5V5.5z",
    fill: "#7C3AED",
  },
  raindrop: {
    d: "M12 3c-4 5-7 7-7 11a7 7 0 1014 0c0-4-3-6-7-11z",
    fill: "#0EA5E9",
  },
  parallel: {
    d: "M5 5h3v14H5V5zm5 0h3v14h-3V5zm5 0h3v14h-3V5z",
    fill: "#111827",
  },
  tavily: {
    d: "M3 8h18v2H3V8zm2 4h14v2H5v-2zm4 4h6v2H9v-2z",
    fill: "#2563EB",
  },
  unleash: {
    d: "M12 2 3 7v10l9 5 9-5V7l-9-5zm-1 6h2v6h-2V8zm0 8h2v2h-2v-2z",
    fill: "#1A1A1A",
  },
  neon: {
    d: "M6 4h12v4H6V4zm0 6h12v10H6V10zm3 3v4h6v-4H9z",
    fill: "#00E599",
  },
  pinecone: {
    d: "M12 3 4 20h16L12 3zm0 5.5L15.5 18h-7L12 8.5z",
    fill: "#000000",
  },
  plaid: {
    d: "M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z",
    fill: "#111111",
  },
  amplitude: {
    d: "M.736 16.976l3.173-8.53H4.3L1.127 16.976H.736V7.024h.591v7.38l3.04-7.38h.48l3.04 7.38V7.024h.591v9.952H.736zm8.644-9.952c2.197 0 3.296 1.099 3.296 3.296v3.36c0 2.197-1.099 3.296-3.296 3.296-2.197 0-3.296-1.099-3.296-3.296v-3.36c0-2.197 1.099-3.296 3.296-3.296zm0 .544c-1.87 0-2.752.882-2.752 2.752v3.36c0 1.87.882 2.752 2.752 2.752s2.752-.882 2.752-2.752v-3.36c0-1.87-.882-2.752-2.752-2.752zm8.9 9.408h-.591V7.024h2.88c1.87 0 2.752.882 2.752 2.752v.544c0 1.87-.882 2.752-2.752 2.752h-2.289v3.152zm.591-3.696h2.224c1.493 0 2.197-.704 2.197-2.197v-.544c0-1.493-.704-2.197-2.197-2.197h-2.224v4.938z",
    fill: "#0878FF",
  },
  "ref-tools": {
    d: "M7 4h10v3H7V4zm0 6h10v3H7v-3zm0 6h7v3H7v-3z",
    fill: "#0F172A",
  },
  alloydb: {
    d: "M12 2C8 6 5 8 5 12a7 7 0 1014 0c0-4-3-6-7-10zm0 4l4 5H8l4-5zm-3 7h6v5H9v-5z",
    fill: "#4285F4",
  },
  dataplex: {
    d: "M4 5h16v3H4V5zm0 6h10v3H4v-3zm0 6h14v3H4v-3z",
    fill: "#4285F4",
  },
};

function getIcon(slug) {
  const key =
    "si" +
    slug.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase());
  return si[key];
}

const paths = { ...CUSTOM_PATHS };

for (const [slug, id] of Object.entries(SLUG_TO_ID)) {
  const icon = getIcon(slug);
  if (!icon) {
    console.warn("missing simple-icons slug:", slug, "→", id);
    continue;
  }
  paths[id] = { d: icon.path, fill: `#${icon.hex}` };
}

const header = `/** Brand paths from Simple Icons (MIT) + custom marks. https://simpleicons.org */\nexport const CATALOG_BRAND_PATHS = `;
const footer = ` as const;\n\nexport type CatalogBrandPathId = keyof typeof CATALOG_BRAND_PATHS;\n`;

const sorted = Object.fromEntries(
  Object.entries(paths).sort(([a], [b]) => a.localeCompare(b)),
);

writeFileSync(outPath, header + JSON.stringify(sorted, null, 2) + footer);
console.log("Wrote", Object.keys(sorted).length, "brand paths to", outPath);
