import { prisma } from "../../lib/storage/prismaClient";
import { ChatOpenAI } from "@langchain/openai";
import { SessionStatus, VerificationStatus, MemoryStatus } from "@prisma/client";

function openRouterBaseUrl(): string {
  return (
    process.env.OPENROUTER_BASE_URL?.trim() || "https://openrouter.ai/api/v1"
  );
}

/** Flight Recorder LLM paths use OpenRouter; fail fast instead of opaque OpenAI-key errors */
function requireOpenRouterApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "Missing OPENROUTER_API_KEY. Set it on the MemoryOS backend (see .env.example). Flight Recorder verify, proposed memories, handoff, and memory explain use OpenRouter.",
    );
  }
  return key;
}

type VerificationPersist = {
  status: Exclude<VerificationStatus, "PENDING">;
  confidence: number;
  checks: string[];
  warnings: string[];
};

async function persistSessionVerification(
  sessionId: string,
  outcome: VerificationPersist,
) {
  const verificationResult = await prisma.verificationResult.upsert({
    where: { sessionId },
    update: {
      status: outcome.status,
      confidence: outcome.confidence,
      checksJson: outcome.checks,
      warningsJson: outcome.warnings,
    },
    create: {
      sessionId,
      status: outcome.status,
      confidence: outcome.confidence,
      checksJson: outcome.checks,
      warningsJson: outcome.warnings,
    },
  });

  await prisma.agentSession.update({
    where: { id: sessionId },
    data: { verificationStatus: verificationResult.status },
  });

  return verificationResult;
}

// Agent A: Quick classification and explanations (Mini/Fast)
const getAgentA = () => {
  const apiKey = requireOpenRouterApiKey();
  return new ChatOpenAI({
    modelName: "openai/gpt-4o-mini",
    openAIApiKey: apiKey,
    configuration: {
      baseURL: openRouterBaseUrl(),
    },
  });
};

// Agent B: Complex reasoning, summaries, and verification (Pro/Smart)
const getAgentB = () => {
  const apiKey = requireOpenRouterApiKey();
  return new ChatOpenAI({
    modelName: "openai/gpt-4o",
    openAIApiKey: apiKey,
    configuration: {
      baseURL: openRouterBaseUrl(),
    },
  });
};

/** OpenRouter/OpenAI-compatible JSON object mode for structured verify output */
const getAgentBJsonObject = () => {
  const apiKey = requireOpenRouterApiKey();
  return new ChatOpenAI({
    modelName: "openai/gpt-4o",
    openAIApiKey: apiKey,
    configuration: {
      baseURL: openRouterBaseUrl(),
    },
    modelKwargs: {
      response_format: { type: "json_object" },
    },
  });
};

const PROPOSED_MEMORY_TYPES = new Set([
  "decision",
  "task",
  "blocker",
  "constraint",
  "context",
]);

function textFromLlmContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) =>
        typeof part === "string"
          ? part
          : typeof (part as { text?: unknown }).text === "string"
            ? (part as { text: string }).text
            : "",
      )
      .join("");
  }
  return String(content ?? "");
}

function normalizeProposedMemoryType(raw: unknown): string {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase();
  return PROPOSED_MEMORY_TYPES.has(s) ? s : "context";
}

function redactSecrets(payload: any): any {
  if (typeof payload === 'string') {
    return payload.replace(/(sk-[a-zA-Z0-9]{20,})/g, '[REDACTED]');
  } else if (Array.isArray(payload)) {
    return payload.map(redactSecrets);
  } else if (typeof payload === 'object' && payload !== null) {
    const redacted: any = {};
    for (const [key, value] of Object.entries(payload)) {
      if (/api[_-]?key|secret|password|token/i.test(key)) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactSecrets(value);
      }
    }
    return redacted;
  }
  return payload;
}

