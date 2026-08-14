import { randomUUID } from "crypto";
import { resolveRequestOrgId } from "../auth/orgScope";
import { prisma } from "../storage/prismaClient";

export type ContinuityFeedbackKind = "resume" | "handoff" | "before_model" | "after_model";
export type ContinuityFeedbackRating = 1 | 2 | 3 | 4 | 5;

export type ContinuityFeedbackRecord = {
  id: string;
  userId: string;
  orgId: string | null;
  kind: ContinuityFeedbackKind;
  rating: ContinuityFeedbackRating;
  useful: boolean;
  requestId: string | null;
  project: string | null;
  agentId: string | null;
  missingContext: string[];
  wrongContext: string[];
  shouldRemember: string[];
  note: string | null;
  createdAt: string;
};

function clampText(value: string, maxLength: number): string {
  const trimmed = value.trim();
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength).trim()}...[TRUNCATED]` : trimmed;
}

function normalizeTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => clampText(item, 400))
    .filter((item) => item.length > 0)
    .slice(0, 12);
}

function parseTextArrayJson(value: string): string[] {
  try {
    return normalizeTextArray(JSON.parse(value) as unknown);
  } catch {
    return [];
  }
}

export function isContinuityFeedbackKind(value: unknown): value is ContinuityFeedbackKind {
  return value === "resume" || value === "handoff" || value === "before_model" || value === "after_model";
}

export function normalizeContinuityFeedbackRating(value: unknown): ContinuityFeedbackRating | null {
  const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(numeric)) return null;
  const rounded = Math.round(numeric);
  return rounded >= 1 && rounded <= 5 ? (rounded as ContinuityFeedbackRating) : null;
}

function toFeedbackRecord(row: {
  id: string;
  userId: string;
  orgId: string | null;
  kind: string;
  rating: number;
  useful: boolean;
  requestId: string | null;
  project: string | null;
  agentId: string | null;
  missingContextJson: string;
  wrongContextJson: string;
  shouldRememberJson: string;
  note: string | null;
  createdAt: string;
}): ContinuityFeedbackRecord {
  return {
    id: row.id,
    userId: row.userId,
    orgId: row.orgId,
    kind: isContinuityFeedbackKind(row.kind) ? row.kind : "resume",
    rating: normalizeContinuityFeedbackRating(row.rating) ?? 1,
    useful: row.useful,
    requestId: row.requestId,
    project: row.project,
    agentId: row.agentId,
    missingContext: parseTextArrayJson(row.missingContextJson),
    wrongContext: parseTextArrayJson(row.wrongContextJson),
    shouldRemember: parseTextArrayJson(row.shouldRememberJson),
    note: row.note,
    createdAt: row.createdAt,
  };
}

export async function appendContinuityFeedback(input: {
  userId: string;
  orgId?: string;
  kind: ContinuityFeedbackKind;
  rating: ContinuityFeedbackRating;
  useful?: boolean;
  requestId?: unknown;
  project?: unknown;
  agentId?: unknown;
  missingContext?: unknown;
  wrongContext?: unknown;
  shouldRemember?: unknown;
  note?: unknown;
}): Promise<ContinuityFeedbackRecord> {
  const orgId = resolveRequestOrgId(input.orgId) ?? null;
  const missingContext = normalizeTextArray(input.missingContext);
  const wrongContext = normalizeTextArray(input.wrongContext);
  const shouldRemember = normalizeTextArray(input.shouldRemember);

  const row = await prisma.continuityFeedback.create({
    data: {
      id: randomUUID(),
      userId: input.userId,
      orgId,
      kind: input.kind,
      rating: input.rating,
      useful: typeof input.useful === "boolean" ? input.useful : input.rating >= 4,
      requestId:
        typeof input.requestId === "string" && input.requestId.trim()
          ? clampText(input.requestId, 160)
          : null,
      project:
        typeof input.project === "string" && input.project.trim()
          ? clampText(input.project, 160)
          : null,
      agentId:
        typeof input.agentId === "string" && input.agentId.trim()
          ? clampText(input.agentId, 160)
          : null,
      missingContextJson: JSON.stringify(missingContext),
      wrongContextJson: JSON.stringify(wrongContext),
      shouldRememberJson: JSON.stringify(shouldRemember),
      note:
        typeof input.note === "string" && input.note.trim()
          ? clampText(input.note, 1000)
          : null,
      createdAt: new Date().toISOString(),
    },
  });

  return toFeedbackRecord(row);
}

export async function listContinuityFeedback(input: {
  userId: string;
  orgId?: string;
  kind?: ContinuityFeedbackKind;
  limit?: number;
}): Promise<ContinuityFeedbackRecord[]> {
  const orgId = resolveRequestOrgId(input.orgId);
  const limit = Math.min(Math.max(input.limit ?? 100, 1), 500);
  const rows = await prisma.continuityFeedback.findMany({
    where: {
      userId: input.userId,
      ...(orgId ? { orgId } : {}),
      ...(input.kind ? { kind: input.kind } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(toFeedbackRecord);
}

export async function getContinuityFeedbackSummary(input: {
  userId: string;
  orgId?: string;
}): Promise<{
  count: number;
  averageRating: number | null;
  usefulRatePercent: number | null;
  byKind: Record<ContinuityFeedbackKind, { count: number; averageRating: number | null }>;
}> {
  const items = await listContinuityFeedback({ ...input, limit: 500 });
  const byKind = {
    resume: { count: 0, averageRating: null as number | null },
    handoff: { count: 0, averageRating: null as number | null },
    before_model: { count: 0, averageRating: null as number | null },
    after_model: { count: 0, averageRating: null as number | null },
  };

  for (const kind of Object.keys(byKind) as ContinuityFeedbackKind[]) {
    const kindItems = items.filter((item) => item.kind === kind);
    byKind[kind] = {
      count: kindItems.length,
      averageRating:
        kindItems.length > 0
          ? Number((kindItems.reduce((sum, item) => sum + item.rating, 0) / kindItems.length).toFixed(2))
          : null,
    };
  }

  return {
    count: items.length,
    averageRating:
      items.length > 0
        ? Number((items.reduce((sum, item) => sum + item.rating, 0) / items.length).toFixed(2))
        : null,
    usefulRatePercent:
      items.length > 0
        ? Number(((items.filter((item) => item.useful).length / items.length) * 100).toFixed(1))
        : null,
    byKind,
  };
}
