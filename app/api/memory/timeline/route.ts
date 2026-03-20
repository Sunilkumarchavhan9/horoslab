import { NextResponse } from "next/server";
import { listTimelineEvents } from "@/lib/memory/timelineMemory";
import { ensureMemoryStoreIntegrity } from "@/lib/memory/startupIntegrity";

export const runtime = "nodejs";
ensureMemoryStoreIntegrity();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") ?? undefined;

    const events = listTimelineEvents(userId);

    return NextResponse.json(
      {
        events,
        count: events.length,
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown timeline error";

    return NextResponse.json(
      {
        error: "Failed to fetch timeline",
        message,
      },
      { status: 500 },
    );
  }
}