export async function getSessions(projectId?: string) {
  console.log(`[AgentSessionService] getSessions projectId=${projectId}`);
  try {
    const sessions = await prisma.agentSession.findMany({
      where: projectId ? { projectId } : {},
      orderBy: { startedAt: "desc" },
      include: {
        _count: {
          select: { events: true, proposedMemories: true }
        }
      }
    });
    console.log(`[AgentSessionService] Found ${sessions.length} sessions`);
    return sessions;
  } catch (error) {
    console.error(`[AgentSessionService] Error in getSessions:`, error);
    throw error;
  }
}

export async function getSessionById(sessionId: string) {
  return await prisma.agentSession.findUnique({
    where: { id: sessionId },
  });
}

export async function createAgentSession(data: {
  projectId?: string;
  agentId: string;
  model: string;
  tool: string;
  task?: string;
  mode: string;
}) {
  console.log(`[AgentSessionService] createAgentSession:`, data);
  try {
    const session = await prisma.agentSession.create({
      data: {
        ...data,
        status: SessionStatus.RECORDING,
      },
    });
    console.log(`[AgentSessionService] Created session: ${session.id}`);
    return session;
  } catch (error) {
    console.error(`[AgentSessionService] Error in createAgentSession:`, error);
    throw error;
  }
}

export async function recordEvent(sessionId: string, type: string, summary: string, payload: any) {
  const redactedPayload = redactSecrets(payload);
  
  return await prisma.agentSessionEvent.create({
    data: {
      sessionId,
      type,
      summary,
      payloadJson: redactedPayload,
    },
  });
}

export async function endSession(sessionId: string, summary?: string) {
  return await prisma.agentSession.update({
    where: { id: sessionId },
    data: {
      status: SessionStatus.COMPLETED,
      endedAt: new Date(),
      summary,
    },
  });
}

export async function getTimeline(sessionId: string) {
  return await prisma.agentSessionEvent.findMany({
    where: { sessionId },
    orderBy: { timestamp: "asc" },
  });
}

export async function runVerification(sessionId: string) {
  const session = await prisma.agentSession.findUnique({
    where: { id: sessionId },
    include: { events: true },
  });

  if (!session) throw new Error("Session not found");

  if (session.events.length === 0) {
    return persistSessionVerification(sessionId, {
      status: VerificationStatus.FAILED,
      confidence: 0,
      checks: [
        "No timeline events recorded. Add session activity before running Verify Gate.",
      ],
      warnings: [],
    });
  }

  const llm = getAgentBJsonObject();
  const eventsLog = session.events.map(e => `${e.type}: ${e.summary}`).join("\n");
  
  const prompt = [
    "You are a strict JSON API.",
    "Verify the following agent session events.",
    "Return ONLY valid JSON with no markdown fences and no extra text.",
    "Required schema:",
    '{ "status": "PASSED" | "FAILED", "confidence": number(0..1), "checks": string[], "warnings": string[] }',
    "If unsure, set status to FAILED and include reasons in checks.",
    "",
    "Session events:",
    eventsLog || "(no events)",
  ].join("\n");
  
  type VerifyOutcomeStatus = Exclude<VerificationStatus, "PENDING">;

  let result:
    | {
        status: VerifyOutcomeStatus;
        confidence: number;
        checks: string[];
        warnings: string[];
      }
    | undefined;
  try {
    const response = await llm.invoke([{ role: "user", content: prompt }]);
    const sanitized = textFromLlmContent(response.content).trim();
    const jsonMatch = sanitized.match(/\{[\s\S]*\}/);
    const candidate = (jsonMatch ? jsonMatch[0] : sanitized).trim();
    const parsed = JSON.parse(candidate) as Partial<{
      status: string;
      confidence: number;
      checks: unknown;
      warnings: unknown;
    }>;

    const normalizedStatus: VerifyOutcomeStatus =
      parsed.status === "PASSED" ? VerificationStatus.PASSED : VerificationStatus.FAILED;
    const normalizedConfidence =
      typeof parsed.confidence === "number" && Number.isFinite(parsed.confidence)
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0;
    const normalizedChecks = Array.isArray(parsed.checks)
      ? parsed.checks.map((v) => String(v))
      : [];
    const normalizedWarnings = Array.isArray(parsed.warnings)
      ? parsed.warnings.map((v) => String(v))
      : [];

    result = {
      status: normalizedStatus,
      confidence: normalizedConfidence,
      checks: normalizedChecks,
      warnings: normalizedWarnings,
    };

    if (result.checks.length === 0) {
      result.checks = [
        normalizedStatus === VerificationStatus.PASSED
          ? "Verification passed"
          : "Verification failed",
      ];
    }
  } catch (error) {
    result = {
      status: VerificationStatus.FAILED,
      confidence: 0,
      checks: ["Failed to parse LLM response"],
      warnings: [],
    };
  }

  return persistSessionVerification(sessionId, {
    status: result.status,
    confidence: result.confidence ?? 0.0,
    checks: result.checks,
    warnings: result.warnings,
  });
}

