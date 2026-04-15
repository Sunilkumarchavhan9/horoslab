import type { Memory } from "./types";

export type LifecycleTransition =
  | { status: "none" }
  | { status: "stale" | "contradicted"; reason: string };

type PreferencePair = {
  preferred: string;
  over: string;
};

type PreferenceUsage = {
  framework: string;
  stack: string;
};

type ProjectState = {
  subject: string;
  phase: "in_progress" | "shipped";
};

type BugState = {
  subject: string;
  phase: "active" | "investigated" | "resolved";
};

function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w\s+#.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parsePreferencePair(content: string): PreferencePair | null {
  const match = content.match(/\buser\s+prefers\s+(.+?)\s+over\s+(.+)$/i);
  if (!match) {
    return null;
  }

  const preferred = normalizeToken(match[1] ?? "");
  const over = normalizeToken(match[2] ?? "");
  if (!preferred || !over) {
    return null;
  }

  return { preferred, over };
}

function parsePreferenceUsage(content: string): PreferenceUsage | null {
  const match = content.match(/\buser\s+uses\s+(.+?)\s+with\s+(.+)$/i);
  if (!match) {
    return null;
  }

  const framework = normalizeToken(match[1] ?? "");
  const stack = normalizeToken(match[2] ?? "");
  if (!framework || !stack) {
    return null;
  }

  return { framework, stack };
}

function parseProjectState(content: string): ProjectState | null {
  const inProgressMatch = content.match(
    /\buser\s+is\s+(?:building|working on)\s+(.+)$/i,
  );
  if (inProgressMatch) {
    const subject = normalizeToken(inProgressMatch[1] ?? "");
    if (subject) {
      return { subject, phase: "in_progress" };
    }
  }

  const shippedMatch = content.match(/\buser\s+(?:shipped|deployed)\s+(.+)$/i);
  if (shippedMatch) {
    const subject = normalizeToken(shippedMatch[1] ?? "");
    if (subject) {
      return { subject, phase: "shipped" };
    }
  }

  return null;
}

function parseBugState(content: string): BugState | null {
  const activeMatch = content.match(/\buser\s+is\s+(?:debugging|fixing)\s+(.+)$/i);
  if (activeMatch) {
    const subject = normalizeToken(activeMatch[1] ?? "");
    if (subject) {
      return { subject, phase: "active" };
    }
  }

  const investigatedMatch = content.match(/\buser\s+debugged\s+(.+)$/i);
  if (investigatedMatch) {
    const subject = normalizeToken(investigatedMatch[1] ?? "");
    if (subject) {
      return { subject, phase: "investigated" };
    }
  }

  const resolvedMatch = content.match(/\buser\s+(?:fixed|solved)\s+(.+)$/i);
  if (resolvedMatch) {
    const subject = normalizeToken(resolvedMatch[1] ?? "");
    if (subject) {
      return { subject, phase: "resolved" };
    }
  }

  return null;
}

function tokenizeSubject(subject: string): string[] {
  return normalizeToken(subject)
    .split(" ")
    .filter((token) => token.length > 2);
}

function subjectsReferToSameThing(a: string, b: string): boolean {
  if (a === b) {
    return true;
  }

  if (a.includes(b) || b.includes(a)) {
    return true;
  }

  const aTokens = tokenizeSubject(a);
  const bTokens = new Set(tokenizeSubject(b));
  const overlap = aTokens.filter((token) => bTokens.has(token)).length;
  const minimumOverlap = Math.min(2, aTokens.length, bTokens.size);
  return overlap >= minimumOverlap;
}

