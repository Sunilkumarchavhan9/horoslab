import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

describe("connector health permission diagnostics", () => {
  const source = readFileSync(
    path.join(process.cwd(), "server", "routes", "connector.routes.ts"),
    "utf8",
  );
  const permissionsSource = readFileSync(
    path.join(process.cwd(), "lib", "integrations", "connectorPermissions.ts"),
    "utf8",
  );

  it("surfaces source permissions from the live connector health endpoint", () => {
    expect(source).toContain('"/health"');
    expect(source).toContain("buildConnectorPermissionDiagnostics");
    expect(source).toContain("permissions: buildConnectorPermissionDiagnostics");
    expect(permissionsSource).toContain("requiredScopesForConnector");
    expect(permissionsSource).toContain("requiredScopes");
    expect(permissionsSource).toContain("grantedScopes");
    expect(permissionsSource).toContain("missingScopes");
    expect(permissionsSource).toContain("tokenStored");
    expect(permissionsSource).toContain("workspaceScoped");
    expect(permissionsSource).toContain("reconnectRequired");
    expect(permissionsSource).toContain("scopeVerification");
    expect(source).toContain("connectorPermissionBlockerMessage");
  });

  it("keeps Phase 7 scope proof honest for P0 direct connectors", () => {
    expect(permissionsSource).toContain("GITHUB_OAUTH_SCOPE");
    expect(permissionsSource).toContain("channels:history");
    expect(permissionsSource).toContain("LINEAR_OAUTH_SCOPES");
    expect(permissionsSource).toContain("read:jira-work");
  });

  it("blocks sync before ingesting source evidence when known scopes are missing", () => {
    expect(permissionsSource).toContain("sync blocked: missing required scopes");
    expect(permissionsSource).toContain("Reconnect this source before using it for inheritance");
    expect(source).toContain("permissions: buildConnectorPermissionDiagnostics");
    expect(source).toContain("throw new Error(permissionBlocker)");
  });
});
