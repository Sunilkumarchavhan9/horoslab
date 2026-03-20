import { NextResponse } from "next/server";
import { z } from "zod";
import { runIngestFlowLangGraph } from "@/lib/workflows/ingestGraphLangGraph";
import { ensureMemoryStoreIntegrity } from "@/lib/memory/startupIntegrity";

export const runtime = "nodejs";
ensureMemoryStoreIntegrity();

const ProcessMemorySchema = z.object({
  userId: z.string().min(1, "userId is required"),
  threadId: z.string().min(1).optional(),
  message: z.string().min(1, "message is required"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = ProcessMemorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const result = await runIngestFlowLangGraph(parsed.data);

    return NextResponse.json(
      {
        acceptedMemories: result.acceptedMemories,
        rejectedMemories: result.rejectedMemories,
        timelineEvents: result.timelineEvents,
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown processing error";

    return NextResponse.json(
      {
        error: "Failed to process memory",
        message,
      },
      { status: 500 },
    );
  }
}
