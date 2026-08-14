/**
 * Generates lib/continuity-lab/mcp-seed-catalog.ts from Devin marketplace list.
 * Run: node scripts/generate-mcp-seed-catalog.mjs
 */
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {Array<{id:string,name:string,description:string,category:string,recommended?:boolean,verified?:boolean}>} */
const ENTRIES = [
  // Recommended
  { id: "atlassian", name: "Atlassian", category: "essentials", recommended: true, verified: true, description: "Official Atlassian integration for Jira and Confluence - access enterprise knowledge, manage issues, and create documentation" },
  { id: "linear", name: "Linear", category: "essentials", recommended: true, verified: true, description: "List, create, update, and query Linear objects—issues, projects, initiatives, cycles, comments, and more" },
  { id: "notion", name: "Notion", category: "essentials", recommended: true, verified: true, description: "Retrieve and manage Notion pages, databases, and comments; search across your workspace; create, update, move, and duplicate pages and databases." },
  { id: "sentry", name: "Sentry", category: "monitoring", recommended: true, verified: true, description: "Retrieve detailed Sentry issue data and full stack traces. Also search and filter issues, update issue status, assignments, tags, bookmarks, and alerts." },
  { id: "context7", name: "Context7", category: "ai_ml", recommended: true, verified: true, description: "Access up-to-date documentation for 1000+ npm packages and frameworks" },
  { id: "playwright", name: "Playwright", category: "dev_tools", recommended: true, verified: true, description: "Automate browser interactions and inspect pages: navigate URLs, handle dialogs, upload files, and intercept network requests. Also take snapshots, evaluate JavaScript, resize windows, and more" },
  { id: "deepwiki", name: "DeepWiki", category: "ai_ml", recommended: true, verified: true, description: "Access comprehensive documentation for GitHub repositories with AI-powered insights" },

  // All servers (alphabetical by name)
  { id: "amazon-redshift-iam", name: "Amazon Redshift (IAM Auth)", category: "databases", verified: true, description: "Amazon Redshift integration for data warehouse operations and analytics" },
  { id: "amazon-redshift-password", name: "Amazon Redshift (Password Auth)", category: "databases", verified: true, description: "Amazon Redshift integration with username/password authentication for data warehouse operations" },
  { id: "alloydb", name: "AlloyDB", category: "databases", verified: true, description: "AlloyDB integration for data management and SQL operations" },
  { id: "amplitude", name: "Amplitude", category: "monitoring", verified: true, description: "Analyze product data, experiments, and user behavior in Amplitude: query and create charts, dashboards, experiments, cohorts, and session replays using natural language." },
  { id: "asana", name: "Asana", category: "productivity", verified: true, description: "Official Asana integration for task management, project tracking, and team collaboration" },
  { id: "browserless", name: "Browserless", category: "dev_tools", verified: true, description: "Browser automation in the cloud: smart scraping, web search, crawling, Lighthouse audits, and custom Puppeteer code execution with no infrastructure required." },
  { id: "circleci", name: "CircleCI", category: "dev_tools", verified: true, description: "Retrieve detailed build failure logs, identify flaky tests, and fetch the status of your latest pipelines and workflows in CircleCI projects. Also get job test results, trigger pipelines, validate configs, analyze git diffs, and more." },
  { id: "cloudflare-ai-gateway", name: "Cloudflare AI Gateway", category: "cloud", verified: true, description: "Search your logs, get details about the prompts and responses" },
  { id: "cloudflare-audit-logs", name: "Cloudflare Audit Logs", category: "cloud", verified: true, description: "Query audit logs and generate reports for review" },
  { id: "cloudflare-autorag", name: "Cloudflare AutoRAG", category: "ai_ml", verified: true, description: "List and search documents on your AutoRAGs" },
  { id: "cloudflare-browser-rendering", name: "Cloudflare Browser Rendering", category: "dev_tools", verified: true, description: "Fetch web pages, convert them to markdown and take screenshots" },
  { id: "cloudflare-container", name: "Cloudflare Container", category: "cloud", verified: true, description: "Spin up a sandbox development environment" },
  { id: "cloudflare-digital-experience-monitoring", name: "Cloudflare Digital Experience Monitoring", category: "monitoring", verified: true, description: "Get quick insight on critical applications for your organization" },
  { id: "cloudflare-dns-analytics", name: "Cloudflare DNS Analytics", category: "monitoring", verified: true, description: "Optimize DNS performance and debug issues based on current set up" },
  { id: "cloudflare-documentation", name: "Cloudflare Documentation", category: "dev_tools", verified: true, description: "Access up-to-date Cloudflare reference information via MCP" },
  { id: "cloudflare-graphql", name: "Cloudflare GraphQL", category: "monitoring", verified: true, description: "Get analytics data using Cloudflare's GraphQL API" },
  { id: "cloudflare-logpush", name: "Cloudflare Logpush", category: "monitoring", verified: true, description: "Get quick summaries for Logpush job health" },
  { id: "cloudflare-observability", name: "Cloudflare Observability", category: "monitoring", verified: true, description: "Debug and get insights into application logs and analytics via Cloudflare MCP" },
  { id: "cloudflare-one-casb", name: "Cloudflare One CASB", category: "cloud", verified: true, description: "Quickly identify any security misconfigurations for SaaS applications to safeguard users & data" },
  { id: "cloudflare-radar", name: "Cloudflare Radar", category: "monitoring", verified: true, description: "Get global Internet traffic insights, trends, URL scans, and other utilities via Cloudflare Radar MCP" },
  { id: "cloudflare-workers-bindings", name: "Cloudflare Workers Bindings", category: "cloud", verified: true, description: "Build Workers applications with storage, AI, and compute primitives" },
  { id: "cloudflare-workers-builds", name: "Cloudflare Workers Builds", category: "dev_tools", verified: true, description: "Get insights and manage your Cloudflare Workers Builds" },
  { id: "corridor", name: "Corridor", category: "dev_tools", verified: true, description: "Corridor adds AI code security guardrails directly into your development workflow, helping to identify and fix security vulnerabilities as you code." },
  { id: "cortex", name: "Cortex", category: "dev_tools", verified: true, description: "Cortex integration for service catalog, scorecards, and engineering insights" },
  { id: "datadog-api-key", name: "Datadog (API key)", category: "monitoring", verified: true, description: "Retrieve telemetry insights and manage Datadog platform features including incidents, monitors, logs, dashboards, metrics, traces, hosts, and more." },
  { id: "datadog-oauth", name: "Datadog (OAuth)", category: "monitoring", verified: true, description: "Retrieve telemetry insights and manage Datadog platform features including incidents, monitors, logs, dashboards, metrics, traces, hosts, and more." },
  { id: "dbt", name: "dbt", category: "databases", verified: true, description: "Supports two setup modes: (1) CLI-only with DBT_PROJECT_DIR and DBT_PATH for local dbt projects, or (2) dbt Platform with DBT_HOST and DBT_TOKEN for Discovery API, Semantic Layer, and Admin API access. Join #tools-dbt-mcp in the dbt Community Slack (https://www.getdbt.com/community/join-the-community) for support." },
  { id: "docker-hub", name: "Docker Hub", category: "cloud", verified: true, description: "Retrieve and manage Docker Hub repositories and tags with ease: check repo/tag existence, list namespaces, repositories, tags, and Docker Hardened Images and more." },
  { id: "elasticsearch", name: "Elasticsearch", category: "databases", verified: true, description: "Retrieve detailed information about Elasticsearch indices, field mappings, shard distribution, and ES|QL search results. Also perform Query DSL searches and inspect shards via natural‑language MCP calls." },
  { id: "firecrawl", name: "Firecrawl", category: "ai_ml", verified: true, description: "Discover and extract web content at scale with Firecrawl's MCP server: map sites, scrape single or multiple URLs, perform web search and deep research, and extract structured data." },
  { id: "fireflies", name: "Fireflies", category: "communication", verified: true, description: "Fireflies integration for meeting data retrieval and analysis—such as transcripts, summaries, action items, and more metadata" },
  { id: "grafana", name: "Grafana", category: "monitoring", verified: true, description: "Grafana integration for monitoring dashboards and visualization" },
  { id: "granola", name: "Granola", category: "communication", verified: true, description: "Connect your AI tools to your Granola meeting notes - search meetings, find topics, extract action items, and answer questions from your meeting history" },
  { id: "hubspot", name: "HubSpot", category: "customer_sales", verified: true, description: "List, retrieve, create, and update HubSpot CRM objects; manage associations, properties, and schemas; create notes and tasks; list workflows; fetch user or account context and more." },
  { id: "jam", name: "Jam", category: "dev_tools", verified: true, description: "Debug faster with Jam recordings - automatically load video, user events, console logs, errors and network requests into AI context for bug analysis" },
  { id: "metabase", name: "Metabase", category: "databases", verified: true, description: "A comprehensive Model Context Protocol server for Metabase integration, providing AI assistants with full access to Metabase's analytics platform" },
  { id: "neon", name: "Neon", category: "databases", verified: true, description: "List, create, and delete Neon Postgres projects and branches; execute SQL queries, inspect tables and schemas. Also perform safe schema migrations, manage compute endpoints, and provision Neon Auth." },
  { id: "netlify", name: "Netlify", category: "cloud", verified: true, description: "Create, manage, and deploy Netlify projects; modify access controls; manage Netlify extensions. Also enable and manage form submissions, and create env variables and secrets." },
  { id: "parallel", name: "Parallel", category: "ai_ml", verified: true, description: "AI-powered web search and research capabilities through Parallel's MCP server" },
  { id: "paypal", name: "PayPal", category: "finance", verified: true, description: "Manage PayPal commerce operations; handle disputes; issue and send invoices; create orders, captures, and refunds; list transactions; track shipments; and manage subscriptions." },
  { id: "pinecone", name: "Pinecone", category: "ai_ml", verified: true, description: "Pinecone vector database integration for semantic search and AI applications" },
  { id: "plaid", name: "Plaid", category: "finance", verified: true, description: "Plaid integration for financial data management and transaction analysis" },
  { id: "posthog", name: "PostHog", category: "monitoring", verified: true, description: "PostHog product analytics integration for querying insights, dashboards, feature flags, experiments, error tracking, and event data through natural language" },
  { id: "prisma", name: "Prisma", category: "databases", verified: true, description: "Manage Prisma Postgres databases; create, list, and restore backups; generate and revoke connection strings; execute SQL queries and introspect schemas." },
  { id: "pulumi", name: "Pulumi", category: "cloud", verified: true, description: "Manage cloud infrastructure with Pulumi using MCP tools; preview and update stacks and manage configs across AWS and more." },
  { id: "raindrop", name: "Raindrop", category: "monitoring", verified: true, description: "Raindrop observability platform for AI agents — investigate issues, search events, inspect traces, and quantify signals through natural language" },
  { id: "replicate", name: "Replicate", category: "ai_ml", verified: true, description: "Run and deploy AI models from thousands of community-contributed models" },
  { id: "slack", name: "Slack", category: "communication", verified: true, description: "Search channels and messages, send and read messages, manage canvases, and access user profiles via the official Slack MCP server. Uses user-level OAuth — if connected with organization-wide access, all org members share the same user identity. We recommend using personal access." },
  { id: "sonarqube", name: "SonarQube", category: "dev_tools", verified: true, description: "SonarQube integration for code quality analysis and issue management" },
  { id: "square", name: "Square", category: "finance", verified: true, description: "Manage payments, orders, inventory, customers, invoices, subscriptions, and loyalty programs in Square; fetch service and type metadata to discover and structure API calls." },
  { id: "stripe", name: "Stripe", category: "finance", verified: true, description: "Create and manage customers, products, prices, subscriptions, invoices, coupons, payment links, payouts, and refunds in Stripe; read balances, disputes, docs and more." },
  { id: "tavily", name: "Tavily", category: "ai_ml", verified: true, description: "Real-time web search and content extraction optimized for AI agents" },
  { id: "unleash", name: "Unleash", category: "monitoring", verified: true, description: "Manage Unleash feature flags: evaluate code changes for flag usage, create flags with best-practice validation, configure rollouts, toggle environments, and wrap code in flag checks" },
  { id: "vercel", name: "Vercel", category: "cloud", verified: true, description: "Search and navigate Vercel documentation, manage projects and deployments, analyze deployment logs and handle your Vercel infrastructure" },
  { id: "zapier", name: "Zapier", category: "productivity", verified: true, description: "Trigger actions across 8,000+ apps with Zapier: send Slack messages, update Sheets, create calendar events, tasks, and more." },
  { id: "bigquery", name: "BigQuery", category: "databases", verified: true, description: "BigQuery integration for analytics queries and dataset management" },
  { id: "cloud-sql-mysql", name: "Cloud SQL (MySQL)", category: "databases", verified: true, description: "Cloud SQL for MySQL integration for data management and SQL operations" },
  { id: "cloud-sql-postgresql", name: "Cloud SQL (PostgreSQL)", category: "databases", verified: true, description: "Cloud SQL for PostgreSQL integration for data management and SQL operations" },
  { id: "cloud-sql-sql-server", name: "Cloud SQL (SQL Server)", category: "databases", verified: true, description: "Cloud SQL for SQL Server integration for data management and T-SQL operations" },
  { id: "dataplex", name: "Dataplex", category: "databases", verified: true, description: "Dataplex Universal Catalog integration for asset discovery and governance" },
  { id: "figma", name: "Figma", category: "design_creative", verified: true, description: "Complete Figma API integration: get files/nodes/images, manage comments and reactions, handle components/styles, create webhooks, and access library analytics with full API functionality" },
  { id: "firestore", name: "Firestore", category: "databases", verified: true, description: "Firestore integration for document database operations" },
  { id: "google-maps", name: "Google Maps", category: "cloud", verified: true, description: "Access Google Maps feature using natural‑language queries: geocode and reverse‑geocode addresses, search places, fetch place details, calculate distances and directions, and retrieve elevation data." },
  { id: "looker", name: "Looker", category: "databases", verified: true, description: "Looker integration for BI queries and content management" },
  { id: "mysql", name: "MySQL", category: "databases", verified: true, description: "MySQL integration for data management and SQL operations" },
  { id: "perplexity-ask", name: "Perplexity Ask", category: "ai_ml", verified: true, description: "Perplexity Ask MCP server: web-wide research via the Perplexity API" },
  { id: "postgresql", name: "PostgreSQL", category: "databases", verified: true, description: "PostgreSQL integration for data management and SQL operations" },
  { id: "redis", name: "Redis", category: "databases", verified: true, description: "Interact with Redis using natural language: get/set keys, manage strings, hashes, lists, sets, streams, keys and JSON data; perform pub/sub operations; and retrieve server stats and client info." },
  { id: "ref-tools", name: "Ref.tools", category: "ai_ml", verified: true, description: "Agentic search for documentation with intelligent context filtering and minimal token usage" },
  { id: "snowflake", name: "Snowflake", category: "databases", verified: true, description: "Snowflake data warehouse integration with password and key-pair authentication support" },
  { id: "spanner", name: "Spanner", category: "databases", verified: true, description: "Spanner integration for globally distributed relational operations" },
  { id: "sql-server", name: "SQL Server", category: "databases", verified: true, description: "SQL Server integration for data management and T-SQL operations" },
  { id: "supabase", name: "Supabase", category: "databases", verified: true, description: "List, create, pause, and restore Supabase projects; execute SQL, apply migrations, deploy Edge Functions, handle branching, update storage buckets and configs; get URLs or API Keys for projects" },

  // Devin docs extras (marketplace parity)
  { id: "airtable", name: "Airtable", category: "productivity", verified: true, description: "Connect Airtable bases and tables to query records, create rows, and manage schemas through natural language." },
  { id: "heroku", name: "Heroku", category: "cloud", verified: true, description: "Manage Heroku apps, dynos, add-ons, and releases using your Heroku API key." },
  { id: "snyk", name: "Snyk", category: "dev_tools", verified: true, description: "Run Snyk security scans, review vulnerabilities, and manage Snyk projects from your Devin sessions." },
];

