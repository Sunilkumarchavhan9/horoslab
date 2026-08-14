import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_VERSION = "epoch.artifact.token.v1";

function encode(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function sign(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

export function issueEpochArtifactAccessToken(input: {
  workspaceId: string;
  artifactId: string;
  secret: string;
  ttlSeconds?: number;
  now?: number;
}): { token: string; expiresAt: string } {
  if (!input.secret) throw new Error("epoch_artifact_signing_secret_missing");
  const now = input.now ?? Math.floor(Date.now() / 1000);
  const ttl = Math.max(30, Math.min(900, Math.floor(input.ttlSeconds ?? 300)));
  const payload = { v: TOKEN_VERSION, workspaceId: input.workspaceId, artifactId: input.artifactId, iat: now, exp: now + ttl };
  const body = encode(payload);
  return { token: `${body}.${sign(body, input.secret)}`, expiresAt: new Date((now + ttl) * 1000).toISOString() };
}

export function verifyEpochArtifactAccessToken(input: {
  token: string;
  workspaceId: string;
  artifactId: string;
  secret: string;
  now?: number;
}): { valid: boolean; reason?: string } {
  if (!input.secret) return { valid: false, reason: "signing_secret_missing" };
  const [body, signature] = input.token.split(".");
  if (!body || !signature) return { valid: false, reason: "malformed_token" };
  const expected = sign(body, input.secret);
  const actualBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  if (actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) return { valid: false, reason: "invalid_signature" };
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Record<string, unknown>;
    const now = input.now ?? Math.floor(Date.now() / 1000);
    if (payload.v !== TOKEN_VERSION || payload.workspaceId !== input.workspaceId || payload.artifactId !== input.artifactId) return { valid: false, reason: "token_scope_mismatch" };
    if (typeof payload.exp !== "number" || now >= payload.exp) return { valid: false, reason: "token_expired" };
    return { valid: true };
  } catch {
    return { valid: false, reason: "malformed_token" };
  }
}
