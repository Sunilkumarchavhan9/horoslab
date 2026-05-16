import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCrmProvider, fetchSupportProvider } from "../lib/companyBrain/providerAdapters";

describe("Company Brain Provider Adapters", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetchCrmProvider(salesforce) follows nextRecordsUrl and returns cursor", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          records: [{ id: "sf_1", updatedAt: "2026-05-16T10:00:00.000Z" }],
          nextRecordsUrl: "https://example.my.salesforce.com/services/data/v60.0/query/01gNEXT",
          done: false,
        }),
      });

    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    const result = await fetchCrmProvider({
      provider: "salesforce",
      apiUrl: "https://example.my.salesforce.com/services/data/v60.0/query",
      cursor: "",
      lastCheckpointEpochMs: 0,
      bearerToken: "abc",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toContain("limit=50");
    expect(result.items).toHaveLength(1);
    expect(result.nextCursor).toBe("https://example.my.salesforce.com/services/data/v60.0/query/01gNEXT");
    expect(result.checkpointEpochMs).toBeGreaterThan(0);
  });

  it("fetchCrmProvider(hubspot search) includes delta filter and after cursor", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{ id: "hs_1", lastmodifieddate: "2026-05-16T10:00:00.000Z" }],
        paging: { next: { after: "next_hs_cursor" } },
      }),
    });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    await fetchCrmProvider({
      provider: "hubspot",
      apiUrl: "https://api.hubapi.com/crm/v3/objects/contacts/search",
      cursor: "hs_cursor_1",
      lastCheckpointEpochMs: 1710000000000,
      bearerToken: "abc",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] ?? [];
    const body = JSON.parse(String((init as RequestInit).body ?? "{}")) as Record<string, unknown>;
    expect(body.after).toBe("hs_cursor_1");
    expect(Array.isArray(body.filterGroups)).toBe(true);
  });

  it("fetchSupportProvider(zendesk) includes cursor + start_time query params", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        tickets: [{ id: "zd_1", updated_at: "2026-05-16T10:00:00.000Z" }],
        meta: { after_cursor: "zd_next", has_more: true },
      }),
    });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    const checkpoint = Date.UTC(2026, 4, 16, 9, 0, 0);
    const result = await fetchSupportProvider({
      provider: "zendesk",
      subdomain: "acme",
      cursor: "zd_cursor",
      lastCheckpointEpochMs: checkpoint,
      bearerToken: "abc",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toContain("page%5Bafter%5D=zd_cursor");
    expect(String(url)).toContain(`start_time=${Math.floor(checkpoint / 1000)}`);
    expect(result.nextCursor).toBe("zd_next");
  });
});

