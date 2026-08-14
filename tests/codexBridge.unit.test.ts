import { describe, expect, it } from "vitest";
import {
  buildCodexMemoryOsMcpConfig,
  buildCodexMemoryOsPrompt,
  buildCodexSessionImportContent,
} from "../lib/integrations/codexBridge";

describe("Codex Epoch bridge", () => {
  it("builds project-scoped Codex MCP config without embedding API tokens", () => {
    const config = buildCodexMemoryOsMcpConfig({
      cwd: "C:\\projects\\MemoryOS",
      baseUrl: "http://localhost:3011",
    });

    expect(config).toContain("[mcp_servers.epoch]");
    expect(config).toContain('args = ["run", "epoch:mcp:stdio"]');
    expect(config).toContain('env_vars = ["EPOCH_API_KEY", "EPOCH_API_TOKEN"]');
    expect(config).toContain('EPOCH_BASE_URL = "http://localhost:3011"');
    expect(config).toContain("memoryignition_get_brief");
    expect(config).not.toContain("sk-");
  });

  it("builds a Codex prompt with the MemoryIgnition brief and task", () => {
    const prompt = buildCodexMemoryOsPrompt({
      task: "Fix the Phase 1 connector gate",
      brief: {
        risky_files: ["server/routes/connector.routes.ts"],
        required_tests: ["npm test -- --run tests/memoryMcp.contract.test.ts"],
      },
    });

    expect(prompt).toContain("MemoryIgnition Brief");
    expect(prompt).toContain("server/routes/connector.routes.ts");
    expect(prompt).toContain("Fix the Phase 1 connector gate");
    expect(prompt).toContain("direct Epoch HTTP routes");
  });

  it("builds a local Codex session source file for Company Brain import", () => {
    const content = buildCodexSessionImportContent({
      task: "Wire Codex to Epoch",
      threadId: "codex-123",
      project: "MemoryOS",
      status: 0,
      stdout: "Changed connector bridge.",
      stderr: "",
      outcomeStatus: "success",
      capturedAt: "2026-06-20T00:00:00.000Z",
    });

    expect(content).toContain("# Codex MemoryOS Session");
    expect(content).toContain("Thread: codex-123");
    expect(content).toContain("Wire Codex to Epoch");
    expect(content).toContain("Changed connector bridge.");
    expect(content).toContain("Future agents can inherit this Codex run");
  });
});
