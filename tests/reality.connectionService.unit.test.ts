import { describe, expect, it } from "vitest";
import { ConnectionService } from "../lib/reality/connections/ConnectionService";

describe("ConnectionService", () => {
  it("seeds core integrations and tracks connect/disconnect/sync", () => {
    const service = new ConnectionService();

    const initial = service.list();
    expect(initial.length).toBeGreaterThan(0);
    expect(initial.some((connection) => connection.system === "github")).toBe(true);

    const connected = service.connectSystem("linear", { provider: "linear" });
    expect(connected.system).toBe("linear");
    expect(connected.state).toBe("connected");

    const health = service.health(connected.id);
    expect(health?.healthy).toBe(true);

    const synced = service.sync(connected.id);
    expect(synced?.state).toBe("connected");
    expect(synced?.healthy).toBe(true);

    expect(service.disconnect(connected.id)).toBe(true);
    expect(service.health(connected.id)?.state).toBe("disconnected");
  });
});
