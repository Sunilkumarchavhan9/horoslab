import { retrieveRelevantMemory } from "../memory/retrieveRelevantMemory";
import { analyzeGitHubRepoForUser, type GitHubRepoAnalysis } from "./githubRepoAnalysis";
import { getConnectedConnectorTypes } from "./connectorTokens";

export type EngineeringAssistAction = {
  id: string;
  connector: "github" | "slack" | "jira" | "memory";
  label: string;
  detail: string;
};

export type EngineeringAssistReport = {
  question: string;
  connectors: {
    github: boolean;
    slack: boolean;
    jira: boolean;
  };
  memorySignals: Array<{ memory: string; score?: number }>;
  github: GitHubRepoAnalysis | null;
  suggestedActions: EngineeringAssistAction[];
};

const ERROR_SIGNAL_RE =
  /\b(error|exception|failed|failure|bug|regression|crash|timeout|500|4\d{2})\b/i;

export async function runEngineeringAssist(input: {
  userId: string;
  question?: string;
  owner?: string;
  repo?: string;
  project?: string;
  workspace?: string;
}): Promise<EngineeringAssistReport> {
  const question =
    input.question?.trim() ||
    "What errors, risky files, or blockers should engineers focus on?";

  const connected = await getConnectedConnectorTypes(input.userId);
  const connectors = {
    github: connected.includes("github"),
    slack: connected.includes("slack"),
    jira: connected.includes("jira"),
  };

  const retrieval = await retrieveRelevantMemory({
    userId: input.userId,
    question,
    topK: 8,
    project: input.project,
    workspace: input.workspace,
  });

  const memorySignals = (retrieval.memories ?? [])
    .slice(0, 6)
    .flatMap((m) =>
      typeof m.memory === "string" && m.memory.trim().length > 0
        ? [{ memory: m.memory, score: m.score }]
        : [],
    );

  let github: GitHubRepoAnalysis | null = null;
  const owner = input.owner?.trim();
  const repo = input.repo?.trim();
  if (connectors.github && owner && repo) {
    try {
      github = await analyzeGitHubRepoForUser(input.userId, owner, repo);
    } catch {
      github = null;
    }
  }

  const suggestedActions = buildSuggestedActions({
    connectors,
    question,
    memorySignals,
    github,
  });

  return {
    question,
    connectors,
    memorySignals,
    github,
    suggestedActions,
  };
}

function buildSuggestedActions(input: {
  connectors: EngineeringAssistReport["connectors"];
  question: string;
  memorySignals: Array<{ memory: string; score?: number }>;
  github: GitHubRepoAnalysis | null;
}): EngineeringAssistAction[] {
  const actions: EngineeringAssistAction[] = [];

  if (input.github?.riskyPaths.length) {
    actions.push({
      id: "review-risky-paths",
      connector: "github",
      label: "Review risky paths",
      detail: input.github.riskyPaths.slice(0, 5).join(", "),
    });
  }

  if (input.github?.openIssues.length) {
    const top = input.github.openIssues[0];
    actions.push({
      id: "github-issue-comment",
      connector: "github",
      label: `Comment on #${top.number}`,
      detail: top.title,
    });
  }

  const errorMemories = input.memorySignals.filter((m) => ERROR_SIGNAL_RE.test(m.memory));
  if (errorMemories.length > 0) {
    actions.push({
      id: "memory-error-thread",
      connector: "memory",
      label: "Investigate error signals in memory",
      detail: errorMemories[0].memory.slice(0, 160),
    });
    if (input.connectors.slack) {
      actions.push({
        id: "slack-share-debug",
        connector: "slack",
        label: "Post debug summary to Slack",
        detail: "Propose a channel message with the top memory error signal (approve before send).",
      });
    }
    if (input.connectors.jira && input.github?.openIssues[0]) {
      const issue = input.github.openIssues[0];
      actions.push({
        id: "jira-link-debug",
        connector: "jira",
        label: `Update ${issue.number ? `issue context` : "Jira"}`,
        detail: `Add a governed comment on a Jira issue with: ${errorMemories[0].memory.slice(0, 120)}`,
      });
    }
  }

  if (input.github?.recentCommits.length) {
    const latest = input.github.recentCommits[0];
    actions.push({
      id: "inspect-latest-commit",
      connector: "github",
      label: "Inspect latest commit",
      detail: `${latest.sha}: ${latest.message}`,
    });
  }

  if (!input.connectors.github && !input.connectors.slack && !input.connectors.jira) {
    actions.push({
      id: "connect-sources",
      connector: "memory",
      label: "Connect GitHub, Slack, or Jira",
      detail: "Link tools in Connected Intelligence Sources to enable repo debug and governed write-back.",
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: "continue-brief",
      connector: "memory",
      label: "Load continue brief",
      detail: "Use organizational memory to pick the next engineering step.",
    });
  }

  return actions.slice(0, 8);
}
