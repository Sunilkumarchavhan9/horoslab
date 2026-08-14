import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { extractMemory } from "../memory/extractMemory";
import { upsertRecentMemory } from "../memory/recentMemoryStore";
import type { CompanyBrainMemoryType, MemoryContractCategory } from "../memory/types";

export type EngineeringSignalConnectorType =
  | "ide_chats"
  | "cursor_chats"
  | "vs_code_chats"
  | "codex_chats"
  | "chatgpt_chats"
  | "windsurf_chats"
  | "devin_chats"
  | "ci_cd_logs"
  | "deployment_errors";

export interface EngineeringSignalFilesSyncOptions {
  userId: string;
  type: EngineeringSignalConnectorType;
  rootPath?: string;
  recentItemKeys?: string[];
}

type EngineeringSignalProfile = {
  defaultRoot: string;
  label: string;
  sourceType: string;
  sourceScheme: string;
  summaryName: string;
  contractCategory: MemoryContractCategory;
  companyBrainType: CompanyBrainMemoryType;
  importanceScore: number;
  confidence: number;
};

export type EngineeringSignalMemorySourceDetails = {
  sourceRef: string;
  traceProof: {
    sourceType: string;
    sourceRef: string;
    evidence: string[];
    confidence: number;
    capturedAt: string;
  };
  developerSignals: {
    projectArea: string[];
    goal?: string[];
    bugType?: string[];
  };
};

const PROFILES: Record<EngineeringSignalConnectorType, EngineeringSignalProfile> = {
  ide_chats: {
    defaultRoot: path.join(".memoryostm", "imports", "ide-chats"),
    label: "IDE Chat",
    sourceType: "ide_chat",
    sourceScheme: "ide-chat",
    summaryName: "IDE chat",
    contractCategory: "previous_attempt",
    companyBrainType: "agent_action",
    importanceScore: 0.78,
    confidence: 0.88,
  },
  cursor_chats: {
    defaultRoot: path.join(".memoryostm", "imports", "cursor-chats"),
    label: "Cursor Chat",
    sourceType: "cursor_chat",
    sourceScheme: "cursor-chat",
    summaryName: "Cursor chat",
    contractCategory: "previous_attempt",
    companyBrainType: "agent_action",
    importanceScore: 0.79,
    confidence: 0.89,
  },
  vs_code_chats: {
    defaultRoot: path.join(".memoryostm", "imports", "vs-code-chats"),
    label: "VS Code Chat",
    sourceType: "vs_code_chat",
    sourceScheme: "vs-code-chat",
    summaryName: "VS Code chat",
    contractCategory: "previous_attempt",
    companyBrainType: "agent_action",
    importanceScore: 0.78,
    confidence: 0.88,
  },
  codex_chats: {
    defaultRoot: path.join(".memoryostm", "imports", "codex-chats"),
    label: "Codex Chat",
    sourceType: "codex_chat",
    sourceScheme: "codex-chat",
    summaryName: "Codex chat",
    contractCategory: "previous_attempt",
    companyBrainType: "agent_action",
    importanceScore: 0.8,
    confidence: 0.9,
  },
  chatgpt_chats: {
    defaultRoot: path.join(".memoryostm", "imports", "chatgpt-chats"),
    label: "ChatGPT Chat",
    sourceType: "chatgpt_chat",
    sourceScheme: "chatgpt-chat",
    summaryName: "ChatGPT chat",
    contractCategory: "previous_attempt",
    companyBrainType: "agent_action",
    importanceScore: 0.78,
    confidence: 0.88,
  },
  windsurf_chats: {
    defaultRoot: path.join(".memoryostm", "imports", "windsurf-chats"),
    label: "Windsurf Chat",
    sourceType: "windsurf_chat",
    sourceScheme: "windsurf-chat",
    summaryName: "Windsurf chat",
    contractCategory: "previous_attempt",
    companyBrainType: "agent_action",
    importanceScore: 0.79,
    confidence: 0.89,
  },
  devin_chats: {
    defaultRoot: path.join(".memoryostm", "imports", "devin-chats"),
    label: "Devin Chat",
    sourceType: "devin_chat",
    sourceScheme: "devin-chat",
    summaryName: "Devin chat",
    contractCategory: "previous_attempt",
    companyBrainType: "agent_action",
    importanceScore: 0.8,
    confidence: 0.9,
  },
  ci_cd_logs: {
    defaultRoot: path.join(".memoryostm", "imports", "ci-cd-logs"),
    label: "CI/CD Log",
    sourceType: "ci_cd_log",
    sourceScheme: "ci-cd",
    summaryName: "CI/CD log",
    contractCategory: "incident",
    companyBrainType: "test",
    importanceScore: 0.82,
    confidence: 0.9,
  },
  deployment_errors: {
    defaultRoot: path.join(".memoryostm", "imports", "deployment-errors"),
    label: "Deployment Error",
    sourceType: "deployment_error",
    sourceScheme: "deployment-error",
    summaryName: "deployment error",
    contractCategory: "bug",
    companyBrainType: "incident",
    importanceScore: 0.84,
    confidence: 0.9,
  },
};

