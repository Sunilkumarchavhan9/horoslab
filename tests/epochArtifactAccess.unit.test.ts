import { describe, expect, it } from "vitest";
import { issueEpochArtifactAccessToken, verifyEpochArtifactAccessToken } from "../lib/epoch/artifactAccess";

describe("Epoch signed artifact access", () => {
  const base = { workspaceId: "workspace-1", artifactId: "artifact-1", secret: "test-secret", now: 1_000 };

  it("binds a short-lived token to workspace and artifact", () => {
    const issued = issueEpochArtifactAccessToken({ ...base, ttlSeconds: 60 });
    expect(verifyEpochArtifactAccessToken({ ...base, token: issued.token, now: 1_030 })).toEqual({ valid: true });
    expect(verifyEpochArtifactAccessToken({ ...base, artifactId: "artifact-2", token: issued.token, now: 1_030 }).valid).toBe(false);
  });

  it("rejects tampering and expiry", () => {
    const issued = issueEpochArtifactAccessToken({ ...base, ttlSeconds: 60 });
    const tampered = `${issued.token.slice(0, -1)}x`;
    expect(verifyEpochArtifactAccessToken({ ...base, token: tampered, now: 1_030 }).valid).toBe(false);
    expect(verifyEpochArtifactAccessToken({ ...base, token: issued.token, now: 1_060 }).reason).toBe("token_expired");
  });
});
