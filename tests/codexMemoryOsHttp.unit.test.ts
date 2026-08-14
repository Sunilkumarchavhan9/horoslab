import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getBaseUrl,
  getToken,
  invokeMemoryOs,
  postMemoryOs,
  requestMemoryOs,
} from "../scripts/codex-memoryos-http";

describe("Codex MemoryOS HTTP helper", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("builds direct API requests with the MemoryOS bearer token", async () => {
    vi.stubEnv("MEMORYOS_BASE_URL", "http://localhost:3011");
    vi.stubEnv("MEMORYOS_API_TOKEN", "token-123");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ ok: true, data: { result: { saved: true } } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      requestMemoryOs("/api/memory/memoryignition/outcome", { task: "Ship the bridge fallback" }),
    ).resolves.toEqual({ ok: true, data: { result: { saved: true } } });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:3011/api/memory/memoryignition/outcome");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-123",
      },
    });
  });

  it("unwraps the tool result payload from the MCP invoke route", async () => {
    vi.stubEnv("MEMORYOS_BASE_URL", "http://localhost:3011");
    vi.stubEnv("MEMORYOS_API_TOKEN", "token-123");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ ok: true, data: { result: { outcome_recorded: true } } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(invokeMemoryOs("memoryignition_save_outcome", { task: "Ship the bridge fallback" })).resolves.toEqual({
      outcome_recorded: true,
    });
    await expect(postMemoryOs("/api/memory/memoryignition/brief", { task: "Ship the bridge fallback" })).resolves.toEqual({
      ok: true,
      data: { result: { outcome_recorded: true } },
    });
  });

  it("retries local Unauthorized responses with a short-lived Codex JWT", async () => {
    vi.stubEnv("MEMORYOS_BASE_URL", "http://localhost:3011");
    vi.stubEnv("MEMORYOS_API_TOKEN", "stale-token");
    vi.stubEnv("MEMORYOS_JWT_SECRET", "local-secret-for-tests");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ error: "Unauthorized" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ data: { outcome_recorded: true } }),
      });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      requestMemoryOs("/api/memory/memoryignition/outcome", { outcome: "Saved after retry" }),
    ).resolves.toEqual({ data: { outcome_recorded: true } });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      headers: expect.objectContaining({ Authorization: "Bearer stale-token" }),
    });
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      headers: expect.objectContaining({ "Content-Type": "application/json" }),
    });
    expect(String((fetchMock.mock.calls[1]?.[1] as RequestInit)?.headers && ((fetchMock.mock.calls[1]?.[1] as RequestInit).headers as Record<string, string>).Authorization)).toMatch(/^Bearer /);
    expect(String(((fetchMock.mock.calls[1]?.[1] as RequestInit).headers as Record<string, string>).Authorization)).not.toBe("Bearer stale-token");
  });

  it("uses the configured base URL and token helpers", () => {
    vi.stubEnv("MEMORYOS_BASE_URL", "http://localhost:3011/");
    vi.stubEnv("MEMORYOS_API_TOKEN", "token-123");

    expect(getBaseUrl()).toBe("http://localhost:3011");
    expect(getToken()).toBe("token-123");
  });
});
