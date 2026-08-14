import { describe, expect, it } from "vitest";
import { mapJiraToMemoryTexts } from "@/lib/integrations/jiraMemoryMapper";

describe("Jira memory mapping contract", () => {
  it("maps incident, decision, blocker, and handoff signals from issues", () => {
    const mapped = mapJiraToMemoryTexts({
      issueId: "10001",
      issueKey: "PLAT-42",
      summary: "SEV-1 production outage — rollback approved",
      description: "Blocked by deploy pipeline. Handoff to oncall for follow-up.",
      status: "In Progress",
      priority: "Highest",
      assignee: "Alex Chen",
      labels: ["incident", "p0"],
      url: "https://example.atlassian.net/browse/PLAT-42",
    }).join("\n");

    expect(mapped).toContain("Incident memory");
    expect(mapped).toContain("Decision:");
    expect(mapped).toContain("Blocker:");
    expect(mapped).toContain("Next action:");
    expect(mapped).toContain("connector_source=jira");
    expect(mapped).toContain("issue=PLAT-42");
  });

  it("maps comment bodies with issue triage context", () => {
    const mapped = mapJiraToMemoryTexts({
      issueId: "10002",
      issueKey: "ENG-9",
      summary: "API latency spike",
      status: "Open",
      commentBody: "Decision: we will defer the cache migration until next sprint.",
      commentAuthor: "Sam Lee",
      url: "https://example.atlassian.net/browse/ENG-9",
    });
    expect(mapped.some((line) => line.includes("Decision:"))).toBe(true);
    expect(mapped.some((line) => line.includes("comment:"))).toBe(true);
  });

  it("falls back to generic jira issue memory when specialized cues are absent", () => {
    const mapped = mapJiraToMemoryTexts({
      issueId: "10003",
      issueKey: "DOC-1",
      summary: "Update onboarding checklist copy",
      status: "To Do",
      priority: "Low",
    });
    expect(mapped).toHaveLength(1);
    expect(mapped[0]).toContain("Jira issue DOC-1");
    expect(mapped[0]).toContain("status=To Do");
  });
});
