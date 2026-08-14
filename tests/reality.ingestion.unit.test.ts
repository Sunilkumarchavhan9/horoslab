import { beforeEach, describe, expect, it } from "vitest";
import { RealityRuntime } from "../lib/reality/realityRuntime";
import { ingestConnectorSync, ingestGitHubCompilation } from "../lib/reality/ingestion/realityIngestion";

describe("Reality ingestion bridge", () => {
  beforeEach(() => {
    RealityRuntime.resetForTests();
  });

  it("ingests GitHub syncs into the graph and runtime event log", () => {
    ingestConnectorSync({
      connectorType: "github",
      userId: "user-1",
      orgId: "org-1",
      connectorId: "github-conn-1",
      extractedCount: 3,
      checkpoint: "2026-07-27T12:00:00.000Z",
      syncAttempts: 1,
      status: "success",
      contractCounts: { architecture_note: 1, decision: 2 },
      repoFullNames: ["acme/widgets"],
    });

    const intakeNode = RealityRuntime.getNode("github-connector-github-conn-1");
    const repositoryNode = RealityRuntime.getNode("acme-widgets");

    expect(intakeNode).toMatchObject({
      type: "source",
      name: "GitHub Connector github-conn-1",
    });
    expect(repositoryNode).toMatchObject({
      type: "repository",
      name: "acme/widgets",
    });
    expect(
      RealityRuntime.listEdges().some(
        (edge) =>
          edge.from === "github-connector-github-conn-1" &&
          edge.to === "acme-widgets" &&
          edge.relationship === "tracks",
      ),
    ).toBe(true);
    expect(
      RealityRuntime.listEvents(10).some(
        (event) =>
          event.nodeId === "github-connector-github-conn-1" &&
          event.type === "connector_sync_recorded",
      ),
    ).toBe(true);
    expect(RealityRuntime.sourceSummary().indexed).toBeGreaterThan(0);
  });

  it("ingests Slack syncs into the graph and runtime event log", () => {
    ingestConnectorSync({
      connectorType: "slack",
      userId: "user-2",
      orgId: "org-2",
      connectorId: "slack-conn-1",
      extractedCount: 5,
      checkpoint: "2026-07-27T12:15:00.000Z",
      syncAttempts: 2,
      status: "success",
      contractCounts: { decision: 1, incident: 4 },
      diagnostics: {
        channelsListed: 2,
        channelsSynced: 2,
        messagesSeen: 20,
        messagesSkipped: 4,
      },
    });

    const intakeNode = RealityRuntime.getNode("slack-connector-slack-conn-1");

    expect(intakeNode).toMatchObject({
      type: "source",
      name: "Slack Connector slack-conn-1",
    });
    expect(
      RealityRuntime.listEvents(10).some(
        (event) =>
          event.nodeId === "slack-connector-slack-conn-1" &&
          event.type === "connector_sync_recorded",
      ),
    ).toBe(true);
  });

  it("ingests Notion syncs into the graph and runtime event log", () => {
    ingestConnectorSync({
      connectorType: "notion",
      userId: "user-3",
      orgId: "org-3",
      connectorId: "notion-conn-1",
      extractedCount: 7,
      checkpoint: "2026-07-27T12:30:00.000Z",
      syncAttempts: 1,
      status: "success",
      contractCounts: { knowledge: 7 },
    });

    const intakeNode = RealityRuntime.getNode("notion-connector-notion-conn-1");

    expect(intakeNode).toMatchObject({
      type: "source",
      name: "Notion Connector notion-conn-1",
    });
    expect(
      RealityRuntime.listEvents(10).some(
        (event) =>
          event.nodeId === "notion-connector-notion-conn-1" &&
          event.type === "connector_sync_recorded",
      ),
    ).toBe(true);
  });

  it("ingests Jira syncs into the graph and runtime event log", () => {
    ingestConnectorSync({
      connectorType: "jira",
      userId: "user-4",
      orgId: "org-4",
      connectorId: "jira-conn-1",
      extractedCount: 4,
      checkpoint: "2026-07-27T12:45:00.000Z",
      syncAttempts: 3,
      status: "success",
      contractCounts: { issue: 4 },
    });

    const intakeNode = RealityRuntime.getNode("jira-connector-jira-conn-1");

    expect(intakeNode).toMatchObject({
      type: "source",
      name: "Jira Connector jira-conn-1",
    });
    expect(
      RealityRuntime.listEvents(10).some(
        (event) =>
          event.nodeId === "jira-connector-jira-conn-1" &&
          event.type === "connector_sync_recorded",
      ),
    ).toBe(true);
  });

  it("ingests GitHub compilation webhooks into repository nodes", () => {
    ingestGitHubCompilation({
      userId: "system",
      orgId: "org-3",
      record: {
        repository: "acme/reality-compiler",
        pullRequest: 21,
        action: "opened",
        headSha: "head-21",
        baseSha: "base-21",
        decision: {
          decision: "CONDITIONAL",
          riskLevel: "medium",
        },
      },
    });

    const repositoryNode = RealityRuntime.getNode("acme-reality-compiler");

    expect(repositoryNode).toMatchObject({
      type: "repository",
      name: "acme/reality-compiler",
    });
    expect(
      RealityRuntime.listEvents(10).some(
        (event) =>
          event.nodeId === "acme-reality-compiler" && event.type === "github_pull_request_compiled",
      ),
    ).toBe(true);
  });
});
