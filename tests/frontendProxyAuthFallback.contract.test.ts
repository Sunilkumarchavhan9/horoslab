import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const backendAuthSource = readFileSync(
  path.join(process.cwd(), "memoryos-frontend", "app", "api", "_lib", "backend-auth.ts"),
  "utf8",
);

const memoryTokenSource = readFileSync(
  path.join(process.cwd(), "memoryos-frontend", "app", "api", "memory", "token", "route.ts"),
  "utf8",
);

const memoryEventsSource = readFileSync(
  path.join(process.cwd(), "memoryos-frontend", "app", "api", "memory", "events", "route.ts"),
  "utf8",
);

const connectorCatchAllSource = readFileSync(
  path.join(process.cwd(), "memoryos-frontend", "app", "api", "connector", "[...connectorPath]", "route.ts"),
  "utf8",
);

const connectorRootSource = readFileSync(
  path.join(process.cwd(), "memoryos-frontend", "app", "api", "connector", "route.ts"),
  "utf8",
);

const sourcesCatchAllSource = readFileSync(
  path.join(process.cwd(), "memoryos-frontend", "app", "api", "sources", "[...path]", "route.ts"),
  "utf8",
);

const sourcesRootSource = readFileSync(
  path.join(process.cwd(), "memoryos-frontend", "app", "api", "sources", "route.ts"),
  "utf8",
);

const memoryIgnitionCatchAllSource = readFileSync(
  path.join(process.cwd(), "memoryos-frontend", "app", "api", "memoryignition", "[...path]", "route.ts"),
  "utf8",
);

const memoryIgnitionRootSource = readFileSync(
  path.join(process.cwd(), "memoryos-frontend", "app", "api", "memoryignition", "route.ts"),
  "utf8",
);

describe("frontend backend proxy auth fallback", () => {
  it("falls back to a dev user when Clerk is configured but no Clerk user is present", () => {
    expect(backendAuthSource).toContain("async function resolveProxyAuthScope");
    expect(backendAuthSource).toContain("if (authState.userId) {");
    expect(backendAuthSource).toContain("return {");
    expect(backendAuthSource).toContain("userId: devUserId");
    expect(backendAuthSource).toContain("orgId: getDevOrgId()");

    for (const source of [memoryTokenSource, memoryEventsSource, connectorCatchAllSource]) {
      expect(source).toContain('process.env.NODE_ENV === "development"');
      expect(source).toContain('process.env.MEMORYOS_DEV_USER_ID?.trim() || "user-demo"');
    }
  });

  it("forwards synthesized backend auth on connector root and subroutes", () => {
    expect(connectorRootSource).toContain("createBackendAuthHeader");
    expect(connectorRootSource).toContain('headers.set("authorization", authHeader)');
    expect(connectorRootSource).toContain("applyProxyOrgIdHeader");

    expect(connectorCatchAllSource).toContain("createConnectorAuthHeader");
    expect(connectorCatchAllSource).toContain('headers.set("authorization", authHeader)');
    expect(connectorCatchAllSource).toContain("!isOAuthCallback");
  });

  it("guards root re-exported catch-all proxies when route params are absent", () => {
    for (const source of [sourcesCatchAllSource, memoryIgnitionCatchAllSource]) {
      expect(source).toContain("const params = context?.params ? await context.params : {}");
      expect(source).toContain("const path = params?.path ?? []");
    }

    expect(sourcesRootSource).toContain('export { GET, POST } from "./[...path]/route"');
    expect(memoryIgnitionRootSource).toContain('export { GET, POST } from "./[...path]/route"');
  });
});
