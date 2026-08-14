import { describe, expect, it } from "vitest";
import { SourceService } from "../lib/reality/sources/SourceService";

describe("SourceService", () => {
  it("seeds indexed sources and supports register/sync/index", () => {
    const service = new SourceService();

    const initial = service.list();
    expect(initial.length).toBeGreaterThan(0);
    expect(initial.some((source) => source.system === "github")).toBe(true);

    const registered = service.register("notion", { connector: "notion" });
    expect(registered.system).toBe("notion");
    expect(registered.state).toBe("registered");

    const synced = service.sync(registered.id);
    expect(synced?.state).toBe("registered");
    expect(synced?.lastSyncedAt).toBeTruthy();

    const indexed = service.index(registered.id, 3);
    expect(indexed?.state).toBe("indexed");
    expect(indexed?.documentsIndexed).toBeGreaterThanOrEqual(3);
    expect(service.status(registered.id)?.state).toBe("indexed");
  });
});
