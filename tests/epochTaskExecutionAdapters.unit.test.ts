import { beforeEach, describe, expect, it } from "vitest";
import { executeEpochTask } from "../lib/epoch/taskExecutionAdapters";

beforeEach(() => { process.env.EPOCH_RUNTIME_TASK_ENDPOINT = "http://127.0.0.1:8000/"; });

describe("Epoch task execution adapters", () => {
  it("validates text, embedding, and reranking outputs", async () => {
    const text = await executeEpochTask({ target: "vllm", endpointEnvVar: "EPOCH_RUNTIME_TASK_ENDPOINT", task: "text-generation", model: "text-model", input: "hello", fetchImpl: async (input, init) => { expect(String(input)).toContain("completions"); expect(String(init?.body)).toContain("text-model"); return new Response(JSON.stringify({ choices: [{ text: "hello" }] }), { status: 200 }); } });
    expect(text.status).toBe("OBSERVED");
    const embedding = await executeEpochTask({ target: "vllm", endpointEnvVar: "EPOCH_RUNTIME_TASK_ENDPOINT", task: "embedding", model: "embed-model", input: "hello", fetchImpl: async (input) => { expect(String(input)).toContain("embeddings"); return new Response(JSON.stringify({ data: [{ embedding: [0.1, 0.2] }] }), { status: 200 }); } });
    expect(embedding.validation.valid).toBe(true);
    const rerank = await executeEpochTask({ target: "vllm", endpointEnvVar: "EPOCH_RUNTIME_TASK_ENDPOINT", task: "reranking", model: "rank-model", input: { query: "hello", documents: ["hello world"] }, fetchImpl: async (input) => { expect(String(input)).toContain("rerank"); return new Response(JSON.stringify({ results: [{ index: 0, relevance_score: 0.9 }] }), { status: 200 }); } });
    expect(rerank.status).toBe("OBSERVED");
    const ollama = await executeEpochTask({ target: "ollama", endpointEnvVar: "EPOCH_RUNTIME_TASK_ENDPOINT", task: "embedding", model: "nomic-embed-text", input: "hello", fetchImpl: async (input) => { expect(String(input)).toContain("api/embed"); return new Response(JSON.stringify({ embeddings: [[0.1, 0.2]] }), { status: 200 }); } });
    expect(ollama.status).toBe("OBSERVED");
  });

  it("validates media/audio contracts and refuses undeclared local media support", async () => {
    const vision = await executeEpochTask({ target: "sglang", endpointEnvVar: "EPOCH_RUNTIME_TASK_ENDPOINT", task: "vision", model: "vision-model", input: [{ type: "text", text: "describe" }], fetchImpl: async () => new Response(JSON.stringify({ choices: [{ message: { content: "a cat" } }] }), { status: 200 }) });
    expect(vision.status).toBe("OBSERVED");
    const ocr = await executeEpochTask({ target: "sglang", endpointEnvVar: "EPOCH_RUNTIME_TASK_ENDPOINT", task: "ocr", model: "ocr-model", input: [{ type: "text", text: "read this" }], fetchImpl: async () => new Response(JSON.stringify({ text: "invoice total 42" }), { status: 200 }) });
    expect(ocr.status).toBe("OBSERVED"); expect(ocr.output).toBe("invoice total 42");
    const speech = await executeEpochTask({ target: "nvidia_nim", endpointEnvVar: "EPOCH_RUNTIME_TASK_ENDPOINT", task: "speech", model: "speech-model", input: "base64-audio", fetchImpl: async (input) => { expect(String(input)).toContain("transcriptions"); return new Response(JSON.stringify({ text: "hello" }), { status: 200 }); } });
    expect(speech.status).toBe("OBSERVED");
    const tts = await executeEpochTask({ target: "nvidia_nim", endpointEnvVar: "EPOCH_RUNTIME_TASK_ENDPOINT", task: "text-to-speech", model: "tts-model", input: "hello", fetchImpl: async (input) => { expect(String(input)).toContain("audio/speech"); return new Response(JSON.stringify({ audio: "data:audio/wav;base64," + "A".repeat(24) }), { status: 200 }); } });
    expect(tts.status).toBe("OBSERVED");
    const image = await executeEpochTask({ target: "vllm", endpointEnvVar: "EPOCH_RUNTIME_TASK_ENDPOINT", task: "image-generation", model: "image-model", input: "a cat" });
    expect(image.status).toBe("UNSUPPORTED");
    const generated = await executeEpochTask({ target: "nvidia_nim", endpointEnvVar: "EPOCH_RUNTIME_TASK_ENDPOINT", task: "image-generation", model: "image-model", input: "a cat", fetchImpl: async (input) => { expect(String(input)).toContain("images/generations"); return new Response(JSON.stringify({ data: [{ b64_json: "A".repeat(24) }] }), { status: 200 }); } });
    expect(generated.status).toBe("OBSERVED");
  });

  it("does not convert malformed or failed runtime responses into success", async () => {
    const malformed = await executeEpochTask({ target: "vllm", endpointEnvVar: "EPOCH_RUNTIME_TASK_ENDPOINT", task: "embedding", model: "embed-model", input: "hello", fetchImpl: async () => new Response(JSON.stringify({ data: [{ embedding: [] }] }), { status: 200 }) });
    expect(malformed).toMatchObject({ status: "FAILED", validation: { valid: false } });
    const failed = await executeEpochTask({ target: "vllm", endpointEnvVar: "EPOCH_RUNTIME_TASK_ENDPOINT", task: "text-generation", model: "text-model", input: "hello", fetchImpl: async () => new Response("busy", { status: 503 }) });
    expect(failed.status).toBe("FAILED");
  });

  it("uses native TEI and Diffusers request contracts", async () => {
    const tei = await executeEpochTask({ target: "tei", endpointEnvVar: "EPOCH_RUNTIME_TASK_ENDPOINT", task: "embedding", model: "embed-model", input: "hello", fetchImpl: async (input, init) => {
      expect(String(input)).toContain("/embed");
      expect(String(init?.body)).toContain("inputs");
      return new Response(JSON.stringify([[0.1, 0.2]]), { status: 200 });
    } });
    expect(tei.status).toBe("OBSERVED");
    const diffusers = await executeEpochTask({ target: "diffusers", endpointEnvVar: "EPOCH_RUNTIME_TASK_ENDPOINT", task: "image-generation", model: "image-model", input: "a cat", fetchImpl: async (input) => {
      expect(String(input)).toContain("/generate");
      return new Response(JSON.stringify({ images: ["A".repeat(24)] }), { status: 200 });
    } });
    expect(diffusers.status).toBe("OBSERVED");
    const unsupported = await executeEpochTask({ target: "tei", endpointEnvVar: "EPOCH_RUNTIME_TASK_ENDPOINT", task: "image-generation", model: "image-model", input: "a cat", fetchImpl: async () => { throw new Error("must not call unsupported runtime"); } });
    expect(unsupported.status).toBe("UNSUPPORTED");
  });
});
