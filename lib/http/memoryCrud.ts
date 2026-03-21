import { NextResponse } from "next/server";
import { z } from "zod";
import { runIngestFlowLangGraph } from "@/lib/workflows/ingestGraphLangGraph";
import { retrieveRelevantMemory } from "@/lib/memory/retrieveRelevantMemory";
import { listRevisionEvents } from "@/lib/memory/revisionMemory";
import { listTimelineEvents } from "@/lib/memory/timelineMemory";
import { explainMemory } from "@/lib/memory/explainMemory";

const ProcessMemorySchema = z.object({
  userId: z.string().min(1).optional(),
  threadId: z.string().min(1).optional(),
  message: z.string().min(1, "message is required"),
});

const RetrieveMemorySchema = z.object({
  userId: z.string().min(1).optional(),
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

function getAuthUserId(req: Request): string | null {
  const userId = req.headers.get("x-user-id")?.trim();
  return userId ? userId : null;
}

async function handleProcess(req: Request, authUserId: string): Promise<NextResponse> {
  const parsed = await parseAndValidateJsonBody(req, ProcessMemorySchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const result = await runIngestFlowLangGraph({
    userId: authUserId,
    threadId: parsed.data.threadId,
    message: parsed.data.message,
  });
  return NextResponse.json(
    {
      acceptedMemories: result.acceptedMemories,
      rejectedMemories: result.rejectedMemories,
      timelineEvents: result.timelineEvents,
    },
    { status: 200 },
  );
}

async function handleRetrieve(req: Request, authUserId: string): Promise<NextResponse> {
  const parsed = await parseAndValidateJsonBody(req, RetrieveMemorySchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const result = await retrieveRelevantMemory({
    userId: authUserId,
    question: parsed.data.question,
    topK: parsed.data.topK,
  });
  return NextResponse.json(result, { status: 200 });
}

function handleRevisions(req: Request, authUserId: string): NextResponse {
  const { searchParams } = new URL(req.url);
  const memoryId = searchParams.get("memoryId") ?? undefined;
  const revisions = listRevisionEvents(
    memoryId ? { memoryId } : { userId: authUserId },
  ).filter((event) => event.userId === authUserId);

  return NextResponse.json(
    {
      revisions,
      count: revisions.length,
    },
    { status: 200 },
  );
}

function handleTimeline(authUserId: string): NextResponse {
  const events = listTimelineEvents(authUserId);

  return NextResponse.json(
    {
      events,
      count: events.length,
    },
    { status: 200 },
  );
}

async function handleExplain(req: Request, authUserId: string): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const memoryId = searchParams.get("memoryId");

  if (!memoryId) {
    return NextResponse.json({ error: "memoryId is required" }, { status: 400 });
  }

  const result = await explainMemory({ memoryId, userId: authUserId });
  if (!result) {
    return NextResponse.json({ error: "Memory not found" }, { status: 404 });
  }
  if (result.memory.rawMetadata.userId !== authUserId) {
    return NextResponse.json({ error: "Memory not found" }, { status: 404 });
  }

  return NextResponse.json(result, { status: 200 });
}

export async function handleMemoryCrud(req: Request): Promise<NextResponse> {
  try {
    const action = getAction(req);
    const method = req.method.toUpperCase();
    const authUserId = getAuthUserId(req);

    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (action === "process" && method === "POST") {
      return handleProcess(req, authUserId);
    }

    if (action === "retrieve" && method === "POST") {
      return handleRetrieve(req, authUserId);
    }

    if (action === "revisions" && method === "GET") {
      return handleRevisions(req, authUserId);
    }

    if (action === "timeline" && method === "GET") {
      return handleTimeline(authUserId);
    }

    if (action === "explain" && method === "GET") {
      return handleExplain(req, authUserId);
    }

    return NextResponse.json(
      { error: "Route not found" },
      { status: 404 },
    );
  } catch (error) {
    return internalServerError(error, "Memory API request failed");
  }
}