export async function proposeMemoriesFromSession(sessionId: string) {
  const session = await prisma.agentSession.findUnique({
    where: { id: sessionId },
    include: { events: true },
  });

  if (!session) throw new Error("Session not found");

  if (session.events.length === 0) {
    return [];
  }

  const llm = getAgentBJsonObject();
  const eventsLog = session.events.map(e => `${e.type}: ${e.summary}`).join("\n");

  const prompt = [
    "You are a strict JSON API.",
    "From the session events below, propose durable memories for future agent turns.",
    "Return ONLY valid JSON with no markdown fences and no extra text.",
    "Required schema:",
    '{ "proposals": [ { "type": "decision" | "task" | "blocker" | "constraint" | "context", "content": string, "confidence": number(0..1), "whyItMatters"?: string } ] }',
    "If nothing is worth remembering, return { \"proposals\": [] }.",
    "",
    "Session events:",
    eventsLog || "(no events)",
  ].join("\n");

  const response = await llm.invoke([{ role: "user", content: prompt }]);
  const raw = textFromLlmContent(response.content).trim();
  let proposals: unknown[] = [];
  try {
    const objectMatch = raw.match(/\{[\s\S]*\}/);
    const candidate = (objectMatch ? objectMatch[0] : raw).trim();
    const parsed = JSON.parse(candidate) as { proposals?: unknown };
    if (Array.isArray(parsed.proposals)) {
      proposals = parsed.proposals;
    } else {
      const arrayMatch = raw.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        proposals = JSON.parse(arrayMatch[0]) as unknown[];
      }
    }
  } catch {
    proposals = [];
  }

  const rows = proposals
    .map((p) => {
      if (!p || typeof p !== "object") return null;
      const o = p as Record<string, unknown>;
      const base = typeof o.content === "string" ? o.content.trim() : "";
      const why =
        typeof o.whyItMatters === "string" && o.whyItMatters.trim()
          ? o.whyItMatters.trim()
          : "";
      const content =
        base && why ? `${base}\n\nWhy it matters: ${why}` : base || why;
      if (!content) return null;
      const confRaw = o.confidence;
      const confidence =
        typeof confRaw === "number" && Number.isFinite(confRaw)
          ? Math.max(0, Math.min(1, confRaw))
          : 0.5;
      return {
        type: normalizeProposedMemoryType(o.type),
        content,
        confidence,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  const createdProposals = await Promise.all(
    rows.map((row) =>
      prisma.proposedMemory.create({
        data: {
          sessionId,
          type: row.type,
          content: row.content,
          confidence: row.confidence,
          source: "AgentFlightRecorder",
          status: MemoryStatus.PENDING,
        },
      }),
    ),
  );

  return createdProposals;
}

export async function getProposedMemories(sessionId: string) {
  return await prisma.proposedMemory.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateMemoryStatus(memoryId: string, status: MemoryStatus, sessionId?: string) {
  if (sessionId) {
    const updated = await prisma.proposedMemory.updateMany({
      where: { id: memoryId, sessionId },
      data: { status },
    });
    if (updated.count === 0) {
      throw new Error("Memory not found in session");
    }
    return await prisma.proposedMemory.findUnique({
      where: { id: memoryId },
    });
  }

  return await prisma.proposedMemory.update({
    where: { id: memoryId },
    data: { status },
  });
}

export async function explainMemory(memoryId: string) {
  const memory = await prisma.proposedMemory.findUnique({
    where: { id: memoryId },
  });

  if (!memory) throw new Error("Memory not found");

  const llm = getAgentA();
  const prompt = `Explain why this memory was proposed and why it is important for future agent turns:
Type: ${memory.type}
Content: ${memory.content}
Confidence: ${memory.confidence}`;

  const response = await llm.invoke([{ role: "user", content: prompt }]);
  return textFromLlmContent(response.content).trim();
}

function buildHeuristicHandoff(session: {
  task: string | null;
  events: Array<{ type: string; summary: string }>;
}): string {
  const taskLine = session.task?.trim() || "Unknown task";
  const lines = session.events
    .map((e) => `- [${e.type}] ${e.summary}`)
    .join("\n");
  return [
    `Handoff — ${taskLine}`,
    "",
    "Recent session activity:",
    lines,
    "",
    "Next agent: continue from the latest state above and preserve open decisions.",
  ].join("\n");
}

export async function generateHandoff(sessionId: string) {
  const session = await prisma.agentSession.findUnique({
    where: { id: sessionId },
    include: { events: true },
  });

  if (!session) throw new Error("Session not found");

  const eventsLog = session.events
    .map((e) => `${e.type}: ${e.summary}`)
    .join("\n");

  if (session.events.length === 0) {
    const task = session.task?.trim() || "Unknown";
    return `No session timeline events recorded. Task/context: ${task}. Start or resume agent work so events appear here before generating a handoff.`;
  }

  const heuristic = buildHeuristicHandoff(session);

  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    const fallbackText = `${heuristic}\n\n(Configure OPENROUTER_API_KEY on the backend for an AI-polished handoff.)`;
    const handoffEvent = await prisma.agentSessionEvent.create({
      data: {
        sessionId,
        type: "handoff.generated",
        summary: "Handoff generated via heuristic fallback.",
        payloadJson: { mode: "heuristic-fallback" },
      },
    });
    await prisma.agentSession.update({
      where: { id: sessionId },
      data: { handoffId: handoffEvent.id },
    });
    return fallbackText;
  }

  try {
    const llm = getAgentB();
    const prompt = `Generate a handoff summary for the next agent based on these events:\n${eventsLog}\n\nTask: ${session.task || "Unknown"}\n\nProvide a concise and informative handoff message.`;
    const response = await llm.invoke([{ role: "user", content: prompt }]);
    const text = textFromLlmContent(response.content).trim() || heuristic;
    const handoffEvent = await prisma.agentSessionEvent.create({
      data: {
        sessionId,
        type: "handoff.generated",
        summary: "Handoff generated for next agent.",
        payloadJson: { mode: "llm" },
      },
    });
    await prisma.agentSession.update({
      where: { id: sessionId },
      data: { handoffId: handoffEvent.id },
    });
    return text;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[AgentSession] generateHandoff LLM failed:", message);
    const fallbackText = `${heuristic}\n\n(Handoff used timeline fallback because the model request failed: ${message})`;
    const handoffEvent = await prisma.agentSessionEvent.create({
      data: {
        sessionId,
        type: "handoff.generated",
        summary: "Handoff generated via model-error fallback.",
        payloadJson: { mode: "llm-fallback", error: message },
      },
    });
    await prisma.agentSession.update({
      where: { id: sessionId },
      data: { handoffId: handoffEvent.id },
    });
    return fallbackText;
  }
}
