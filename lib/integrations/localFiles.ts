import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import path from "path";
import { extractMemory } from "../memory/extractMemory";
import { upsertRecentMemory } from "../memory/recentMemoryStore";
import { randomUUID } from "crypto";

export interface LocalFilesSyncOptions {
  userId: string;
  rootPath?: string;
  recentItemKeys?: string[];
}

export type LocalFileMemorySourceDetails = {
  sourceRef: string;
  traceProof: {
    sourceType: "docs";
    sourceRef: string;
    evidence: string[];
    confidence: number;
    capturedAt: string;
  };
  developerSignals: {
    projectArea: string[];
  };
};

export function buildLocalFileMemorySourceDetails(input: {
  relativePath: string;
  absolutePath: string;
  capturedAt?: string;
}): LocalFileMemorySourceDetails {
  const capturedAt = input.capturedAt ?? new Date().toISOString();
  const normalizedPath = input.relativePath.replace(/\\/g, "/");
  const sourceRef = `docs://${encodeURI(normalizedPath)}`;
  return {
    sourceRef,
    traceProof: {
      sourceType: "docs",
      sourceRef,
      evidence: [`Document: ${normalizedPath}`, input.absolutePath],
      confidence: 0.9,
      capturedAt,
    },
    developerSignals: {
      projectArea: [normalizedPath],
    },
  };
}

function safeReadText(filePath: string): string {
  try {
    return readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function pickFiles(rootPath: string): string[] {
  const allowedExtensions = new Set([".md", ".mdx", ".txt", ".json", ".yaml", ".yml"]);
  const ignoredDirs = new Set(["node_modules", ".next", "dist", "build", ".git", "coverage", ".turbo", ".cache"]);
  const results: string[] = [];
  const stack = [rootPath];

  while (stack.length > 0 && results.length < 120) {
    const current = stack.pop();
    if (!current) break;

    let entries: Array<{ name: string; isDirectory: () => boolean; isFile: () => boolean }>;
    try {
      entries = readdirSync(current, { withFileTypes: true }) as unknown as Array<{
        name: string;
        isDirectory: () => boolean;
        isFile: () => boolean;
      }>;
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (results.length >= 120) break;
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!ignoredDirs.has(entry.name)) {
          stack.push(fullPath);
        }
        continue;
      }
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (!allowedExtensions.has(ext)) continue;
      try {
        const stats = statSync(fullPath);
        if (stats.size > 0 && stats.size <= 2_000_000) {
          results.push(fullPath);
        }
      } catch {
        // ignore unreadable file
      }
    }
  }

  return results;
}

function incrementContractCount(counts: Record<string, number>, category?: string): void {
  if (!category) return;
  counts[category] = (counts[category] ?? 0) + 1;
}

export const LocalFilesClient = {
  async sync(options: LocalFilesSyncOptions) {
    const rootPath = options.rootPath && options.rootPath.trim().length > 0
      ? path.resolve(options.rootPath)
      : process.cwd();

    if (!existsSync(rootPath)) {
      throw new Error(`Local files root does not exist: ${rootPath}`);
    }

    const files = pickFiles(rootPath);
    const seen = new Set(options.recentItemKeys ?? []);
    const dedupeKeys: string[] = [];
    const contractCounts: Record<string, number> = {};
    let extractedCount = 0;
    const now = new Date().toISOString();

    for (const filePath of files) {
      const text = safeReadText(filePath);
      if (!text.trim()) continue;
      const compact = text.slice(0, 6000);
      const relativePath = path.relative(rootPath, filePath).replace(/\\/g, "/");
      const dedupeKey = `local:${relativePath}`;
      if (seen.has(dedupeKey)) continue;
      const sourceDetails = buildLocalFileMemorySourceDetails({
        relativePath,
        absolutePath: filePath,
        capturedAt: now,
      });
      const content = `Local File ${relativePath}\n${compact}`;
      await upsertRecentMemory({
        id: randomUUID(),
        userId: options.userId,
        type: "project",
        content,
        summary: `Document ${relativePath} imported as a company knowledge source.`,
        source: "import",
        status: "active",
        createdAt: now,
        updatedAt: now,
        importanceScore: 0.76,
        confidence: 0.9,
        evidenceCount: sourceDetails.traceProof.evidence.length,
        contractVersion: "memoryos.contract.v1",
        contractCategory: "architecture_note",
        developerSignals: sourceDetails.developerSignals,
        sourceRef: sourceDetails.sourceRef,
        traceProof: sourceDetails.traceProof,
      });
      extractedCount += 1;
      incrementContractCount(contractCounts, "architecture_note");

      const candidates = extractMemory({
        userId: options.userId,
        message: content,
      });

      for (const candidate of candidates) {
        const sourceRef = candidate.sourceRef ?? sourceDetails.sourceRef;
        await upsertRecentMemory({
          ...candidate,
          id: randomUUID(),
          source: "import",
          status: "active",
          createdAt: now,
          updatedAt: now,
          importanceScore: 0.82,
          confidence: 0.9,
          evidenceCount: 1,
          developerSignals: {
            ...candidate.developerSignals,
            projectArea: Array.from(
              new Set([
                ...(candidate.developerSignals?.projectArea ?? []),
                ...sourceDetails.developerSignals.projectArea,
              ]),
            ),
          },
          sourceRef,
          traceProof: {
            ...sourceDetails.traceProof,
            sourceRef,
          },
        });
        extractedCount += 1;
        incrementContractCount(contractCounts, candidate.contractCategory);
      }
      dedupeKeys.push(dedupeKey);
    }

    return {
      success: true,
      extractedCount,
      dedupeKeys,
      contractCounts,
      scannedFiles: files.length,
      rootPath,
    };
  },
};
