import { describe, expect, it, vi } from "vitest";
import { runEpochOllamaMissionProof } from "../lib/epoch/localMissionProof";

describe("Epoch real local mission proof", () => {
  it("runs the V12 mission contract through Ollama transport", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => new Response(JSON.stringify({ message: { content: "accepted" }, prompt_eval_count: 12, eval_count: 2 }), { status: 200 }));
    const proof = await runEpochOllamaMissionProof({ workspaceId: "ws", institutionId: "inst", title: "Local model mission", objective: "Check the model", acceptanceCriteria: ["Model responds"], model: "qwen2.5:3b", fetch: fetcher });
    expect(proof.verification.decision).toBe("PASS");
    expect(proof.policy.decision).toBe("allow");
    expect(proof.ai.estimatedCostCents).toBe(0);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("verifies a criterion-specific response instead of requiring the word accepted", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => new Response(JSON.stringify({ message: { content: "runtime-ok" } }), { status: 200 }));
    const proof = await runEpochOllamaMissionProof({ workspaceId: "ws", institutionId: "inst", title: "Runtime proof", objective: "Check the model", acceptanceCriteria: ["The model returns runtime-ok"], model: "qwen2.5:3b", fetch: fetcher });
    expect(proof.verification.decision).toBe("PASS");
  });
});
