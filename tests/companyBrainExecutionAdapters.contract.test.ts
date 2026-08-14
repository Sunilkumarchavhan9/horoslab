import { afterEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
}));

vi.mock("@/lib/storage/prismaClient", () => ({
  prisma: {
    connector: {
      findFirst: prismaMocks.findFirst,
    },
  },
}));

import { jiraExecutionAdapter } from "@/lib/companyBrain/adapters/jiraExecutionAdapter";
import { slackExecutionAdapter } from "@/lib/companyBrain/adapters/slackExecutionAdapter";
import {
  proposeExecution,
  reviewExecution,
} from "@/lib/companyBrain/executionEngine";

const scope = { userId: "user_exec", orgId: "org_exec" };

function slackConnectorConfig() {
  prismaMocks.findFirst.mockResolvedValue({
    configJson: JSON.stringify({ accessToken: "xoxp-slack-test" }),
  });
}

function jiraConnectorConfig() {
  prismaMocks.findFirst.mockResolvedValue({
    configJson: JSON.stringify({
      accessToken: "jira-token",
      cloudId: "cloud-1",
      browseBaseUrl: "https://acme.atlassian.net",
    }),
  });
}

describe("Company Brain execution adapters", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    prismaMocks.findFirst.mockReset();
  });

  it("slack adapter infers low risk for channel_message", () => {
    expect(slackExecutionAdapter.inferRiskTier("channel_message", {})).toBe("low");
    expect(slackExecutionAdapter.inferRiskTier("unknown", {})).toBe("high");
  });

  it("jira adapter infers risk tiers for supported actions", () => {
    expect(jiraExecutionAdapter.inferRiskTier("issue_comment", {})).toBe("low");
    expect(jiraExecutionAdapter.inferRiskTier("issue_transition", {})).toBe("medium");
    expect(jiraExecutionAdapter.inferRiskTier("delete_issue", {})).toBe("high");
  });

  it("slack validatePropose rejects missing connector", async () => {
    prismaMocks.findFirst.mockResolvedValue(null);
    await expect(
      slackExecutionAdapter.validatePropose(scope, "channel_message", {
        channel: "C123",
        text: "hello",
      }),
    ).rejects.toThrow(/not connected/i);
  });

  it("slack validatePropose calls auth.test with org-scoped connector", async () => {
    slackConnectorConfig();
    const verify = vi.spyOn(
      (await import("@/lib/integrations/slack")).SlackClient,
      "verifyAccessToken",
    ).mockResolvedValue(undefined);

    await slackExecutionAdapter.validatePropose(scope, "post_message", {
      channel: "C123",
      text: "Ship checklist complete.",
    });

    expect(prismaMocks.findFirst).toHaveBeenCalled();
    expect(verify).toHaveBeenCalledWith("xoxp-slack-test");
  });

  it("slack execute posts channel message", async () => {
    slackConnectorConfig();
    const post = vi
      .spyOn((await import("@/lib/integrations/slack")).SlackClient, "postChannelMessage")
      .mockResolvedValue({ channel: "C123", ts: "1710000000.0001" });

    const result = await slackExecutionAdapter.execute(scope, "channel_message", {
      channel: "C123",
      text: "Deployment note",
    });

    expect(result.ok).toBe(true);
    expect(result.externalRef).toBe("slack://C123/1710000000.0001");
    expect(post).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: "C123",
        text: "Deployment note",
      }),
    );
  });

  it("jira execute adds issue comment", async () => {
    jiraConnectorConfig();
    const postComment = vi
      .spyOn(await import("@/lib/integrations/jira"), "postJiraIssueComment")
      .mockResolvedValue({
        commentId: "10001",
        issueUrl: "https://acme.atlassian.net/browse/ENG-42",
      });

    const result = await jiraExecutionAdapter.execute(scope, "issue_comment", {
      issueKey: "ENG-42",
      body: "Approved from Company Brain.",
    });

    expect(result.ok).toBe(true);
    expect(result.externalRef).toBe("https://acme.atlassian.net/browse/ENG-42");
    expect(postComment).toHaveBeenCalledWith(
      "jira-token",
      expect.any(Object),
      "ENG-42",
      "Approved from Company Brain.",
    );
  });

  it("reviewExecution rejects approve when connector validation fails", async () => {
    const proposalModule = await import("@/lib/companyBrain/executionProposalStore");
    const saveSpy = vi.spyOn(proposalModule, "saveExecutionProposal");
    vi.spyOn(proposalModule, "getExecutionProposal").mockResolvedValue({
      id: "prop_1",
      userId: scope.userId,
      orgId: scope.orgId,
      adapter: "slack",
      actionType: "channel_message",
      payload: { channel: "C1", text: "hi" },
      status: "pending",
      riskTier: "low",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedByUserId: null,
      executedAt: null,
      rejectionReason: null,
      secondFactorVerified: false,
      result: null,
      error: null,
    });
    prismaMocks.findFirst.mockResolvedValue(null);
    saveSpy.mockImplementation(async (proposal) => proposal);

    const reviewed = await reviewExecution(scope, {
      proposalId: "prop_1",
      decision: "approve",
    });

    expect(reviewed.status).toBe("rejected");
    expect(reviewed.rejectionReason).toMatch(/not connected/i);
  });

  it("proposeExecution validates slack payload before persisting", async () => {
    prismaMocks.findFirst.mockResolvedValue({
      configJson: JSON.stringify({ accessToken: "xoxp-slack-test" }),
    });
    vi.spyOn(
      (await import("@/lib/integrations/slack")).SlackClient,
      "verifyAccessToken",
    ).mockResolvedValue(undefined);

    await expect(
      proposeExecution(scope, {
        adapter: "slack",
        actionType: "channel_message",
        payload: { channel: "C1" },
      }),
    ).rejects.toThrow(/payload\.text/i);
  });
});
