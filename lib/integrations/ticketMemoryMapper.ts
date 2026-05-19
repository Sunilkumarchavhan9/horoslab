type TicketSource = "zendesk" | "jira";

type TicketMemoryMapInput = {
  source: TicketSource;
  id: string;
  key?: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assignee?: string;
  labels?: string[];
  resolution?: string;
  updatedAt?: string;
  url?: string;
};

function compactText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function hasAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

function normalizedCorpus(input: TicketMemoryMapInput): string {
  return compactText(
    [
      input.title,
      input.description ?? "",
      input.status ?? "",
      input.priority ?? "",
      input.assignee ?? "",
      (input.labels ?? []).join(" "),
      input.resolution ?? "",
    ].join(" ").toLowerCase(),
  );
}

function sourceRef(input: TicketMemoryMapInput): string {
  const identifier = input.key?.trim() || input.id.trim();
  return `[connector_source=${input.source} ticket_ref=${identifier}${input.url ? ` url=${input.url}` : ""}]`;
}

export function mapTicketToMemoryTexts(input: TicketMemoryMapInput): string[] {
  const results = new Set<string>();
  const corpus = normalizedCorpus(input);
  const tags = sourceRef(input);
  const base = compactText(`${input.title}${input.description ? ` — ${input.description}` : ""}`);
  const status = input.status ? `status=${input.status}` : "status=unknown";
  const priority = input.priority ? `priority=${input.priority}` : "priority=unknown";
  const assignee = input.assignee ? `assignee=${input.assignee}` : "assignee=unassigned";

  const incidentSignal =
    hasAny(corpus, ["incident", "outage", "sev", "p0", "p1", "production down", "bug", "urgent"])
    || hasAny((input.labels ?? []).map((label) => label.toLowerCase()).join(" "), ["incident", "outage", "bug", "sev", "p0", "p1"]);
  if (incidentSignal) {
    results.add(
      compactText(
        `Incident memory from ${input.source} ticket: ${base}. ${status}. ${priority}. ${assignee}. ${tags}`,
      ),
    );
  }

  const runbookSignal = hasAny(corpus, ["resolution", "resolved by", "fix", "workaround", "steps to reproduce", "playbook", "procedure"]);
  if (runbookSignal) {
    results.add(
      compactText(
        `Runbook candidate from ${input.source} ticket: ${base}. Resolution/procedure notes: ${input.resolution ?? input.description ?? "n/a"}. ${tags}`,
      ),
    );
  }

  const decisionSignal = hasAny(corpus, ["triage", "priority", "assigned", "owner", "escalat", "defer", "approved", "decision"]);
  if (decisionSignal) {
    results.add(
      compactText(
        `Decision memory from ${input.source} ticket: ${base}. Triage context ${status}, ${priority}, ${assignee}. ${tags}`,
      ),
    );
  }

  const policySignal = hasAny(corpus, ["sla", "compliance", "policy", "escalation", "security", "gdpr", "hipaa", "audit"]);
  if (policySignal) {
    results.add(
      compactText(
        `Policy memory from ${input.source} ticket: ${base}. SLA/compliance/escalation signal captured. ${tags}`,
      ),
    );
  }

  const preferenceSignal = hasAny(corpus, ["prefer", "preference", "usually", "always", "workflow", "template"]);
  if (preferenceSignal) {
    results.add(
      compactText(
        `Preference memory from ${input.source} ticket: ${base}. Team/user execution preference signal detected. ${tags}`,
      ),
    );
  }

  if (results.size === 0) {
    results.add(compactText(`Ticket memory from ${input.source}: ${base}. ${status}. ${priority}. ${assignee}. ${tags}`));
  }

  return Array.from(results);
}

