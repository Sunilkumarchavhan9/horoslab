import { createHash, createHmac } from "node:crypto";

export type EpochS3Config = { endpoint: string; bucket: string; region: string; accessKeyId: string; secretAccessKey: string; fetch?: typeof fetch };
export type EpochStoredObject = { key: string; etag?: string; contentType?: string; bytes: number };

function hash(value: string | Uint8Array): string { return createHash("sha256").update(value).digest("hex"); }
function hmac(key: string | Uint8Array, value: string): Buffer { return createHmac("sha256", key).update(value).digest(); }
function encodePath(value: string): string { return value.split("/").map((part) => encodeURIComponent(part)).join("/"); }

export class EpochS3ObjectStorage {
  private readonly config: EpochS3Config;
  private readonly http: typeof fetch;
  constructor(config: EpochS3Config) { if (!/^https:\/\//i.test(config.endpoint)) throw new Error("epoch_s3_endpoint_must_use_https"); this.config = { ...config, endpoint: config.endpoint.replace(/\/$/, "") }; this.http = config.fetch ?? fetch; }

  private signedRequest(method: string, key: string, body: Uint8Array | undefined, contentType?: string): { url: string; headers: Record<string, string> } {
    const now = new Date(); const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ""); const date = amzDate.slice(0, 8); const url = new URL(`${this.config.endpoint}/${encodeURIComponent(this.config.bucket)}/${encodePath(key)}`); const host = url.host; const payloadHash = hash(body ?? new Uint8Array());
    const headers: Record<string, string> = { host, "x-amz-content-sha256": payloadHash, "x-amz-date": amzDate }; if (contentType) headers["content-type"] = contentType;
    const signedHeaders = Object.keys(headers).sort().join(";"); const canonicalHeaders = Object.keys(headers).sort().map((name) => `${name}:${headers[name].trim()}\n`).join(""); const canonicalRequest = `${method}\n${url.pathname}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
    const scope = `${date}/${this.config.region}/s3/aws4_request`; const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${hash(canonicalRequest)}`; const signingKey = hmac(hmac(hmac(hmac(`AWS4${this.config.secretAccessKey}`, date), this.config.region), "s3"), "aws4_request"); const signature = hmac(signingKey, stringToSign).toString("hex");
    headers.authorization = `AWS4-HMAC-SHA256 Credential=${this.config.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    return { url: url.toString(), headers };
  }

  async put(key: string, body: Uint8Array, contentType = "application/octet-stream"): Promise<EpochStoredObject> {
    const request = this.signedRequest("PUT", key, body, contentType); const response = await this.http(request.url, { method: "PUT", headers: request.headers, body: body as BodyInit });
    if (!response.ok) throw new Error(`epoch_s3_put_failed:${response.status}`);
    return { key, etag: response.headers.get("etag") ?? undefined, contentType, bytes: body.byteLength };
  }

  async get(key: string): Promise<Uint8Array> {
    const request = this.signedRequest("GET", key, undefined); const response = await this.http(request.url, { method: "GET", headers: request.headers });
    if (!response.ok) throw new Error(`epoch_s3_get_failed:${response.status}`);
    return new Uint8Array(await response.arrayBuffer());
  }
}
