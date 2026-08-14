import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalEnv = {
  provider: process.env.MEMORYOSTM_DESKTOP_PROVIDER,
  baseUrl: process.env.MEMORYOSTM_DESKTOP_PROVIDER_BASE_URL,
  token: process.env.MEMORYOSTM_DESKTOP_PROVIDER_TOKEN,
};

describe("desktop provider adapter", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env.MEMORYOSTM_DESKTOP_PROVIDER = originalEnv.provider;
    process.env.MEMORYOSTM_DESKTOP_PROVIDER_BASE_URL = originalEnv.baseUrl;
    process.env.MEMORYOSTM_DESKTOP_PROVIDER_TOKEN = originalEnv.token;
    vi.unstubAllGlobals();
  });

  it("maps external provider start/status/stop responses including artifact ids", async () => {
    process.env.MEMORYOSTM_DESKTOP_PROVIDER = "external";
    process.env.MEMORYOSTM_DESKTOP_PROVIDER_BASE_URL = "https://desktop-provider.example";
    process.env.MEMORYOSTM_DESKTOP_PROVIDER_TOKEN = "secret-token";

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            session: {
              provider: "browser",
              state: "live",
              osType: "windows",
              previewUrl: "https://preview.example/start",
              controlUrl: "https://control.example/start",
              providerSessionId: "session-1",
              runtimeMessage: "Desktop started",
              previewArtifactId: "preview-a1",
              recordingArtifactId: "recording-r1",
              lastFrameAt: "2026-06-15T00:00:00.000Z",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            session: {
              provider: "browser",
              state: "live",
              osType: "windows",
              previewUrl: "https://preview.example/status",
              controlUrl: "https://control.example/status",
              providerSessionId: "session-1",
              runtimeMessage: "Desktop is live",
              previewArtifactId: "preview-a1",
              recordingArtifactId: "recording-r1",
              lastFrameAt: "2026-06-15T00:01:00.000Z",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            session: {
              provider: "browser",
              state: "idle",
              osType: "windows",
              previewUrl: "https://preview.example/status",
              controlUrl: "https://control.example/status",
              providerSessionId: "session-1",
              runtimeMessage: "Desktop stopped",
              previewArtifactId: "preview-a1",
              recordingArtifactId: "recording-r1",
              lastFrameAt: "2026-06-15T00:01:00.000Z",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            accepted: true,
            message: "Input accepted",
            at: "2026-06-15T00:02:00.000Z",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            connected: true,
            mode: "webrtc",
            latencyMs: 88,
            fps: 30,
            width: 1280,
            height: 720,
            cursorVisible: true,
            at: "2026-06-15T00:03:00.000Z",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            captured: true,
            imageUrl: "https://proof.example/session-1.png",
            contentType: "image/png",
            width: 1280,
            height: 720,
            at: "2026-06-15T00:04:00.000Z",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    vi.stubGlobal("fetch", fetchMock);

    const { getDesktopProviderAdapter } = await import("../../server/services/desktop-provider");
    const adapter = getDesktopProviderAdapter();

    const started = await adapter.startOrWakeSession({
      threadId: "thread-123",
      osType: "windows",
      existingSession: null,
    });
    expect(started.state).toBe("live");
    expect(started.osType).toBe("windows");
    expect(started.previewArtifactId).toBe("preview-a1");
    expect(started.recordingArtifactId).toBe("recording-r1");

    const status = await adapter.getSessionStatus({
      threadId: "thread-123",
      osType: "windows",
      existingSession: null,
    });
    expect(status.state).toBe("live");
    expect(status.previewUrl).toBe("https://preview.example/status");
    expect(status.recordingArtifactId).toBe("recording-r1");

    const stopped = await adapter.stopSession({
      threadId: "thread-123",
      osType: "windows",
      existingSession: null,
    });
    expect(stopped.state).toBe("idle");
    expect(stopped.previewArtifactId).toBe("preview-a1");

    const input = await adapter.sendInput({
      threadId: "thread-123",
      osType: "windows",
      existingSession: null,
      event: { type: "mouse_click", x: 10, y: 20, button: "left", action: "click" },
    });
    expect(input.accepted).toBe(true);

    const stream = await adapter.getStreamState({
      threadId: "thread-123",
      osType: "windows",
      existingSession: null,
    });
    expect(stream.connected).toBe(true);
    expect(stream.mode).toBe("webrtc");
    expect(stream.latencyMs).toBe(88);

    const screenshot = await adapter.captureScreenshot({
      threadId: "thread-123",
      osType: "windows",
      existingSession: null,
    });
    expect(screenshot.captured).toBe(true);
    expect(screenshot.imageUrl).toBe("https://proof.example/session-1.png");
    expect(screenshot.contentType).toBe("image/png");

    expect(fetchMock).toHaveBeenCalledTimes(6);
    const firstCall = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(firstCall[0]).toBe("https://desktop-provider.example/desktop/sessions/start");
    expect(firstCall[1].method).toBe("POST");
    const authHeader =
      firstCall[1].headers && typeof firstCall[1].headers === "object"
        ? (firstCall[1].headers as Record<string, string>).Authorization
        : undefined;
    expect(authHeader).toBe("Bearer secret-token");
  });

  it("falls back to start when an external resume endpoint is not available", async () => {
    process.env.MEMORYOSTM_DESKTOP_PROVIDER = "external";
    process.env.MEMORYOSTM_DESKTOP_PROVIDER_BASE_URL = "https://desktop-provider.example";
    process.env.MEMORYOSTM_DESKTOP_PROVIDER_TOKEN = "secret-token";

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            session: {
              provider: "browser",
              state: "live",
              osType: "ubuntu",
              previewUrl: "https://preview.example/resume",
              controlUrl: "https://control.example/resume",
              providerSessionId: "resume-session-1",
              resumeToken: "resume-token-1",
              runtimeMessage: "Desktop resumed",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    vi.stubGlobal("fetch", fetchMock);

    const { getDesktopProviderAdapter } = await import("../../server/services/desktop-provider");
    const adapter = getDesktopProviderAdapter();

    const resumed = await adapter.resumeSession({
      threadId: "thread-456",
      osType: "ubuntu",
      existingSession: {
        provider: "browser",
        state: "idle",
        osType: "ubuntu",
        providerSessionId: "resume-session-1",
        resumeToken: "resume-token-1",
      } as Parameters<typeof adapter.resumeSession>[0]["existingSession"],
    });

    expect(resumed.state).toBe("live");
    expect(resumed.providerSessionId).toBe("resume-session-1");
    expect(resumed.resumeToken).toBe("resume-token-1");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "https://desktop-provider.example/desktop/sessions/resume",
    );
    expect(String(fetchMock.mock.calls[1]?.[0])).toBe(
      "https://desktop-provider.example/desktop/sessions/start",
    );
  });
});
