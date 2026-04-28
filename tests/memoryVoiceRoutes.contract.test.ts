import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { makeToken } from "./helpers/authToken";

const mocks = vi.hoisted(() => ({
  runIngestFlowLangGraph: vi.fn(),
  startVoiceSession: vi.fn(),
  getVoiceSession: vi.fn(),
  recordVoiceChunk: vi.fn(),
  endVoiceSession: vi.fn(),
}));

vi.mock("../lib/workflows/ingestGraphLangGraph", () => ({
  runIngestFlowLangGraph: mocks.runIngestFlowLangGraph,
}));

vi.mock("../lib/voice/sessionStore", () => ({
  startVoiceSession: mocks.startVoiceSession,
  getVoiceSession: mocks.getVoiceSession,
  recordVoiceChunk: mocks.recordVoiceChunk,
  endVoiceSession: mocks.endVoiceSession,
}));

import { createMemoryOsApp } from "../server/app";

describe("Memory Voice Route Contracts", () => {
  const app = createMemoryOsApp();
  const authUserId = "u_voice_contract";
  let authHeader = "";

  beforeEach(async () => {
    mocks.runIngestFlowLangGraph.mockReset();
    mocks.startVoiceSession.mockReset();
    mocks.getVoiceSession.mockReset();
    mocks.recordVoiceChunk.mockReset();
    mocks.endVoiceSession.mockReset();
    authHeader = `Bearer ${await makeToken(authUserId)}`;
  });

  it("starts a voice session", async () => {
    mocks.startVoiceSession.mockResolvedValue({
      sessionId: "pc-1",
      userId: authUserId,
      source: "pipecat",
      status: "active",
      chunkCount: 0,
      totalCharacters: 0,
    });

    const res = await request(app)
      .post("/api/memory/voice/sessions/start")
      .set("authorization", authHeader)
      .send({
        sessionId: "pc-1",
        source: "pipecat",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("session");
    expect(mocks.startVoiceSession).toHaveBeenCalledWith({
      sessionId: "pc-1",
      userId: authUserId,
      source: "pipecat",
    });
  });

  it("streams a voice chunk using existing session thread", async () => {
    mocks.getVoiceSession.mockReturnValue({
      sessionId: "pc-1",
      userId: authUserId,
      source: "pipecat",
      status: "active",
      threadId: "voice:pc-1",
      chunkCount: 2,
      totalCharacters: 120,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    mocks.runIngestFlowLangGraph.mockResolvedValue({
      acceptedMemories: [],
      rejectedMemories: [],
      timelineEvents: [],
    });
    mocks.recordVoiceChunk.mockResolvedValue({
      sessionId: "pc-1",
      userId: authUserId,
      source: "pipecat",
      status: "active",
      threadId: "voice:pc-1",
      chunkCount: 3,
      totalCharacters: 170,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const res = await request(app)
      .post("/api/memory/voice/chunk")
      .set("authorization", authHeader)
      .send({
        sessionId: "pc-1",
        speaker: "user",
        chunkIndex: 3,
        chunk: "I am debugging audio latency right now.",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("acceptedMemories");
    expect(mocks.startVoiceSession).not.toHaveBeenCalled();
    expect(mocks.runIngestFlowLangGraph).toHaveBeenCalledWith({
      userId: authUserId,
      threadId: "voice:pc-1",
      message:
        "User: I am debugging audio latency right now.\n[voice_meta chunkIndex=3]",
    });
  });

  it("auto-starts a voice session if chunk arrives first", async () => {
    mocks.getVoiceSession
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(null);
    mocks.startVoiceSession.mockResolvedValue({
      sessionId: "pc-2",
      userId: authUserId,
      source: "pipecat",
      status: "active",
      chunkCount: 0,
      totalCharacters: 0,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    mocks.runIngestFlowLangGraph.mockResolvedValue({
      acceptedMemories: [],
      rejectedMemories: [],
      timelineEvents: [],
    });
    mocks.recordVoiceChunk.mockResolvedValue({
      sessionId: "pc-2",
      userId: authUserId,
      source: "pipecat",
      status: "active",
      chunkCount: 1,
      totalCharacters: 38,
      threadId: "voice:pc-2",
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const res = await request(app)
      .post("/api/memory/voice/chunk")
      .set("authorization", authHeader)
      .send({
        sessionId: "pc-2",
        chunk: "I deployed the new voice memory pipeline.",
      });

    expect(res.status).toBe(200);
    expect(mocks.startVoiceSession).toHaveBeenCalledWith({
      sessionId: "pc-2",
      userId: authUserId,
      source: "pipecat",
    });
    expect(mocks.runIngestFlowLangGraph).toHaveBeenCalledWith({
      userId: authUserId,
      threadId: "voice:pc-2",
      message: "I deployed the new voice memory pipeline.",
    });
  });

  it("returns 404 when ending unknown voice session", async () => {
    mocks.getVoiceSession.mockReturnValue(null);

    const res = await request(app)
      .post("/api/memory/voice/sessions/end")
      .set("authorization", authHeader)
      .send({
        sessionId: "missing-session",
      });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "Session not found");
  });

  it("ends a voice session and ingests final summary", async () => {
    mocks.getVoiceSession.mockReturnValue({
      sessionId: "pc-3",
      userId: authUserId,
      source: "pipecat",
      status: "active",
      threadId: "voice:pc-3",
      chunkCount: 4,
      totalCharacters: 320,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    mocks.runIngestFlowLangGraph.mockResolvedValue({
      acceptedMemories: [],
      rejectedMemories: [],
      timelineEvents: [],
    });
    mocks.endVoiceSession.mockResolvedValue({
      sessionId: "pc-3",
      userId: authUserId,
      source: "pipecat",
      status: "ended",
      threadId: "voice:pc-3",
      chunkCount: 4,
      totalCharacters: 320,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
    });

    const res = await request(app)
      .post("/api/memory/voice/sessions/end")
      .set("authorization", authHeader)
      .send({
        sessionId: "pc-3",
        finalSummary: "Call ended with next step to improve latency monitoring.",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("session");
    expect(res.body).toHaveProperty("summaryIngestResult");
    expect(mocks.runIngestFlowLangGraph).toHaveBeenCalledWith({
      userId: authUserId,
      threadId: "voice:pc-3",
      message:
        "Voice session summary: Call ended with next step to improve latency monitoring.",
    });
    expect(mocks.endVoiceSession).toHaveBeenCalledWith({
      userId: authUserId,
      sessionId: "pc-3",
    });
  });
});

