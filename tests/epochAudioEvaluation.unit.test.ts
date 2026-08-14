import { describe, expect, it } from "vitest";
import { evaluateEpochSpeech, validateEpochAudioArtifact } from "../lib/epoch/audioEvaluation";

describe("Epoch speech and audio evaluation", () => {
  it("validates a TTS data URL and scores transcription quality", () => {
    const artifact = validateEpochAudioArtifact({ encoding: "data-url", value: "data:audio/wav;base64," + "A".repeat(24) });
    expect(artifact.valid).toBe(true); expect(artifact.sha256).toHaveLength(64);
    const result = evaluateEpochSpeech({ cases: [{ id: "one", expectedText: "hello world", observedText: "hello world" }, { id: "two", expectedText: "good morning", observedText: "good morning" }] });
    expect(result.status).toBe("PASS"); expect(result.tokenF1).toBe(1);
  });
  it("rejects malformed audio and empty transcripts", () => {
    expect(validateEpochAudioArtifact({ encoding: "base64", value: "bad" }).valid).toBe(false);
    const result = evaluateEpochSpeech({ cases: [{ id: "bad", expectedText: "hello", observedText: "" }] });
    expect(result.status).toBe("UNKNOWN"); expect(result.invalidCaseIds).toEqual(["bad"]);
  });
});
