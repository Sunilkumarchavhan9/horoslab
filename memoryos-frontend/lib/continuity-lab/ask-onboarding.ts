/**
 * Continuity Lab Ask page onboarding checklist (localStorage + connector signals).
 */

import type { MemoryOsConnectorState } from "@/lib/continuity-lab/runtime";
import type { ServerFunnelProgress } from "@/lib/company-brain-funnel";

const STORAGE_KEY = "memoryos.continuity-lab.onboarding";

export type AskOnboardingStepId =
  | "connect_git"
  | "select_repos"
  | "first_session"
  | "validate_review"
  | "setup_wiki"
  | "ask_codebase"
  | "connect_integration"
  | "setup_automations"
  | "create_playbook"
  | "explore_advanced";

export type AskOnboardingStep = {
  id: AskOnboardingStepId;
  title: string;
  description: string;
  href?: string;
  advanced?: boolean;
  strikethrough?: string;
};

export const ASK_ONBOARDING_MAIN: AskOnboardingStep[] = [
  {
    id: "connect_git",
    title: "Connect Git",
    description: "Link GitHub so MemoryOS can scope repos and memory.",
    href: "/continuity-lab?select_org=true",
  },
  {
    id: "select_repos",
    title: "Select repositories",
    description: "Choose repos for resume briefs and agent work.",
    strikethrough: "$10 earned",
    href: "/continuity-lab/settings/select-org",
  },
  {
    id: "first_session",
    title: "Make first session",
    description: "Start a governed agent session with operational context.",
    href: "/continuity-lab",
  },
  {
    id: "validate_review",
    title: "Validate in Review",
    description: "Continue a PR review with repo context loaded.",
    href: "/continuity-lab/review",
  },
  {
    id: "setup_wiki",
    title: "Set up wiki",
    description: "Browse decisions, operational map, and repo memory.",
    href: "/continuity-lab/wiki",
  },
  {
    id: "ask_codebase",
    title: "Ask about codebase",
    description: "Use this page to brief answers and session prompts.",
    href: "/continuity-lab/ask",
  },
];

export const ASK_ONBOARDING_ADVANCED: AskOnboardingStep[] = [
  {
    id: "connect_integration",
    title: "Connect integration",
    description: "Add Slack, Jira, or other connectors in settings.",
    href: "/continuity-lab/settings/connections?tab=mcps",
    advanced: true,
  },
  {
    id: "setup_automations",
    title: "Set up automations",
    description: "Schedule recurring continuity workflows.",
    href: "/continuity-lab/automations/new",
    advanced: true,
  },
  {
    id: "create_playbook",
    title: "Create playbook",
    description: "Save repeatable agent playbooks for your team.",
    href: "/continuity-lab/automations/templates",
    advanced: true,
  },
  {
    id: "explore_advanced",
    title: "Explore advanced capabilities",
    description: "Batch sessions, knowledge, and session analysis.",
    href: "/continuity-lab/capabilities",
    advanced: true,
  },
];

export const ASK_ONBOARDING_STEPS: AskOnboardingStep[] = [
  ...ASK_ONBOARDING_MAIN,
  ...ASK_ONBOARDING_ADVANCED,
];

type StoredOnboarding = {
  manual?: Partial<Record<AskOnboardingStepId, boolean>>;
};

function readStored(): StoredOnboarding {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StoredOnboarding;
  } catch {
    return {};
  }
}

export function markAskOnboardingStep(id: AskOnboardingStepId, done = true): void {
  if (typeof window === "undefined") return;
  const stored = readStored();
  const manual = { ...stored.manual, [id]: done };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ manual }));
}

export function deriveAskOnboardingProgress(input: {
  funnel: Partial<ServerFunnelProgress> | null;
  connector: MemoryOsConnectorState;
  hasSessions: boolean;
  onAskPage?: boolean;
}): {
  completed: Record<AskOnboardingStepId, boolean>;
  doneCount: number;
  total: number;
} {
  const github = input.connector.payload.github;
  const manual = readStored().manual ?? {};

  const connectGit =
    manual.connect_git ?? (Boolean(input.funnel?.connectGithub) || github.connected);
  const selectRepos =
    manual.select_repos ??
    (Boolean(input.funnel?.syncGithub) ||
      github.records > 0 ||
      (github.connected && github.repos.length > 0));
  const firstSession =
    manual.first_session ?? (Boolean(input.funnel?.labOpened) || input.hasSessions);
  const validateReview =
    manual.validate_review ?? Boolean(input.funnel?.proposalApproved ?? input.funnel?.approved);
  const setupWiki = manual.setup_wiki ?? Boolean(input.funnel?.briefLoaded);
  const askCodebase = manual.ask_codebase ?? Boolean(input.onAskPage);

  const connectIntegration =
    manual.connect_integration ??
    (Boolean(input.funnel?.syncGithub) || (github.connected && github.records > 0));
  const setupAutomations = manual.setup_automations ?? false;
  const createPlaybook = manual.create_playbook ?? false;
  const exploreAdvanced = manual.explore_advanced ?? false;

  const completed: Record<AskOnboardingStepId, boolean> = {
    connect_git: connectGit,
    select_repos: selectRepos,
    first_session: firstSession,
    validate_review: validateReview,
    setup_wiki: setupWiki,
    ask_codebase: askCodebase,
    connect_integration: connectIntegration,
    setup_automations: setupAutomations,
    create_playbook: createPlaybook,
    explore_advanced: exploreAdvanced,
  };

  const total = ASK_ONBOARDING_STEPS.length;
  const doneCount = ASK_ONBOARDING_STEPS.filter((s) => completed[s.id]).length;

  return { completed, doneCount, total };
}

export function emptyAskOnboardingProgress(): {
  completed: Record<AskOnboardingStepId, boolean>;
  doneCount: number;
  total: number;
} {
  const completed = Object.fromEntries(
    ASK_ONBOARDING_STEPS.map((step) => [step.id, false]),
  ) as Record<AskOnboardingStepId, boolean>;

  return { completed, doneCount: 0, total: ASK_ONBOARDING_STEPS.length };
}
