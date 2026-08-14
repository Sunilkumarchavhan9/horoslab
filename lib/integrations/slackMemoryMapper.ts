export type SlackMemoryMapInput = {
  channelId: string;
  channelName?: string;
  messageTs: string;
  threadTs?: string;
  userId?: string;
  text: string;
  permalink?: string;
};

function compactText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function hasAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

function normalizedCorpus(input: SlackMemoryMapInput): string {
  return compactText(
    [input.text, input.channelName ?? "", input.threadTs ? "thread" : ""].join(" ").toLowerCase(),
  );
}

function sourceRef(input: SlackMemoryMapInput): string {
  const channel = input.channelName?.trim() || input.channelId.trim();
  const thread = input.threadTs && input.threadTs !== input.messageTs ? ` thread_ts=${input.threadTs}` : "";
  const url = input.permalink ? ` url=${input.permalink}` : "";
  return `[connector_source=slack channel=${channel} message_ts=${input.messageTs}${thread}${url}]`;
}

function channelLabel(input: SlackMemoryMapInput): string {
  return input.channelName?.trim() ? `#${input.channelName.trim()}` : `channel:${input.channelId}`;
}

/**
 * Maps a Slack channel message into one or more extraction-ready texts with
 * continuity-relevant cues and stable source metadata for memoryos.contract.v1.
 */
export function mapSlackToMemoryTexts(input: SlackMemoryMapInput): string[] {
  const results = new Set<string>();
  const corpus = normalizedCorpus(input);
  const tags = sourceRef(input);
  const channel = channelLabel(input);
  const author = input.userId?.trim() ? `author=${input.userId.trim()}` : "author=unknown";
  const threadNote =
    input.threadTs && input.threadTs !== input.messageTs
      ? `thread_ts=${input.threadTs}`
      : "channel_message";
  const base = compactText(input.text);

  const incidentSignal = hasAny(corpus, [
    "incident",
    "outage",
    "sev",
    "p0",
    "p1",
    "production down",
    "on fire",
    "degraded",
    "rollback",
  ]);
  if (incidentSignal) {
    results.add(
      compactText(
        `Incident memory from Slack ${channel}: ${base}. ${author}. ${threadNote}. ${tags}`,
      ),
    );
  }

  const runbookSignal = hasAny(corpus, [
    "runbook",
    "playbook",
    "procedure",
    "workaround",
    "steps to",
    "mitigation",
    "fix applied",
    "resolved by",
  ]);
  if (runbookSignal) {
    results.add(
      compactText(
        `Runbook: ${base}. Captured from Slack ${channel} (${threadNote}). ${tags}`,
      ),
    );
  }

  const decisionSignal = hasAny(corpus, [
    "decided",
    "decision",
    "we will",
    "ship",
    "approved",
    "consensus",
    "agreed",
    "going with",
    "chose to",
  ]);
  if (decisionSignal) {
    results.add(
      compactText(
        `Decision: ${base}. Team alignment in Slack ${channel}. ${author}. ${tags}`,
      ),
    );
  }

  const blockerSignal = hasAny(corpus, ["blocker", "blocked by", "blocking", "can't proceed", "waiting on"]);
  if (blockerSignal) {
    results.add(
      compactText(
        `Blocker: ${base}. Slack ${channel} thread context (${threadNote}). ${tags}`,
      ),
    );
  }

  const bugSignal = hasAny(corpus, ["bug", "regression", "broken", "failing", "error in prod"]);
  if (bugSignal) {
    results.add(
      compactText(
        `Bug: ${base}. Reported in Slack ${channel}. ${author}. ${tags}`,
      ),
    );
  }

  const policySignal = hasAny(corpus, ["policy", "compliance", "sla", "security review", "must not", "required to"]);
  if (policySignal) {
    results.add(
      compactText(
        `Policy: ${base}. Governance signal from Slack ${channel}. ${tags}`,
      ),
    );
  }

  const handoffSignal = hasAny(corpus, ["handoff", "hand off", "taking over", "fyi", "heads up", "context for"]);
  if (handoffSignal) {
    results.add(
      compactText(
        `Next action: ${base}. Handoff/context note from Slack ${channel}. ${tags}`,
      ),
    );
  }

  if (results.size === 0) {
    results.add(
      compactText(
        `Slack message in ${channel}: ${base}. ${author}. ${threadNote}. ${tags}`,
      ),
    );
  }

  return Array.from(results);
}
