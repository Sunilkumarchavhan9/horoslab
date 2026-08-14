import { connectorUserFilter, normalizeOrgId } from "../auth/orgScope";
import { prisma } from "../storage/prismaClient";

const MAX_STORED_EXPORTS = 25;
const DEFAULT_FORMAT = "skills_markdown";
const DEFAULT_STATUS = "completed";

export type CompanyBrainExportStats = {
  activeMemoryCount: number;
  totalTimelineEvents: number;
  decisions: number;
  constraints: number;
  incidents: number;
  runbooks: number;
  openRisks: number;
};

export type CompanyBrainExportRecord = {
  id: string;
  userId: string;
  orgId?: string;
  workspace: string;
  generatedAt: string;
  format?: string;
  status?: string;
  stats: CompanyBrainExportStats;
  skillsMarkdown: string;
};

export type CompanyBrainExportSummary = {
  id: string;
  workspace: string;
  generatedAt: string;
  stats: CompanyBrainExportStats;
};

function parseDataJson(raw: string): {
  stats?: CompanyBrainExportStats;
  skillsMarkdown?: string;
} {
  try {
    const parsed = JSON.parse(raw) as {
      stats?: CompanyBrainExportStats;
      skillsMarkdown?: unknown;
    };
    return {
      stats: parsed.stats,
      skillsMarkdown: typeof parsed.skillsMarkdown === "string" ? parsed.skillsMarkdown : undefined,
    };
  } catch {
    return {};
  }
}

function rowToRecord(row: {
  id: string;
  userId: string;
  orgId: string | null;
  workspace: string;
  format: string;
  status: string;
  generatedAt: string;
  dataJson: string;
}): CompanyBrainExportRecord {
  const payload = parseDataJson(row.dataJson);
  return {
    id: row.id,
    userId: row.userId,
    ...(row.orgId ? { orgId: row.orgId } : {}),
    workspace: row.workspace,
    generatedAt: row.generatedAt,
    format: row.format,
    status: row.status,
    stats: payload.stats ?? {
      activeMemoryCount: 0,
      totalTimelineEvents: 0,
      decisions: 0,
      constraints: 0,
      incidents: 0,
      runbooks: 0,
      openRisks: 0,
    },
    skillsMarkdown: payload.skillsMarkdown ?? "",
  };
}

function recordToDataJson(record: CompanyBrainExportRecord): string {
  return JSON.stringify({
    stats: record.stats,
    skillsMarkdown: record.skillsMarkdown,
  });
}

function toSummary(record: CompanyBrainExportRecord): CompanyBrainExportSummary {
  return {
    id: record.id,
    workspace: record.workspace,
    generatedAt: record.generatedAt,
    stats: record.stats,
  };
}

async function appendPostgres(record: CompanyBrainExportRecord): Promise<void> {
  await prisma.companyBrainExport.create({
    data: {
      id: record.id,
      userId: record.userId,
      orgId: normalizeOrgId(record.orgId) ?? null,
      workspace: record.workspace,
      format: record.format ?? DEFAULT_FORMAT,
      status: record.status ?? DEFAULT_STATUS,
      generatedAt: record.generatedAt,
      dataJson: recordToDataJson(record),
    },
  });

  const scope = connectorUserFilter({ userId: record.userId, orgId: record.orgId });
  const excess = await prisma.companyBrainExport.findMany({
    where: scope,
    orderBy: { generatedAt: "desc" },
    skip: MAX_STORED_EXPORTS,
    select: { id: true },
  });
  if (excess.length > 0) {
    await prisma.companyBrainExport.deleteMany({
      where: { id: { in: excess.map((row) => row.id) } },
    });
  }
}

async function listPostgres(userId: string, orgId?: string): Promise<CompanyBrainExportSummary[]> {
  const rows = await prisma.companyBrainExport.findMany({
    where: connectorUserFilter({ userId, orgId }),
    orderBy: { generatedAt: "desc" },
    take: MAX_STORED_EXPORTS,
  });
  return rows.map((row) => toSummary(rowToRecord(row)));
}

export async function appendCompanyBrainExport(
  record: CompanyBrainExportRecord,
  orgId?: string,
): Promise<void> {
  const next: CompanyBrainExportRecord = {
    ...record,
    format: record.format ?? DEFAULT_FORMAT,
    status: record.status ?? DEFAULT_STATUS,
    orgId: normalizeOrgId(record.orgId) ?? normalizeOrgId(orgId),
  };

  await appendPostgres(next);
}

export async function listCompanyBrainExports(
  userId: string,
  orgId?: string,
): Promise<CompanyBrainExportSummary[]> {
  const scopedOrgId = normalizeOrgId(orgId);

  return listPostgres(userId, scopedOrgId);
}

export function getCompanyBrainExportStoreBackend(): "postgres" {
  return "postgres";
}

export function normalizeCompanyBrainExportRow(
  raw: Partial<CompanyBrainExportRecord> & { id?: string },
  fallbackUserId?: string,
): CompanyBrainExportRecord | null {
  if (!raw.id || typeof raw.id !== "string") return null;
  const userId =
    typeof raw.userId === "string" && raw.userId.trim().length > 0
      ? raw.userId.trim()
      : fallbackUserId?.trim();
  if (!userId) return null;
  if (!raw.workspace || typeof raw.workspace !== "string") return null;
  if (!raw.generatedAt || typeof raw.generatedAt !== "string") return null;
  if (!raw.stats || typeof raw.stats !== "object") return null;
  if (typeof raw.skillsMarkdown !== "string") return null;

  return {
    id: raw.id,
    userId,
    orgId: normalizeOrgId(raw.orgId),
    workspace: raw.workspace,
    generatedAt: raw.generatedAt,
    format: typeof raw.format === "string" ? raw.format : DEFAULT_FORMAT,
    status: typeof raw.status === "string" ? raw.status : DEFAULT_STATUS,
    stats: raw.stats as CompanyBrainExportStats,
    skillsMarkdown: raw.skillsMarkdown,
  };
}
