import type {
  AutomationConnectorId,
  AutomationDraft,
  AutomationMemoryFeatures,
  AutomationTriggerType,
} from "@/lib/continuity-lab/automation-storage";
import {
  DEFAULT_MEMORY_FEATURES,
  newTrigger,
} from "@/lib/continuity-lab/automation-storage";

export type AutomationTemplateCategory =
  | "monitoring"
  | "ci-cd"
  | "maintenance"
  | "memory-continuity"
  | "security"
  | "triage"
  | "project-management"
  | "code-quality";

export type AutomationTemplateAvailability = "live" | "coming_soon";

/** Display pill on template cards — connectors + MemoryOS + future integrations */
export type AutomationIntegrationPill =
  | AutomationConnectorId
  | "memoryos"
  | "stripe"
  | "datadog"
  | "sentry"
  | "circleci"
  | "pagerduty"
  | "linear"
  | "cloudflare"
  | "metabase"
  | "hubspot"
  | "jam"
  | "asana"
  | "figma"
  | "sonarqube";

export const AUTOMATION_TEMPLATE_CATEGORIES: Array<{
  id: AutomationTemplateCategory;
  label: string;
  description: string;
}> = [
  {
    id: "monitoring",
    label: "Monitoring",
    description: "Watch signals, drift, and operational health across repos and memory",
  },
  {
    id: "ci-cd",
    label: "CI/CD",
    description: "React to failed checks and keep pipelines green with continuity memory",
  },
  {
    id: "maintenance",
    label: "Maintenance",
    description: "Scheduled hygiene for repos, PRs, wiki, and operational maps",
  },
  {
    id: "memory-continuity",
    label: "Memory & Continuity",
    description: "MemoryOS-native resume briefs, handoffs, action memory, and session preload",
  },
  {
    id: "security",
    label: "Security",
    description: "Governed changes, dependency signals, and approval gates",
  },
  {
    id: "triage",
    label: "Triage",
    description: "Route bugs and issues from Slack, GitHub, and Jira with company memory",
  },
  {
    id: "project-management",
    label: "Project Management",
    description: "Sync Jira and GitHub work with operational memory",
  },
  {
    id: "code-quality",
    label: "Code Quality",
    description: "Lint, format, and ownership hygiene with minimal diffs",
  },
];

export type AutomationTemplateSlug =
  | "slack-triage"
  | "ci-failure-continuity"
  | "github-issue"
  | "resume-pr-work"
  | "weekly-continuity-digest"
  | "lint-failure-fixer"
  | "approval-gated-change"
  | "repo-drift-scan"
  | "slack-memory-handoff"
  | "wiki-refresh-on-merge"
  | "session-duplicate-preload"
  | "continuity-brief-schedule"
  | "jira-issue-triage"
  | "pr-stale-reminder"
  | "dependency-audit-scan"
  | "codeowners-drift"
  | "connector-freshness-alert"
  | "github-pr-review-digest"
  | "stripe-failed-payment"
  | "datadog-alert-triage"
  | "sentry-error-spike"
  | "circleci-flaky-test"
  | "pagerduty-incident-bridge"
  | "linear-stale-issue-sync"
  | "daily-sentry-error-fixes"
  | "datadog-alert-investigation"
  | "daily-health-digest"
  | "weekly-analytics-health-check"
  | "circleci-failure-fix"
  | "nightly-qa-smoke-tests"
  | "weekly-dependency-updates"
  | "cloudflare-security-audit"
  | "dependency-vulnerability-scanner"
  | "secret-scanner"
  | "code-pattern-enforcer"
  | "sre-health-checker"
  | "owasp-security-hardening"
  | "customer-support-triage"
  | "jira-ticket-to-pr"
  | "jam-bug-report-investigation"
  | "weekly-status-digest-notion"
  | "asana-sprint-progress-report"
  | "figma-design-review-pr"
  | "sonarqube-quality-gate-fix";

const TEMPLATE_ID_ALIASES: Record<string, AutomationTemplateSlug> = {
  "slack-bug-triage": "slack-triage",
  "ci-failure": "ci-failure-continuity",
  "ci-failure-fixer": "ci-failure-continuity",
  "github-issue-memoryos": "github-issue",
};

export type AutomationTemplate = {
  id: AutomationTemplateSlug;
  category: AutomationTemplateCategory;
  availability: AutomationTemplateAvailability;
  title: string;
  description: string;
  loopGoal: string;
  connectors: AutomationConnectorId[];
  integrationPills: AutomationIntegrationPill[];
  triggers: AutomationTriggerType[];
  instructions: string;
  promptHint?: string;
  createLabel: string;
  watchAgentLabel?: string;
  featured?: boolean;
  /** Hero card on automations index */
  featuredHero?: boolean;
  defaultMemoryFeatures?: Partial<AutomationMemoryFeatures>;
};

