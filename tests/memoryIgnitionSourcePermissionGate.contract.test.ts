import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

describe("MemoryIgnition source permission gate", () => {
  const sdkSource = readFileSync(
    path.join(process.cwd(), "lib", "SDK", "memoryHooks.ts"),
    "utf8",
  );
  const permissionsSource = readFileSync(
    path.join(process.cwd(), "lib", "integrations", "connectorPermissions.ts"),
    "utf8",
  );

  it("loads connector permission trust before MemoryIgnition inherits retrieved memories", () => {
    expect(sdkSource).toContain("loadMemoryIgnitionSourceTrust");
    expect(sdkSource).toContain("buildConnectorPermissionDiagnostics");
    expect(sdkSource).toContain("connectorTypeFromSourceRef");
    expect(sdkSource).toContain("sourceTrust");
    expect(sdkSource).toContain("source_permissions");
  });

  it("withholds blocked source memories from the trusted inheritance package", () => {
    expect(sdkSource).toContain('sourceTrust?.status === "blocked"');
    expect(sdkSource).toContain("allowedMemories");
    expect(sdkSource).toContain("allowedTraceProof");
    expect(sdkSource).toContain("relevant_memories: agentRelevant");
    expect(sdkSource).toContain("trace_proof: agentTraceProof");
    expect(sdkSource).toContain("blocked_memories: inheritanceGateResult.blockedMemories");
  });

  it("maps source refs to connector types for connector-backed memory trust", () => {
    expect(permissionsSource).toContain("connectorTypeFromSourceRef");
    expect(permissionsSource).toContain('if (normalized === "docs") return "local_files"');
    expect(permissionsSource).toContain('if (normalized === "github_actions") return "ci_cd_logs"');
    expect(permissionsSource).toContain('if (normalized === "sentry") return "deployment_errors"');
    expect(permissionsSource).toContain('if (normalized === "devin_session" || normalized === "devin") return "devin_chats"');
  });
});