const ids = new Set();
for (const e of ENTRIES) {
  if (ids.has(e.id)) throw new Error("duplicate id: " + e.id);
  ids.add(e.id);
}

const lines = ENTRIES.map((e) => {
  const parts = [
    `  {`,
    `    id: ${JSON.stringify(e.id)},`,
    `    name: ${JSON.stringify(e.name)},`,
    `    description: ${JSON.stringify(e.description)},`,
    `    category: ${JSON.stringify(e.category)},`,
  ];
  if (e.recommended) parts.push(`    recommended: true,`);
  if (e.verified) parts.push(`    verified: true,`);
  parts.push(`  },`);
  return parts.join("\n");
});

const body = `import type { McpCatalogCategory } from "./mcp-catalog-storage";

export type McpSeedCatalogEntry = {
  id: string;
  name: string;
  description: string;
  category: McpCatalogCategory;
  recommended?: boolean;
  verified?: boolean;
};

/** Devin MCP Marketplace seed (${ENTRIES.length} servers). */
export const MCP_SEED_CATALOG: McpSeedCatalogEntry[] = [
${lines.join("\n")}
];
`;

const out = join(__dirname, "../lib/continuity-lab/mcp-seed-catalog.ts");
writeFileSync(out, body);
console.log("Wrote", ENTRIES.length, "entries to", out);
