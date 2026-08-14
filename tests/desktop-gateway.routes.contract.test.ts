import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { desktopGatewayRouter } from "../server/routes/desktop-gateway.routes";

const originalTargetsJson = process.env.MEMORYOSTM_DESKTOP_GATEWAY_TARGETS_JSON;
const originalAuthorizeUrl = process.env.MEMORYOSTM_DESKTOP_GATEWAY_PROVIDER_AUTHORIZE_URL;

function createGatewayTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/desktop-gateway", desktopGatewayRouter);
  return app;
}

describe("memoryostm desktop gateway routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.MEMORYOSTM_DESKTOP_GATEWAY_PROVIDER_AUTHORIZE_URL =
      "https://provider.example/internal/desktop-provider/desktop/gateway/authorize";
    process.env.MEMORYOSTM_DESKTOP_GATEWAY_TARGETS_JSON = JSON.stringify([
      {
        id: "ubuntu-vnc-a",
        label: "Ubuntu VNC A",
        osTypes: ["ubuntu"],
        httpBaseUrl: "https://ubuntu-target.example",
        inputUrlTemplate: "https://ubuntu-target.example/sessions/{sessionId}/input",
        screenshotUrlTemplate: "https://ubuntu-target.example/sessions/{sessionId}/screenshot.png",
      },
      {
        id: "windows-vnc-a",
        label: "Windows VNC A",
        osTypes: ["windows"],
        httpBaseUrl: "https://windows-target.example",
        inputUrlTemplate: "https://windows-target.example/sessions/{sessionId}/input",
      },
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.MEMORYOSTM_DESKTOP_GATEWAY_TARGETS_JSON = originalTargetsJson;
    process.env.MEMORYOSTM_DESKTOP_GATEWAY_PROVIDER_AUTHORIZE_URL = originalAuthorizeUrl;
  });

  it("reports configured Ubuntu and Windows desktop targets", async () => {
    const app = createGatewayTestApp();
    const res = await request(app).get("/desktop-gateway/health");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.service).toBe("memoryostm-desktop-gateway");
    expect(res.body.targets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "ubuntu-vnc-a",
          osTypes: ["ubuntu"],
          hasWebSocketProxy: true,
          hasScreenshotCapture: true,
        }),
        expect.objectContaining({
          id: "windows-vnc-a",
          osTypes: ["windows"],
          hasWebSocketProxy: true,
        }),
      ]),
    );
  });

  it("rejects unauthorized desktop gateway sessions", async () => {
    const app = createGatewayTestApp();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("unauthorized", { status: 401 }),
    );

    const res = await request(app)
      .post("/desktop-gateway/sessions/session-1/input?target=ubuntu-vnc-a")
      .set("authorization", "Bearer wrong")
      .send({ event: { type: "key", key: "Enter", action: "press" } });

    expect(res.status).toBe(401);
    expect(res.body.accepted).toBe(false);
  });

  it("forwards authorized Ubuntu input to the configured target adapter", async () => {
    const app = createGatewayTestApp();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));

    const res = await request(app)
      .post("/desktop-gateway/sessions/session-ubuntu/input?target=ubuntu-vnc-a")
      .set("authorization", "Bearer token-ubuntu")
      .send({ event: { type: "text", text: "hello ubuntu" } });

    expect(res.status).toBe(200);
    expect(res.body.accepted).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("sessionId=session-ubuntu");
    expect(String(fetchMock.mock.calls[1]?.[0])).toBe(
      "https://ubuntu-target.example/sessions/session-ubuntu/input",
    );
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      method: "POST",
      headers: expect.objectContaining({ authorization: "Bearer token-ubuntu" }),
    });
  });

  it("prefers explicit desktop session query tokens over provider bearer headers", async () => {
    const app = createGatewayTestApp();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));

    const res = await request(app)
      .post("/desktop-gateway/sessions/session-ubuntu/input?target=ubuntu-vnc-a&token=token-ubuntu")
      .set("authorization", "Bearer provider-token")
      .send({ event: { type: "mouse_move", x: 320, y: 240 } });

    expect(res.status).toBe(200);
    expect(res.body.accepted).toBe(true);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("sessionId=session-ubuntu");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      headers: expect.objectContaining({ authorization: "Bearer token-ubuntu" }),
    });
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      headers: expect.objectContaining({ authorization: "Bearer token-ubuntu" }),
    });
  });

  it("proxies authorized screenshot capture as a no-store image response", async () => {
    const app = createGatewayTestApp();
    const screenshotBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response(screenshotBytes, {
          status: 200,
          headers: { "content-type": "image/png" },
        }),
      );

    const res = await request(app)
      .get("/desktop-gateway/sessions/session-ubuntu/screenshot?target=ubuntu-vnc-a&token=token-ubuntu")
      .buffer(true);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("image/png");
    expect(res.headers["cache-control"]).toBe("no-store");
    expect(res.headers["x-memoryostm-desktop-session"]).toBe("session-ubuntu");
    expect(Buffer.isBuffer(res.body)).toBe(true);
    expect(res.body.length).toBe(screenshotBytes.length);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1]?.[0])).toBe(
      "https://ubuntu-target.example/sessions/session-ubuntu/screenshot.png",
    );
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      method: "GET",
      headers: expect.objectContaining({ authorization: "Bearer token-ubuntu" }),
    });
  });

  it("rejects screenshot capture when the target returns non-image content", async () => {
    const app = createGatewayTestApp();
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ url: "https://unsafe.example/image.png" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

    const res = await request(app)
      .get("/desktop-gateway/sessions/session-ubuntu/screenshot?target=ubuntu-vnc-a&token=token-ubuntu");

    expect(res.status).toBe(502);
    expect(res.body.error).toBe("Desktop screenshot target returned a non-image response.");
  });

  it("returns a clear status when screenshot capture is not configured for a target", async () => {
    const app = createGatewayTestApp();
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(null, { status: 204 }));

    const res = await request(app)
      .get("/desktop-gateway/sessions/session-windows/screenshot?target=windows-vnc-a&token=token-windows");

    expect(res.status).toBe(501);
    expect(res.body.error).toBe("Desktop gateway target does not support screenshot capture.");
  });

  it("proxies authorized Windows HTTP traffic to the Windows target", async () => {
    const app = createGatewayTestApp();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response("<html>windows desktop</html>", {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
      );

    const res = await request(app)
      .get("/desktop-gateway/sessions/session-windows/proxy/vnc.html?target=windows-vnc-a&token=token-windows")
      .set("accept", "text/html");

    expect(res.status).toBe(200);
    expect(res.text).toContain("windows desktop");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1]?.[0])).toBe(
      "https://windows-target.example/vnc.html",
    );
  });

  it("rewrites Ubuntu webtop absolute asset paths so noVNC stays inside the gateway", async () => {
    const app = createGatewayTestApp();
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response(
          [
            '<script src="./assets/index-D2fS95jp.js"></script>',
            '<link href="./assets/index-BfqkCnaC.css" rel="stylesheet">',
            '<form action="login">',
            '<script src="src/universalTouchGamepad.js"></script>',
            '<link rel="manifest" href="manifest.json">',
            '<script>const ws = "/websockify?token=session-ubuntu";</script>',
            '<script>window.__asset = "/assets/runtime-client.js";</script>',
            '<script>import("/src/desktop-client.js")</script>',
          ].join(""),
          {
            status: 200,
            headers: { "content-type": "text/html; charset=utf-8" },
          },
        ),
      );

    const res = await request(app)
      .get("/desktop-gateway/sessions/session-ubuntu/proxy/vnc.html?target=ubuntu-vnc-a&token=token-ubuntu")
      .set("accept", "text/html");

    expect(res.status).toBe(200);
    expect(res.text).toContain(
      "/desktop-gateway/sessions/session-ubuntu/proxy/assets/index-D2fS95jp.js?target=ubuntu-vnc-a&token=token-ubuntu",
    );
    expect(res.text).toContain(
      "/desktop-gateway/sessions/session-ubuntu/proxy/assets/index-BfqkCnaC.css?target=ubuntu-vnc-a&token=token-ubuntu",
    );
    expect(res.text).toContain(
      "/desktop-gateway/sessions/session-ubuntu/proxy/login?target=ubuntu-vnc-a&token=token-ubuntu",
    );
    expect(res.text).toContain(
      "/desktop-gateway/sessions/session-ubuntu/proxy/src/universalTouchGamepad.js?target=ubuntu-vnc-a&token=token-ubuntu",
    );
    expect(res.text).toContain(
      "/desktop-gateway/sessions/session-ubuntu/proxy/manifest.json?target=ubuntu-vnc-a&token=token-ubuntu",
    );
    expect(res.text).toContain(
      "/ws/desktop-gateway/sessions/session-ubuntu?target=ubuntu-vnc-a&token=token-ubuntu",
    );
    expect(res.text).toContain(
      "/desktop-gateway/sessions/session-ubuntu/proxy/assets/runtime-client.js?target=ubuntu-vnc-a&token=token-ubuntu",
    );
    expect(res.text).toContain(
      "/desktop-gateway/sessions/session-ubuntu/proxy/src/desktop-client.js?target=ubuntu-vnc-a&token=token-ubuntu",
    );
  });

  it("forwards rewritten upstream noVNC tokens back to the target as token", async () => {
    const app = createGatewayTestApp();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response("socket target", { status: 200 }));

    const res = await request(app)
      .get("/desktop-gateway/sessions/session-ubuntu/proxy/websockify?target=ubuntu-vnc-a&token=auth-token&upstream_token=novnc-token")
      .set("accept", "text/plain");

    expect(res.status).toBe(200);
    expect(String(fetchMock.mock.calls[1]?.[0])).toBe(
      "https://ubuntu-target.example/websockify?token=novnc-token",
    );
  });

  it("rewrites CSS asset URLs through the gateway proxy", async () => {
    const app = createGatewayTestApp();
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response("body{background:url('/img/wallpaper.png')}", {
          status: 200,
          headers: { "content-type": "text/css" },
        }),
      );

    const res = await request(app)
      .get("/desktop-gateway/sessions/session-ubuntu/proxy/style.css?target=ubuntu-vnc-a&token=token-ubuntu")
      .set("accept", "text/css");

    expect(res.status).toBe(200);
    expect(res.text).toContain(
      "url('/desktop-gateway/sessions/session-ubuntu/proxy/img/wallpaper.png?target=ubuntu-vnc-a&token=token-ubuntu')",
    );
  });
});