const BASE_AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    id: "ci-failure-continuity",
    category: "ci-cd",
    availability: "live",
    featured: true,
    title: "CI Failure Fixer",
    description:
      "Automatically fix failing CI checks on non-MemoryOS PRs. MemoryOS reads build logs, identifies the root cause, pushes a fix, and verifies it.",
    loopGoal: "Fix failing CI checks on pull requests with minimal verified changes",
    connectors: ["github"],
    integrationPills: ["github", "memoryos"],
    triggers: ["ci_failure"],
    defaultMemoryFeatures: {
      injectResumeBrief: true,
      writeActionMemoryOnComplete: true,
      attachOperationalWiki: true,
      useCompanyBrainContext: true,
      requireGovernanceApproval: false,
    },
    instructions: [
      "A CI check has failed. The full event details are included below.",
      "",
      "IMPORTANT: If the failing commit was authored by memoryos-ai-integration[bot], reply 'Skipping: commit authored by MemoryOS' and stop.",
      "",
      "Otherwise:",
      "1. Open the failing check run URL and read the build/test logs",
      "2. Identify the root cause of the failure",
      "3. Fix the issue on the same branch",
      "4. Run the relevant tests locally to verify",
      "5. Push the fix",
    ].join("\n"),
    promptHint: "Resume CI investigation with memory-backed context when checks fail.",
    createLabel: "Create automation",
    watchAgentLabel: "the CI agent",
  },
  {
    id: "slack-triage",
    category: "triage",
    availability: "live",
    featured: true,
    title: "Triage Bug Reports on Slack",
    description:
      "Monitors a Slack channel for bug reports. When one comes in, MemoryOS triages it, investigates root cause, and opens the right follow-up.",
    loopGoal: "Triage Slack bug reports and hand off with memory context",
    connectors: ["slack"],
    integrationPills: ["slack", "memoryos"],
    triggers: ["slack_message"],
    defaultMemoryFeatures: {
      injectResumeBrief: true,
      continuityHandoffOnComplete: true,
      writeActionMemoryOnComplete: true,
      useCompanyBrainContext: true,
    },
    instructions: [
      "Start session when a message in the watched Slack channel looks like a bug or incident.",
      "",
      "1. Summarize repro steps, environment, and impact.",
      "2. Search action memory and continuity threads for related incidents.",
      "3. Classify severity (P0–P4) and suggest owner or on-call.",
      "4. Draft GitHub or Jira tracking when needed.",
      "5. Reply in-thread; queue continuity handoff for follow-up sessions.",
      "",
      "Escalate P0/P1 immediately. Cite memory sources when available.",
    ].join("\n"),
    createLabel: "Create triage automation",
    watchAgentLabel: "the triage agent",
  },
  {
    id: "github-issue",
    category: "triage",
    availability: "live",
    featured: true,
    title: "/MemoryOS Issue Fix",
    description:
      "Starts a governed fix session when someone comments /memoryos on a GitHub issue.",
    loopGoal: "Execute issue fix workflow when triggered via GitHub issue comment",
    connectors: ["github"],
    integrationPills: ["github", "memoryos"],
    triggers: ["github_issue_comment"],
    instructions: [
      "Start session when /memoryos is mentioned on a GitHub issue.",
      "",
      "1. Read issue title, body, and comment thread.",
      "2. Retrieve wiki, operational map, and company brain context.",
      "3. Post a short plan in-thread before making changes.",
      "4. Implement on a branch; open a PR linking the issue.",
      "5. Write action memory with outcome and links.",
    ].join("\n"),
    createLabel: "Create issue automation",
    watchAgentLabel: "the issue agent",
  },
  {
    id: "slack-memory-handoff",
    category: "memory-continuity",
    availability: "live",
    title: "Slack thread → continuity handoff",
    description:
      "Captures a resolved Slack thread into action memory and opens a child session with preload.",
    loopGoal: "Hand off Slack decisions into MemoryOS continuity",
    connectors: ["slack"],
    integrationPills: ["slack", "memoryos"],
    triggers: ["slack_message"],
    defaultMemoryFeatures: {
      continuityHandoffOnComplete: true,
      writeActionMemoryOnComplete: true,
      injectResumeBrief: true,
    },
    instructions: [
      "1. Summarize the Slack thread decisions and open questions.",
      "2. Write structured action memory tagged with channel and participants.",
      "3. Start a child session with resume brief preload when follow-up code work is needed.",
    ].join("\n"),
    createLabel: "Create handoff automation",
  },
  {
    id: "resume-pr-work",
    category: "memory-continuity",
    availability: "live",
    title: "Resume PR work",
    description:
      "Picks up an open PR with resume brief, handoffs, and who touched it last.",
    loopGoal: "Resume in-flight pull request work with continuity memory",
    connectors: ["github"],
    integrationPills: ["github", "memoryos"],
    triggers: ["manual"],
    defaultMemoryFeatures: {
      injectResumeBrief: true,
      attachOperationalWiki: true,
      useCompanyBrainContext: true,
    },
    instructions: [
      "1. Load PR diff, checks, reviews, and linked issues.",
      "2. Retrieve session memory and handoffs for this branch.",
      "3. Summarize state and blockers; list smallest next actions.",
      "4. Continue on the same branch without force-push.",
    ].join("\n"),
    createLabel: "Create continuity automation",
  },
  {
    id: "session-duplicate-preload",
    category: "memory-continuity",
    availability: "live",
    title: "Duplicate session with memory preload",
    description:
      "Spawns a child session copying resume brief and recent action memory from a parent run.",
    loopGoal: "Fork work with continuity preload",
    connectors: [],
    integrationPills: ["memoryos"],
    triggers: ["memoryos_handoff", "manual"],
    defaultMemoryFeatures: {
      injectResumeBrief: true,
      continuityHandoffOnComplete: true,
      writeActionMemoryOnComplete: false,
    },
    instructions: [
      "1. Load parent session continuity thread and resume brief.",
      "2. Auto-start child session with the same repo scope.",
      "3. Carry forward open tasks from action memory.",
    ].join("\n"),
    createLabel: "Create session automation",
  },
  {
    id: "continuity-brief-schedule",
    category: "memory-continuity",
    availability: "live",
    title: "Scheduled continuity brief",
    description:
      "Posts a continuity brief digest to Slack from recent sessions and memory highlights.",
    loopGoal: "Deliver scheduled continuity brief to Slack",
    connectors: ["slack"],
    integrationPills: ["slack", "memoryos"],
    triggers: ["schedule"],
    defaultMemoryFeatures: {
      injectResumeBrief: true,
      useCompanyBrainContext: true,
      writeActionMemoryOnComplete: false,
    },
    instructions: [
      "1. Compile resume brief highlights for active projects.",
      "2. List stalled sessions and open handoffs.",
      "3. Post digest to the configured Slack channel.",
    ].join("\n"),
    createLabel: "Create scheduled automation",
  },
  {
    id: "weekly-continuity-digest",
    category: "monitoring",
    availability: "live",
    title: "Weekly continuity digest",
    description:
      "Summary of open PRs, stalled sessions, and memory highlights for the team.",
    loopGoal: "Deliver a weekly continuity digest to Slack",
    connectors: ["slack", "github"],
    integrationPills: ["slack", "github", "memoryos"],
    triggers: ["schedule"],
    instructions: [
      "1. List open PRs needing attention and sessions without handoffs.",
      "2. Surface top memory updates and operational map changes.",
      "3. Highlight connector sync freshness issues.",
      "4. Post digest to Slack.",
    ].join("\n"),
    createLabel: "Create digest automation",
  },
  {
    id: "connector-freshness-alert",
    category: "monitoring",
    availability: "live",
    title: "Connector freshness alert",
    description:
      "Notifies when GitHub, Slack, or Jira connectors are stale relative to company brain sync.",
    loopGoal: "Alert on stale connector sync",
    connectors: ["slack", "github", "jira"],
    integrationPills: ["github", "slack", "jira", "memoryos"],
    triggers: ["schedule"],
    defaultMemoryFeatures: { useCompanyBrainContext: true },
    instructions: [
      "1. Read connector freshness summary from company brain.",
      "2. List connectors past threshold with last sync time.",
      "3. Post actionable Slack notice for owners.",
    ].join("\n"),
    createLabel: "Create monitoring automation",
  },
  {
    id: "lint-failure-fixer",
    category: "code-quality",
    availability: "live",
    title: "Lint failure fixer",
    description:
      "Fixes lint and format check failures with minimal diffs scoped to failing files.",
    loopGoal: "Fix lint CI failures with minimal diffs",
    connectors: ["github"],
    integrationPills: ["github", "memoryos"],
    triggers: ["ci_failure"],
    instructions: [
      "1. Parse failed check logs for file paths and rules.",
      "2. Apply auto-fixes only where safe.",
      "3. Open PR with one-paragraph summary; write action memory.",
    ].join("\n"),
    createLabel: "Create automation",
  },
  {
    id: "codeowners-drift",
    category: "code-quality",
    availability: "live",
    title: "CODEOWNERS drift check",
    description:
      "Compares CODEOWNERS to repo tree and proposes updates when ownership is missing.",
    loopGoal: "Detect CODEOWNERS drift",
    connectors: ["github"],
    integrationPills: ["github", "memoryos"],
    triggers: ["schedule"],
    instructions: [
      "1. Scan repo tree vs CODEOWNERS paths.",
      "2. List uncovered directories and suggest owners from memory.",
      "3. Propose PR updating CODEOWNERS only.",
    ].join("\n"),
    createLabel: "Create automation",
  },
  {
    id: "wiki-refresh-on-merge",
    category: "maintenance",
    availability: "live",
    title: "Wiki refresh on merge",
    description:
      "After merge to default branch, refresh operational wiki sections from repo index.",
    loopGoal: "Keep wiki aligned with merged code",
    connectors: ["github"],
    integrationPills: ["github", "memoryos"],
    triggers: ["ci_failure"],
    defaultMemoryFeatures: { attachOperationalWiki: true, writeActionMemoryOnComplete: true },
    instructions: [
      "1. Detect merge to default branch (via workflow or manual trigger).",
      "2. Diff indexed tree vs wiki sections.",
      "3. Propose wiki updates as PR or memory note.",
    ].join("\n"),
    createLabel: "Create wiki automation",
  },
  {
    id: "repo-drift-scan",
    category: "maintenance",
    availability: "live",
    title: "Repo drift scan",
    description:
      "Compares live repo structure to operational map and wiki; proposes sync updates.",
    loopGoal: "Detect operational map drift",
    connectors: ["github"],
    integrationPills: ["github", "memoryos"],
    triggers: ["schedule"],
    defaultMemoryFeatures: { attachOperationalWiki: true },
    instructions: [
      "1. Compare indexed repo tree to operational map and wiki.",
      "2. List missing, renamed, or orphan documentation nodes.",
      "3. Propose updates as PR or memory note — read-only on production.",
    ].join("\n"),
    createLabel: "Create scheduled automation",
  },
  {
    id: "pr-stale-reminder",
    category: "maintenance",
    availability: "live",
    title: "Stale PR reminder",
    description:
      "Reminds authors of PRs idle 7+ days with continuity context on last activity.",
    loopGoal: "Nudge stale pull requests",
    connectors: ["github", "slack"],
    integrationPills: ["github", "slack", "memoryos"],
    triggers: ["schedule"],
    instructions: [
      "1. List PRs without commits or review for 7+ days.",
      "2. Attach last session handoff or review comment summary.",
      "3. Notify via Slack or PR comment.",
    ].join("\n"),
    createLabel: "Create reminder automation",
  },
  {
    id: "approval-gated-change",
    category: "security",
    availability: "live",
    title: "Governance approval gate",
    description:
      "Operational loop changes require approver sign-off before connectors execute.",
    loopGoal: "Enforce approval gates on execution",
    connectors: ["github", "slack"],
    integrationPills: ["github", "slack", "memoryos"],
    triggers: ["schedule", "manual"],
    defaultMemoryFeatures: {
      requireGovernanceApproval: true,
      writeActionMemoryOnComplete: true,
      useCompanyBrainContext: true,
    },
    instructions: [
      "1. Summarize intended actions and blast radius.",
      "2. Create execution proposal with connector targets.",
      "3. Notify approvers via Slack.",
      "4. Execute only after approval; log to action memory.",
      "",
      "Default to read-only while approval is pending.",
    ].join("\n"),
    createLabel: "Create governance automation",
  },
  {
    id: "dependency-audit-scan",
    category: "security",
    availability: "live",
    title: "Dependency audit scan",
    description:
      "Scheduled read-only scan of dependency manifests with memory-backed risk notes.",
    loopGoal: "Surface dependency risks from repo and memory",
    connectors: ["github"],
    integrationPills: ["github", "memoryos"],
    triggers: ["schedule"],
    defaultMemoryFeatures: { requireGovernanceApproval: true, attachOperationalWiki: true },
    instructions: [
      "1. Parse lockfiles and known advisory references in memory.",
      "2. Produce ranked findings — no auto-merge without approval.",
      "3. Open issue or Slack summary for owners.",
    ].join("\n"),
    createLabel: "Create security automation",
  },
  {
    id: "jira-issue-triage",
    category: "project-management",
    availability: "live",
    title: "Jira issue triage",
    description:
      "Routes new or updated Jira issues using company memory and suggests GitHub links.",
    loopGoal: "Triage Jira with MemoryOS context",
    connectors: ["jira", "github"],
    integrationPills: ["jira", "github", "memoryos"],
    triggers: ["jira_issue_event"],
    instructions: [
      "1. On Jira issue create/update, load summary and components.",
      "2. Search memory for related PRs, incidents, and prior triage.",
      "3. Suggest priority, owner, and linked GitHub work.",
      "4. Write action memory with triage outcome.",
    ].join("\n"),
    createLabel: "Create Jira automation",
  },
  {
    id: "github-pr-review-digest",
    category: "project-management",
    availability: "live",
    title: "PR review digest",
    description:
      "Daily digest of PRs awaiting review with continuity notes for reviewers.",
    loopGoal: "Summarize PRs needing human review",
    connectors: ["github", "slack"],
    integrationPills: ["github", "slack", "memoryos"],
    triggers: ["schedule"],
    instructions: [
      "1. List open PRs awaiting review > 24h.",
      "2. Attach resume brief snippets for each branch.",
      "3. Post digest to Slack.",
    ].join("\n"),
    createLabel: "Create digest automation",
  },
  {
    id: "stripe-failed-payment",
    category: "monitoring",
    availability: "live",
    title: "Stripe Failed Payment Investigation",
    description:
      "When a failed payment alert lands in Slack, MemoryOS investigates the payment, customer, and recent charge attempts.",
    loopGoal: "Investigate Stripe failed payments and post recommended action",
    connectors: ["slack", "stripe"],
    integrationPills: ["slack", "stripe", "memoryos"],
    triggers: ["slack_message_advanced"],
    instructions: [
      "A payment alert was posted to Slack. The full event details are included below.",
      "",
      "1. Extract the payment or customer ID from the alert message",
      "2. Use the Stripe MCP to look up payment details, customer info, and recent charge attempts",
      "3. Identify why the payment failed (card declined, insufficient funds, fraud block, integration error, etc.)",
      "4. If it is an integration error, check the codebase for the relevant payment handling code",
      "5. Post findings in the Slack thread: failure reason, customer impact, and recommended action",
    ].join("\n"),
    createLabel: "Create automation",
  },
  {
    id: "datadog-alert-triage",
    category: "monitoring",
    availability: "live",
    title: "Datadog Alert Triage",
    description:
      "Route Datadog monitor alerts into MemoryOS sessions with incident, deploy, and service context.",
    loopGoal: "Triage Datadog alerts and identify probable service impact",
    connectors: ["slack", "datadog"],
    integrationPills: ["slack", "datadog", "memoryos"],
    triggers: ["slack_message_advanced"],
    instructions: [
      "A Datadog alert was posted in Slack. Investigate the alert before escalating.",
      "",
      "1. Extract monitor name, alert state, service, region, and time window.",
      "2. Pull Datadog graphs, logs, and recent anomaly context.",
      "3. Check recent deploys, incidents, and action memory for related changes.",
      "4. Post a Slack update with impact, likely cause, confidence, and next action.",
    ].join("\n"),
    createLabel: "Create automation",
  },
  {
    id: "sentry-error-spike",
    category: "triage",
    availability: "live",
    title: "Sentry Error Spike Investigation",
    description:
      "Correlate Sentry issue spikes with deploy memory and open a focused fix when the cause is clear.",
    loopGoal: "Investigate Sentry error spikes and open follow-up fixes",
    connectors: ["sentry", "github", "slack"],
    integrationPills: ["sentry", "github", "memoryos"],
    triggers: ["schedule"],
    instructions: [
      "Investigate the latest Sentry error spike.",
      "",
      "1. Rank issues by affected users, event volume, and regression recency.",
      "2. Compare first-seen time against recent deploys and merged PRs.",
      "3. Reproduce or identify the failing path from logs and stack traces.",
      "4. Open a fix issue or PR with exact evidence and owner recommendation.",
    ].join("\n"),
    createLabel: "Create automation",
  },
  {
    id: "circleci-flaky-test",
    category: "ci-cd",
    availability: "live",
    title: "CircleCI Flaky Test Hunter",
    description:
      "Detect flaky CircleCI tests across branches and propose isolation or stabilization fixes.",
    loopGoal: "Detect and fix flaky CircleCI tests",
    connectors: ["github", "circleci"],
    integrationPills: ["circleci", "github", "memoryos"],
    triggers: ["ci_failure"],
    instructions: [
      "A CircleCI failure may be caused by a flaky test. Investigate before changing code.",
      "",
      "1. Compare recent CircleCI failures for the same test and branch.",
      "2. Identify whether the failure is deterministic, timing-related, or environment-related.",
      "3. Check recent PRs and action memory for related changes.",
      "4. Propose the smallest stabilization fix and run the targeted test repeatedly.",
    ].join("\n"),
    createLabel: "Create automation",
  },
  {
    id: "pagerduty-incident-bridge",
    category: "triage",
    availability: "live",
    title: "PagerDuty incident bridge",
    description:
      "Bridge PagerDuty incidents to Slack triage with service ownership, runbooks, and continuity memory.",
    loopGoal: "Bridge incidents to continuity",
    connectors: ["pagerduty", "slack"],
    integrationPills: ["pagerduty", "slack", "memoryos"],
    triggers: ["webhook"],
    instructions: [
      "A PagerDuty incident was received. Start a triage thread with enough context for responders.",
      "",
      "1. Extract service, urgency, alert source, and incident timeline.",
      "2. Load runbooks, wiki context, and recent incidents for the affected service.",
      "3. Post a Slack thread with impact, owner, known mitigations, and next action.",
      "4. Write action memory when the incident is resolved.",
    ].join("\n"),
    createLabel: "Create automation",
  },
  {
    id: "linear-stale-issue-sync",
    category: "project-management",
    availability: "live",
    title: "Linear stale issue sync",
    description:
      "Sync stale Linear issues with Jira and GitHub context, then post owner-facing follow-up.",
    loopGoal: "Sync stale issues",
    connectors: ["linear", "jira", "github"],
    integrationPills: ["linear", "jira", "memoryos"],
    triggers: ["schedule"],
    instructions: [
      "Review stale Linear issues and update their status with MemoryOS context.",
      "",
      "1. Find issues without owner activity in the configured date range.",
      "2. Search related Jira tickets, PRs, sessions, and handoffs.",
      "3. Add a concise update or owner ping with exact next action.",
      "4. Close or relabel issues only when the evidence is clear.",
    ].join("\n"),
    createLabel: "Create automation",
  },
];

