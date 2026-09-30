import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

export async function GET(): Promise<Response> {
  const contractPath = path.resolve(process.cwd(), "..", "docs/generated/dhyra-v12-contract.json");
  const contract = JSON.parse(await readFile(contractPath, "utf8")) as Record<string, unknown>;
  return NextResponse.json({ ok: true, data: contract }, { headers: { "cache-control": "no-store" } });
}
