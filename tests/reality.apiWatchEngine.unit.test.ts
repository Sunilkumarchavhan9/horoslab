import { describe, expect, it } from "vitest";
import { APIWatchEngine } from "../lib/reality/watchers/APIWatchEngine";

describe("APIWatchEngine", () => {
  it("seeds tracked APIs and supports watch/check flows", () => {
    const engine = new APIWatchEngine();

    const initial = engine.list();
    expect(initial.length).toBeGreaterThan(0);
    expect(initial.some((target) => target.provider === "github")).toBe(true);

    const watched = engine.watch("linear", { category: "project-management" });
    expect(watched.provider).toBe("linear");
    expect(watched.state).toBe("monitoring");

    const checked = engine.check({
      provider: "linear",
      state: "degraded",
      metadata: { incident: "latency-spike" },
    });
    expect(checked?.state).toBe("degraded");
    expect(checked?.issueCount).toBeGreaterThanOrEqual(1);
    expect(checked?.metadata.incident).toBe("latency-spike");

    expect(engine.summary().total).toBeGreaterThanOrEqual(5);
  });
});
