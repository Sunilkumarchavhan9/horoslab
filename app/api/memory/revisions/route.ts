import { NextResponse } from "next/server";
import { listRevisionEvents } from "@/lib/memory/revisionMemory";
import { ensureMemoryStoreIntegrity } from "@/lib/memory/startupIntegrity";

export const runtime = "nodejs";
ensureMemoryStoreIntegrity();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") ?? undefined;
    const memoryId = searchParams.get("memoryId") ?? undefined;

    const revisions = listRevisionEvents({
      userId,
      memoryId,
    });

    return NextResponse.json(
      {
        revisions,
        count: revisions.length,
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown revision error";

    return NextResponse.json(
      {
        error: "Failed to fetch revisions",
        message,
      },
      { status: 500 },
    );
  }
}
