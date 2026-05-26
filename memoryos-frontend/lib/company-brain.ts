/**
 * Company Brain — product pillars and how Developer Console sections map to them.
 * @see docs/COMPANY_BRAIN_CORE_PRODUCT.md
 */

export const COMPANY_BRAIN_PILLARS = [
  {
    id: "ingest",
    label: "Ingest",
    short: "Connect tools & sync knowledge",
  },
  {
    id: "structure",
    label: "Structure",
    short: "Contracts, graph, lineage",
  },
  {
    id: "execute",
    label: "Execute",
    short: "Runtime actions & skills",
  },
  {
    id: "continue",
    label: "Continue",
    short: "Cross-model continuity",
  },
  {
    id: "operate",
    label: "Operate safely",
    short: "Governance, privacy, audit",
  },
] as const;

export type CompanyBrainPillarId = (typeof COMPANY_BRAIN_PILLARS)[number]["id"];

export type SectionExecutionTier = "live" | "partial" | "planned";

export type ConsoleSectionBrainMeta = {
  purpose: string;
  pillars: CompanyBrainPillarId[];
  executionTier: SectionExecutionTier;
};

/** How each main console section supports the Company Brain vision. */
export const CONSOLE_SECTION_BRAIN: Record<string, ConsoleSectionBrainMeta> = {
  Overview: {
    purpose: "Operational control center — live memory, connectors, continuity, and runtime signals.",
    pillars: ["ingest", "structure", "continue", "operate"],
    executionTier: "live",
  },
  "Connected Intelligence Sources": {
    purpose: "Ingest company knowledge from GitHub, Notion, Jira, Slack, files, and APIs.",
    pillars: ["ingest", "structure"],
    executionTier: "partial",
  },
  "Memory Graph": {
    purpose: "Visualize structured memory, repos, workflows, and relationships from live data.",
    pillars: ["structure", "continue"],
    executionTier: "partial",
  },
  "Runtime Activity": {
    purpose: "Live infrastructure monitor — retrievals, ingest, and API execution traces.",
    pillars: ["execute", "operate"],
    executionTier: "live",
  },
  "Agent Activity Timeline": {
    purpose: "Trust layer — what agents and APIs did, with traceable decisions and calls.",
    pillars: ["execute", "continue", "operate"],
    executionTier: "partial",
  },
  "Memory Evolution Timeline": {
    purpose: "How organizational intelligence evolved — decisions, context, and memory changes.",
    pillars: ["structure", "continue"],
    executionTier: "partial",
  },
  "Security + Governance": {
    purpose: "Enterprise-safe execution — review gates, retention, redaction, and plan limits.",
    pillars: ["operate"],
    executionTier: "partial",
  },
  "Continuity Lab": {
    purpose:
      "Living memory workspace — chat with live company intelligence, multi-agent handoff, project evolution.",
    pillars: ["continue", "execute", "structure", "ingest"],
    executionTier: "partial",
  },
  Playground: {
    purpose: "Agent runtime sandbox — retrieval, memory execution, prompts, and trace proof.",
    pillars: ["execute", "structure", "continue"],
    executionTier: "live",
  },
  "Integrations & SDK": {
    purpose: "Wire MemoryOS into your stack — SDK, MCP, API keys, and installation proof.",
    pillars: ["ingest", "execute"],
    executionTier: "live",
  },
  Team: {
    purpose: "Workspace seats and roles on the intelligence layer.",
    pillars: ["operate"],
    executionTier: "live",
  },
  Billing: {
    purpose: "Usage meters and plan limits for production operation.",
    pillars: ["operate"],
    executionTier: "live",
  },
  Settings: {
    purpose: "Workspace policy, privacy preferences, and environment configuration.",
    pillars: ["operate"],
    executionTier: "live",
  },
  "API Keys": {
    purpose: "Scoped access for agents and CI to ingest and retrieve with your memory.",
    pillars: ["ingest", "execute", "operate"],
    executionTier: "live",
  },
};

/** Continuity Lab capabilities — honest live vs roadmap for execution layer. */
export const CONTINUITY_LAB_CAPABILITIES = [
  {
    id: "live_chat",
    label: "Live company intelligence chat",
    tier: "live" as const,
    detail: "Voice/chat backed by memory retrieval, contracts, and agent runtime APIs.",
  },
  {
    id: "multi_agent",
    label: "Multi-agent + multi-model handoff",
    tier: "live" as const,
    detail: "Switch agents/models; inject MemoryOS state without re-explaining context.",
  },
  {
    id: "continue_brief",
    label: "Continue project / resume brief",
    tier: "live" as const,
    detail: "Structured brief from organizational memory — goals, blockers, risky files.",
  },
  {
    id: "retrieve_debug",
    label: "Retrieve, explain, trace proof",
    tier: "live" as const,
    detail: "Debug retrieval quality; trace what memory was used and why.",
  },
  {
    id: "ide_workspace",
    label: "Codex-style IDE workspace",
    tier: "partial" as const,
    detail:
      "Agent + Editor layouts: threads rail, chat or Monaco workbench, review with local edits and GitHub propose→approve.",
  },
  {
    id: "editor_workbench",
    label: "In-browser code editor",
    tier: "partial" as const,
    detail: "GitHub repo browser, Monaco editor, dirty-file tracking, governed file commits.",
  },
  {
    id: "connected_context",
    label: "Connected tool context",
    tier: "partial" as const,
    detail: "Sync from GitHub, Notion, Jira, Slack, files — connectors rail + review panel.",
  },
  {
    id: "repo_debug",
    label: "Repository debug & risky files",
    tier: "partial" as const,
    detail: "Risky-file and bug signals from memory; deep repo analysis expanding next.",
  },
  {
    id: "tool_writeback",
    label: "Governed GitHub issue comments",
    tier: "partial" as const,
    detail: "Propose → approve → post comment on GitHub. Commits/PR automation next.",
  },
] as const;

export function getSectionBrainMeta(sectionLabel: string): ConsoleSectionBrainMeta | null {
  return CONSOLE_SECTION_BRAIN[sectionLabel] ?? null;
}
