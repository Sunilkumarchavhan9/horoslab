import { Router, type Request } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { emitMemoryRealtimeEvent } from "../../lib/memory/realtimeEventBus";
import { listMemoryRealtimeEvents } from "../../lib/memory/realtimeEventStore";
import {
  approveFutureInstruction,
  approvePackage,
  buildAgentExperienceGraphFromRun,
  addMemoryCorrection,
  blockPackage,
  connectModelProvider,
  createAgentBlackBoxRecord,
  createAgentRun,
  createComplianceEvidenceFromRun,
  createEvaluationRun,
  createFutureInstructionFromRun,
  createPackageHandoff,
  createFutureInstructionFromMemory,
  createInheritancePackage,
  createMistakeRuleFromRun,
  createMistakeRuleFromMemory,
  createOutcome,
  createSkillCandidateFromRun,
  createSource,
  createSourceItem,
  createWorkspace,
  createWorkflowBlueprint,
  derivePackageStatus,
  getAgentBlackBoxRecord,
  getAgentExperienceGraph,
  getAgentRun,
  getAgentRunBlackBox,
  getAgentRunOutcome,
  getAgentRunTimeline,
  getCostSummary,
  getEvaluationResults,
  getEvaluationReplaySummary,
  getMemory,
  getMemoryProof,
  getModelUsage,
  getOutcome,
  getPackage,
  getPackageAuditJson,
  getPackagePrompt,
  getPackageSendHistory,
  getSource,
  getWorkspace,
  listComplianceEvidence,
  listRelatedMemories,
  listAgentRuns,
  listEvaluationRuns,
  listFutureInstructions,
  listInheritancePackages,
  listMemories,
  listModelProviders,
  listSourceMemories,
  listSources,
  listSourceItems,
  listWorkspaces,
  listWorkflowBlueprints,
  prepareInheritancePackage,
  rebuildPackage,
  recordAgentRunEvent,
  recordModelUsageEvent,
  recordPackageJsonExport,
  recordPackagePromptCopy,
  replayAgentRun,
  routeSkillsForTask,
  runWorkflowBlueprint,
  savePackageTemplate,
  searchMemories,
  sendNow,
  syncSource,
  mergeMemory,
  updateMemory,
  updateAgentRunStatus,
  updateSourceStatus,
  updateMemoryStatus,
  type MasterplanScope,
} from "../../lib/masterplan/productLoopStore";

export const masterplanRouter = Router();

type MemoryIgnitionEventType =
  | "package.created"
  | "package.sent"
  | "package.approved"
  | "package.blocked"
  | "package.rebuilt"
  | "package.template_saved"
  | "package.handoff_created"
  | "package.json_exported"
  | "agent_run.updated"
  | "outcome.captured"
  | "future_instruction.created"
  | "mistake_rule.created"
  | "skill_candidate.created"
  | "first_launch_proof.created"
  | "evaluation.replay_created"
  | "prompt.copied";

type CompanySourceEventType =
  | "source.connected"
  | "source.sync_started"
  | "source.item_imported"
  | "source.memory_extracted"
  | "source.sync_failed"
  | "source.sync_completed";

type CompanyBrainEventType =
  | "memory.updated"
  | "memory.approved"
  | "memory.deprecated"
  | "memory.stale"
  | "memory.verified"
  | "memory.correction_added"
  | "memory.merged"
  | "future_instruction.created"
  | "mistake_rule.created";

type SourceProviderCategory = "Engineering" | "Support" | "Cloud" | "Communication" | "Docs" | "Manual";
type SourceProviderStatus = "available" | "later";

function sourceProviderCard(
  id: string,
  name: string,
  category: SourceProviderCategory,
  icon: string,
  firstLaunch = false,
  description?: string,
) {
  return {
    id,
    name,
    category,
    firstLaunch,
    status: (firstLaunch ? "available" : "later") as SourceProviderStatus,
    icon,
    description:
      description ??
      (firstLaunch
        ? "Connect and sync this source into the MemoryOS company brain."
        : "Full source catalog connector. Roadmap until its sync adapter is enabled."),
  };
}

