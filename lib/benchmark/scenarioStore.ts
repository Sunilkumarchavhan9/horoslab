import { randomUUID } from "crypto";
import { prisma } from "../storage/prismaClient";

export type BenchmarkScenario = {
  id: string;
  name: string;
  mode: "local" | "preview" | "production";
  caseIds: string[];
  createdAt: string;
  updatedAt: string;
};

function parseCaseIds(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function toScenario(row: {
  id: string;
  name: string;
  mode: string;
  caseIdsJson: string;
  createdAt: string;
  updatedAt: string;
}): BenchmarkScenario {
  return {
    id: row.id,
    name: row.name,
    mode: row.mode === "preview" || row.mode === "production" ? row.mode : "local",
    caseIds: parseCaseIds(row.caseIdsJson),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listBenchmarkScenarios(): Promise<BenchmarkScenario[]> {
  const rows = await prisma.benchmarkScenario.findMany({ orderBy: { updatedAt: "desc" } });
  return rows.map(toScenario);
}

export async function getBenchmarkScenario(id: string): Promise<BenchmarkScenario | null> {
  const row = await prisma.benchmarkScenario.findUnique({ where: { id } });
  return row ? toScenario(row) : null;
}

export async function upsertBenchmarkScenario(input: {
  id?: string;
  name: string;
  mode: "local" | "preview" | "production";
  caseIds: string[];
}): Promise<BenchmarkScenario> {
  const now = new Date().toISOString();
  const id = input.id ?? `scenario_${randomUUID().slice(0, 8)}`;
  const existing = await prisma.benchmarkScenario.findUnique({ where: { id } });
  const row = await prisma.benchmarkScenario.upsert({
    where: { id },
    create: {
      id,
      name: input.name,
      mode: input.mode,
      caseIdsJson: JSON.stringify(input.caseIds),
      createdAt: now,
      updatedAt: now,
    },
    update: {
      name: input.name,
      mode: input.mode,
      caseIdsJson: JSON.stringify(input.caseIds),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    },
  });
  return toScenario(row);
}
