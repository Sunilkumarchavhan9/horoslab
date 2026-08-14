import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function installBrowserGlobals() {
  const storage = new Map<string, string>();
  const localStorage = {
    getItem: vi.fn((key: string) => storage.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      storage.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      storage.delete(key);
    }),
  };

  vi.stubGlobal("window", {
    atob: (value: string) => Buffer.from(value, "base64").toString("utf8"),
    localStorage,
  });
}

describe("memory token bridge", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-30T10:00:00.000Z"));
    installBrowserGlobals();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("dedupes concurrent bridge requests and cools down after unauthorized responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);
    const { getOrCreateMemoryToken } = await import("../memoryos-frontend/lib/memory-token");

    const [first, second, third] = await Promise.all([
      getOrCreateMemoryToken(),
      getOrCreateMemoryToken(),
      getOrCreateMemoryToken(),
    ]);

    expect(first).toBeNull();
    expect(second).toBeNull();
    expect(third).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await getOrCreateMemoryToken();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(2_600);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ token: "not-a-jwt" }), { status: 200 }));

    await getOrCreateMemoryToken();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