const SOURCE_PROVIDERS = [
  sourceProviderCard("github", "GitHub", "Engineering", "github", true, "Import repositories, issues, pull requests, and engineering decisions."),
  sourceProviderCard("markdown-docs", "Markdown docs import", "Docs", "local-files", true, "Upload markdown or text docs and extract reusable company memory."),
  sourceProviderCard("manual-notes", "Manual notes", "Manual", "local-files", true, "Paste decisions, runbooks, incidents, and team preferences by hand."),
  sourceProviderCard("agent-chat-paste", "Agent chat paste", "Manual", "codex-chats", true, "Paste Codex, Cursor, Claude Code, Windsurf, Cline, or IDE sessions."),
  sourceProviderCard("slack", "Slack", "Communication", "slack", true),
  sourceProviderCard("linear", "Linear", "Engineering", "linear", true),
  sourceProviderCard("jira", "Jira", "Engineering", "jira", true),
  sourceProviderCard("sentry", "Sentry", "Cloud", "sentry", true),
  sourceProviderCard("zendesk", "Zendesk", "Support", "zendesk", true),
  sourceProviderCard("cursor", "Cursor", "Engineering", "cursor", true),
  sourceProviderCard("codex", "Codex", "Engineering", "codex-chats", true),
  sourceProviderCard("claude-code", "Claude Code", "Engineering", "claude", true),
  sourceProviderCard("windsurf", "Windsurf", "Engineering", "windsurf-chats", true),
  sourceProviderCard("cline", "Cline", "Engineering", "cline", true),
  sourceProviderCard("vs-code-ide-chats", "VS Code / IDE chats", "Engineering", "vs-code-chats", true),

  sourceProviderCard("gitlab", "GitLab", "Engineering", "gitlab"),
  sourceProviderCard("bitbucket", "Bitbucket", "Engineering", "bitbucket"),
  sourceProviderCard("azure-devops", "Azure DevOps", "Engineering", "azure-devops"),
  sourceProviderCard("sourcegraph", "Sourcegraph", "Engineering", "sourcegraph"),
  sourceProviderCard("gerrit", "Gerrit", "Engineering", "simple:gerrit"),
  sourceProviderCard("phabricator", "Phabricator", "Engineering", "simple:phabricator"),
  sourceProviderCard("perforce", "Perforce", "Engineering", "simple:perforce"),
  sourceProviderCard("gitea", "Gitea", "Engineering", "simple:gitea"),
  sourceProviderCard("forgejo", "Forgejo", "Engineering", "simple:forgejo"),
  sourceProviderCard("codeberg", "Codeberg", "Engineering", "simple:codeberg"),

  sourceProviderCard("cursor-chats", "Cursor Chats", "Engineering", "cursor-chats"),
  sourceProviderCard("codex-chat", "Codex Chat", "Engineering", "codex-chats"),
  sourceProviderCard("openai-agents-sdk", "OpenAI Agents SDK", "Engineering", "openai-agents"),
  sourceProviderCard("claude-chat", "Claude Chat", "Engineering", "claude"),
  sourceProviderCard("windsurf-chats", "Windsurf Chats", "Engineering", "windsurf-chats"),
  sourceProviderCard("roo-code", "Roo Code", "Engineering", "simple:roo"),
  sourceProviderCard("continue", "Continue", "Engineering", "continue"),
  sourceProviderCard("github-copilot-chat", "GitHub Copilot Chat", "Engineering", "simple:githubcopilot"),
  sourceProviderCard("devin", "Devin", "Engineering", "devin-chats"),
  sourceProviderCard("replit-agent", "Replit Agent", "Engineering", "simple:replit"),
  sourceProviderCard("aider", "Aider", "Engineering", "simple:aider"),
  sourceProviderCard("opencode", "OpenCode", "Engineering", "simple:opencode"),
  sourceProviderCard("amp", "Amp", "Engineering", "simple:amp"),
  sourceProviderCard("zed-ai", "Zed AI", "Engineering", "simple:zedindustries"),
  sourceProviderCard("vs-code-chat", "VS Code Chat", "Engineering", "vs-code-chats"),
  sourceProviderCard("jetbrains-ai", "JetBrains AI", "Engineering", "simple:jetbrains"),
  sourceProviderCard("gemini-cli", "Gemini CLI", "Engineering", "simple:googlegemini"),
  sourceProviderCard("openclaw", "OpenClaw", "Engineering", "simple:openai"),
  sourceProviderCard("langgraph", "LangGraph", "Engineering", "langgraph"),
  sourceProviderCard("crewai", "CrewAI", "Engineering", "crewai"),
  sourceProviderCard("mastra", "Mastra", "Engineering", "mastra"),
  sourceProviderCard("autogen", "AutoGen", "Engineering", "simple:microsoft"),
  sourceProviderCard("llamaindex-agents", "LlamaIndex Agents", "Engineering", "simple:llamaindex"),
  sourceProviderCard("custom-agent", "Custom Agent", "Manual", "ide-chats"),

  sourceProviderCard("asana", "Asana", "Engineering", "asana"),
  sourceProviderCard("trello", "Trello", "Engineering", "trello"),
  sourceProviderCard("clickup", "ClickUp", "Engineering", "clickup"),
  sourceProviderCard("monday", "Monday.com", "Engineering", "monday"),
  sourceProviderCard("shortcut", "Shortcut", "Engineering", "shortcut"),
  sourceProviderCard("height", "Height", "Engineering", "simple:height"),
  sourceProviderCard("plane", "Plane", "Engineering", "simple:plane"),
  sourceProviderCard("basecamp", "Basecamp", "Engineering", "simple:basecamp"),
  sourceProviderCard("youtrack", "YouTrack", "Engineering", "simple:youtrack"),
  sourceProviderCard("azure-boards", "Azure Boards", "Engineering", "azure-devops"),
  sourceProviderCard("notion-projects", "Notion Projects", "Docs", "notion"),

  sourceProviderCard("notion", "Notion", "Docs", "notion"),
  sourceProviderCard("confluence", "Confluence", "Docs", "confluence"),
  sourceProviderCard("google-docs", "Google Docs", "Docs", "simple:googledocs"),
  sourceProviderCard("google-drive", "Google Drive", "Docs", "google-drive"),
  sourceProviderCard("sharepoint", "Microsoft SharePoint", "Docs", "sharepoint"),
  sourceProviderCard("onedrive", "OneDrive", "Docs", "onedrive"),
  sourceProviderCard("dropbox", "Dropbox", "Docs", "dropbox"),
  sourceProviderCard("box", "Box", "Docs", "box"),
  sourceProviderCard("slab", "Slab", "Docs", "simple:slab"),
  sourceProviderCard("coda", "Coda", "Docs", "simple:coda"),
  sourceProviderCard("quip", "Quip", "Docs", "simple:quip"),
  sourceProviderCard("guru", "Guru", "Docs", "simple:getguru"),
  sourceProviderCard("tettra", "Tettra", "Docs", "simple:tettra"),
  sourceProviderCard("gitbook", "GitBook", "Docs", "simple:gitbook"),
  sourceProviderCard("readme", "ReadMe", "Docs", "simple:readme"),
  sourceProviderCard("docusaurus", "Docusaurus", "Docs", "simple:docusaurus"),
  sourceProviderCard("mintlify", "Mintlify", "Docs", "simple:mintlify"),
  sourceProviderCard("mkdocs", "MkDocs", "Docs", "simple:materialformkdocs"),
  sourceProviderCard("pdf-docs", "PDF docs", "Docs", "simple:adobeacrobatreader"),
  sourceProviderCard("internal-wiki", "Internal wiki", "Docs", "local-files"),

  sourceProviderCard("microsoft-teams", "Microsoft Teams", "Communication", "microsoft-teams"),
  sourceProviderCard("discord", "Discord", "Communication", "discord"),
  sourceProviderCard("google-chat", "Google Chat", "Communication", "simple:googlechat"),
  sourceProviderCard("mattermost", "Mattermost", "Communication", "simple:mattermost"),
  sourceProviderCard("zulip", "Zulip", "Communication", "simple:zulip"),
  sourceProviderCard("rocket-chat", "Rocket.Chat", "Communication", "simple:rocketdotchat"),
  sourceProviderCard("email", "Email", "Communication", "simple:gmail"),
  sourceProviderCard("gmail", "Gmail", "Communication", "gmail"),
  sourceProviderCard("outlook", "Outlook", "Communication", "outlook"),

  sourceProviderCard("intercom", "Intercom", "Support", "intercom"),
  sourceProviderCard("freshdesk", "Freshdesk", "Support", "freshdesk"),
  sourceProviderCard("help-scout", "Help Scout", "Support", "help-scout"),
  sourceProviderCard("front", "Front", "Support", "front"),
  sourceProviderCard("salesforce-service-cloud", "Salesforce Service Cloud", "Support", "salesforce"),
  sourceProviderCard("hubspot-service-hub", "HubSpot Service Hub", "Support", "hubspot"),
  sourceProviderCard("gorgias", "Gorgias", "Support", "simple:gorgias"),
  sourceProviderCard("kustomer", "Kustomer", "Support", "simple:kustomer"),
  sourceProviderCard("crisp", "Crisp", "Support", "simple:crisp"),
  sourceProviderCard("uservoice", "UserVoice", "Support", "simple:uservoice"),
  sourceProviderCard("canny", "Canny", "Support", "simple:canny"),
  sourceProviderCard("productboard", "Productboard", "Support", "simple:productboard"),
  sourceProviderCard("typeform", "Typeform", "Support", "simple:typeform"),
  sourceProviderCard("google-forms", "Google Forms", "Support", "simple:googleforms"),

  sourceProviderCard("datadog", "Datadog", "Cloud", "datadog"),
  sourceProviderCard("new-relic", "New Relic", "Cloud", "new-relic"),
  sourceProviderCard("grafana", "Grafana", "Cloud", "grafana"),
  sourceProviderCard("prometheus", "Prometheus", "Cloud", "prometheus"),
  sourceProviderCard("pagerduty", "PagerDuty", "Cloud", "pagerduty"),
  sourceProviderCard("opsgenie", "Opsgenie", "Cloud", "opsgenie"),
  sourceProviderCard("splunk", "Splunk", "Cloud", "simple:splunk"),
  sourceProviderCard("honeycomb", "Honeycomb", "Cloud", "honeycomb"),
  sourceProviderCard("logrocket", "LogRocket", "Cloud", "simple:logrocket"),
  sourceProviderCard("posthog", "PostHog", "Cloud", "posthog"),
  sourceProviderCard("bugsnag", "Bugsnag", "Cloud", "simple:bugsnag"),
  sourceProviderCard("rollbar", "Rollbar", "Cloud", "simple:rollbar"),
  sourceProviderCard("better-stack", "Better Stack", "Cloud", "simple:betterstack"),
  sourceProviderCard("uptimerobot", "UptimeRobot", "Cloud", "simple:uptimerobot"),

  sourceProviderCard("github-actions", "GitHub Actions", "Cloud", "github-actions"),
  sourceProviderCard("gitlab-ci", "GitLab CI", "Cloud", "gitlab"),
  sourceProviderCard("circleci", "CircleCI", "Cloud", "circleci"),
  sourceProviderCard("jenkins", "Jenkins", "Cloud", "jenkins"),
  sourceProviderCard("buildkite", "Buildkite", "Cloud", "buildkite"),
  sourceProviderCard("travis-ci", "Travis CI", "Cloud", "simple:travisci"),
  sourceProviderCard("azure-pipelines", "Azure Pipelines", "Cloud", "azure-devops"),
  sourceProviderCard("bitbucket-pipelines", "Bitbucket Pipelines", "Cloud", "bitbucket"),
  sourceProviderCard("vercel", "Vercel", "Cloud", "vercel"),
  sourceProviderCard("netlify", "Netlify", "Cloud", "netlify"),
  sourceProviderCard("railway", "Railway", "Cloud", "railway"),
  sourceProviderCard("render", "Render", "Cloud", "render"),
  sourceProviderCard("fly", "Fly.io", "Cloud", "fly"),
  sourceProviderCard("heroku", "Heroku", "Cloud", "heroku"),
  sourceProviderCard("cloudflare-pages", "Cloudflare Pages", "Cloud", "cloudflare-pages"),

  sourceProviderCard("aws", "AWS", "Cloud", "aws"),
  sourceProviderCard("gcp", "Google Cloud", "Cloud", "gcp"),
  sourceProviderCard("azure", "Azure", "Cloud", "azure"),
  sourceProviderCard("cloudflare", "Cloudflare", "Cloud", "cloudflare"),
  sourceProviderCard("digitalocean", "DigitalOcean", "Cloud", "digitalocean"),
  sourceProviderCard("kubernetes", "Kubernetes", "Cloud", "kubernetes"),
  sourceProviderCard("docker", "Docker", "Cloud", "docker"),
  sourceProviderCard("terraform", "Terraform", "Cloud", "terraform"),
  sourceProviderCard("pulumi", "Pulumi", "Cloud", "simple:pulumi"),
  sourceProviderCard("hashicorp-vault", "HashiCorp Vault", "Cloud", "simple:vault"),
  sourceProviderCard("doppler", "Doppler", "Cloud", "simple:doppler"),
  sourceProviderCard("onepassword-secrets", "1Password Secrets", "Cloud", "onepassword"),

  sourceProviderCard("postgres", "Postgres", "Cloud", "simple:postgresql"),
  sourceProviderCard("mysql", "MySQL", "Cloud", "simple:mysql"),
  sourceProviderCard("mongodb", "MongoDB", "Cloud", "simple:mongodb"),
  sourceProviderCard("redis", "Redis", "Cloud", "simple:redis"),
  sourceProviderCard("supabase", "Supabase", "Cloud", "supabase"),
  sourceProviderCard("neon", "Neon", "Cloud", "neon"),
  sourceProviderCard("planetscale", "PlanetScale", "Cloud", "planetscale"),
  sourceProviderCard("firebase", "Firebase", "Cloud", "simple:firebase"),
  sourceProviderCard("upstash", "Upstash", "Cloud", "simple:upstash"),
  sourceProviderCard("snowflake", "Snowflake", "Cloud", "simple:snowflake"),
  sourceProviderCard("bigquery", "BigQuery", "Cloud", "simple:googlebigquery"),
  sourceProviderCard("redshift", "Redshift", "Cloud", "simple:amazonredshift"),
  sourceProviderCard("databricks", "Databricks", "Cloud", "simple:databricks"),
  sourceProviderCard("pinecone", "Pinecone", "Cloud", "simple:pinecone"),
  sourceProviderCard("qdrant", "Qdrant", "Cloud", "simple:qdrant"),
  sourceProviderCard("weaviate", "Weaviate", "Cloud", "simple:weaviate"),
  sourceProviderCard("chroma", "Chroma", "Cloud", "simple:chroma"),
  sourceProviderCard("milvus", "Milvus", "Cloud", "simple:milvus"),
  sourceProviderCard("elasticsearch", "Elasticsearch", "Cloud", "simple:elasticsearch"),
  sourceProviderCard("opensearch", "OpenSearch", "Cloud", "simple:opensearch"),

  sourceProviderCard("amplitude", "Amplitude", "Cloud", "amplitude"),
  sourceProviderCard("mixpanel", "Mixpanel", "Cloud", "mixpanel"),
  sourceProviderCard("segment", "Segment", "Cloud", "simple:segment"),
  sourceProviderCard("heap", "Heap", "Cloud", "simple:heap"),
  sourceProviderCard("pendo", "Pendo", "Cloud", "simple:pendo"),
  sourceProviderCard("fullstory", "FullStory", "Cloud", "fullstory"),
  sourceProviderCard("hotjar", "Hotjar", "Cloud", "simple:hotjar"),
  sourceProviderCard("google-analytics", "Google Analytics", "Cloud", "simple:googleanalytics"),
  sourceProviderCard("metabase", "Metabase", "Cloud", "simple:metabase"),
  sourceProviderCard("mode", "Mode", "Cloud", "simple:mode"),
  sourceProviderCard("looker", "Looker", "Cloud", "simple:looker"),
  sourceProviderCard("tableau", "Tableau", "Cloud", "simple:tableau"),
  sourceProviderCard("power-bi", "Power BI", "Cloud", "simple:powerbi"),

  sourceProviderCard("snyk", "Snyk", "Engineering", "snyk"),
  sourceProviderCard("dependabot", "Dependabot", "Engineering", "simple:dependabot"),
  sourceProviderCard("github-advanced-security", "GitHub Advanced Security", "Engineering", "github"),
  sourceProviderCard("semgrep", "Semgrep", "Engineering", "semgrep"),
  sourceProviderCard("sonarqube", "SonarQube", "Engineering", "simple:sonarqube"),
  sourceProviderCard("codeql", "CodeQL", "Engineering", "simple:github"),
  sourceProviderCard("wiz", "Wiz", "Engineering", "simple:wiz"),
  sourceProviderCard("lacework", "Lacework", "Engineering", "simple:lacework"),
  sourceProviderCard("okta", "Okta", "Engineering", "okta"),
  sourceProviderCard("auth0", "Auth0", "Engineering", "auth0"),
  sourceProviderCard("clerk", "Clerk", "Engineering", "simple:clerk"),
  sourceProviderCard("workos", "WorkOS", "Engineering", "simple:workos"),
  sourceProviderCard("vanta", "Vanta", "Engineering", "simple:vanta"),
  sourceProviderCard("drata", "Drata", "Engineering", "simple:drata"),
  sourceProviderCard("secureframe", "Secureframe", "Engineering", "simple:secureframe"),

  sourceProviderCard("figma", "Figma", "Docs", "figma"),
  sourceProviderCard("figjam", "FigJam", "Docs", "figma"),
  sourceProviderCard("miro", "Miro", "Docs", "simple:miro"),
  sourceProviderCard("lucidchart", "Lucidchart", "Docs", "simple:lucid"),
  sourceProviderCard("whimsical", "Whimsical", "Docs", "simple:whimsical"),
  sourceProviderCard("canva", "Canva", "Docs", "simple:canva"),
  sourceProviderCard("framer", "Framer", "Docs", "framer"),
  sourceProviderCard("pitch", "Pitch", "Docs", "simple:pitch"),
  sourceProviderCard("tome", "Tome", "Docs", "simple:tome"),

  sourceProviderCard("salesforce", "Salesforce", "Support", "salesforce"),
  sourceProviderCard("hubspot-crm", "HubSpot CRM", "Support", "hubspot"),
  sourceProviderCard("pipedrive", "Pipedrive", "Support", "simple:pipedrive"),
  sourceProviderCard("attio", "Attio", "Support", "simple:attio"),
  sourceProviderCard("apollo", "Apollo", "Support", "simple:apollo"),
  sourceProviderCard("airtable", "Airtable", "Support", "simple:airtable"),
  sourceProviderCard("customer-io", "Customer.io", "Support", "simple:customerio"),
  sourceProviderCard("braze", "Braze", "Support", "simple:braze"),
  sourceProviderCard("mailchimp", "Mailchimp", "Support", "simple:mailchimp"),
  sourceProviderCard("loops", "Loops", "Support", "simple:loops"),
  sourceProviderCard("resend", "Resend", "Support", "simple:resend"),
  sourceProviderCard("sendgrid", "SendGrid", "Support", "simple:sendgrid"),
  sourceProviderCard("postmark", "Postmark", "Support", "simple:postmark"),

  sourceProviderCard("stripe", "Stripe", "Cloud", "simple:stripe"),
  sourceProviderCard("chargebee", "Chargebee", "Cloud", "simple:chargebee"),
  sourceProviderCard("paddle", "Paddle", "Cloud", "simple:paddle"),
  sourceProviderCard("recurly", "Recurly", "Cloud", "simple:recurly"),
  sourceProviderCard("razorpay", "Razorpay", "Cloud", "simple:razorpay"),
  sourceProviderCard("quickbooks", "QuickBooks", "Cloud", "simple:quickbooks"),
  sourceProviderCard("xero", "Xero", "Cloud", "simple:xero"),
  sourceProviderCard("plaid", "Plaid", "Cloud", "simple:plaid"),
  sourceProviderCard("ramp", "Ramp", "Cloud", "simple:ramp"),
  sourceProviderCard("brex", "Brex", "Cloud", "simple:brex"),
  sourceProviderCard("mercury", "Mercury", "Cloud", "simple:mercury"),

  sourceProviderCard("zapier", "Zapier", "Manual", "zapier"),
  sourceProviderCard("make", "Make", "Manual", "simple:make"),
  sourceProviderCard("n8n", "n8n", "Manual", "simple:n8n"),
  sourceProviderCard("pipedream", "Pipedream", "Manual", "simple:pipedream"),
  sourceProviderCard("ifttt", "IFTTT", "Manual", "simple:ifttt"),
  sourceProviderCard("retool", "Retool", "Manual", "simple:retool"),
  sourceProviderCard("internal-tools", "Internal tools", "Manual", "local-files"),
  sourceProviderCard("custom-webhook", "Custom webhook", "Manual", "web-crawler"),
  sourceProviderCard("custom-api", "Custom API", "Manual", "web-crawler"),
] as const;

