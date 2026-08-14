import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createMemoryOsApp } from "../server/app";

const originalToken = process.env.MEMORYOSTM_DESKTOP_PROVIDER_TOKEN;
const originalBridgeMode = process.env.MEMORYOSTM_DESKTOP_BRIDGE_MODE;
const originalFleetJson = process.env.MEMORYOSTM_DESKTOP_FLEET_JSON;

describe("internal desktop provider routes", () => {
  const app = createMemoryOsApp();

  beforeEach(() => {
    process.env.MEMORYOSTM_DESKTOP_PROVIDER_TOKEN = "desktop-test-token";
    process.env.MEMORYOSTM_DESKTOP_BRIDGE_MODE = "mock";
    delete process.env.MEMORYOSTM_DESKTOP_FLEET_JSON;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.MEMORYOSTM_DESKTOP_PROVIDER_TOKEN = originalToken;
    process.env.MEMORYOSTM_DESKTOP_BRIDGE_MODE = originalBridgeMode;
    process.env.MEMORYOSTM_DESKTOP_FLEET_JSON = originalFleetJson;
  });

  it("returns 401 when provider token is missing or invalid", async () => {
    const withoutToken = await request(app).get(
      "/internal/desktop-provider/desktop/sessions/status?threadId=t1&osType=ubuntu",
    );
    expect(withoutToken.status).toBe(401);

    const withWrongToken = await request(app)
      .get("/internal/desktop-provider/desktop/sessions/status?threadId=t1&osType=ubuntu")
      .set("authorization", "Bearer wrong-token");
    expect(withWrongToken.status).toBe(401);
  });

  it("returns 200 with idle session when provider token is valid", async () => {
    const res = await request(app)
      .get("/internal/desktop-provider/desktop/sessions/status?threadId=t2&osType=windows")
      .set("authorization", "Bearer desktop-test-token");

    expect(res.status).toBe(200);
    expect(res.body.session.threadId).toBe("t2");
    expect(res.body.session.osType).toBe("windows");
    expect(res.body.session.state).toBe("idle");
    expect(res.body.session.provider).toBe("browser");
  });

  it("returns bridge health when provider token is valid", async () => {
    const res = await request(app)
      .get("/internal/desktop-provider/desktop/health")
      .set("authorization", "Bearer desktop-test-token");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.healthy).toBe(true);
  });

  it("accepts desktop input and returns stream state for live bridge session", async () => {
    const startRes = await request(app)
      .post("/internal/desktop-provider/desktop/sessions/start")
      .set("authorization", "Bearer desktop-test-token")
      .send({ threadId: "t3", osType: "ubuntu" });
    expect(startRes.status).toBe(200);

    const inputRes = await request(app)
      .post("/internal/desktop-provider/desktop/sessions/input")
      .set("authorization", "Bearer desktop-test-token")
      .send({
        threadId: "t3",
        osType: "ubuntu",
        event: { type: "mouse_click", x: 42, y: 21, action: "click", button: "left" },
      });
    expect(inputRes.status).toBe(200);
    expect(inputRes.body.accepted).toBe(true);

    const streamRes = await request(app)
      .get("/internal/desktop-provider/desktop/sessions/stream?threadId=t3&osType=ubuntu")
      .set("authorization", "Bearer desktop-test-token");
    expect(streamRes.status).toBe(200);
    expect(streamRes.body.connected).toBe(true);
    expect(streamRes.body.mode).toBe("image-stream");
  });

  it("allocates fleet nodes with capacity and returns 503 when saturated", async () => {
    process.env.MEMORYOSTM_DESKTOP_BRIDGE_MODE = "fleet";
    process.env.MEMORYOSTM_DESKTOP_FLEET_JSON = JSON.stringify([
      {
        id: "ubuntu-a",
        osTypes: ["ubuntu"],
        capacity: 1,
        transportMode: "vnc",
        previewUrlTemplate: "https://fleet.example/{nodeId}/preview/{sessionId}",
        controlUrlTemplate: "https://fleet.example/{nodeId}/control/{sessionId}",
      },
    ]);

    const startRes1 = await request(app)
      .post("/internal/desktop-provider/desktop/sessions/start")
      .set("authorization", "Bearer desktop-test-token")
      .send({ threadId: "fleet-1", osType: "ubuntu" });
    expect(startRes1.status).toBe(200);
    expect(startRes1.body.session.state).toBe("live");
    expect(startRes1.body.session.nodeId).toBe("ubuntu-a");
    expect(startRes1.body.session.transportMode).toBe("vnc");
    expect(typeof startRes1.body.session.sessionAuthToken).toBe("string");
    expect(typeof startRes1.body.session.sessionAuthExpiresAt).toBe("string");
    expect(startRes1.body.session.resumeSupported).toBe(true);

    const startRes2 = await request(app)
      .post("/internal/desktop-provider/desktop/sessions/start")
      .set("authorization", "Bearer desktop-test-token")
      .send({ threadId: "fleet-2", osType: "ubuntu" });
    expect(startRes2.status).toBe(503);

    const healthRes = await request(app)
      .get("/internal/desktop-provider/desktop/health")
      .set("authorization", "Bearer desktop-test-token");
    expect(healthRes.status).toBe(200);
    expect(healthRes.body.mode).toBe("fleet");
    expect(healthRes.body.capacity).toBe(1);
    expect(healthRes.body.inUse).toBe(1);

    const streamRes = await request(app)
      .get("/internal/desktop-provider/desktop/sessions/stream?threadId=fleet-1&osType=ubuntu")
      .set("authorization", "Bearer desktop-test-token");
    expect(streamRes.status).toBe(200);
    expect(streamRes.body.mode).toBe("vnc");
    expect(streamRes.body.resumeSupported).toBe(true);

    const stopRes = await request(app)
      .post("/internal/desktop-provider/desktop/sessions/stop")
      .set("authorization", "Bearer desktop-test-token")
      .send({ threadId: "fleet-1", osType: "ubuntu" });
    expect(stopRes.status).toBe(200);

    const startRes3 = await request(app)
      .post("/internal/desktop-provider/desktop/sessions/start")
      .set("authorization", "Bearer desktop-test-token")
      .send({ threadId: "fleet-2", osType: "ubuntu" });
    expect(startRes3.status).toBe(200);
  });

  it("authorizes Ubuntu and Windows gateway streams with per-session tokens", async () => {
    process.env.MEMORYOSTM_DESKTOP_BRIDGE_MODE = "fleet";
    process.env.MEMORYOSTM_DESKTOP_FLEET_JSON = JSON.stringify([
      {
        id: "ubuntu-vnc-a",
        osTypes: ["ubuntu"],
        capacity: 2,
        transportMode: "vnc",
        previewUrlTemplate: "https://desktop-gateway.example/ubuntu/{sessionId}?token={token}",
        controlUrlTemplate: "https://desktop-gateway.example/ubuntu/{sessionId}?token={token}",
      },
      {
        id: "windows-vnc-a",
        osTypes: ["windows"],
        capacity: 2,
        transportMode: "vnc",
        previewUrlTemplate: "https://desktop-gateway.example/windows/{sessionId}?token={token}",
        controlUrlTemplate: "https://desktop-gateway.example/windows/{sessionId}?token={token}",
      },
    ]);

    const ubuntu = await request(app)
      .post("/internal/desktop-provider/desktop/sessions/start")
      .set("authorization", "Bearer desktop-test-token")
      .send({ threadId: "gateway-ubuntu", osType: "ubuntu" });
    const windows = await request(app)
      .post("/internal/desktop-provider/desktop/sessions/start")
      .set("authorization", "Bearer desktop-test-token")
      .send({ threadId: "gateway-windows", osType: "windows" });

    expect(ubuntu.status).toBe(200);
    expect(windows.status).toBe(200);
    expect(ubuntu.body.session.nodeId).toBe("ubuntu-vnc-a");
    expect(windows.body.session.nodeId).toBe("windows-vnc-a");
    expect(ubuntu.body.session.previewUrl).toContain("token=");
    expect(windows.body.session.previewUrl).toContain("token=");

    const ubuntuAuth = await request(app)
      .get("/internal/desktop-provider/desktop/gateway/authorize")
      .query({
        sessionId: ubuntu.body.session.providerSessionId,
        token: ubuntu.body.session.sessionAuthToken,
      });
    expect(ubuntuAuth.status).toBe(204);

    const windowsAuth = await request(app)
      .get("/internal/desktop-provider/desktop/gateway/authorize")
      .query({ sessionId: windows.body.session.providerSessionId })
      .set("authorization", `Bearer ${windows.body.session.sessionAuthToken}`);
    expect(windowsAuth.status).toBe(204);

    const wrongToken = await request(app)
      .get("/internal/desktop-provider/desktop/gateway/authorize")
      .query({
        sessionId: ubuntu.body.session.providerSessionId,
        token: windows.body.session.sessionAuthToken,
      });
    expect(wrongToken.status).toBe(401);
  });

  it("forwards desktop input to a configured fleet input gateway", async () => {
    process.env.MEMORYOSTM_DESKTOP_BRIDGE_MODE = "fleet";
    process.env.MEMORYOSTM_DESKTOP_FLEET_JSON = JSON.stringify([
      {
        id: "ubuntu-input-a",
        osTypes: ["ubuntu"],
        capacity: 1,
        transportMode: "vnc",
        previewUrlTemplate: "https://desktop-gateway.example/preview/{sessionId}?token={token}",
        controlUrlTemplate: "https://desktop-gateway.example/control/{sessionId}?token={token}",
        inputUrlTemplate: "https://desktop-gateway.example/input/{sessionId}",
      },
    ]);
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("ok", { status: 200 }));

    const startRes = await request(app)
      .post("/internal/desktop-provider/desktop/sessions/start")
      .set("authorization", "Bearer desktop-test-token")
      .send({ threadId: "input-ubuntu", osType: "ubuntu" });
    expect(startRes.status).toBe(200);

    const inputRes = await request(app)
      .post("/internal/desktop-provider/desktop/sessions/input")
      .set("authorization", "Bearer desktop-test-token")
      .send({
        threadId: "input-ubuntu",
        osType: "ubuntu",
        event: { type: "key", key: "Enter", action: "press" },
      });

    expect(inputRes.status).toBe(200);
    expect(inputRes.body.accepted).toBe(true);
    expect(inputRes.body.message).toContain("forwarded");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      startRes.body.session.providerSessionId,
    );
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
      headers: expect.objectContaining({
        authorization: `Bearer ${startRes.body.session.sessionAuthToken}`,
      }),
    });
  });

  it("returns token-scoped screenshot proof URLs for configured fleet nodes", async () => {
    process.env.MEMORYOSTM_DESKTOP_BRIDGE_MODE = "fleet";
    process.env.MEMORYOSTM_DESKTOP_FLEET_JSON = JSON.stringify([
      {
        id: "ubuntu-proof-a",
        osTypes: ["ubuntu"],
        capacity: 1,
        transportMode: "vnc",
        previewUrlTemplate: "https://desktop-gateway.example/preview/{sessionId}?token={token}",
        controlUrlTemplate: "https://desktop-gateway.example/control/{sessionId}?token={token}",
        screenshotUrlTemplate: "https://desktop-gateway.example/screenshot/{sessionId}.png?token={token}",
      },
    ]);

    const startRes = await request(app)
      .post("/internal/desktop-provider/desktop/sessions/start")
      .set("authorization", "Bearer desktop-test-token")
      .send({ threadId: "proof-ubuntu", osType: "ubuntu" });
    expect(startRes.status).toBe(200);

    const screenshotRes = await request(app)
      .get("/internal/desktop-provider/desktop/sessions/screenshot?threadId=proof-ubuntu&osType=ubuntu")
      .set("authorization", "Bearer desktop-test-token");

    expect(screenshotRes.status).toBe(200);
    expect(screenshotRes.body.captured).toBe(true);
    expect(screenshotRes.body.imageUrl).toContain(
      startRes.body.session.providerSessionId,
    );
    expect(screenshotRes.body.imageUrl).toContain(
      encodeURIComponent(startRes.body.session.sessionAuthToken),
    );
    expect(screenshotRes.body.contentType).toBe("image/png");

    const healthRes = await request(app)
      .get("/internal/desktop-provider/desktop/health")
      .set("authorization", "Bearer desktop-test-token");
    expect(healthRes.body.nodes[0].hasScreenshotCapture).toBe(true);
  });
});
