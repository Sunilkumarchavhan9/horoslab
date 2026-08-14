import type { Memory, MemoryCandidate } from "./types";

const CONNECTOR_SOURCE_PATTERN = /\[connector_source=[^\]]+\]/;
const FILE_PATH_PATTERN = /(?:^|[\s"'`(])((?:[\w.-]+\/)+[\w.-]+\.\w{1,8})(?:[\s"'`),]|$)/g;

export function extractConnectorSourceRef(text: string): string | null {
  const match = text.match(CONNECTOR_SOURCE_PATTERN);
  if (!match?.[0]) return null;
  return match[0].replace(/^\[|\]$/g, "");
}

export function extractFilePathsFromText(text: string): string[] {
  const found: string[] = [];
  for (const match of text.matchAll(new RegExp(FILE_PATH_PATTERN.source, "g"))) {
    const path = match[1]?.trim();
    if (path && !found.includes(path)) {
      found.push(path);
    }
  }
  return found;
}

export function resolveMemorySourceRef(memory: Pick<Memory, "sourceRef" | "content" | "summary">): string | null {
  if (memory.sourceRef?.trim()) {
    return memory.sourceRef.trim();
  }
  return extractConnectorSourceRef(`${memory.summary ?? ""} ${memory.content ?? ""}`);
}

export function resolveMemorySourceFiles(
  memory: Pick<Memory, "files" | "content" | "summary" | "contractCategory">,
): string[] {
  if (Array.isArray(memory.files) && memory.files.length > 0) {
    return memory.files.filter((file): file is string => typeof file === "string" && file.trim().length > 0);
  }
  if (memory.contractCategory === "risky_file") {
    return extractFilePathsFromText(`${memory.summary ?? ""} ${memory.content ?? ""}`);
  }
  return [];
}

export function withSourceMetadata<T extends MemoryCandidate | Memory>(candidate: T): T {
  const corpus = `${candidate.summary ?? ""} ${candidate.content ?? ""}`;
  const sourceRef = candidate.sourceRef?.trim() || extractConnectorSourceRef(corpus) || undefined;
  const files =
    candidate.files && candidate.files.length > 0
      ? candidate.files
      : candidate.contractCategory === "risky_file"
        ? extractFilePathsFromText(corpus)
        : undefined;
  return {
    ...candidate,
    ...(sourceRef ? { sourceRef } : {}),
    ...(files && files.length > 0 ? { files } : {}),
  };
}
