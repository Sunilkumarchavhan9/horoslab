import { NextResponse } from "next/server";
import { z } from "zod";
import { runIngestFlowLangGraph } from "@/lib/workflows/ingestGraphLangGraph";
import { retrieveRelevantMemory } from "@/lib/memory/retrieveRelevantMemory";
import { listRevisionEvents } from "@/lib/memory/revisionMemory";
import { listTimelineEvents } from "@/lib/memory/timelineMemory";
import { explainMemory } from "@/lib/memory/explainMemory";

const ProcessMemorySchema = z.object({
  userId: z.string().min(1, "userId is required"),
  threadId: z.string().min(1).optional(),
  message: z.string().min(1, "message is required"),
});

const RetrieveMemorySchema = z.object({
  userId: z.string().min(1, "userId is required"),
  question: z.string().min(1, "question is required"),
  topK: z.number().int().positive().max(20).optional(),
});

async function parseAndValidateJsonBody<T>(
  req: Request,
  schema: z.ZodType<T>,
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: "Invalid request body",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      ),
    };
  }

  return {
    success: true,
    data: parsed.data,
  };
}

function getAction(req: Request): string {
  const pathname = new URL(req.url).pathname.replace(/\/+$/, "");
  const segments = pathname.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? "";
}

function internalServerError(error: unknown, message: string): NextResponse {
  const detail = error instanceof Error ? error.message : "Unknown error";
  return NextResponse.json(
    {
      error: message,
      message: detail,
    },
    { status: 500 },
  );
}

async function handleProcess(req: Request): Promise<NextResponse> {
  const parsed = await parseAndValidateJsonBody(req, ProcessMemorySchema);
  if (!parsed.success) {
    return parsed.response;
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
}

async function handleRetrieve(req: Request): Promise<NextResponse> {
  const parsed = await parseAndValidateJsonBody(req, RetrieveMemorySchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const result = await retrieveRelevantMemory(parsed.data);
  return NextResponse.json(result, { status: 200 });
}

function handleRevisions(req: Request): NextResponse {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? undefined;
  const memoryId = searchParams.get("memoryId") ?? undefined;
  const revisions = listRevisionEvents({ userId, memoryId });

  return NextResponse.json(
    {
      revisions,
      count: revisions.length,
    },
    { status: 200 },
  );
}

function handleTimeline(req: Request): NextResponse {
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
}

async function handleExplain(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const memoryId = searchParams.get("memoryId");
  const userId = searchParams.get("userId") ?? undefined;

  if (!memoryId) {
    return NextResponse.json({ error: "memoryId is required" }, { status: 400 });
  }

  const result = await explainMemory({ memoryId, userId });
  if (!result) {
    return NextResponse.json({ error: "Memory not found" }, { status: 404 });
  }

  return NextResponse.json(result, { status: 200 });
}

export async function handleMemoryCrud(req: Request): Promise<NextResponse> {
  try {
    const action = getAction(req);
    const method = req.method.toUpperCase();

    if (action === "process" && method === "POST") {
      return handleProcess(req);
    }

    if (action === "retrieve" && method === "POST") {
      return handleRetrieve(req);
    }

    if (action === "revisions" && method === "GET") {
      return handleRevisions(req);
    }

    if (action === "timeline" && method === "GET") {
      return handleTimeline(req);
    }

    if (action === "explain" && method === "GET") {
      return handleExplain(req);
    }

    return NextResponse.json(
      { error: "Route not found" },
      { status: 404 },
    );
  } catch (error) {
    return internalServerError(error, "Memory API request failed");
  }
}
