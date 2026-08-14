export type LinearMemoryMapInput = {
  issueId: string;
  identifier: string;
  title: string;
  description?: string;
  state?: string;
  stateType?: string;
  priorityLabel?: string;
  assignee?: string;
  team?: string;
  labels?: string[];
  updatedAt?: string;
  url?: string;
  commentBody?: string;
  commentAuthor?: string;
};

function compactText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function hasAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

function normalizedCorpus(input: LinearMemoryMapInput): string {
  return compactText(
    [
      input.identifier,
      input.title,
      input.description ?? "",
      input.commentBody ?? "",
      input.state ?? "",
      input.stateType ?? "",
      input.priorityLabel ?? "",
      input.assignee ?? "",
      input.team ?? "",
      (input.labels ?? []).join(" "),
    ].join(" ").toLowerCase(),
  );
}

function sourceTag(input: LinearMemoryMapInput): string {
  const comment = input.commentBody && input.commentAuthor ? ` comment_author=${input.commentAuthor}` : "";
  const url = input.url ? ` url=${input.url}` : "";
  return `[connector_source=linear issue=${input.identifier || input.issueId}${comment}${url}]`;
}

export function linearSourceRef(input: Pick<LinearMemoryMapInput, "issueId" | "identifier">): string {
  return `linear://issue/${encodeURIComponent(input.identifier || input.issueId)}`;
}

export function mapLinearToMemoryTexts(input: LinearMemoryMapInput): string[] {
  const results = new Set<string>();
  const corpus = normalizedCorpus(input);
  const tags = sourceTag(input);
  const issueRef = input.identifier || input.issueId;
  const status = input.state ? `status=${input.state}` : "status=unknown";
  const priority = input.priorityLabel ? `priority=${input.priorityLabel}` : "priority=unknown";
  const assignee = input.assignee ? `assignee=${input.assignee}` : "assignee=unassigned";
  const team = input.team ? `team=${input.team}` : "team=unknown";
  const base = compactText(
    input.commentBody
      ? `${input.title} — comment: ${input.commentBody}`
      : `${input.title}${input.description ? ` — ${input.description}` : ""}`,
  );

  const incidentSignal =
    hasAny(corpus, [
      "incident",
      "outage",
      "sev",
      "p0",
      "p1",
      "production down",
      "urgent",
      "rollback",
      "regression",
      "blocked release",
    ])
    || hasAny((input.labels ?? []).map((label) => label.toLowerCase()).join(" "), [
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
        `Incident memory from Linear ${issueRef}: ${base}. ${status}. ${priority}. ${assignee}. ${team}. ${tags}`,
      ),
    );
  }

  const decisionSignal = hasAny(corpus, [
    "decision",
    "decided",
    "approved",
    "agreed",
    "we will",
    "chose to",
    "going with",
    "defer",
    "triage",
    "priorit",
  ]);
  if (decisionSignal) {
    results.add(
      compactText(
        `Decision memory from Linear ${issueRef}: ${base}. Triage context ${status}, ${priority}, ${assignee}. ${tags}`,
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
    "dependency",
  ]);
  if (blockerSignal) {
    results.add(compactText(`Blocker from Linear ${issueRef}: ${base}. ${assignee}. ${tags}`));
  }

  const runbookSignal = hasAny(corpus, [
    "fix",
    "fixed by",
    "resolution",
    "resolved by",
    "workaround",
    "root cause",
    "rca",
    "playbook",
    "procedure",
    "mitigation",
  ]);
  if (runbookSignal) {
    results.add(compactText(`Runbook candidate from Linear ${issueRef}: ${base}. ${tags}`));
  }

  const nextActionSignal = hasAny(corpus, [
    "next action",
    "follow up",
    "follow-up",
    "handoff",
    "take over",
    "assigned",
    "owner",
    "ship",
  ]);
  if (nextActionSignal) {
    results.add(
      compactText(
        `Next action from Linear ${issueRef}: ${base}. ${status}. ${assignee}. ${team}. ${tags}`,
      ),
    );
  }

  if (results.size === 0) {
    results.add(
      compactText(
        `Linear issue ${issueRef}: ${base}. ${status}. ${priority}. ${assignee}. ${team}. ${tags}`,
      ),
    );
  }

  return Array.from(results);
}
