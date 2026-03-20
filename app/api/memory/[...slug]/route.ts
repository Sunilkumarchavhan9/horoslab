import { handleMemoryCrud } from "@/lib/http/memoryCrud";
import { ensureMemoryStoreIntegrity } from "@/lib/memory/startupIntegrity";

export const runtime = "nodejs";
ensureMemoryStoreIntegrity();

export async function GET(req: Request) {
  return handleMemoryCrud(req);
}

export async function POST(req: Request) {
  return handleMemoryCrud(req);
}
