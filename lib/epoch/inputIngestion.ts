import { createHash } from "node:crypto";
import type { EpochInputEnvelope, EpochInputModality, EpochIntent } from "./inputIntelligence";
import { extractEpochIntent } from "./inputIntelligence";

export type EpochIngestionStatus = "parsed" | "accepted_for_external_processing" | "unsupported" | "invalid";
export type EpochIngestionResult = {
  version: "epoch_input_ingestion_result.v1";
  status: EpochIngestionStatus;
  modality: EpochInputModality;
  normalizedContent: unknown;
  parser: string;
  reasons: string[];
  intent: EpochIntent;
  contentSha256: string;
};

function hash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function parseCsv(input: string): Array<Record<string, string>> {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const source = input.replace(/^\uFEFF/, "");
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];
    if (character === '"' && quoted && next === '"') { field += '"'; index += 1; continue; }
    if (character === '"') { quoted = !quoted; continue; }
    if (character === "," && !quoted) { row.push(field); field = ""; continue; }
    if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(field); field = "";
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      continue;
    }
    field += character;
  }
  if (field.length || row.length) { row.push(field); if (row.some((value) => value.trim())) rows.push(row); }
  if (!rows.length) return [];
  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, (values[index] ?? "").trim()])));
}

function parseStructured(content: unknown): { ok: true; value: unknown } | { ok: false; reason: string } {
  if (typeof content !== "string") return { ok: true, value: content };
  try { return { ok: true, value: JSON.parse(content) }; } catch { return { ok: false, reason: "structured_content_is_not_valid_json" }; }
}

function validateExternalReference(envelope: EpochInputEnvelope): string[] {
  const value = envelope.content && typeof envelope.content === "object" ? envelope.content as Record<string, unknown> : {};
  const reference = typeof value.uri === "string" || typeof value.url === "string" || typeof value.connectionRef === "string" || typeof value.resourceId === "string";
  return reference ? [] : ["external_input_reference_required"];
}

export function ingestEpochInput(envelope: EpochInputEnvelope): EpochIngestionResult {
  let status: EpochIngestionStatus = "parsed";
  let normalizedContent: unknown = envelope.content;
  let parser = "identity";
  const reasons: string[] = [];
    if (envelope.modality === "structured") {
    const parsed = parseStructured(envelope.content);
    if (!parsed.ok) { status = "invalid"; reasons.push(parsed.reason); }
    else { normalizedContent = parsed.value; parser = "json"; }
  } else if (envelope.contentType?.toLowerCase().includes("parquet")) {
    const referenceErrors = validateExternalReference(envelope);
    if (referenceErrors.length) { status = "invalid"; reasons.push(...referenceErrors); }
    else {
      status = "accepted_for_external_processing";
      parser = "parquet-external-boundary";
      reasons.push("parquet_parser_requires_configured_external_runtime");
    }
  } else if (envelope.modality === "table" || envelope.contentType?.toLowerCase().includes("csv")) {
    if (Array.isArray(envelope.content)) { normalizedContent = envelope.content; parser = "table-identity"; }
    else if (typeof envelope.content !== "string") { status = "invalid"; reasons.push("csv_content_must_be_text_or_rows"); }
    else { normalizedContent = parseCsv(envelope.content); parser = "csv-rfc4180"; }
  } else if (envelope.modality === "text" || envelope.modality === "code" || envelope.modality === "document") {
    if (typeof envelope.content !== "string" && !envelope.content) { status = "invalid"; reasons.push("textual_content_required"); }
    else parser = envelope.modality === "document" ? "document-text-boundary" : "identity-text";
  } else if (["audio", "image", "video"].includes(envelope.modality)) {
    reasons.push(`${envelope.modality}_parser_requires_configured_external_runtime`);
    status = "accepted_for_external_processing";
    parser = `${envelope.modality}-external-boundary`;
  } else {
    const referenceErrors = validateExternalReference(envelope);
    if (referenceErrors.length) { status = "invalid"; reasons.push(...referenceErrors); }
    else { status = "accepted_for_external_processing"; parser = "connector-boundary"; }
  }
  const intent = extractEpochIntent({ ...envelope, content: normalizedContent });
  return { version: "epoch_input_ingestion_result.v1", status, modality: envelope.modality, normalizedContent, parser, reasons, intent, contentSha256: hash(normalizedContent) };
}

export function validateEpochIntent(intent: EpochIntent, envelope: EpochInputEnvelope): { valid: true } | { valid: false; reasons: string[] } {
  const reasons: string[] = [];
  if (!intent.objective && !["observe", "discover"].includes(intent.action)) reasons.push("objective_required");
  if (intent.confidence < 0.3) reasons.push("intent_confidence_too_low");
  if (!envelope.id) reasons.push("source_input_required");
  return reasons.length ? { valid: false, reasons } : { valid: true };
}
