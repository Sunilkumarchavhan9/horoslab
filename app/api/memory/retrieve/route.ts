import { NextResponse } from "next/server";
import { z } from "zod";
import { retrieveRelevantMemory } from "@/lib/memory/retrieveRelevantMemory";

export const runtime = "nodejs";

const RetrieveMemorySchema = z.object({
  userId: z.string().min(1, "userId is required"),
  question: z.string().min(1, "question is required"),
  topK: z.number().int().positive().max(20).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RetrieveMemorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const result = await retrieveRelevantMemory(parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown retrieval error";

    return NextResponse.json(
      {
        error: "Failed to retrieve memories",
        message,
      },
      { status: 500 },
    );
  }
}
