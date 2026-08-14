import { randomUUID } from "crypto";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import {
  defaultEngineeringSignalRoot,
  type EngineeringSignalConnectorType,
} from "./engineeringSignalFiles";

export type EngineeringSignalExportUpload = {
  rootPath?: string;
  type: EngineeringSignalConnectorType;
  filename: string;
  content: string;
  uploadedAt?: string;
};

export type EngineeringSignalExportUploadResult = {
  rootPath: string;
  absolutePath: string;
  relativePath: string;
  sizeBytes: number;
};

const ALLOWED_UPLOAD_EXTENSIONS = new Set([
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
const MAX_UPLOAD_BYTES = Math.max(
  10_000,
  Number(process.env.ENGINEERING_SIGNAL_EXPORT_UPLOAD_MAX_BYTES ?? 1_000_000),
);

export function sanitizeEngineeringSignalUploadFilename(filename: string): string {
  const base = path.basename(filename || "export.txt");
  const parsed = path.parse(base);
  const extension = ALLOWED_UPLOAD_EXTENSIONS.has(parsed.ext.toLowerCase())
    ? parsed.ext.toLowerCase()
    : ".txt";
  const name = (parsed.name || "export")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "export";
  return `${name}${extension}`;
}

export function writeEngineeringSignalExportUpload(
  input: EngineeringSignalExportUpload,
): EngineeringSignalExportUploadResult {
  const sizeBytes = Buffer.byteLength(input.content, "utf8");
  if (sizeBytes <= 0) {
    throw new Error("Export upload is empty.");
  }
  if (sizeBytes > MAX_UPLOAD_BYTES) {
    throw new Error(`Export upload is too large. Limit is ${MAX_UPLOAD_BYTES} bytes.`);
  }

  const rootPath = input.rootPath && input.rootPath.trim().length > 0
    ? path.resolve(input.rootPath)
    : defaultEngineeringSignalRoot(input.type);
  const uploadedAt = input.uploadedAt ?? new Date().toISOString();
  const datePrefix = uploadedAt.slice(0, 10);
  const safeName = sanitizeEngineeringSignalUploadFilename(input.filename);
  const relativePath = `${datePrefix}-${randomUUID().slice(0, 8)}-${safeName}`;
  const absolutePath = path.join(rootPath, relativePath);

  mkdirSync(rootPath, { recursive: true });
  writeFileSync(absolutePath, input.content, "utf8");

  return {
    rootPath,
    absolutePath,
    relativePath,
    sizeBytes,
  };
}