const ADDITIONAL_AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    id: "daily-sentry-error-fixes",
    category: "monitoring",
    availability: "live",
    title: "Daily Sentry Error Fixes",
    description:
      "Every morning, MemoryOS pulls unresolved Sentry errors, investigates top issues, and opens fixes for owners.",
    loopGoal: "Investigate unresolved Sentry errors and open verified fixes",
    connectors: ["sentry", "github"],
    integrationPills: ["sentry", "github", "memoryos"],
    triggers: ["schedule"],
    instructions: [
      "Every morning, inspect unresolved Sentry issues and recent deploy context.",
      "",
      "1. Rank errors by users affected, recency, and regression risk.",
      "2. Correlate each top error with recent deploys, PRs, and action memory.",
      "3. Open focused GitHub issues or PRs with reproduction notes.",
      "4. Write a brief owner-facing summary with evidence links.",
    ].join("\n"),
    createLabel: "Create automation",
  },
  {
    id: "datadog-alert-investigation",
    category: "monitoring",
    availability: "live",
    title: "Datadog Alert Investigation",
    description:
      "When a Datadog alert lands in Slack, MemoryOS reads alert context and investigates probable causes.",
    loopGoal: "Investigate Datadog alerts with Slack and memory context",
    connectors: ["slack", "datadog"],
    integrationPills: ["slack", "datadog", "memoryos"],
    triggers: ["slack_message_advanced"],
    instructions: [
      "A Datadog alert was posted in Slack. The full event details are included below.",
      "",
      "1. Extract monitor name, impacted service, time window, and alert threshold.",
      "2. Use Datadog context and recent action memory to identify likely causes.",
      "3. Check deploys, incidents, and related PRs from the same window.",
      "4. Reply in the Slack thread with current impact, hypothesis, and next action.",
    ].join("\n"),
    createLabel: "Create automation",
  },
  {
    id: "daily-health-digest",
    category: "monitoring",
    availability: "live",
    title: "Daily Health Digest",
    description:
      "Daily scan of alerts, failing checks, stale PRs, and memory handoffs, posted as one operational digest.",
    loopGoal: "Post a daily operational health digest",
    connectors: ["slack", "datadog", "github"],
    integrationPills: ["slack", "datadog", "github", "memoryos"],
    triggers: ["schedule"],
    instructions: [
      "Create a concise daily health digest for the engineering channel.",
      "",
      "1. Summarize active alerts, unresolved Sentry or Datadog issues, and failing checks.",
      "2. List stale PRs, blocked sessions, and open continuity handoffs.",
      "3. Highlight owner, severity, and recommended next action.",
      "4. Post a Slack summary with links and memory-backed context.",
    ].join("\n"),
    createLabel: "Create automation",
  },
  {
    id: "weekly-analytics-health-check",
    category: "monitoring",
    availability: "live",
    title: "Weekly Analytics Health Check",
    description:
      "Every Monday, MemoryOS checks control-plane queries and flags broken, stale, or suspicious metrics.",
    loopGoal: "Verify analytics surfaces and report broken queries",
    connectors: ["metabase", "slack"],
    integrationPills: ["metabase", "slack", "memoryos"],
    triggers: ["schedule"],
    instructions: [
      "Run a weekly analytics health check.",
      "",
      "1. Check key control-plane queries for failures, stale data, and abnormal runtime.",
      "2. Compare important metrics against last week and known incidents.",
      "3. Create issues for broken charts with links and owners.",
      "4. Post the summary to Slack.",
    ].join("\n"),
    createLabel: "Create automation",
  },
  {
    id: "circleci-failure-fix",
    category: "ci-cd",
    availability: "live",
    title: "CircleCI Failure Fix",
    description:
      "When a CircleCI check fails, MemoryOS inspects build logs, finds root cause, and opens a minimal fix.",
    loopGoal: "Fix CircleCI failures with focused verified diffs",
    connectors: ["github", "circleci"],
    integrationPills: ["github", "circleci", "memoryos"],
    triggers: ["ci_failure"],
    instructions: [
      "A CircleCI check failed. Investigate and fix the failing branch.",
      "",
      "1. Read CircleCI build logs and identify the first meaningful failure.",
      "2. Inspect the related PR diff and recent memory for context.",
      "3. Apply the smallest safe code or config fix.",
      "4. Run relevant tests locally and push the fix.",
    ].join("\n"),
    createLabel: "Create automation",
  },
  {
    id: "nightly-qa-smoke-tests",
    category: "maintenance",
    availability: "live",
    title: "Nightly QA & Smoke Tests",
    description:
      "Run end-to-end smoke tests every night and open a fix session when failures repeat.",
    loopGoal: "Run nightly QA checks and triage repeat failures",
    connectors: ["github", "slack"],
    integrationPills: ["github", "slack", "memoryos"],
    triggers: ["schedule"],
    instructions: [
      "Run nightly QA and smoke test monitoring.",
      "",
      "1. Check latest smoke test results for staging.",
      "2. Group failures by scenario, browser, and recent changes.",
      "3. Open a fix issue or PR for repeat failures.",
      "4. Post the digest to Slack.",
    ].join("\n"),
    createLabel: "Create automation",
  },
  {
    id: "weekly-dependency-updates",
    category: "maintenance",
    availability: "live",
    title: "Weekly Dependency Updates",
    description:
      "Every Monday, MemoryOS scans outdated packages and proposes safe updates with changelog context.",
    loopGoal: "Propose safe weekly dependency updates",
    connectors: ["github"],
    integrationPills: ["github", "memoryos"],
    triggers: ["schedule"],
    instructions: [
      "Scan dependencies and propose safe weekly updates.",
      "",
      "1. Read package manifests and lockfiles.",
      "2. Prioritize security patches and low-risk minor releases.",
      "3. Review changelogs for breaking changes.",
      "4. Open focused PRs with test notes.",
    ].join("\n"),
    createLabel: "Create automation",
  },
  {
    id: "cloudflare-security-audit",
    category: "maintenance",
    availability: "live",
    title: "Cloudflare Security Audit",
    description:
      "Weekly review of Cloudflare logs and settings to flag suspicious activity and risky changes.",
    loopGoal: "Audit Cloudflare security signals",
    connectors: ["cloudflare", "slack"],
    integrationPills: ["cloudflare", "slack", "memoryos"],
    triggers: ["schedule"],
    instructions: [
      "Review Cloudflare security state for suspicious activity.",
      "",
      "1. Inspect recent firewall events, WAF changes, and rate-limit anomalies.",
      "2. Compare changes against known deployment and incident memory.",
      "3. Summarize suspicious activity with risk level and recommended action.",
      "4. Post findings to Slack.",
    ].join("\n"),
    createLabel: "Create automation",
  },
  {
    id: "dependency-vulnerability-scanner",
    category: "security",
    availability: "live",
    title: "Dependency Vulnerability Scanner",
    description:
      "Daily scan for CVEs in dependencies, prioritized by reachability, severity, and company context.",
    loopGoal: "Find and prioritize dependency vulnerabilities",
    connectors: ["github"],
    integrationPills: ["github", "memoryos"],
    triggers: ["schedule"],
    defaultMemoryFeatures: { requireGovernanceApproval: true, attachOperationalWiki: true },
    instructions: [
      "Run a dependency vulnerability scan.",
      "",
      "1. Parse dependency manifests and lockfiles.",
      "2. Rank advisories by severity, exploitability, and service exposure.",
      "3. Open issues or PRs for high-priority fixes.",
      "4. Require governance approval before risky upgrades.",
    ].join("\n"),
    createLabel: "Create automation",
  },
  {
    id: "secret-scanner",
    category: "security",
    availability: "live",
    title: "Secret Scanner",
    description:
      "Daily scan for leaked credentials, API keys, and tokens in the codebase with remediation guidance.",
    loopGoal: "Detect leaked secrets and guide remediation",
    connectors: ["github", "slack"],
    integrationPills: ["github", "slack", "memoryos"],
    triggers: ["schedule"],
    defaultMemoryFeatures: { requireGovernanceApproval: true },
    instructions: [
      "Scan code and recent commits for possible secrets.",
      "",
      "1. Identify leaked keys, credentials, and tokens.",
      "2. Check whether each finding is active or false positive.",
      "3. Open a private remediation issue with rotation steps.",
      "4. Notify owners without exposing secret values.",
    ].join("\n"),
    createLabel: "Create automation",
  },
  {
    id: "code-pattern-enforcer",
    category: "security",
    availability: "live",
    title: "Code Pattern Enforcer",
    description:
      "Weekly comparison of repo code against golden patterns to detect risky implementation drift.",
    loopGoal: "Detect code pattern drift",
    connectors: ["github"],
    integrationPills: ["github", "memoryos"],
    triggers: ["schedule"],
    instructions: [
      "Compare code patterns against approved reference implementations.",
      "",
      "1. Scan critical paths for auth, tenant isolation, and data access patterns.",
      "2. Identify deviations from approved examples.",
      "3. Create issues with exact file paths and safer patterns.",
    ].join("\n"),
    createLabel: "Create automation",
  },
  {
    id: "sre-health-checker",
    category: "security",
    availability: "live",
    title: "SRE Health Checker",
    description:
      "Weekly scan for deprecated APIs, missing error handling, hardcoded timeouts, and missing circuit breakers.",
    loopGoal: "Find SRE reliability gaps",
    connectors: ["github", "datadog"],
    integrationPills: ["github", "datadog", "memoryos"],
    triggers: ["schedule"],
    instructions: [
      "Run an SRE reliability health check.",
      "",
      "1. Find deprecated APIs, missing retries, and hardcoded timeouts.",
      "2. Compare incidents and alerts against code paths.",
      "3. Open reliability issues with severity and owner suggestions.",
    ].join("\n"),
    createLabel: "Create automation",
  },
  {
    id: "owasp-security-hardening",
    category: "security",
    availability: "live",
    title: "OWASP Security Hardening",
    description:
      "Weekly scan for OWASP Top 10 risks: injection, XSS, missing auth checks, and insecure defaults.",
    loopGoal: "Scan for OWASP hardening gaps",
    connectors: ["github"],
    integrationPills: ["github", "memoryos"],
    triggers: ["schedule"],
    defaultMemoryFeatures: { requireGovernanceApproval: true },
    instructions: [
      "Run OWASP hardening checks across the codebase.",
      "",
      "1. Check auth, input validation, output encoding, and secret handling.",
      "2. Prioritize findings by exploitable surface area.",
      "3. Open issues or PRs for focused hardening work.",
    ].join("\n"),
    createLabel: "Create automation",
  },
  {
    id: "customer-support-triage",
    category: "triage",
    availability: "live",
    title: "Customer Support Triage",
    description:
      "When a support message lands, MemoryOS investigates relevant docs, code, and memory before drafting a reply.",
    loopGoal: "Triage support messages with product memory",
    connectors: ["slack", "hubspot"],
    integrationPills: ["slack", "hubspot", "memoryos"],
    triggers: ["slack_message_advanced"],
    instructions: [
      "A customer support message was posted. Triage it with product context.",
      "",
      "1. Extract customer, account, product area, and impact.",
      "2. Search docs, code, and action memory for known issues.",
      "3. Draft a support response and internal follow-up.",
      "4. Escalate if severity or customer impact is high.",
    ].join("\n"),
    createLabel: "Create automation",
  },
  {
    id: "jira-ticket-to-pr",
    category: "triage",
    availability: "live",
    title: "Jira Ticket to PR",
    description:
      "When a Jira ticket is linked in Slack, MemoryOS reads context and opens the right GitHub follow-up.",
    loopGoal: "Convert Jira tickets into actionable PR work",
    connectors: ["slack", "jira", "github"],
    integrationPills: ["slack", "jira", "github", "memoryos"],
    triggers: ["slack_message_advanced"],
    instructions: [
      "A Jira ticket link was posted in Slack.",
      "",
      "1. Read ticket summary, acceptance criteria, and linked discussions.",
      "2. Find related code, wiki sections, and previous memory.",
      "3. Draft implementation plan or open a PR when scope is clear.",
      "4. Update the Slack thread with status and links.",
    ].join("\n"),
    createLabel: "Create automation",
  },
  {
    id: "jam-bug-report-investigation",
    category: "triage",
    availability: "live",
    title: "Jam Bug Report Investigation",
    description:
      "When someone shares a Jam recording in Slack, MemoryOS analyzes the report and opens a reproduction plan.",
    loopGoal: "Investigate Jam bug reports",
    connectors: ["slack", "jam", "github"],
    integrationPills: ["slack", "jam", "github", "memoryos"],
    triggers: ["slack_message_advanced"],
    instructions: [
      "A Jam bug report was shared in Slack.",
      "",
      "1. Extract reproduction steps, browser, console errors, and network signals.",
      "2. Search code and memory for related bugs.",
      "3. Open a GitHub issue or PR with reproduction details.",
      "4. Reply in Slack with triage status.",
    ].join("\n"),
    createLabel: "Create automation",
  },
  {
    id: "weekly-status-digest-notion",
    category: "project-management",
    availability: "live",
    title: "Weekly Status Digest to Notion",
    description:
      "Every Monday, MemoryOS compiles the week's merged PRs and open work into a Notion status update.",
    loopGoal: "Publish weekly status digest to Notion",
    connectors: ["notion", "github"],
    integrationPills: ["notion", "github", "memoryos"],
    triggers: ["schedule"],
    instructions: [
      "Create the weekly project status digest.",
      "",
      "1. Summarize merged PRs, shipped features, incidents, and open risks.",
      "2. Pull key decisions from action memory and handoffs.",
      "3. Update the Notion status page with categorized sections.",
    ].join("\n"),
    createLabel: "Create automation",
  },
  {
    id: "asana-sprint-progress-report",
    category: "project-management",
    availability: "live",
    title: "Asana Sprint Progress Report",
    description:
      "Daily standup summary from Asana: MemoryOS pulls task status and posts a progress report.",
    loopGoal: "Report sprint progress from Asana",
    connectors: ["asana", "slack"],
    integrationPills: ["asana", "slack", "memoryos"],
    triggers: ["schedule"],
    instructions: [
      "Create a daily sprint progress report.",
      "",
      "1. Read Asana tasks by status, owner, and due date.",
      "2. Compare progress against open PRs and memory handoffs.",
      "3. Post blockers, shipped items, and risks to Slack.",
    ].join("\n"),
    createLabel: "Create automation",
  },
  {
    id: "figma-design-review-pr",
    category: "code-quality",
    availability: "live",
    title: "Figma Design Review on PR",
    description:
      "When a UI PR opens, MemoryOS compares implementation against the linked Figma frame and writes review notes.",
    loopGoal: "Review UI PRs against Figma designs",
    connectors: ["github", "figma"],
    integrationPills: ["github", "figma", "memoryos"],
    triggers: ["github_pull_request"],
    instructions: [
      "A UI pull request needs design review.",
      "",
      "1. Read the PR diff and linked Figma references.",
      "2. Compare spacing, layout, states, and copy against the design.",
      "3. Leave concise review comments with exact fixes.",
    ].join("\n"),
    createLabel: "Create automation",
  },
  {
    id: "sonarqube-quality-gate-fix",
    category: "code-quality",
    availability: "live",
    title: "SonarQube Quality Gate Fix",
    description:
      "When a check fails due to SonarQube quality gate issues, MemoryOS fixes scoped code quality problems.",
    loopGoal: "Fix SonarQube quality gate failures",
    connectors: ["github", "sonarqube"],
    integrationPills: ["github", "sonarqube", "memoryos"],
    triggers: ["ci_failure"],
    instructions: [
      "A SonarQube quality gate failed.",
      "",
      "1. Read issue categories, file paths, and severity.",
      "2. Fix maintainability, reliability, or security issues with minimal diffs.",
      "3. Run targeted tests and push the fix.",
    ].join("\n"),
    createLabel: "Create automation",
  },
];

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  ...BASE_AUTOMATION_TEMPLATES,
  ...ADDITIONAL_AUTOMATION_TEMPLATES,
];

