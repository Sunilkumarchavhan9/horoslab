import { describe, expect, it } from "vitest";
import { mapTicketToMemoryTexts } from "@/lib/integrations/ticketMemoryMapper";

describe("Ticket memory mapping contract", () => {
  it("maps incident/runbook/decision/policy/preference signals from ticket payload", () => {
    const mapped = mapTicketToMemoryTexts({
      source: "zendesk",
      id: "123",
      title: "SEV-1 outage in production API",
      description: "Triage decided to escalate by SLA policy. Team prefers rollback playbook.",
      status: "open",
      priority: "urgent",
      assignee: "oncall",
      labels: ["incident", "sev1", "policy"],
      resolution: "Resolution: rollback and run procedure",
      url: "https://example.zendesk.com/tickets/123",
    }).join("\n");

    expect(mapped).toContain("Incident memory");
    expect(mapped).toContain("Runbook candidate");
    expect(mapped).toContain("Decision memory");
    expect(mapped).toContain("Policy memory");
    expect(mapped).toContain("Preference memory");
    expect(mapped).toContain("connector_source=zendesk");
  });

  it("falls back to generic ticket memory when specialized cues are absent", () => {
    const mapped = mapTicketToMemoryTexts({
      source: "jira",
      id: "1",
      key: "PROJ-1",
      title: "Refactor module import paths",
    });
    expect(mapped).toHaveLength(1);
    expect(mapped[0]).toContain("Ticket memory from jira");
    expect(mapped[0]).toContain("ticket_ref=PROJ-1");
  });
});

