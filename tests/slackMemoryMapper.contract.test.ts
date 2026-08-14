import { describe, expect, it } from "vitest";
import { mapSlackToMemoryTexts } from "@/lib/integrations/slackMemoryMapper";

describe("Slack memory mapping contract", () => {
  it("maps incident, decision, blocker, and handoff signals from channel messages", () => {
    const mapped = mapSlackToMemoryTexts({
      channelId: "C123",
      channelName: "platform",
      messageTs: "1710000000.000100",
      threadTs: "1710000000.000100",
      userId: "U1",
      text: "SEV-1 outage in prod — we decided to rollback. Blocked by deploy pipeline. Handoff to oncall.",
      permalink: "https://example.slack.com/archives/C123/p1710000000000100",
    }).join("\n");

    expect(mapped).toContain("Incident memory");
    expect(mapped).toContain("Decision:");
    expect(mapped).toContain("Blocker:");
    expect(mapped).toContain("Next action:");
    expect(mapped).toContain("connector_source=slack");
    expect(mapped).toContain("channel=platform");
  });

  it("falls back to generic slack message memory when specialized cues are absent", () => {
    const mapped = mapSlackToMemoryTexts({
      channelId: "C999",
      channelName: "eng-random",
      messageTs: "1710000001.000200",
      userId: "U9",
      text: "Updated the dashboard copy for the settings page.",
    });
    expect(mapped).toHaveLength(1);
    expect(mapped[0]).toContain("Slack message in #eng-random");
    expect(mapped[0]).toContain("message_ts=1710000001.000200");
  });
});
