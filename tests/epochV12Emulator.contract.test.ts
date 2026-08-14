import { describe, expect, it } from "vitest";
import { runEpochV12Emulator } from "../packages/epoch-v12-emulator/src/index";

describe("Epoch V12 local emulator", () => {
  it("simulates fenced lease and completion", () => {
    expect(runEpochV12Emulator({ workerId: "w1", jobs: [{ id: "j1", type: "execute", payload: {} }] })).toMatchObject({ workerId: "w1", leased: ["j1"], completed: ["j1"], fencingTokens: { j1: 1 } });
  });
});
