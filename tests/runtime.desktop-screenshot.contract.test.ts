import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { makeToken } from "./helpers/authToken";

const originalProvider = process.env.MEMORYOSTM_DESKTOP_PROVIDER;
const originalProviderBaseUrl = process.env.MEMORYOSTM_DESKTOP_PROVIDER_BASE_URL;
const originalProviderToken = process.env.MEMORYOSTM_DESKTOP_PROVIDER_TOKEN;
const originalAllowedOrigins =
  process.env.MEMORYOSTM_DESKTOP_SCREENSHOT_FETCH_ALLOWED_ORIGINS;
const originalScreenshotMaxBytes = process.env.MEMORYOSTM_DESKTOP_SCREENSHOT_MAX_BYTES;

describe("runtime desktop screenshot proof capture", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    process.env.MEMORYOSTM_DESKTOP_PROVIDER = "external";
    process.env.MEMORYOSTM_DESKTOP_PROVIDER_BASE_URL =
      "https://provider.example/internal/desktop-provider";
    process.env.MEMORYOSTM_DESKTOP_PROVIDER_TOKEN = "provider-test-token";
    process.env.MEMORYOSTM_DESKTOP_SCREENSHOT_FETCH_ALLOWED_ORIGINS =
      "https://desktop-gateway.example";
    process.env.MEMORYOSTM_DESKTOP_SCREENSHOT_MAX_BYTES = "1024";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.MEMORYOSTM_DESKTOP_PROVIDER = originalProvider;
    process.env.MEMORYOSTM_DESKTOP_PROVIDER_BASE_URL = originalProviderBaseUrl;
    process.env.MEMORYOSTM_DESKTOP_PROVIDER_TOKEN = originalProviderToken;
    process.env.MEMORYOSTM_DESKTOP_SCREENSHOT_FETCH_ALLOWED_ORIGINS =
      originalAllowedOrigins;
    process.env.MEMORYOSTM_DESKTOP_SCREENSHOT_MAX_BYTES =
      originalScreenshotMaxBytes;
  });

  it("persists gateway screenshot bytes into a visual proof artifact", async () => {
    const screenshotUrl =
      "https://desktop-gateway.example/desktop-gateway/sessions/fleet-ubuntu-1/screenshot?target=ubuntu-vnc-a&token=desktop-token";
    const imageBytes = new Uint8Array([137, 80, 78, 71]);
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input) => {
        const url = String(input);
        if (url.endsWith("/desktop/sessions/start")) {
          return new Response(
            JSON.stringify({
              session: {
                provider: "browser",
                state: "live",
                osType: "ubuntu",
                previewUrl:
                  "https://desktop-gateway.example/desktop-gateway/sessions/fleet-ubuntu-1/view?target=ubuntu-vnc-a&token=desktop-token",
                controlUrl:
                  "https://desktop-gateway.example/desktop-gateway/sessions/fleet-ubuntu-1/view?target=ubuntu-vnc-a&token=desktop-token",
                providerSessionId: "fleet-ubuntu-1",
                sessionAuthToken: "desktop-token",
                sessionAuthExpiresAt: new Date(Date.now() + 60_000).toISOString(),
                transportMode: "vnc",
                nodeId: "ubuntu-vnc-a",
                runtimeMessage: "Ubuntu desktop is live.",
              },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }
        if (url.includes("/desktop/sessions/screenshot")) {
          return new Response(
            JSON.stringify({
              captured: true,
              imageUrl: screenshotUrl,
              contentType: "image/png",
              width: 1024,
              height: 768,
              message: "Desktop screenshot proof captured.",
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }
        if (url === screenshotUrl) {
          return new Response(imageBytes, {
            status: 200,
            headers: {
              "content-length": String(imageBytes.length),
              "content-type": "image/png",
            },
          });
        }
        return new Response("unexpected request", { status: 500 });
      });

    const { createMemoryOsApp } = await import("../server/app");
    const app = createMemoryOsApp();
    const authHeader = `Bearer ${await makeToken("u_runtime_desktop_screenshot")}`;

    const createRes = await request(app)
      .post("/api/runtime/threads")
      .set("authorization", authHeader)
      .send({ title: "Desktop proof thread", workspace: "default", project: "memoryos" });
    expect(createRes.status).toBe(201);
    const threadId = createRes.body.data.thread.id as string;

    const startRes = await request(app)
      .post(`/api/runtime/threads/${threadId}/desktop/start`)
      .set("authorization", authHeader)
      .send({ osType: "ubuntu" });
    expect(startRes.status).toBe(200);

    const captureRes = await request(app)
      .post(`/api/runtime/threads/${threadId}/desktop/screenshot`)
      .set("authorization", authHeader)
      .send({ osType: "ubuntu" });

    expect(captureRes.status).toBe(201);
    expect(captureRes.body.data.screenshot.captured).toBe(true);
    expect(captureRes.body.data.artifact.content).toBe("data:image/png;base64,iVBORw==");
    expect(captureRes.body.data.artifact.metadata.tags).toEqual(
      expect.arrayContaining([
        "desktop",
        "screenshot",
        "visual-proof",
        "ubuntu",
        "persisted-proof",
      ]),
    );
    expect(captureRes.body.data.artifact.description).toContain(
      "Screenshot proof image persisted",
    );
    expect(fetchMock).toHaveBeenCalledWith(
      screenshotUrl,
      expect.objectContaining({ method: "GET" }),
    );
  }, 15000);
});
