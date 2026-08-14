import { describe, expect, it, vi } from "vitest";
import { EpochS3ObjectStorage } from "../lib/epoch/s3ObjectStorage";

describe("S3-compatible production artifact storage", () => {
  it("signs PUT and GET requests with SigV4", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (_input, init) => new Response(init?.method === "GET" ? new Uint8Array([1, 2]) : "", { status: 200, headers: { etag: "etag-1" } }));
    const storage = new EpochS3ObjectStorage({ endpoint: "https://nyc3.digitaloceanspaces.com", bucket: "epoch-prod", region: "nyc3", accessKeyId: "access", secretAccessKey: "secret", fetch: fetcher });
    expect(await storage.put("evidence/m1/a.bin", new Uint8Array([1, 2]))).toMatchObject({ key: "evidence/m1/a.bin", bytes: 2 });
    expect(await storage.get("evidence/m1/a.bin")).toEqual(new Uint8Array([1, 2]));
    expect(String(fetcher.mock.calls[0][1]?.headers && (fetcher.mock.calls[0][1]?.headers as Record<string, string>).authorization)).toContain("AWS4-HMAC-SHA256");
  });

  it("requires HTTPS endpoints", () => {
    expect(() => new EpochS3ObjectStorage({ endpoint: "http://storage", bucket: "b", region: "r", accessKeyId: "a", secretAccessKey: "s" })).toThrow("epoch_s3_endpoint_must_use_https");
  });
});