function resolvePreferenceTransition(
  existing: Memory,
  incoming: Memory,
): LifecycleTransition {
  if (existing.type !== "preference" || incoming.type !== "preference") {
    return { status: "none" };
  }

  const existingPair = parsePreferencePair(existing.content);
  const incomingPair = parsePreferencePair(incoming.content);

  if (
    existingPair &&
    incomingPair &&
    existingPair.preferred === incomingPair.over &&
    existingPair.over === incomingPair.preferred
  ) {
    return {
      status: "contradicted",
      reason: `Contradicted by new preference: "${incoming.content}"`,
    };
  }

  if (
    existingPair &&
    incomingPair &&
    existingPair.over === incomingPair.over &&
    existingPair.preferred !== incomingPair.preferred
  ) {
    return {
      status: "stale",
      reason: `Superseded preference by newer signal: "${incoming.content}"`,
    };
  }

  const existingUsage = parsePreferenceUsage(existing.content);
  const incomingUsage = parsePreferenceUsage(incoming.content);
  if (!existingUsage || !incomingUsage) {
    return { status: "none" };
  }

  if (
    existingUsage.framework === incomingUsage.framework &&
    existingUsage.stack !== incomingUsage.stack
  ) {
    return {
      status: "stale",
      reason: `Superseded stack choice for ${existingUsage.framework}: "${incoming.content}"`,
    };
  }

  if (
    existingUsage.stack === incomingUsage.stack &&
    existingUsage.framework !== incomingUsage.framework
  ) {
    return {
      status: "stale",
      reason: `Superseded framework choice for ${existingUsage.stack}: "${incoming.content}"`,
    };
  }

  return { status: "none" };
}

function resolveProjectTransition(
  existing: Memory,
  incoming: Memory,
): LifecycleTransition {
  if (existing.type !== "project" || incoming.type !== "project") {
    return { status: "none" };
  }

  const existingState = parseProjectState(existing.content);
  const incomingState = parseProjectState(incoming.content);
  if (!existingState || !incomingState) {
    return { status: "none" };
  }

  if (!subjectsReferToSameThing(existingState.subject, incomingState.subject)) {
    return { status: "none" };
  }

  if (
    existingState.phase === "in_progress" &&
    incomingState.phase === "shipped"
  ) {
    return {
      status: "stale",
      reason: `Superseded project state by shipped milestone: "${incoming.content}"`,
    };
  }

  if (
    existingState.phase === "shipped" &&
    incomingState.phase === "in_progress"
  ) {
    return {
      status: "contradicted",
      reason: `Contradicted by reopened project state: "${incoming.content}"`,
    };
  }

  return { status: "none" };
}

function resolveBugTransition(
  existing: Memory,
  incoming: Memory,
): LifecycleTransition {
  if (existing.type !== "episodic" || incoming.type !== "episodic") {
    return { status: "none" };
  }

  const existingState = parseBugState(existing.content);
  const incomingState = parseBugState(incoming.content);
  if (!existingState || !incomingState) {
    return { status: "none" };
  }

  if (!subjectsReferToSameThing(existingState.subject, incomingState.subject)) {
    return { status: "none" };
  }

  if (
    (existingState.phase === "active" ||
      existingState.phase === "investigated") &&
    incomingState.phase === "resolved"
  ) {
    return {
      status: "stale",
      reason: `Superseded bug state by resolved issue: "${incoming.content}"`,
    };
  }

  if (
    existingState.phase === "resolved" &&
    incomingState.phase === "active"
  ) {
    return {
      status: "contradicted",
      reason: `Contradicted by reopened bug state: "${incoming.content}"`,
    };
  }

  return { status: "none" };
}

export function resolveLifecycleTransition(
  existing: Memory,
  incoming: Memory,
): LifecycleTransition {
  if (existing.userId !== incoming.userId) {
    return { status: "none" };
  }

  if (existing.type !== "preference" || incoming.type !== "preference") {
    return { status: "none" };
  }

  if (existing.status !== "active") {
    return { status: "none" };
  }

  const preferenceTransition = resolvePreferenceTransition(existing, incoming);
  if (preferenceTransition.status !== "none") {
    return preferenceTransition;
  }

  const projectTransition = resolveProjectTransition(existing, incoming);
  if (projectTransition.status !== "none") {
    return projectTransition;
  }

  const bugTransition = resolveBugTransition(existing, incoming);
  if (bugTransition.status !== "none") {
    return bugTransition;
  }

  return { status: "none" };
}
