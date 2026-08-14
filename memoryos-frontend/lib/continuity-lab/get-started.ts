/**
 * Devin-style "Get started with MemoryOS" checklist for Continuity Lab home.
 */

import type { MemoryOsConnectorState } from "@/lib/continuity-lab/runtime";
import type { ServerFunnelProgress } from "@/lib/company-brain-funnel";

export type GetStartedStepId =
  | "connect_github"
  | "select_repository"
  | "save_company_model"
  | "first_session"
  | "validate_review"
  | "setup_wiki";

export type GetStartedStep = {
  id: GetStartedStepId;
  title: string;
  description: string;
  href?: string;
  placeholder?: boolean;
};

export const GET_STARTED_STEPS: GetStartedStep[] = [
  {
    id: "connect_github",
    title: "Connect GitHub",
    description: "Link the repo where incidents and PRs already live.",
    href: "/continuity-lab?select_org=true",
  },
  {
    id: "select_repository",
    title: "Select repository",
    description: "Scope continuity to one repo for resume briefs and agent work.",
    href: "/continuity-lab/settings/select-org",
  },
  {
    id: "save_company_model",
    title: "Save Company Model",
    description: "Set the model that powers governed agent sessions in the lab.",
    href: "/continuity-lab?companyModel=1",
  },
  {
    id: "first_session",
    title: "Resume your first task",
    description: "Start a session with an operational brief — not a cold prompt.",
    href: "/continuity-lab",
  },
  {
    id: "validate_review",
    title: "Resume a PR review",
    description: "Paste a PR URL and continue review with repo context loaded.",
    href: "/continuity-lab/review",
  },
  {
    id: "setup_wiki",
    title: "Trace decisions",
    description: "Browse repo memory, decisions, and your operational map.",
    href: "/continuity-lab/wiki",
  },
];

export type GetStartedProgress = {
  completed: Record<GetStartedStepId, boolean>;
  doneCount: number;
  total: number;
  currentStepId: GetStartedStepId | null;
};

export function deriveGetStartedProgress(input: {
  funnel: Partial<ServerFunnelProgress> | null;
  connector: MemoryOsConnectorState;
  modelReady: boolean;
  hasSessions: boolean;
}): GetStartedProgress {
  const github = input.connector.payload.github;
  const connectGithub = Boolean(input.funnel?.connectGithub) || github.connected;
  const selectRepository =
    Boolean(input.funnel?.syncGithub) || github.records > 0 || (github.connected && github.repos.length > 0);
  const saveCompanyModel = input.modelReady;
  const firstSession =
    Boolean(input.funnel?.labOpened) || input.hasSessions;
  const validateReview = Boolean(input.funnel?.proposalApproved ?? input.funnel?.approved);
  const setupWiki = Boolean(input.funnel?.briefLoaded);

  const completed: Record<GetStartedStepId, boolean> = {
    connect_github: connectGithub,
    select_repository: selectRepository,
    save_company_model: saveCompanyModel,
    first_session: firstSession,
    validate_review: validateReview,
    setup_wiki: setupWiki,
  };

  const total = GET_STARTED_STEPS.length;
  const doneCount = GET_STARTED_STEPS.filter((s) => completed[s.id]).length;
  const currentStepId =
    GET_STARTED_STEPS.find((s) => !completed[s.id])?.id ?? null;

  return { completed, doneCount, total, currentStepId };
}
