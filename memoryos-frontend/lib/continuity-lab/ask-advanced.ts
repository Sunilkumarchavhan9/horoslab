/**
 * Advanced capabilities sections and prompt cards for /continuity-lab/ask/advanced.
 */

export type AskAdvancedSectionId =
  | "batch"
  | "schedules"
  | "playbooks"
  | "knowledge"
  | "analyze"
  | "memory";

export type AskAdvancedCard = {
  id: string;
  title: string;
  description: string;
  prompt: string;
  href?: string;
};

export type AskAdvancedSection = {
  id: AskAdvancedSectionId;
  label: string;
  cards: AskAdvancedCard[];
};

export const ASK_ADVANCED_SECTIONS: AskAdvancedSection[] = [
  {
    id: "batch",
    label: "Start batch sessions",
    cards: [
      {
        id: "migration",
        title: "Migration across codebase",
        description: "Plan a staged migration with continuity checkpoints per package.",
        prompt:
          "Plan a batch migration across this codebase. For each major module, list risky files, dependencies, and a safe order of operations. Start with the lowest-risk package.",
      },
      {
        id: "security-audit",
        title: "Security audit",
        description: "Scan for auth, secrets, and injection risks with governance notes.",
        prompt:
          "Run a security audit on this repository: auth flows, secret handling, dependency risks, and injection surfaces. Propose fixes ranked by severity with file paths.",
      },
      {
        id: "recent-pr-features",
        title: "Recent PR features",
        description: "Summarize and continue work from the latest merged PRs.",
        prompt:
          "Review the most recent merged PRs in this repo. Summarize what shipped, what follow-ups remain, and suggest the next session tasks with continuity context.",
      },
    ],
  },
  {
    id: "schedules",
    label: "Create schedules",
    cards: [
      {
        id: "weekly-stale-flags",
        title: "Weekly stale flags",
        description: "Flag operational map drift and stale wiki sections.",
        prompt: "",
        href: "/continuity-lab/automations/templates",
      },
      {
        id: "daily-design-system",
        title: "Daily design system check",
        description: "Scan UI tokens and component usage against wiki standards.",
        prompt: "",
        href: "/continuity-lab/automations/new",
      },
    ],
  },
  {
    id: "playbooks",
    label: "Manage playbooks",
    cards: [
      {
        id: "create-playbook",
        title: "Create playbook",
        description: "Start a new repeatable agent playbook from a template.",
        prompt:
          "Create a new agent playbook for this team: goal, triggers, guardrails, and memory capture steps.",
        href: "/continuity-lab/automations/templates",
      },
      {
        id: "improve-playbook",
        title: "Improve playbook",
        description: "Refine an existing automation into a stronger playbook.",
        prompt:
          "Review our automation templates and suggest improvements for continuity, governance, and handoff memory.",
        href: "/continuity-lab/automations",
      },
    ],
  },
  {
    id: "knowledge",
    label: "Manage knowledge",
    cards: [
      {
        id: "dedupe-memory",
        title: "Dedupe company memory",
        description: "Find overlapping memories and merge duplicates.",
        prompt:
          "Scan company memory for this repo and list duplicate or conflicting entries. Propose merges with governance notes.",
      },
      {
        id: "discover-patterns",
        title: "Discover patterns",
        description: "Surface recurring themes across sessions and wiki.",
        prompt:
          "Discover recurring patterns in sessions, wiki, and action memory for this project. What should become playbooks?",
      },
      {
        id: "review-suggestions",
        title: "Review suggestions",
        description: "Triage pending memory and wiki suggestions.",
        prompt:
          "List pending knowledge suggestions for this org and rank them by impact on continuity score.",
        href: "/continuity-lab/wiki",
      },
    ],
  },
  {
    id: "analyze",
    label: "Analyze sessions",
    cards: [
      {
        id: "governance-traces",
        title: "Governance trace review",
        description: "Inspect approval and execution lineage from recent sessions.",
        prompt:
          "Analyze recent agent sessions for governance traces: what was proposed, approved, and executed. Summarize gaps in continuity.",
      },
      {
        id: "action-memory",
        title: "Action memory patterns",
        description: "Find repeated actions worth automating.",
        prompt:
          "Review action memory and session history. Which repeated actions should become automations or playbooks?",
      },
      {
        id: "session-cost",
        title: "Session cost analysis",
        description: "Review token and runtime usage patterns (stub metrics).",
        prompt:
          "Summarize estimated session cost drivers for this org: model choice, sandbox runtime, and long-running threads. Suggest optimizations.",
      },
      {
        id: "failed-sessions",
        title: "Failed sessions",
        description: "Find sessions that errored or stalled in the sandbox.",
        prompt:
          "List recent sessions that failed or stalled. For each, hypothesize root cause and whether continuity context was missing.",
      },
      {
        id: "org-usage",
        title: "Org usage",
        description: "High-level continuity lab adoption across repos.",
        prompt:
          "Summarize org-wide Continuity Lab usage: sessions per repo, review vs ask ratio, and top continuity gaps.",
      },
    ],
  },
  {
    id: "memory",
    label: "Memory & continuity",
    cards: [
      {
        id: "resume-handoff",
        title: "Resume brief handoff",
        description: "Export continuity context for a teammate.",
        prompt:
          "Export a concise operational resume brief for handoff — current goal, blockers, risky files, and recommended next action.",
      },
      {
        id: "action-memory-review",
        title: "Review action memory",
        description: "Inspect repeated agent actions worth automating.",
        prompt:
          "Review action memory for this project. Which repeated actions should become automations or playbooks?",
        href: "/continuity-lab/wiki",
      },
      {
        id: "governance-settings",
        title: "Governance & approvals",
        description: "Trace proposals and execution lineage.",
        prompt: "",
        href: "/continuity-lab/settings/analytics",
      },
    ],
  },
];

export const BATCH_SESSIONS_EXAMPLE_PROMPT = ASK_ADVANCED_SECTIONS[0].cards[0].prompt;