export type FeaturedAutomationTemplate = AutomationTemplate;

export const FEATURED_AUTOMATION_TEMPLATES: AutomationTemplate[] = AUTOMATION_TEMPLATES.filter(
  (t) => t.featured && t.availability === "live",
);

export const FEATURED_HERO_TEMPLATE: AutomationTemplate | undefined = AUTOMATION_TEMPLATES.find(
  (t) => t.featuredHero && t.availability === "live",
);

export function normalizeTemplateId(id: string | null | undefined): AutomationTemplateSlug | null {
  if (!id?.trim()) return null;
  const raw = id.trim();
  if (TEMPLATE_ID_ALIASES[raw]) return TEMPLATE_ID_ALIASES[raw];
  if (AUTOMATION_TEMPLATES.some((t) => t.id === raw)) {
    return raw as AutomationTemplateSlug;
  }
  return null;
}

export function findTemplate(id: string): AutomationTemplate | undefined {
  const slug = normalizeTemplateId(id);
  if (!slug) return undefined;
  return AUTOMATION_TEMPLATES.find((t) => t.id === slug);
}

export function isTemplateAvailable(template: AutomationTemplate): boolean {
  return template.availability === "live" || template.integrationPills.length > 0;
}

export function templatesByCategory(
  category: AutomationTemplateCategory,
): AutomationTemplate[] {
  return AUTOMATION_TEMPLATES.filter((t) => t.category === category);
}

