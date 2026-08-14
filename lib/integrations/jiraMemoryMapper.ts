export type JiraMemoryMapInput = {
  issueId: string;
  issueKey: string;
  summary: string;
  description?: string;
  status?: string;
  priority?: string;
  assignee?: string;
  labels?: string[];
  resolution?: string;
  updatedAt?: string;
  url?: string;
  /** When mapping a comment, the comment body; issue fields still provide triage context. */
  commentBody?: string;
  commentAuthor?: string;
};

function compactText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function hasAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

function normalizedCorpus(input: JiraMemoryMapInput): string {
  const labelText = (input.labels ?? []).join(" ");
  return compactText(
    [
      input.summary,
      input.description ?? "",
      input.commentBody ?? "",
      input.status ?? "",
      input.priority ?? "",
      input.assignee ?? "",
      labelText,
      input.resolution ?? "",
    ].join(" ").toLowerCase(),
  );
}

function sourceRef(input: JiraMemoryMapInput, kind: "issue" | "comment"): string {
  const ref = input.issueKey.trim() || input.issueId.trim();
  const commentSuffix =
    kind === "comment" && input.commentAuthor
      ? ` comment_author=${input.commentAuthor.trim()}`
      : "";
  const url = input.url ? ` url=${input.url}` : "";
  return `[connector_source=jira issue=${ref}${commentSuffix}${url}]`;
}

/**
 * Maps Jira issues and comments into extraction-ready texts aligned with
 * memoryos.contract.v1 (incident, decision, blocker, handoff).
 */
export function mapJiraToMemoryTexts(input: JiraMemoryMapInput): string[] {
  const results = new Set<string>();
  const corpus = normalizedCorpus(input);
  const tags = sourceRef(input, input.commentBody ? "comment" : "issue");
  const issueRef = input.issueKey.trim() || input.issueId.trim();
  const status = input.status ? `status=${input.status}` : "status=unknown";
  const priority = input.priority ? `priority=${input.priority}` : "priority=unknown";
  const assignee = input.assignee ? `assignee=${input.assignee}` : "assignee=unassigned";
  const base = compactText(
    input.commentBody
      ? `${input.summary} — comment: ${input.commentBody}`
      : `${input.summary}${input.description ? ` — ${input.description}` : ""}`,
  );

  const incidentSignal =
    hasAny(corpus, [
      "incident",
      "outage",
      "sev",
      "p0",
      "p1",
      "production down",
      "on fire",
      "degraded",
      "rollback",
      "urgent",
    ])
    || hasAny((input.labels ?? []).map((l) => l.toLowerCase()).join(" "), [
      "incident",
      "outage",
      "sev",
      "p0",
      "p1",
      "bug",
    ]);
  if (incidentSignal) {
    results.add(
      compactText(
        `Incident memory from Jira ${issueRef}: ${base}. ${status}. ${priority}. ${assignee}. ${tags}`,
      ),
    );
  }

  const decisionSignal = hasAny(corpus, [
    "decided",
    "decision",
    "we will",
    "approved",
    "consensus",
    "agreed",
    "going with",
    "chose to",
    "triage",
    "priorit",
    "defer",
    "won't fix",
    "wont fix",
  ]);
  if (decisionSignal) {
    results.add(
      compactText(
        `Decision: ${base}. Jira triage on ${issueRef} (${status}, ${priority}). ${tags}`,
      ),
    );
  }

  const blockerSignal = hasAny(corpus, [
    "blocker",
    "blocked by",
    "blocking",
    "can't proceed",
    "cannot proceed",
    "waiting on",
    "depends on",
    "impediment",
  ]);
  if (blockerSignal) {
    results.add(
      compactText(
        `Blocker: ${base}. Jira ${issueRef} — ${assignee}. ${tags}`,
      ),
    );
  }

  const handoffSignal = hasAny(corpus, [
    "handoff",
    "hand off",
    "taking over",
    "fyi",
    "heads up",
    "context for",
    "next action",
    "follow up",
    "follow-up",
    "reassign",
  ]);
  if (handoffSignal) {
    results.add(
      compactText(
        `Next action: ${base}. Handoff/context from Jira ${issueRef}. ${tags}`,
      ),
    );
  }

  const runbookSignal = hasAny(corpus, [
    "resolution",
    "resolved by",
    "fix",
    "workaround",
    "root cause",
    "rca",
    "playbook",
    "procedure",
    "mitigation",
  ]);
  if (runbookSignal) {
    results.add(
      compactText(
        `Runbook: ${base}. Resolution/procedure notes on Jira ${issueRef}. ${tags}`,
      ),
    );
  }

  if (results.size === 0) {
    results.add(
      compactText(
        `Jira ${input.commentBody ? "comment" : "issue"} ${issueRef}: ${base}. ${status}. ${priority}. ${assignee}. ${tags}`,
      ),
    );
  }

  return Array.from(results);
}
