import {
  postJiraIssueComment,
  transitionJiraIssue,
  verifyJiraConnectorAccess,
} from "../../integrations/jira";
import type { JiraAuthMode } from "../../integrations/jira";
import type { ExecutionAdapterResult, ExecutionRiskTier, ExecutionScope } from "../executionTypes";
import type { ExecutionAdapter } from "./executionAdapterTypes";
import { loadConnectorCredentials } from "./executionConnectorAccess";

function jiraConfigFromRecord(config: Record<string, unknown>) {
  return {
    authMode: config.authMode === "pat" ? ("pat" as JiraAuthMode) : undefined,
    siteUrl: typeof config.siteUrl === "string" ? config.siteUrl : undefined,
    email: typeof config.email === "string" ? config.email : undefined,
    projectKeys: Array.isArray(config.projectKeys)
      ? config.projectKeys.filter((value): value is string => typeof value === "string")
      : undefined,
    cloudId: typeof config.cloudId === "string" ? config.cloudId : undefined,
    browseBaseUrl: typeof config.browseBaseUrl === "string" ? config.browseBaseUrl : undefined,
  };
}

function parseIssueCommentPayload(payload: Record<string, unknown>): { issueKey: string; body: string } {
  const issueKey = typeof payload.issueKey === "string" ? payload.issueKey.trim() : "";
  const body = typeof payload.body === "string" ? payload.body.trim() : "";
  if (!issueKey) {
    throw new Error('Jira issue_comment requires payload.issueKey (e.g. "PROJ-123").');
  }
  if (!body) {
    throw new Error("Jira issue_comment requires payload.body.");
  }
  return { issueKey, body };
}

function parseIssueTransitionPayload(payload: Record<string, unknown>): {
  issueKey: string;
  transitionId: string;
} {
  const issueKey = typeof payload.issueKey === "string" ? payload.issueKey.trim() : "";
  const transitionId = typeof payload.transitionId === "string" ? payload.transitionId.trim() : "";
  if (!issueKey) {
    throw new Error('Jira issue_transition requires payload.issueKey (e.g. "PROJ-123").');
  }
  if (!transitionId) {
    throw new Error("Jira issue_transition requires payload.transitionId.");
  }
  return { issueKey, transitionId };
}

export const jiraExecutionAdapter: ExecutionAdapter = {
  id: "jira",
  inferRiskTier(actionType) {
    if (actionType === "issue_comment") return "low";
    if (actionType === "issue_transition") return "medium";
    return "high";
  },
  async validatePropose(scope, actionType, payload) {
    if (actionType === "issue_comment") {
      parseIssueCommentPayload(payload);
    } else if (actionType === "issue_transition") {
      parseIssueTransitionPayload(payload);
    } else {
      throw new Error(
        `Unsupported Jira action "${actionType}". Supported: issue_comment, issue_transition.`,
      );
    }
    const { accessToken, config } = await loadConnectorCredentials(scope, "jira");
    await verifyJiraConnectorAccess(accessToken, jiraConfigFromRecord(config));
  },
  async execute(scope, actionType, payload): Promise<ExecutionAdapterResult> {
    const { accessToken, config } = await loadConnectorCredentials(scope, "jira");
    const jiraConfig = jiraConfigFromRecord(config);

    if (actionType === "issue_comment") {
      const { issueKey, body } = parseIssueCommentPayload(payload);
      const result = await postJiraIssueComment(accessToken, jiraConfig, issueKey, body);
      return {
        ok: true,
        detail: `Added Jira comment on ${issueKey}.`,
        externalRef: result.issueUrl,
        data: { issueKey, commentId: result.commentId ?? null },
      };
    }

    if (actionType === "issue_transition") {
      const { issueKey, transitionId } = parseIssueTransitionPayload(payload);
      const result = await transitionJiraIssue(accessToken, jiraConfig, issueKey, transitionId);
      return {
        ok: true,
        detail: `Transitioned Jira issue ${issueKey}.`,
        externalRef: result.issueUrl,
        data: { issueKey, transitionId },
      };
    }

    return {
      ok: false,
      detail: `Unsupported Jira action "${actionType}".`,
    };
  },
};