export function templateToDraft(
  template: AutomationTemplate,
  options?: { repoFullName?: string | null },
): AutomationDraft {
  const inferredConnectors = template.connectors.length
    ? template.connectors
    : template.integrationPills.flatMap((pill) =>
        pill === "memoryos" ? [] : [pill as AutomationConnectorId],
      );
  return {
    templateId: template.id,
    name: template.title,
    goal: template.loopGoal,
    instructions: template.instructions || defaultTemplateInstructions(template),
    connectors: [...inferredConnectors],
    memoryFeatures: {
      ...DEFAULT_MEMORY_FEATURES,
      ...template.defaultMemoryFeatures,
    },
    triggers: template.triggers.map((type) => {
      const config: Record<string, string> = {};
      applyDefaultTriggerConfig(type, config, options);
      return newTrigger(type, config);
    }),
    instructionsV2:
      template.id === "ci-failure-continuity"
      || template.id === "stripe-failed-payment"
      || template.id === "datadog-alert-investigation"
        ? [
            {
              id: `inst_${template.id.replace(/-/g, "_")}_email`,
              kind: "email_notification",
              emailRecipient: "owner",
              emailWhen: template.id === "ci-failure-continuity" ? "on_failure" : "always",
            },
          ]
        : undefined,
    agentMode: "normal",
  };
}