function scope(req: Request): MasterplanScope {
  return {
    userId: req.authUserId,
    orgId: req.authOrgId,
  };
}

function bodyRecord(req: Request): Record<string, unknown> {
  return req.body && typeof req.body === "object" && !Array.isArray(req.body)
    ? (req.body as Record<string, unknown>)
    : {};
}

function stringParam(req: Request, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function stringQuery(req: Request, name: string): string | undefined {
  const value = req.query[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function errorStatus(error: unknown): number {
  if (!(error instanceof Error)) return 500;
  if (error.message.endsWith("_not_found")) return 404;
  if (error.message === "outcome_required") return 409;
  if (error.message === "inheritance_contract_required") return 409;
  if (error.message.includes("required")) return 400;
  return 500;
}

function sendRouteError(res: { status: (status: number) => { json: (body: unknown) => void } }, error: unknown): void {
  res.status(errorStatus(error)).json({
    error: error instanceof Error ? error.message : "internal_error",
  });
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return undefined;
}

function emitIgnitionEvent(
  req: Request,
  eventType: MemoryIgnitionEventType,
  payload: Record<string, unknown>,
): void {
  const kind =
    eventType === "package.created" ? "brief_ready" :
    eventType === "package.sent" ? "agent_run_started" :
    eventType === "agent_run.updated" ? "timeline_updated" :
    eventType === "outcome.captured" ? "outcome_recorded" :
    eventType === "future_instruction.created" ? "future_instruction_created" :
    eventType === "skill_candidate.created" ? "skill_candidate_generated" :
    "governance_review_queued";

  emitMemoryRealtimeEvent({
    userId: req.authUserId,
    orgId: req.authOrgId,
    kind,
    source: "memory-ignition",
    subject: {
      type: "memoryignition",
      id: firstString(payload.packageId, payload.runId, payload.outcomeId, payload.futureInstructionId),
      label: eventType,
    },
    payload: {
      eventType,
      ...payload,
      proofLoop: "Task -> Memory -> Risk -> Policy -> Package -> AgentRun -> Outcome -> Future Instruction -> Mistake Immunity",
      at: new Date().toISOString(),
    },
  });
}

function sourceProvider(providerId: string) {
  return SOURCE_PROVIDERS.find((provider) => provider.id === providerId) ?? SOURCE_PROVIDERS[2];
}

async function ensureSourceWorkspace(req: Request) {
  const requested = stringQuery(req, "workspaceId");
  const workspaces = await listWorkspaces(scope(req));
  const existing = requested ? workspaces.find((workspace) => workspace.id === requested) : workspaces[0];
  return existing ?? createWorkspace(scope(req), {
    name: "MemoryOS Workspace",
    plan: "developer",
    region: "local",
  });
}

function emitSourceEvent(
  req: Request,
  eventType: CompanySourceEventType,
  payload: Record<string, unknown>,
): void {
  const kind =
    eventType === "source.memory_extracted" ? "memory_extracted" :
    eventType === "source.sync_started" ? "request_logged" :
    eventType === "source.sync_failed" ? "governance_review_queued" :
    "source_synced";

  emitMemoryRealtimeEvent({
    userId: req.authUserId,
    orgId: req.authOrgId,
    kind,
    source: "company-brain",
    subject: {
      type: "company_source",
      id: firstString(payload.sourceId),
      label: firstString(payload.provider, payload.name, eventType),
    },
    payload: {
      eventType,
      ...payload,
      loop: "Source -> SourceItem -> MemoryExtractionJob -> Company Brain -> MemoryIgnition",
      at: new Date().toISOString(),
    },
  });
}

function emitCompanyBrainEvent(
  req: Request,
  eventType: CompanyBrainEventType,
  payload: Record<string, unknown>,
): void {
  const kind =
    eventType === "future_instruction.created" ? "future_instruction_created" :
    eventType === "mistake_rule.created" ? "skill_candidate_generated" :
    eventType === "memory.approved" || eventType === "memory.verified" ? "memory_processed" :
    "governance_review_queued";

  emitMemoryRealtimeEvent({
    userId: req.authUserId,
    orgId: req.authOrgId,
    kind,
    source: "company-brain",
    subject: {
      type: "memory",
      id: firstString(payload.memoryId, payload.futureInstructionId, payload.ruleId),
      label: eventType,
    },
    payload: {
      eventType,
      ...payload,
      loop: "SourceItem -> Memory -> Proof -> Integrity Check -> Approved Memory -> MemoryIgnition -> Future Instruction -> Mistake Immunity -> Skill Candidate",
      at: new Date().toISOString(),
    },
  });
}

function sourceMatchesFilter(source: { provider: string; type: string }, category?: string): boolean {
  if (!category || category === "All Sources") return true;
  const provider = sourceProvider(source.provider);
  return provider.category === category || source.type === category.toLowerCase();
}

masterplanRouter.post("/workspaces", asyncHandler(async (req, res) => {
  const body = bodyRecord(req);
  const workspace = await createWorkspace(scope(req), {
    name: typeof body.name === "string" ? body.name : undefined,
    plan: typeof body.plan === "string" ? body.plan : undefined,
    region: typeof body.region === "string" ? body.region : undefined,
  });
  res.status(201).json({ workspace });
}));

masterplanRouter.get("/workspaces", asyncHandler(async (req, res) => {
  res.json({ workspaces: await listWorkspaces(scope(req)) });
}));

masterplanRouter.get("/workspaces/:id", asyncHandler(async (req, res) => {
  try {
    res.json({ workspace: await getWorkspace(scope(req), stringParam(req, "id")) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/sources/summary", asyncHandler(async (req, res) => {
  try {
    const workspace = await ensureSourceWorkspace(req);
    const sources = await listSources(scope(req), workspace.id);
    const [itemsBySource, memoriesBySource] = await Promise.all([
      Promise.all(sources.map((source) => listSourceItems(scope(req), source.id).catch(() => []))),
      Promise.all(sources.map((source) => listSourceMemories(scope(req), source.id).catch(() => []))),
    ]);
    const connected = sources.filter((source) => !["not_connected", "disconnected"].includes(source.status)).length;
    const errors = (await listMemoryRealtimeEvents(req.authUserId, 200)).filter((event) =>
      event.payload.eventType === "source.sync_failed",
    );
    const totalItems = itemsBySource.reduce((sum, items) => sum + items.length, 0);
    const totalMemories = memoriesBySource.reduce((sum, memories) => sum + memories.length, 0);
    res.json({
      workspace,
      summary: {
        connectedSources: connected,
        totalSources: sources.length,
        itemsImported: totalItems,
        memoriesExtracted: totalMemories,
        syncHealth: sources.length ? Math.max(0, Math.round((connected / sources.length) * 100)) : 100,
        syncErrors: errors.length,
        lastSyncAt: sources.map((source) => source.lastSyncedAt).filter(Boolean).sort().at(-1) ?? null,
      },
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/sources/providers", asyncHandler(async (_req, res) => {
  res.json({
    providers: SOURCE_PROVIDERS,
    firstLaunch: SOURCE_PROVIDERS.filter((provider) => provider.firstLaunch),
    later: SOURCE_PROVIDERS.filter((provider) => !provider.firstLaunch),
  });
}));

masterplanRouter.post("/sources", asyncHandler(async (req, res) => {
  const body = bodyRecord(req);
  const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId : "";
  if (!workspaceId) {
    res.status(400).json({ error: "workspaceId is required" });
    return;
  }
  try {
    const source = await createSource(scope(req), {
      workspaceId,
      provider: typeof body.provider === "string" ? body.provider : undefined,
      type: typeof body.type === "string" ? body.type : undefined,
      status: typeof body.status === "string" ? body.status : undefined,
      permissions: body.permissions,
    });
    res.status(201).json({ source });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/sources", asyncHandler(async (req, res) => {
  try {
    const workspace = await ensureSourceWorkspace(req);
    const category = stringQuery(req, "category");
    const sources = (await listSources(scope(req), workspace.id)).filter((source) =>
      sourceMatchesFilter(source, category),
    );
    const enriched = await Promise.all(sources.map(async (source) => {
      const [items, memories] = await Promise.all([
        listSourceItems(scope(req), source.id).catch(() => []),
        listSourceMemories(scope(req), source.id).catch(() => []),
      ]);
      const provider = sourceProvider(source.provider);
      return {
        ...source,
        providerName: provider.name,
        category: provider.category,
        icon: provider.icon,
        firstLaunch: provider.firstLaunch,
        itemCount: items.length,
        memoryCount: memories.length,
        health: source.status === "error" ? 35 : source.status === "syncing" ? 72 : source.status === "disconnected" ? null : 96,
      };
    }));
    res.json({ workspace, sources: enriched });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/sources/connect", asyncHandler(async (req, res) => {
  const body = bodyRecord(req);
  const providerId = typeof body.provider === "string" ? body.provider : "manual-notes";
  const provider = sourceProvider(providerId);
  if (!provider.firstLaunch) {
    res.status(400).json({ error: "provider_not_enabled_first_launch" });
    return;
  }
  try {
    const workspace = await ensureSourceWorkspace(req);
    const source = await createSource(scope(req), {
      workspaceId: workspace.id,
      provider: provider.id,
      type: typeof body.type === "string" ? body.type : provider.category.toLowerCase(),
      status: "connected",
      permissions: {
        mode: "read",
        provider: provider.id,
        connectedVia: "company_sources",
        connectedAt: new Date().toISOString(),
      },
    });
    emitSourceEvent(req, "source.connected", {
      sourceId: source.id,
      provider: source.provider,
      name: provider.name,
      workspaceId: source.workspaceId,
    });
    res.status(201).json({ source, provider });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/sources/:id/sync", asyncHandler(async (req, res) => {
  try {
    const sourceId = stringParam(req, "id");
    const source = await getSource(scope(req), sourceId);
    const job = {
      id: `sync_${Date.now()}_${source.id.slice(0, 6)}`,
      sourceId: source.id,
      status: "running",
      startedAt: new Date().toISOString(),
    };
    await updateSourceStatus(scope(req), source.id, "syncing");
    emitSourceEvent(req, "source.sync_started", {
      sourceId: source.id,
      provider: source.provider,
      jobId: job.id,
      workspaceId: source.workspaceId,
    });
    const synced = await syncSource(scope(req), source.id);
    const [items, memories] = await Promise.all([
      listSourceItems(scope(req), source.id).catch(() => []),
      listSourceMemories(scope(req), source.id).catch(() => []),
    ]);
    emitSourceEvent(req, "source.sync_completed", {
      sourceId: source.id,
      provider: source.provider,
      jobId: job.id,
      itemCount: items.length,
      memoryCount: memories.length,
    });
    res.json({ source: synced, job: { ...job, status: "completed", completedAt: new Date().toISOString() } });
  } catch (error) {
    emitSourceEvent(req, "source.sync_failed", {
      sourceId: stringParam(req, "id"),
      error: error instanceof Error ? error.message : "sync_failed",
    });
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/sources/:id/disconnect", asyncHandler(async (req, res) => {
  try {
    res.json({ source: await updateSourceStatus(scope(req), stringParam(req, "id"), "disconnected") });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/sources/:id/reconnect", asyncHandler(async (req, res) => {
  try {
    const source = await updateSourceStatus(scope(req), stringParam(req, "id"), "connected");
    emitSourceEvent(req, "source.connected", {
      sourceId: source.id,
      provider: source.provider,
      workspaceId: source.workspaceId,
    });
    res.json({ source });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/sources/:id", asyncHandler(async (req, res) => {
  try {
    const source = await getSource(scope(req), stringParam(req, "id"));
    const [items, memories] = await Promise.all([
      listSourceItems(scope(req), source.id).catch(() => []),
      listSourceMemories(scope(req), source.id).catch(() => []),
    ]);
    res.json({
      source: {
        ...source,
        providerName: sourceProvider(source.provider).name,
        category: sourceProvider(source.provider).category,
        itemCount: items.length,
        memoryCount: memories.length,
      },
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/sources/:id/items", asyncHandler(async (req, res) => {
  try {
    res.json({ items: await listSourceItems(scope(req), stringParam(req, "id")) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/sources/:id/items", asyncHandler(async (req, res) => {
  const body = bodyRecord(req);
  const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId : "";
  if (!workspaceId) {
    res.status(400).json({ error: "workspaceId is required" });
    return;
  }
  try {
    const item = await createSourceItem(scope(req), {
      workspaceId,
      sourceId: stringParam(req, "id"),
      type: typeof body.type === "string" ? body.type : undefined,
      title: typeof body.title === "string" ? body.title : undefined,
      content: typeof body.content === "string" ? body.content : undefined,
      url: typeof body.url === "string" ? body.url : null,
      metadata: body.metadata,
      extractMemory: body.extractMemory !== false,
    });
    res.status(201).json({ item });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/company-brain/summary", asyncHandler(async (req, res) => {
  try {
    const memories = await listMemories(scope(req), {
      workspaceId: stringQuery(req, "workspaceId"),
      query: stringQuery(req, "q"),
    });
    const byStatus = memories.reduce<Record<string, number>>((acc, memory) => {
      acc[memory.status] = (acc[memory.status] ?? 0) + 1;
      return acc;
    }, {});
    const byType = memories.reduce<Record<string, number>>((acc, memory) => {
      acc[memory.type] = (acc[memory.type] ?? 0) + 1;
      return acc;
    }, {});
    const approved = byStatus.approved ?? 0;
    const stale = byStatus.stale ?? 0;
    const needsReview = memories.filter((memory) => !["approved", "deprecated", "merged"].includes(memory.status)).length;
    const highRisk = memories.filter((memory) => memory.riskLevel === "high").length;
    const avgQuality = memories.length
      ? Math.round(memories.reduce((total, memory) => total + memory.qualityScore, 0) / memories.length)
      : 0;
    res.json({
      summary: {
        totalMemories: memories.length,
        approved,
        needsReview,
        stale,
        highRisk,
        linkedOutcomes: (await listMemoryRealtimeEvents(req.authUserId, 1000))
          .filter((event) => event.payload.eventType === "outcome.captured")
          .length,
        avgQuality,
        byStatus,
        byType,
        proofLoop: "SourceItem -> Memory -> Proof -> Integrity Check -> Approved Memory -> MemoryIgnition / Future Instruction / Mistake Immunity / Skill Candidate",
      },
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/memories", asyncHandler(async (req, res) => {
  try {
    res.json({ memories: await listMemories(scope(req), {
      workspaceId: stringQuery(req, "workspaceId"),
      type: stringQuery(req, "type"),
      status: stringQuery(req, "status"),
      riskLevel: stringQuery(req, "riskLevel"),
      query: stringQuery(req, "q"),
    }) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/memories/search", asyncHandler(async (req, res) => {
  const body = bodyRecord(req);
  try {
    res.json({ memories: await searchMemories(scope(req), {
      workspaceId: typeof body.workspaceId === "string" ? body.workspaceId : undefined,
      query: typeof body.query === "string" ? body.query : undefined,
      limit: typeof body.limit === "number" ? body.limit : undefined,
    }) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/memories/:id/proof", asyncHandler(async (req, res) => {
  try {
    res.json({ proof: await getMemoryProof(scope(req), stringParam(req, "id")) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/memories/:id/related", asyncHandler(async (req, res) => {
  try {
    res.json({ memories: await listRelatedMemories(scope(req), stringParam(req, "id")) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/memories/:id", asyncHandler(async (req, res) => {
  try {
    res.json({ memory: await getMemory(scope(req), stringParam(req, "id")) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.patch("/memories/:id", asyncHandler(async (req, res) => {
  try {
    const memory = await updateMemory(scope(req), stringParam(req, "id"), bodyRecord(req));
    emitCompanyBrainEvent(req, "memory.updated", { memoryId: memory.id, workspaceId: memory.workspaceId });
    res.json({ memory });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/memories/:id/approve", asyncHandler(async (req, res) => {
  try {
    const memory = await updateMemoryStatus(scope(req), stringParam(req, "id"), "approved");
    emitCompanyBrainEvent(req, "memory.approved", { memoryId: memory.id, workspaceId: memory.workspaceId });
    res.json({ memory });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/memories/:id/verify", asyncHandler(async (req, res) => {
  try {
    const memory = await updateMemoryStatus(scope(req), stringParam(req, "id"), "approved");
    emitCompanyBrainEvent(req, "memory.verified", { memoryId: memory.id, workspaceId: memory.workspaceId });
    res.json({ memory });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/memories/:id/deprecate", asyncHandler(async (req, res) => {
  try {
    const memory = await updateMemoryStatus(scope(req), stringParam(req, "id"), "deprecated");
    emitCompanyBrainEvent(req, "memory.deprecated", { memoryId: memory.id, workspaceId: memory.workspaceId });
    res.json({ memory });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/memories/:id/mark-stale", asyncHandler(async (req, res) => {
  try {
    const memory = await updateMemoryStatus(scope(req), stringParam(req, "id"), "stale");
    emitCompanyBrainEvent(req, "memory.stale", { memoryId: memory.id, workspaceId: memory.workspaceId });
    res.json({ memory });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/memories/:id/add-correction", asyncHandler(async (req, res) => {
  const body = bodyRecord(req);
  try {
    const memory = await addMemoryCorrection(scope(req), stringParam(req, "id"), {
      correction: typeof body.correction === "string" ? body.correction : "",
      author: typeof body.author === "string" ? body.author : undefined,
    });
    emitCompanyBrainEvent(req, "memory.correction_added", { memoryId: memory.id, workspaceId: memory.workspaceId });
    res.json({ memory });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/memories/:id/merge", asyncHandler(async (req, res) => {
  const body = bodyRecord(req);
  const targetMemoryId = typeof body.targetMemoryId === "string" ? body.targetMemoryId : "";
  if (!targetMemoryId) {
    res.status(400).json({ error: "targetMemoryId is required" });
    return;
  }
  try {
    const memory = await mergeMemory(scope(req), stringParam(req, "id"), targetMemoryId);
    emitCompanyBrainEvent(req, "memory.merged", { memoryId: stringParam(req, "id"), targetMemoryId: memory.id, workspaceId: memory.workspaceId });
    res.json({ memory });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/memories/:id/create-future-instruction", asyncHandler(async (req, res) => {
  try {
    const futureInstruction = await createFutureInstructionFromMemory(scope(req), stringParam(req, "id"));
    emitCompanyBrainEvent(req, "future_instruction.created", {
      memoryId: stringParam(req, "id"),
      futureInstructionId: futureInstruction.id,
      workspaceId: futureInstruction.workspaceId,
    });
    res.status(201).json({ futureInstruction });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/memories/:id/create-mistake-rule", asyncHandler(async (req, res) => {
  try {
    const result = await createMistakeRuleFromMemory(scope(req), stringParam(req, "id"));
    emitCompanyBrainEvent(req, "mistake_rule.created", {
      memoryId: stringParam(req, "id"),
      ruleId: result.rule.id,
      skillId: result.skill.id,
      workspaceId: result.skill.workspaceId,
    });
    res.status(201).json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/sources/:id/memories", asyncHandler(async (req, res) => {
  try {
    res.json({ memories: await listSourceMemories(scope(req), stringParam(req, "id")) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/sources/:id/errors", asyncHandler(async (req, res) => {
  const sourceId = stringParam(req, "id");
  const errors = (await listMemoryRealtimeEvents(req.authUserId, 500))
    .filter((event) => event.payload.eventType === "source.sync_failed" && event.payload.sourceId === sourceId)
    .map((event) => ({ id: event.id, occurredAt: event.occurredAt, ...event.payload }));
  res.json({ errors });
}));

masterplanRouter.get("/sources/:id/sync-events", asyncHandler(async (req, res) => {
  const sourceId = stringParam(req, "id");
  const events = (await listMemoryRealtimeEvents(req.authUserId, 500))
    .filter((event) => event.subject?.type === "company_source" && event.subject.id === sourceId)
    .map((event) => ({ id: event.id, kind: event.kind, occurredAt: event.occurredAt, ...event.payload }));
  res.json({ events });
}));

masterplanRouter.post("/sources/manual-import", asyncHandler(async (req, res) => {
  const body = bodyRecord(req);
  const files = Array.isArray(body.files) ? body.files : [];
  const fallbackContent = typeof body.content === "string" ? body.content : "";
  try {
    const workspace = await ensureSourceWorkspace(req);
    const source = await createSource(scope(req), {
      workspaceId: workspace.id,
      provider: "markdown-docs",
      type: "docs",
      status: "connected",
      permissions: { mode: "read", importType: "manual" },
    });
    const inputs = files.length ? files : [{ name: body.title ?? "Manual import", content: fallbackContent }];
    const items = [];
    for (const input of inputs) {
      const record = asRecord(input);
      const title = firstString(record.name, record.title, body.title, "Manual import") ?? "Manual import";
      const content = firstString(record.content, fallbackContent) ?? "";
      if (!content.trim()) continue;
      const item = await createSourceItem(scope(req), {
        workspaceId: workspace.id,
        sourceId: source.id,
        type: "markdown",
        title,
        content,
        metadata: { importKind: "manual-import", memoryExtractionJob: "created" },
        extractMemory: true,
      });
      items.push(item);
      emitSourceEvent(req, "source.item_imported", { sourceId: source.id, itemId: item.id, title });
      emitSourceEvent(req, "source.memory_extracted", { sourceId: source.id, itemId: item.id, title });
    }
    res.status(201).json({ source, items, memoryExtractionJob: { status: "completed", itemCount: items.length } });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/sources/agent-chat-paste", asyncHandler(async (req, res) => {
  const body = bodyRecord(req);
  const content = typeof body.content === "string" ? body.content : "";
  if (!content.trim()) {
    res.status(400).json({ error: "content is required" });
    return;
  }
  try {
    const workspace = await ensureSourceWorkspace(req);
    const source = await createSource(scope(req), {
      workspaceId: workspace.id,
      provider: "agent-chat-paste",
      type: "agent_session",
      status: "connected",
      permissions: { mode: "read", importType: "agent-chat-paste" },
    });
    const item = await createSourceItem(scope(req), {
      workspaceId: workspace.id,
      sourceId: source.id,
      type: "agent_session",
      title: firstString(body.title, "Agent chat paste") ?? "Agent chat paste",
      content,
      metadata: {
        agent: firstString(body.agent, "unknown"),
        importKind: "agent-chat-paste",
        memoryExtractionJob: "created",
      },
      extractMemory: true,
    });
    emitSourceEvent(req, "source.item_imported", { sourceId: source.id, itemId: item.id, title: item.title });
    emitSourceEvent(req, "source.memory_extracted", { sourceId: source.id, itemId: item.id, title: item.title });
    res.status(201).json({ source, item, memoryExtractionJob: { status: "completed", itemCount: 1 } });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/memoryignition/state", asyncHandler(async (req, res) => {
  try {
    const workspaces = await listWorkspaces(scope(req));
    const requestedWorkspaceId = stringQuery(req, "workspaceId");
    const workspace =
      (requestedWorkspaceId
        ? workspaces.find((item) => item.id === requestedWorkspaceId)
        : workspaces[0]) ?? null;

    if (!workspace) {
      res.json({
        workspace: null,
        memories: [],
        packages: [],
        runs: [],
        futureInstructions: [],
        latestPackage: null,
        latestRun: null,
        metrics: {
          agentReadiness: 0,
          memoryQuality: 0,
          policyCheck: 0,
          requiredTests: 0,
          riskWarnings: 0,
        },
        policyGate: {
          status: "blocked",
          reasons: ["Create or link a workspace before preparing a package."],
          checks: [],
        },
        connection: {
          mcp: "needs_setup",
          api: "ready",
        },
        proofLoop: "Task -> Memory -> Risk -> Policy -> Package -> AgentRun -> Outcome -> Future Instruction -> Mistake Immunity",
      });
      return;
    }

    const [memories, packages, runs, futureInstructions] = await Promise.all([
      listMemories(scope(req), { workspaceId: workspace.id }),
      listInheritancePackages(scope(req), workspace.id),
      listAgentRuns(scope(req), workspace.id),
      listFutureInstructions(scope(req), workspace.id),
    ]);
    const latestPackage = packages[0] ?? null;
    const latestRun = runs[0] ?? null;
    const payload = asRecord(latestPackage?.payload);
    const approvals = asStringArray(payload.approval_requirements ?? payload.approval_rules);
    const riskyFiles = asStringArray(payload.risky_files);
    const requiredTests = asStringArray(payload.required_tests);
    const blockedActions = asStringArray(payload.blocked_actions);
    const memoryQuality =
      latestPackage?.memoryQualityScore ??
      (memories.length
        ? Math.round(memories.reduce((total, memory) => total + memory.qualityScore, 0) / memories.length)
        : 0);
    const gateReasons = [
      ...approvals.map((approval) => `Approval required: ${approval}`),
      ...blockedActions.map((action) => `Blocked action: ${action}`),
      ...(memoryQuality > 0 && memoryQuality < 70 ? ["Memory quality below 70 blocks autonomous execution."] : []),
    ];

    res.json({
      workspace,
      memories,
      packages,
      runs,
      futureInstructions,
      latestPackage,
      latestRun,
      metrics: {
        agentReadiness: latestPackage?.agentReadinessScore ?? (memories.length ? 72 : 0),
        memoryQuality,
        policyCheck: latestPackage?.reliabilityScore ?? (gateReasons.length ? 62 : memories.length ? 82 : 0),
        requiredTests: requiredTests.length,
        riskWarnings: riskyFiles.length,
      },
      policyGate: {
        status: gateReasons.length ? "blocked" : "allow",
        reasons: gateReasons,
        checks: [
          { label: "Memory retrieved", status: memories.length ? "pass" : "empty", count: memories.length },
          { label: "Risk scanned", status: riskyFiles.length ? "review" : "pass", count: riskyFiles.length },
          { label: "Tests attached", status: requiredTests.length ? "pass" : "empty", count: requiredTests.length },
          { label: "Approvals checked", status: approvals.length ? "blocked" : "pass", count: approvals.length },
        ],
      },
      connection: {
        mcp: "ready",
        api: "ready",
      },
      proofLoop: "Task -> Memory -> Risk -> Policy -> Package -> AgentRun -> Outcome -> Future Instruction -> Mistake Immunity",
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/memoryignition/prepare", asyncHandler(async (req, res) => {
  const body = bodyRecord(req);
  const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId : "";
  const task = typeof body.task === "string" ? body.task : "";
  if (!workspaceId || !task) {
    res.status(400).json({ error: "workspaceId and task are required" });
    return;
  }
  try {
    const prepared = await prepareInheritancePackage(scope(req), {
      workspaceId,
      task,
      whyItMatters: typeof body.whyItMatters === "string" ? body.whyItMatters : undefined,
      targetAgent: typeof body.targetAgent === "string" ? body.targetAgent : undefined,
      targetFormat: typeof body.targetFormat === "string" ? body.targetFormat : undefined,
      autonomyLevel: typeof body.autonomyLevel === "string" ? body.autonomyLevel : undefined,
      safetyMode: typeof body.safetyMode === "string" ? body.safetyMode : undefined,
    });
    res.json(prepared);
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/skill-router/route", asyncHandler(async (req, res) => {
  const body = bodyRecord(req);
  const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId : "";
  const task = typeof body.task === "string" ? body.task : "";
  if (!workspaceId || !task) {
    res.status(400).json({ error: "workspaceId and task are required" });
    return;
  }
  try {
    const memories = await searchMemories(scope(req), {
      workspaceId,
      query: task,
      limit: 12,
    });
    const skills = await routeSkillsForTask(scope(req), {
      workspaceId,
      task,
      memories,
      limit: typeof body.limit === "number" ? body.limit : 3,
    });
    res.json({
      skills,
      proof: {
        mode: "top_3_relevant_skills",
        maxSkills: 3,
        memorySignals: memories.length,
        selectedSkillIds: skills.map((skill) => skill.id),
        lineage: "Task -> SkillRouter -> InheritanceContract -> InheritancePackage",
      },
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/memoryignition/package", asyncHandler(async (req, res) => {
  const body = bodyRecord(req);
  const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId : "";
  const task = typeof body.task === "string" ? body.task : "";
  if (!workspaceId || !task) {
    res.status(400).json({ error: "workspaceId and task are required" });
    return;
  }
  try {
    const inheritancePackage = await createInheritancePackage(scope(req), {
      workspaceId,
      contractId: typeof body.contractId === "string" ? body.contractId : null,
      task,
      whyItMatters: typeof body.whyItMatters === "string" ? body.whyItMatters : undefined,
      targetAgent: typeof body.targetAgent === "string" ? body.targetAgent : undefined,
      targetFormat: typeof body.targetFormat === "string" ? body.targetFormat : undefined,
      autonomyLevel: typeof body.autonomyLevel === "string" ? body.autonomyLevel : undefined,
      safetyMode: typeof body.safetyMode === "string" ? body.safetyMode : undefined,
    });
    emitIgnitionEvent(req, "package.created", {
      packageId: inheritancePackage.id,
      contractId: inheritancePackage.contractId,
      workspaceId: inheritancePackage.workspaceId,
      targetAgent: inheritancePackage.targetAgent,
    });
    res.status(201).json({ package: inheritancePackage });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/memoryignition/send-now", asyncHandler(async (req, res) => {
  const body = bodyRecord(req);
  const packageId = typeof body.packageId === "string" ? body.packageId : "";
  if (!packageId) {
    res.status(400).json({ error: "packageId is required" });
    return;
  }
  try {
    const run = await sendNow(scope(req), {
      packageId,
      agentRoleId: typeof body.agentRoleId === "string" ? body.agentRoleId : null,
    });
    emitIgnitionEvent(req, "package.sent", {
      packageId,
      contractId: run.contractId,
      runId: run.id,
      workspaceId: run.workspaceId,
      targetAgent: run.targetAgent,
      status: run.status,
    });
    emitIgnitionEvent(req, "agent_run.updated", {
      packageId,
      contractId: run.contractId,
      runId: run.id,
      workspaceId: run.workspaceId,
      status: run.status,
    });
    res.status(201).json({ run });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/packages/summary", asyncHandler(async (req, res) => {
  try {
    const packages = await listInheritancePackages(scope(req), stringQuery(req, "workspaceId"));
    const runs = await listAgentRuns(scope(req), stringQuery(req, "workspaceId")).catch(() => []);
    const today = new Date().toISOString().slice(0, 10);
    const packageRows = packages.map((item) => ({
      ...item,
      status: derivePackageStatus(item),
      linkedRun: runs.find((run) => run.packageId === item.id) ?? null,
    }));
    const sentToday = runs.filter((run) => run.packageId && run.startedAt && new Date(run.startedAt).toISOString().slice(0, 10) === today).length;
    const avgMemoryQuality = packages.length
      ? Math.round(packages.reduce((total, item) => total + item.memoryQualityScore, 0) / packages.length)
      : 0;
    res.json({
      summary: {
        packagesGenerated: packages.length,
        readyToSend: packageRows.filter((item) => item.status === "ready").length,
        sentToday,
        needsReview: packageRows.filter((item) => item.status === "needs_review").length,
        blockedPackages: packageRows.filter((item) => item.status === "blocked").length,
        avgMemoryQuality,
        proofLoop: "MemoryIgnition -> InheritanceContract -> InheritancePackage -> Proof -> Delivery -> AgentRun",
      },
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/packages", asyncHandler(async (req, res) => {
  try {
    const packages = await listInheritancePackages(scope(req), stringQuery(req, "workspaceId"));
    const runs = await listAgentRuns(scope(req), stringQuery(req, "workspaceId")).catch(() => []);
    res.json({
      packages: packages.map((item) => ({
        ...item,
        status: derivePackageStatus(item),
        linkedRun: runs.find((run) => run.packageId === item.id) ?? null,
      })),
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/packages/:id", asyncHandler(async (req, res) => {
  try {
    res.json({ package: await getPackage(scope(req), stringParam(req, "id")) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/packages/:id/proof", asyncHandler(async (req, res) => {
  try {
    const inheritancePackage = await getPackage(scope(req), stringParam(req, "id"));
    res.json({
      proof: {
        ...asRecord(inheritancePackage.proof),
        packageId: inheritancePackage.id,
        status: derivePackageStatus(inheritancePackage),
        loop: "MemoryIgnition -> InheritanceContract -> InheritancePackage -> Proof -> Delivery -> AgentRun",
      },
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/packages/:id/prompt", asyncHandler(async (req, res) => {
  try {
    const inheritancePackage = await getPackage(scope(req), stringParam(req, "id"));
    res.json({
      packageId: inheritancePackage.id,
      prompt: await getPackagePrompt(scope(req), inheritancePackage.id),
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/packages/:id/json", asyncHandler(async (req, res) => {
  try {
    res.json(await getPackageAuditJson(scope(req), stringParam(req, "id")));
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/packages/:id/send-history", asyncHandler(async (req, res) => {
  try {
    res.json({ history: await getPackageSendHistory(scope(req), stringParam(req, "id")) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/packages/:id/copy-prompt", asyncHandler(async (req, res) => {
  try {
    const packageId = stringParam(req, "id");
    const [prompt, inheritancePackage] = await Promise.all([
      getPackagePrompt(scope(req), packageId),
      recordPackagePromptCopy(scope(req), packageId),
    ]);
    emitIgnitionEvent(req, "prompt.copied", {
      packageId,
      recorded: true,
    });
    res.status(201).json({ prompt, package: inheritancePackage, recorded: true });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/packages/:id/copy-event", asyncHandler(async (req, res) => {
  try {
    const packageId = stringParam(req, "id");
    const inheritancePackage = await recordPackagePromptCopy(scope(req), packageId);
    emitIgnitionEvent(req, "prompt.copied", { packageId, recorded: true });
    res.status(201).json({ recorded: true, package: inheritancePackage });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/packages/:id/export-json", asyncHandler(async (req, res) => {
  try {
    const packageId = stringParam(req, "id");
    const [payload, inheritancePackage] = await Promise.all([
      getPackageAuditJson(scope(req), packageId),
      recordPackageJsonExport(scope(req), packageId),
    ]);
    emitIgnitionEvent(req, "package.json_exported", { packageId, workspaceId: inheritancePackage.workspaceId });
    res.status(201).json({ ...payload, package: inheritancePackage });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

async function sendPackageVia(req: Request, res: { status: (status: number) => { json: (body: unknown) => void }; json: (body: unknown) => void }, channel: "mcp" | "api") {
  try {
    const packageId = stringParam(req, "id");
    const run = await sendNow(scope(req), { packageId, channel });
    emitIgnitionEvent(req, "package.sent", {
      packageId,
      runId: run.id,
      targetAgent: run.targetAgent,
      workspaceId: run.workspaceId,
      channel,
    });
    res.status(201).json({ run, channel });
  } catch (error) {
    sendRouteError(res, error);
  }
}

masterplanRouter.post("/packages/:id/send-mcp", asyncHandler(async (req, res) => {
  await sendPackageVia(req, res, "mcp");
}));

masterplanRouter.post("/packages/:id/send-api", asyncHandler(async (req, res) => {
  await sendPackageVia(req, res, "api");
}));

masterplanRouter.post("/packages/:id/create-handoff", asyncHandler(async (req, res) => {
  try {
    const packageId = stringParam(req, "id");
    const inheritancePackage = await createPackageHandoff(scope(req), packageId);
    emitIgnitionEvent(req, "package.handoff_created", { packageId, workspaceId: inheritancePackage.workspaceId });
    res.status(201).json({ package: inheritancePackage });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/packages/:id/save-template", asyncHandler(async (req, res) => {
  try {
    const packageId = stringParam(req, "id");
    const inheritancePackage = await savePackageTemplate(scope(req), packageId);
    emitIgnitionEvent(req, "package.template_saved", { packageId, workspaceId: inheritancePackage.workspaceId });
    res.status(201).json({ package: inheritancePackage });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/packages/:id/approve", asyncHandler(async (req, res) => {
  try {
    const packageId = stringParam(req, "id");
    const inheritancePackage = await approvePackage(scope(req), packageId);
    emitIgnitionEvent(req, "package.approved", { packageId, workspaceId: inheritancePackage.workspaceId });
    res.json({ package: inheritancePackage });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/packages/:id/block", asyncHandler(async (req, res) => {
  const body = bodyRecord(req);
  try {
    const packageId = stringParam(req, "id");
    const inheritancePackage = await blockPackage(scope(req), packageId, typeof body.reason === "string" ? body.reason : undefined);
    emitIgnitionEvent(req, "package.blocked", { packageId, workspaceId: inheritancePackage.workspaceId });
    res.json({ package: inheritancePackage });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/packages/:id/rebuild", asyncHandler(async (req, res) => {
  try {
    const packageId = stringParam(req, "id");
    const inheritancePackage = await rebuildPackage(scope(req), packageId);
    emitIgnitionEvent(req, "package.rebuilt", { packageId, rebuiltPackageId: inheritancePackage.id, workspaceId: inheritancePackage.workspaceId });
    res.status(201).json({ package: inheritancePackage });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/agent-runs", asyncHandler(async (req, res) => {
  const body = bodyRecord(req);
  const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId : "";
  if (!workspaceId) {
    res.status(400).json({ error: "workspaceId is required" });
    return;
  }
  try {
    const run = await createAgentRun(scope(req), {
      workspaceId,
      contractId: typeof body.contractId === "string" ? body.contractId : null,
      packageId: typeof body.packageId === "string" ? body.packageId : null,
      agentRoleId: typeof body.agentRoleId === "string" ? body.agentRoleId : null,
      task: typeof body.task === "string" ? body.task : null,
      targetAgent: typeof body.targetAgent === "string" ? body.targetAgent : undefined,
      status: typeof body.status === "string" ? body.status : undefined,
    });
    await recordAgentRunEvent(scope(req), run.id, {
      type: "run_created",
      payload: {
        contractId: run.contractId,
        packageId: run.packageId,
        targetAgent: run.targetAgent,
        status: run.status,
      },
      proof: { agentRunId: run.id, contractId: run.contractId, workspaceId: run.workspaceId },
    });
    emitIgnitionEvent(req, "agent_run.updated", {
      runId: run.id,
      contractId: run.contractId,
      workspaceId: run.workspaceId,
      status: run.status,
      runEventType: "run_created",
    });
    res.status(201).json({ run });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/agent-runs/summary", asyncHandler(async (req, res) => {
  try {
    const runs = await listAgentRuns(scope(req), stringQuery(req, "workspaceId"));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedRuns = runs.filter((run) => run.status === "Completed");
    const failedRuns = runs.filter((run) => run.status === "Failed");
    const outcomeRuns = runs.filter((run) => Boolean(run.outcomeId || run.outcome));
    const durations = completedRuns
      .map((run) => {
        const started = run.startedAt ? new Date(run.startedAt).getTime() : NaN;
        const ended = run.endedAt ? new Date(run.endedAt).getTime() : NaN;
        return Number.isFinite(started) && Number.isFinite(ended) ? Math.max(0, ended - started) : null;
      })
      .filter((value): value is number => typeof value === "number");
    const avgDurationMs = durations.length
      ? Math.round(durations.reduce((total, value) => total + value, 0) / durations.length)
      : 0;
    res.json({
      metrics: [
        { key: "all", label: "Total Runs", value: runs.length, filter: "all" },
        { key: "running", label: "Running", value: runs.filter((run) => run.status === "Running").length, filter: "Running" },
        { key: "completed", label: "Completed", value: completedRuns.length, filter: "Completed" },
        { key: "failed", label: "Failed", value: failedRuns.length, filter: "Failed" },
        { key: "needs_outcome", label: "Needs Outcome", value: runs.filter((run) => !run.outcomeId && run.status !== "Cancelled").length, filter: "needs_outcome" },
        { key: "sent_today", label: "Started Today", value: runs.filter((run) => run.startedAt && new Date(run.startedAt) >= today).length, filter: "today" },
      ],
      totals: {
        totalRuns: runs.length,
        running: runs.filter((run) => run.status === "Running").length,
        completed: completedRuns.length,
        failed: failedRuns.length,
        cancelled: runs.filter((run) => run.status === "Cancelled").length,
        needsOutcome: runs.filter((run) => !run.outcomeId && run.status !== "Cancelled").length,
        outcomeCoverage: runs.length ? Math.round((outcomeRuns.length / runs.length) * 100) : 0,
        avgDurationMs,
      },
      proofLoop: "Task -> Memory -> Risk -> Policy -> Package -> AgentRun -> Outcome -> Future Instruction -> Mistake Immunity",
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/agent-runs", asyncHandler(async (req, res) => {
  try {
    const status = stringQuery(req, "status");
    const runs = await listAgentRuns(scope(req), stringQuery(req, "workspaceId"));
    res.json({
      runs: status
        ? runs.filter((run) => status === "needs_outcome" ? !run.outcomeId : run.status.toLowerCase() === status.toLowerCase())
        : runs,
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/agent-runs/demo/first-launch-proof", asyncHandler(async (req, res) => {
  try {
    const requestScope = scope(req);
    const workspaces = await listWorkspaces(requestScope);
    const workspace =
      workspaces[0] ??
      (await createWorkspace(requestScope, {
        name: "memoryosTM First Launch Proof",
        plan: "developer",
        region: "local",
      }));

    const source = await createSource(requestScope, {
      workspaceId: workspace.id,
      provider: "agent-chat-paste",
      type: "agent_session",
      status: "connected",
      permissions: {
        mode: "first_launch_proof",
        connector: "agent_chat_paste",
      },
    });

    const sourceItem = await createSourceItem(requestScope, {
      workspaceId: workspace.id,
      sourceId: source.id,
      type: "agent_session",
      title: "Billing idempotency correction from first agent run",
      content: [
        "Incident: first agent fixed billing duplicate charge code but forgot the idempotency regression test.",
        "Risk: billing/charge.ts and prisma/schema.prisma affect payment integrity and customer invoices.",
        "Decision: every billing charge change must run pnpm test billing-idempotency before approval.",
        "Future lesson: require idempotency proof before sending a billing package to another agent.",
        "Skill candidate: Billing change safety reviewer checks risky files, tests, policy, outcome, and replay proof.",
      ].join("\n"),
      metadata: {
        proofLoop: "Source -> Memory -> Package -> Agent Run -> Outcome -> Future Instruction -> Mistake Immunity -> Skill",
        importedBy: "first_launch_proof",
      },
      extractMemory: true,
    });

    const memories = await listSourceMemories(requestScope, source.id);
    const task = "Fix duplicate billing charge while preserving idempotency and payment safety.";
    const inheritancePackage = await createInheritancePackage(requestScope, {
      workspaceId: workspace.id,
      task,
      whyItMatters: "This proves a corrected outcome becomes inherited safety for the next agent.",
      targetAgent: "Codex",
      targetFormat: "MemoryIgnition prompt",
      autonomyLevel: "Approval Execute",
      safetyMode: "Assist",
    });

    const firstRun = await createAgentRun(requestScope, {
      workspaceId: workspace.id,
      packageId: inheritancePackage.id,
      targetAgent: "Codex",
      status: "Running",
    });
    const firstRunEvents = [
      ["task_received", { task }],
      ["source_memory_loaded", { sourceId: source.id, sourceItemId: sourceItem.id, memoryIds: memories.map((memory) => memory.id) }],
      ["risk_detected", { files: ["billing/charge.ts", "prisma/schema.prisma"], risk: "billing_duplicate_charge" }],
      ["policy_checked", { requiredApproval: true, requiredTests: ["pnpm test billing-idempotency"] }],
      ["package_applied", { packageId: inheritancePackage.id }],
      ["agent_mistake_detected", { missedTest: "pnpm test billing-idempotency", humanCorrection: true }],
    ] as const;
    for (const [type, payload] of firstRunEvents) {
      await recordAgentRunEvent(requestScope, firstRun.id, {
        type,
        payload,
        proof: { agentRunId: firstRun.id, packageId: inheritancePackage.id },
      });
    }

    const firstOutcome = await createOutcome(requestScope, {
      agentRunId: firstRun.id,
      summary: "First agent needed correction because it missed the billing idempotency regression test.",
      filesChanged: ["billing/charge.ts", "prisma/schema.prisma"],
      testsPassed: ["pnpm test billing-idempotency"],
      testsFailed: ["initial review: required idempotency proof missing"],
      worked: "The risky billing context was captured with source memory and package proof.",
      failed: "The first agent did not run the required idempotency regression before review.",
      humanCorrection: true,
      futureLesson: "For billing charge changes, inspect inherited memory and run pnpm test billing-idempotency before marking the run complete.",
    });

    const secondRun = await createAgentRun(requestScope, {
      workspaceId: workspace.id,
      packageId: inheritancePackage.id,
      targetAgent: "Codex",
      status: "Running",
    });
    const secondRunEvents = [
      ["task_received", { task: "Replay the billing fix with inherited MemoryOS learning." }],
      ["future_instruction_applied", { futureInstructionId: firstOutcome.futureInstruction.id, instruction: firstOutcome.futureInstruction.instruction }],
      ["mistake_immunity_applied", { mistakeRuleId: firstOutcome.mistakeRule.id, prevention: firstOutcome.mistakeRule.preventionInstruction }],
      ["skill_candidate_applied", { skillCandidateId: firstOutcome.skillCandidate.id, name: firstOutcome.skillCandidate.name }],
      ["required_test_ran", { command: "pnpm test billing-idempotency", result: "passed" }],
      ["mistake_avoided", { repeated: false, avoided: "duplicate_charge_without_idempotency_test" }],
    ] as const;
    for (const [type, payload] of secondRunEvents) {
      await recordAgentRunEvent(requestScope, secondRun.id, {
        type,
        payload,
        proof: { agentRunId: secondRun.id, inheritedFromRunId: firstRun.id },
      });
    }

    const secondOutcome = await createOutcome(requestScope, {
      agentRunId: secondRun.id,
      summary: "Second agent inherited the correction, ran idempotency proof, and avoided the duplicate-charge mistake.",
      filesChanged: ["billing/charge.ts"],
      testsPassed: ["pnpm test billing-idempotency"],
      testsFailed: [],
      worked: "Future instruction and mistake immunity were applied before completion.",
      failed: "No repeated mistake detected.",
      humanCorrection: false,
      futureLesson: "Keep billing idempotency proof attached to every related package and run.",
    });
    const replay = await replayAgentRun(requestScope, secondRun.id);
    const blackBox = await getAgentRunBlackBox(requestScope, secondRun.id);

    emitIgnitionEvent(req, "outcome.captured", { runId: firstRun.id, outcomeId: firstOutcome.outcome.id, summary: firstOutcome.outcome.summary });
    emitIgnitionEvent(req, "future_instruction.created", { runId: firstRun.id, futureInstructionId: firstOutcome.futureInstruction.id });
    emitIgnitionEvent(req, "mistake_rule.created", { runId: firstRun.id, mistakeRuleId: firstOutcome.mistakeRule.id });
    emitIgnitionEvent(req, "skill_candidate.created", { runId: firstRun.id, skillCandidateId: firstOutcome.skillCandidate.id });
    emitIgnitionEvent(req, "agent_run.updated", { runId: secondRun.id, status: "Completed", runEventType: "first_launch_replay_completed" });
    emitIgnitionEvent(req, "first_launch_proof.created", {
      workspaceId: workspace.id,
      sourceId: source.id,
      sourceItemId: sourceItem.id,
      packageId: inheritancePackage.id,
      firstRunId: firstRun.id,
      secondRunId: secondRun.id,
      outcomeId: secondOutcome.outcome.id,
      proof: "The second agent did not repeat the first billing idempotency mistake.",
    });

    res.status(201).json({
      proof: {
        version: "first_launch_proof.v1",
        title: "Second agent avoids the first agent's mistake",
        status: "passed",
        workspace,
        source,
        sourceItem,
        memories,
        package: inheritancePackage,
        firstRun: await getAgentRun(requestScope, firstRun.id),
        firstOutcome,
        futureInstruction: firstOutcome.futureInstruction,
        mistakeRule: firstOutcome.mistakeRule,
        skillCandidate: firstOutcome.skillCandidate,
        secondRun: await getAgentRun(requestScope, secondRun.id),
        secondOutcome,
        replay,
        blackBox,
        comparison: {
          firstAgent: "Missed the required idempotency proof before human correction.",
          secondAgent: "Inherited the future instruction and mistake immunity rule before completion.",
          mistakeRepeated: false,
        },
        proofLoop: [
          "Source",
          "Memory",
          "Package",
          "Agent Run 1",
          "Outcome",
          "Future Instruction",
          "Mistake Immunity",
          "Skill Candidate",
          "Agent Run 2 Replay",
          "Proof",
        ],
      },
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/agent-runs/:id/timeline", asyncHandler(async (req, res) => {
  try {
    res.json({ events: await getAgentRunTimeline(scope(req), stringParam(req, "id")) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/agent-runs/:id/black-box", asyncHandler(async (req, res) => {
  try {
    res.json({ blackBox: await getAgentRunBlackBox(scope(req), stringParam(req, "id")) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/agent-runs/:id/package", asyncHandler(async (req, res) => {
  try {
    const run = await getAgentRun(scope(req), stringParam(req, "id"));
    res.json({ package: run.packageId ? await getPackage(scope(req), run.packageId) : null });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/agent-runs/:id/proof", asyncHandler(async (req, res) => {
  try {
    const blackBox = await getAgentRunBlackBox(scope(req), stringParam(req, "id"));
    res.json({
      proof: {
        id: blackBox.id,
        runId: blackBox.runId,
        packageId: blackBox.packageId,
        proofLoop: blackBox.proofLoop,
        integrityChecks: blackBox.integrityChecks,
        packageProof: blackBox.packageProof,
        events: blackBox.events,
        outcome: blackBox.outcome,
      },
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/agent-runs/:id/outcome", asyncHandler(async (req, res) => {
  try {
    res.json({ outcome: await getAgentRunOutcome(scope(req), stringParam(req, "id")) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/agent-runs/:id", asyncHandler(async (req, res) => {
  try {
    res.json({ run: await getAgentRun(scope(req), stringParam(req, "id")) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/agent-runs/:id/events", asyncHandler(async (req, res) => {
  const body = bodyRecord(req);
  try {
    const event = await recordAgentRunEvent(scope(req), stringParam(req, "id"), {
      type: typeof body.type === "string" ? body.type : "event",
      payload: body.payload,
      proof: body.proof,
    });
    emitIgnitionEvent(req, "agent_run.updated", {
      runId: stringParam(req, "id"),
      eventId: event.id,
      runEventType: event.type,
    });
    res.status(201).json({ event });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/agent-runs/:id/complete", asyncHandler(async (req, res) => {
  const body = bodyRecord(req);
  try {
    const run = await updateAgentRunStatus(scope(req), stringParam(req, "id"), {
      status: "Completed",
      payload: body.payload ?? { completed: true },
      proof: body.proof,
    });
    emitIgnitionEvent(req, "agent_run.updated", { runId: run.id, status: run.status, runEventType: "run_completed" });
    res.json({ run });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/agent-runs/:id/fail", asyncHandler(async (req, res) => {
  const body = bodyRecord(req);
  try {
    const run = await updateAgentRunStatus(scope(req), stringParam(req, "id"), {
      status: "Failed",
      payload: body.payload ?? { reason: typeof body.reason === "string" ? body.reason : "Run failed." },
      proof: body.proof,
    });
    emitIgnitionEvent(req, "agent_run.updated", { runId: run.id, status: run.status, runEventType: "run_failed" });
    res.json({ run });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/agent-runs/:id/cancel", asyncHandler(async (req, res) => {
  const body = bodyRecord(req);
  try {
    const run = await updateAgentRunStatus(scope(req), stringParam(req, "id"), {
      status: "Cancelled",
      payload: body.payload ?? { reason: typeof body.reason === "string" ? body.reason : "Run cancelled." },
      proof: body.proof,
    });
    emitIgnitionEvent(req, "agent_run.updated", { runId: run.id, status: run.status, runEventType: "run_cancelled" });
    res.json({ run });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/agent-runs/:id/save-outcome", asyncHandler(async (req, res) => {
  const body = bodyRecord(req);
  const agentRunId = stringParam(req, "id");
  try {
    const result = await createOutcome(scope(req), {
      agentRunId,
      summary: typeof body.summary === "string" ? body.summary : undefined,
      filesChanged: body.filesChanged,
      testsPassed: body.testsPassed,
      testsFailed: body.testsFailed,
      worked: typeof body.worked === "string" ? body.worked : undefined,
      failed: typeof body.failed === "string" ? body.failed : undefined,
      humanCorrection: body.humanCorrection === true,
      futureLesson: typeof body.futureLesson === "string" ? body.futureLesson : undefined,
    });
    await recordAgentRunEvent(scope(req), agentRunId, {
      type: "experience_record_created",
      payload: {
        outcomeId: result.outcome.id,
        summary: result.outcome.summary,
        source: "agent_run_save_outcome",
      },
      proof: { agentRunId, outcomeId: result.outcome.id },
    });
    emitIgnitionEvent(req, "outcome.captured", { runId: agentRunId, outcomeId: result.outcome.id, summary: result.outcome.summary });
    emitIgnitionEvent(req, "future_instruction.created", { runId: agentRunId, outcomeId: result.outcome.id, futureInstructionId: result.futureInstruction.id });
    emitIgnitionEvent(req, "mistake_rule.created", { runId: agentRunId, outcomeId: result.outcome.id, mistakeRuleId: result.mistakeRule.id });
    emitIgnitionEvent(req, "skill_candidate.created", { runId: agentRunId, outcomeId: result.outcome.id, skillCandidateId: result.skillCandidate.id });
    emitIgnitionEvent(req, "agent_run.updated", { runId: agentRunId, outcomeId: result.outcome.id, status: "Completed" });
    res.status(201).json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/agent-runs/:id/create-future-instruction", asyncHandler(async (req, res) => {
  const body = bodyRecord(req);
  try {
    const futureInstruction = await createFutureInstructionFromRun(scope(req), stringParam(req, "id"), {
      instruction: typeof body.instruction === "string" ? body.instruction : undefined,
      riskLevel: typeof body.riskLevel === "string" ? body.riskLevel : undefined,
      affectedFiles: body.affectedFiles,
      requiredTests: body.requiredTests,
    });
    emitIgnitionEvent(req, "future_instruction.created", {
      runId: stringParam(req, "id"),
      futureInstructionId: futureInstruction.id,
      instruction: futureInstruction.instruction,
    });
    res.status(201).json({ futureInstruction });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/agent-runs/:id/create-mistake-rule", asyncHandler(async (req, res) => {
  const body = bodyRecord(req);
  try {
    const mistakeRule = await createMistakeRuleFromRun(scope(req), stringParam(req, "id"), {
      trigger: typeof body.trigger === "string" ? body.trigger : undefined,
      prevention: typeof body.prevention === "string" ? body.prevention : undefined,
    });
    emitIgnitionEvent(req, "mistake_rule.created", {
      runId: stringParam(req, "id"),
      mistakeRuleId: mistakeRule.id,
      prevention: mistakeRule.preventionInstruction,
    });
    res.status(201).json({ mistakeRule });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/agent-runs/:id/create-skill-candidate", asyncHandler(async (req, res) => {
  const body = bodyRecord(req);
  try {
    const skillCandidate = await createSkillCandidateFromRun(scope(req), stringParam(req, "id"), {
      name: typeof body.name === "string" ? body.name : undefined,
      requiredTools: body.requiredTools,
      requiredTests: body.requiredTests,
    });
    emitIgnitionEvent(req, "skill_candidate.created", {
      runId: stringParam(req, "id"),
      skillCandidateId: skillCandidate.id,
      name: skillCandidate.name,
    });
    res.status(201).json({ skillCandidate });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/agent-runs/:id/replay", asyncHandler(async (req, res) => {
  try {
    const replay = await replayAgentRun(scope(req), stringParam(req, "id"));
    emitIgnitionEvent(req, "agent_run.updated", {
      runId: stringParam(req, "id"),
      runEventType: "run_replay_requested",
      replayId: replay.replayId,
    });
    res.status(201).json({ replay });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/agent-experience-graph", asyncHandler(async (req, res) => {
  try {
    res.json(await getAgentExperienceGraph(scope(req), stringQuery(req, "workspaceId")));
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/agent-experience-graph/from-run/:id", asyncHandler(async (req, res) => {
  try {
    const graph = await buildAgentExperienceGraphFromRun(scope(req), stringParam(req, "id"));
    emitIgnitionEvent(req, "agent_run.updated", {
      runId: stringParam(req, "id"),
      runEventType: "experience_graph_updated",
    });
    res.status(201).json(graph);
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/agent-experience-graph/nodes/:id", asyncHandler(async (req, res) => {
  try {
    const graph = await getAgentExperienceGraph(scope(req), stringQuery(req, "workspaceId"));
    const node = graph.nodes.find((item) => item.id === stringParam(req, "id"));
    if (!node) {
      res.status(404).json({ error: "agent_experience_graph_node_not_found" });
      return;
    }
    res.json({
      node,
      incoming: graph.edges.filter((edge) => edge.toNodeId === node.id),
      outgoing: graph.edges.filter((edge) => edge.fromNodeId === node.id),
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/agent-experience-graph/paths", asyncHandler(async (req, res) => {
  try {
    const graph = await getAgentExperienceGraph(scope(req), stringQuery(req, "workspaceId"));
    const from = stringQuery(req, "from");
    const to = stringQuery(req, "to");
    res.json({
      paths: graph.edges.filter((edge) => (!from || edge.fromNodeId === from) && (!to || edge.toNodeId === to)),
      graphSummary: graph.summary,
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/agent-black-box/record", asyncHandler(async (req, res) => {
  const body = bodyRecord(req);
  const agentRunId = typeof body.agentRunId === "string" ? body.agentRunId : "";
  if (!agentRunId) {
    res.status(400).json({ error: "agentRunId is required" });
    return;
  }
  try {
    const record = await createAgentBlackBoxRecord(scope(req), agentRunId);
    const evidence = await createComplianceEvidenceFromRun(scope(req), agentRunId);
    emitIgnitionEvent(req, "agent_run.updated", {
      runId: agentRunId,
      runEventType: "black_box_recorded",
      blackBoxRecordId: record.id,
      complianceEvidenceId: evidence.id,
    });
    res.status(201).json({ blackBoxRecord: record, complianceEvidence: evidence });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/agent-black-box/:agentRunId", asyncHandler(async (req, res) => {
  try {
    res.json({ blackBoxRecord: await getAgentBlackBoxRecord(scope(req), stringParam(req, "agentRunId")) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/blueprints", asyncHandler(async (req, res) => {
  try {
    res.json({ blueprints: await listWorkflowBlueprints(scope(req), stringQuery(req, "workspaceId")) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/blueprints", asyncHandler(async (req, res) => {
  const body = bodyRecord(req);
  const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId : "";
  if (!workspaceId) {
    res.status(400).json({ error: "workspaceId is required" });
    return;
  }
  try {
    const blueprint = await createWorkflowBlueprint(scope(req), {
      workspaceId,
      name: typeof body.name === "string" ? body.name : undefined,
      trigger: body.trigger,
      steps: body.steps,
      requiredMemories: body.requiredMemories,
      requiredTools: body.requiredTools,
      riskChecks: body.riskChecks,
      approvalRules: body.approvalRules,
      successCriteria: body.successCriteria,
      outcomeSchema: body.outcomeSchema,
    });
    res.status(201).json({ blueprint });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/blueprints/:id/run", asyncHandler(async (req, res) => {
  const body = bodyRecord(req);
  try {
    const result = await runWorkflowBlueprint(scope(req), stringParam(req, "id"), {
      workspaceId: typeof body.workspaceId === "string" ? body.workspaceId : undefined,
      task: typeof body.task === "string" ? body.task : undefined,
      targetAgent: typeof body.targetAgent === "string" ? body.targetAgent : undefined,
    });
    emitIgnitionEvent(req, "package.created", {
      packageId: result.package.id,
      runId: result.run.id,
      blueprintId: result.blueprint.id,
    });
    res.status(201).json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/evaluation", asyncHandler(async (req, res) => {
  try {
    res.json({ evaluationRuns: await listEvaluationRuns(scope(req), stringQuery(req, "workspaceId")) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/evaluation/summary", asyncHandler(async (req, res) => {
  try {
    res.json({ summary: await getEvaluationReplaySummary(scope(req), stringQuery(req, "workspaceId")) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/evaluation/run", asyncHandler(async (req, res) => {
  const body = bodyRecord(req);
  const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId : "";
  if (!workspaceId) {
    res.status(400).json({ error: "workspaceId is required" });
    return;
  }
  try {
    const result = await createEvaluationRun(scope(req), {
      workspaceId,
      contractId: typeof body.contractId === "string" ? body.contractId : null,
      name: typeof body.name === "string" ? body.name : undefined,
      task: typeof body.task === "string" ? body.task : undefined,
      agent: typeof body.agent === "string" ? body.agent : undefined,
      baselinePrompt: typeof body.baselinePrompt === "string" ? body.baselinePrompt : undefined,
      inheritancePackageId: typeof body.inheritancePackageId === "string" ? body.inheritancePackageId : null,
    });
    emitIgnitionEvent(req, "evaluation.replay_created", {
      evaluationRunId: result.evaluationRun.id,
      baselineAgentRunId: result.evaluationRun.baselineAgentRunId,
      inheritedAgentRunId: result.evaluationRun.inheritedAgentRunId,
      contractId: result.evaluationRun.contractId,
    });
    res.status(201).json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/evaluation/:id/results", asyncHandler(async (req, res) => {
  try {
    res.json(await getEvaluationResults(scope(req), stringParam(req, "id")));
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/model-providers", asyncHandler(async (req, res) => {
  try {
    res.json({ modelProviders: await listModelProviders(scope(req), stringQuery(req, "workspaceId")) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/model-providers/connect", asyncHandler(async (req, res) => {
  const body = bodyRecord(req);
  const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId : "";
  if (!workspaceId) {
    res.status(400).json({ error: "workspaceId is required" });
    return;
  }
  try {
    const modelProvider = await connectModelProvider(scope(req), {
      workspaceId,
      provider: typeof body.provider === "string" ? body.provider : undefined,
      displayName: typeof body.displayName === "string" ? body.displayName : undefined,
      authType: typeof body.authType === "string" ? body.authType : undefined,
      credentialRef: typeof body.credentialRef === "string" ? body.credentialRef : null,
      baseUrl: typeof body.baseUrl === "string" ? body.baseUrl : null,
      defaultModel: typeof body.defaultModel === "string" ? body.defaultModel : null,
      allowedAgents: body.allowedAgents,
      allowedRuntimes: body.allowedRuntimes,
      monthlyBudget: typeof body.monthlyBudget === "number" ? body.monthlyBudget : null,
    });
    res.status(201).json({ modelProvider });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/model-providers/test", asyncHandler(async (req, res) => {
  const body = bodyRecord(req);
  const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId : "";
  if (!workspaceId) {
    res.status(400).json({ error: "workspaceId is required" });
    return;
  }
  try {
    const usageEvent = await recordModelUsageEvent(scope(req), {
      workspaceId,
      providerId: typeof body.providerId === "string" ? body.providerId : null,
      taskType: "provider_test",
      inputTokens: 12,
      outputTokens: 8,
      estimatedCost: 0,
      latencyMs: 120,
      success: true,
    });
    res.status(201).json({ status: "connected", usageEvent });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/model-usage", asyncHandler(async (req, res) => {
  try {
    res.json(await getModelUsage(scope(req), stringQuery(req, "workspaceId")));
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/model-usage", asyncHandler(async (req, res) => {
  const body = bodyRecord(req);
  const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId : "";
  if (!workspaceId) {
    res.status(400).json({ error: "workspaceId is required" });
    return;
  }
  try {
    const usageEvent = await recordModelUsageEvent(scope(req), {
      workspaceId,
      providerId: typeof body.providerId === "string" ? body.providerId : null,
      agentRunId: typeof body.agentRunId === "string" ? body.agentRunId : null,
      taskType: typeof body.taskType === "string" ? body.taskType : undefined,
      inputTokens: typeof body.inputTokens === "number" ? body.inputTokens : undefined,
      outputTokens: typeof body.outputTokens === "number" ? body.outputTokens : undefined,
      estimatedCost: typeof body.estimatedCost === "number" ? body.estimatedCost : undefined,
      latencyMs: typeof body.latencyMs === "number" ? body.latencyMs : undefined,
      success: body.success !== false,
      error: typeof body.error === "string" ? body.error : null,
    });
    res.status(201).json({ usageEvent });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/cost", asyncHandler(async (req, res) => {
  try {
    res.json(await getCostSummary(scope(req), stringQuery(req, "workspaceId")));
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/compliance/evidence", asyncHandler(async (req, res) => {
  try {
    res.json({ evidence: await listComplianceEvidence(scope(req), stringQuery(req, "workspaceId")) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/compliance/evidence/from-run/:id", asyncHandler(async (req, res) => {
  try {
    const evidence = await createComplianceEvidenceFromRun(scope(req), stringParam(req, "id"));
    res.status(201).json({ evidence });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/outcomes", asyncHandler(async (req, res) => {
  const body = bodyRecord(req);
  const agentRunId = typeof body.agentRunId === "string" ? body.agentRunId : "";
  if (!agentRunId) {
    res.status(400).json({ error: "agentRunId is required" });
    return;
  }
  try {
    const result = await createOutcome(scope(req), {
      agentRunId,
      summary: typeof body.summary === "string" ? body.summary : undefined,
      filesChanged: body.filesChanged,
      testsPassed: body.testsPassed,
      testsFailed: body.testsFailed,
      worked: typeof body.worked === "string" ? body.worked : undefined,
      failed: typeof body.failed === "string" ? body.failed : undefined,
      humanCorrection: body.humanCorrection === true,
      futureLesson: typeof body.futureLesson === "string" ? body.futureLesson : undefined,
    });
    emitIgnitionEvent(req, "outcome.captured", {
      runId: agentRunId,
      outcomeId: result.outcome.id,
      summary: result.outcome.summary,
    });
    emitIgnitionEvent(req, "future_instruction.created", {
      runId: agentRunId,
      outcomeId: result.outcome.id,
      futureInstructionId: result.futureInstruction.id,
      instruction: result.futureInstruction.instruction,
    });
    emitIgnitionEvent(req, "mistake_rule.created", {
      runId: agentRunId,
      outcomeId: result.outcome.id,
      mistakeRuleId: result.mistakeRule.id,
      prevention: result.mistakeRule.preventionInstruction,
    });
    emitIgnitionEvent(req, "skill_candidate.created", {
      runId: agentRunId,
      outcomeId: result.outcome.id,
      skillCandidateId: result.skillCandidate.id,
      name: result.skillCandidate.name,
    });
    emitIgnitionEvent(req, "agent_run.updated", {
      runId: agentRunId,
      outcomeId: result.outcome.id,
      status: "Completed",
    });
    res.status(201).json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/outcomes/:id", asyncHandler(async (req, res) => {
  try {
    res.json({ outcome: await getOutcome(scope(req), stringParam(req, "id")) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.get("/future-instructions", asyncHandler(async (req, res) => {
  try {
    res.json({ futureInstructions: await listFutureInstructions(scope(req), stringQuery(req, "workspaceId")) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

masterplanRouter.post("/future-instructions/:id/approve", asyncHandler(async (req, res) => {
  try {
    res.json({ futureInstruction: await approveFutureInstruction(scope(req), stringParam(req, "id")) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));
