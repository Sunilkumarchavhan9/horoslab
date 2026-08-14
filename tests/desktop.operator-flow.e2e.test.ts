import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { makeToken } from "./helpers/authToken";
import { createMemoryOsApp } from "../server/app";

describe("desktop operator flow e2e", () => {
  const app = createMemoryOsApp();
  let authHeader = "";

  beforeEach(async () => {
    authHeader = `Bearer ${await makeToken("u_desktop_operator_e2e")}`;
  });

  it.each(["ubuntu", "windows"] as const)(
    "supports %s start -> stream -> input -> stop -> status flow",
    async (osType) => {
    const createRes = await request(app)
      .post("/api/runtime/threads")
      .set("authorization", authHeader)
      .send({ title: `Desktop e2e ${osType}`, workspace: "default", project: "memoryos" });
    const threadId = createRes.body.data.thread.id as string;

    const startRes = await request(app)
      .post(`/api/runtime/threads/${threadId}/desktop/start`)
      .set("authorization", authHeader)
      .send({ osType });
    expect(startRes.status).toBe(200);
    expect(startRes.body.data.desktop.state).toBe("live");
    expect(startRes.body.data.desktop.osType).toBe(osType);
    expect(startRes.body.data.desktop.previewUrl || startRes.body.data.desktop.controlUrl).toBeTruthy();

    const streamRes = await request(app)
      .get(`/api/runtime/threads/${threadId}/desktop/stream`)
      .set("authorization", authHeader);
    expect(streamRes.status).toBe(200);
    expect(streamRes.body.data.stream.connected).toBe(true);
    expect(streamRes.body.data.stream.resumeSupported).toBe(true);

    const keyInputRes = await request(app)
      .post(`/api/runtime/threads/${threadId}/desktop/input`)
      .set("authorization", authHeader)
      .send({ osType, event: { type: "key", key: "Enter", action: "press" } });
    expect(keyInputRes.status).toBe(200);
    expect(keyInputRes.body.data.input.accepted).toBe(true);

    const mouseInputRes = await request(app)
      .post(`/api/runtime/threads/${threadId}/desktop/input`)
      .set("authorization", authHeader)
      .send({
        osType,
        event: { type: "mouse_click", x: 128, y: 96, button: "left", action: "click" },
      });
    expect(mouseInputRes.status).toBe(200);
    expect(mouseInputRes.body.data.input.accepted).toBe(true);

    const statusLiveRes = await request(app)
      .get(`/api/runtime/threads/${threadId}/desktop/status`)
      .set("authorization", authHeader);
    expect(statusLiveRes.status).toBe(200);
    expect(statusLiveRes.body.data.desktop.state).toBe("live");
    expect(statusLiveRes.body.data.desktop.osType).toBe(osType);

    const stopRes = await request(app)
      .post(`/api/runtime/threads/${threadId}/desktop/stop`)
      .set("authorization", authHeader)
      .send({ osType });
    expect(stopRes.status).toBe(200);
    expect(stopRes.body.data.desktop.state).toBe("idle");

    const statusIdleRes = await request(app)
      .get(`/api/runtime/threads/${threadId}/desktop/status`)
      .set("authorization", authHeader);
    expect(statusIdleRes.status).toBe(200);
    expect(statusIdleRes.body.data.desktop.state).toBe("idle");
    expect(statusIdleRes.body.data.thread.desktopSession.osType).toBe(osType);
    },
  );
});
