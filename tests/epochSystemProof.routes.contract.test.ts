import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";

describe("Epoch system proof API contract", () => {
  it("exposes compile and mission persistence endpoints", async () => {
    const source = await readFile("server/routes/epoch-runtime.routes.ts", "utf8");
    expect(source).toContain("/workspaces/:workspaceId/orchestrator/system/compile");
    expect(source).toContain("/workspaces/:workspaceId/missions/:missionId/system-proof");
    expect(source).toContain("compileEpochMissionSystem");
    expect(source).toContain("persistEpochMissionSystemProof");
    expect(source).toContain("/workspaces/:workspaceId/runtime-adapters/probe-compatibility");
    expect(source).toContain("applyEpochRuntimeProbeToCompatibility");
    expect(source).toContain("/workspaces/:workspaceId/runtime-adapters/task-execute");
    expect(source).toContain("executeEpochTask");
    expect(source).toContain("/workspaces/:workspaceId/runtime-adapters/embedding-evaluate");
    expect(source).toContain("evaluateEpochEmbeddings");
    expect(source).toContain("/workspaces/:workspaceId/runtime-adapters/reranking-evaluate");
    expect(source).toContain("evaluateEpochReranking");
    expect(source).toContain("/workspaces/:workspaceId/runtime-adapters/vision-evaluate");
    expect(source).toContain("evaluateEpochVision");
    expect(source).toContain("/workspaces/:workspaceId/runtime-adapters/speech-evaluate");
    expect(source).toContain("evaluateEpochSpeech");
    expect(source).toContain("/workspaces/:workspaceId/runtime-adapters/media-evaluate");
    expect(source).toContain("evaluateEpochMedia");
    expect(source).toContain("/workspaces/:workspaceId/runtime-adapters/task-batch");
    expect(source).toContain("executeEpochTaskBatch");
    expect(source).toContain("/workspaces/:workspaceId/runtime-adapters/load-verify");
    expect(source).toContain("verifyEpochRuntimeLoad");
    expect(source).toContain("/workspaces/:workspaceId/models/huggingface/verification-gate");
    expect(source).toContain("evaluateEpochModelVerificationGate");
    expect(source).toContain("/workspaces/:workspaceId/models/huggingface/sync-jobs");
    expect(source).toContain('type: "model_sync"');
    expect(source).toContain("/workspaces/:workspaceId/models/huggingface/security-scan");
    expect(source).toContain("/workspaces/:workspaceId/models/huggingface/approval");
    expect(source).toContain("SECURITY_SCAN_MISMATCH");
  });
});