function defaultTemplateInstructions(template: AutomationTemplate): string {
  return [
    `${template.title} was triggered. The full event details are included below.`,
    "",
    "1. Read the trigger payload and identify the affected customer, repo, service, or workflow.",
    "2. Pull relevant MemoryOS context: action memory, wiki, handoffs, and recent sessions.",
    "3. Investigate the root cause and produce the smallest safe next action.",
    "4. Post findings with evidence links and recommended owner.",
    "5. Write action memory with the outcome.",
  ].join("\n");
}

function applyDefaultTriggerConfig(
  type: AutomationTriggerType,
  config: Record<string, string>,
  options?: { repoFullName?: string | null },
): void {
  if (type === "slack_message" || type === "slack_message_advanced") {
    config.channel = "";
    config.keywords = "bug, crash, regression, outage";
    config.matchMode = "advanced";
    config.threadReply = "true";
  }
  if (type === "github_issue_comment") {
    config.command = "/memoryos";
    config.repo = options?.repoFullName ?? "";
  }
  if (type === "ci_failure") {
    config.repo = options?.repoFullName ?? "";
    config.action = "completed";
    config.conclusion = "failure";
    config.scope = "non_agent_prs";
    config.conditions = JSON.stringify([
      {
        id: "cond_ci_action",
        field: "action",
        operator: "equals",
        value: "completed",
      },
      {
        id: "cond_ci_conclusion",
        field: "conclusion",
        operator: "equals",
        value: "failure",
      },
    ]);
  }
  if (type === "linear_issue_event") {
    config.teamKey = "";
    config.event = "created,updated";
  }
  if (type === "webhook") {
    config.payloadFilter = "";
    config.webhookSecret = `whsec_${Math.random().toString(36).slice(2, 18)}`;
  }
  if (type === "jira_issue_event") {
    config.projectKey = "";
    config.event = "created,updated";
  }
  if (type === "memoryos_handoff") {
    config.source = "continuity_thread";
  }
  if (type === "schedule") {
    config.cron = "0 9 * * 1";
    config.timezone = "UTC";
  }
}