function safeReadText(filePath: string): string {
  try {
    return readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function pickFiles(rootPath: string): string[] {
  const allowedExtensions = new Set([
    ".md",
    ".mdx",
    ".txt",
    ".json",
    ".jsonl",
    ".yaml",
    ".yml",
    ".log",
    ".out",
  ]);
  const ignoredDirs = new Set(["node_modules", ".next", "dist", "build", ".git", "coverage", ".turbo", ".cache"]);
  const results: string[] = [];
  const stack = [rootPath];

  while (stack.length > 0 && results.length < 150) {
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
      if (results.length >= 150) break;
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!ignoredDirs.has(entry.name)) stack.push(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!allowedExtensions.has(path.extname(entry.name).toLowerCase())) continue;
      try {
        const stats = statSync(fullPath);
        if (stats.size > 0 && stats.size <= 3_000_000) results.push(fullPath);
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

function profileFor(type: EngineeringSignalConnectorType): EngineeringSignalProfile {
  return PROFILES[type];
}

export function isEngineeringSignalConnectorType(value: string): value is EngineeringSignalConnectorType {
  return (
    value === "ide_chats" ||
    value === "cursor_chats" ||
    value === "vs_code_chats" ||
    value === "codex_chats" ||
    value === "chatgpt_chats" ||
    value === "windsurf_chats" ||
    value === "devin_chats" ||
    value === "ci_cd_logs" ||
    value === "deployment_errors"
  );
}

export function defaultEngineeringSignalRoot(type: EngineeringSignalConnectorType): string {
  return path.resolve(profileFor(type).defaultRoot);
}

export function buildEngineeringSignalMemorySourceDetails(input: {
  type: EngineeringSignalConnectorType;
  relativePath: string;
  absolutePath: string;
  capturedAt?: string;
}): EngineeringSignalMemorySourceDetails {
  const profile = profileFor(input.type);
  const capturedAt = input.capturedAt ?? new Date().toISOString();
  const normalizedPath = input.relativePath.replace(/\\/g, "/");
  const sourceRef = `${profile.sourceScheme}://${encodeURI(normalizedPath)}`;
  return {
    sourceRef,
    traceProof: {
      sourceType: profile.sourceType,
      sourceRef,
      evidence: [`${profile.label}: ${normalizedPath}`, input.absolutePath],
      confidence: profile.confidence,
      capturedAt,
    },
      developerSignals: {
        projectArea: [normalizedPath],
        goal:
        input.type === "ide_chats" ||
        input.type === "cursor_chats" ||
        input.type === "vs_code_chats" ||
        input.type === "codex_chats" ||
        input.type === "chatgpt_chats" ||
        input.type === "windsurf_chats" ||
        input.type === "devin_chats"
          ? ["agent handoff", "coding context"]
          : input.type === "ci_cd_logs"
            ? ["test history", "release pipeline"]
            : ["incident evidence", "deployment failure"],
      bugType: input.type === "deployment_errors" ? ["runtime error", "deployment regression"] : undefined,
    },
  };
}

export const EngineeringSignalFilesClient = {
  async sync(options: EngineeringSignalFilesSyncOptions) {
    const profile = profileFor(options.type);
    const rootPath = options.rootPath && options.rootPath.trim().length > 0
      ? path.resolve(options.rootPath)
      : defaultEngineeringSignalRoot(options.type);

    if (!existsSync(rootPath)) {
      throw new Error(`${profile.summaryName} import root does not exist: ${rootPath}`);
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

      const compact = text.slice(0, 7000);
      const relativePath = path.relative(rootPath, filePath).replace(/\\/g, "/");
      const dedupeKey = `${options.type}:${relativePath}`;
      if (seen.has(dedupeKey)) continue;

      const sourceDetails = buildEngineeringSignalMemorySourceDetails({
        type: options.type,
        relativePath,
        absolutePath: filePath,
        capturedAt: now,
      });
      const content = `${profile.label} ${relativePath}\n${compact}`;

      await upsertRecentMemory({
        id: randomUUID(),
        userId: options.userId,
        type: "project",
        content,
        summary: `${profile.summaryName} ${relativePath} imported as Phase 1 engineering continuity signal.`,
        source: "import",
        status: "active",
        createdAt: now,
        updatedAt: now,
        importanceScore: profile.importanceScore,
        confidence: profile.confidence,
        evidenceCount: sourceDetails.traceProof.evidence.length,
        contractVersion: "memoryos.contract.v1",
        contractCategory: profile.contractCategory,
        companyBrainType: profile.companyBrainType,
        developerSignals: sourceDetails.developerSignals,
        sourceRef: sourceDetails.sourceRef,
        traceProof: sourceDetails.traceProof,
      });
      extractedCount += 1;
      incrementContractCount(contractCounts, profile.contractCategory);

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
          importanceScore: profile.importanceScore,
          confidence: profile.confidence,
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
