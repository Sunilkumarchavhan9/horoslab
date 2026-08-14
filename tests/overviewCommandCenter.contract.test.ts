import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const overviewRoutes = readFileSync(
  path.join(process.cwd(), "server", "routes", "overview.routes.ts"),
  "utf8",
);

const eventsRoutes = readFileSync(
  path.join(process.cwd(), "server", "routes", "events.routes.ts"),
  "utf8",
);

const appSource = readFileSync(
  path.join(process.cwd(), "server", "app.ts"),
  "utf8",
);

const overviewStore = readFileSync(
  path.join(process.cwd(), "lib", "overview", "overviewStore.ts"),
  "utf8",
);

const overviewUi = readFileSync(
  path.join(
    process.cwd(),
    "memoryos-frontend",
    "components",
    "memoryos",
    "memory-realtime-loop-panel.tsx",
  ),
  "utf8",
);

const overviewProxy = readFileSync(
  path.join(process.cwd(), "memoryos-frontend", "app", "api", "overview", "[...path]", "route.ts"),
  "utf8",
);

describe("Overview Agent Inheritance Command Center contract", () => {
  it("exposes the requested live overview endpoints and SSE stream", () => {
    for (const route of [
      '"/summary"',
      '"/attention"',
      '"/mistake-immunity"',
      '"/inheritance-performance"',
      '"/outcome-learning"',
      '"/sources"',
      '"/recent-agent-runs"',
    ]) {
      expect(overviewRoutes).toContain(route);
    }

    expect(appSource).toContain('"/api/overview"');
    expect(appSource).toContain("overviewRouter");
    expect(appSource).toContain('"/api/events"');
    expect(appSource).toContain("eventsRouter");
    expect(eventsRoutes).toContain('"/stream"');
    expect(eventsRoutes).toContain('"text/event-stream"');
    expect(eventsRoutes).toContain("registerMemoryRealtimeSink");
  });

  it("derives the product loop from backend store helpers instead of mock arrays or direct Prisma", () => {
    for (const helper of [
      "listSources",
      "listSourceItems",
      "listMemories",
      "listInheritancePackages",
      "listAgentRuns",
      "listOutcomes",
      "listFutureInstructions",
      "listPolicies",
      "listAgentSkills",
    ]) {
      expect(overviewStore).toContain(helper);
    }
    expect(overviewStore).not.toContain("prisma.source.findMany");

    expect(overviewStore).toContain("Source -> Memory -> Package -> Agent Run -> Outcome -> Future Instruction");
    expect(overviewStore).toContain("getOverviewMistakeImmunity");
    expect(overviewStore).toContain("getOverviewRecentAgentRuns");
  });

  it("uses SWR and SSE in the Overview page with actionable rows and drawers", () => {
    expect(overviewUi).toContain('new EventSource("/api/memory/events")');
    expect(overviewUi).toContain('consoleApiFetch("/api/memory/events/projection")');
    expect(overviewUi).toContain('consoleApiFetch("/api/memory/events/history?limit=8")');
    expect(overviewUi).toContain("Recent loop");
    expect(overviewUi).toContain("Source sync");
    expect(overviewUi).toContain("Memory");
    expect(overviewUi).toContain("Learning");
    expect(overviewUi).toContain("MemoryIgnition");
    expect(overviewUi).toContain("Open Approvals");
  });

  it("keeps Recharts containers measurable during first render", () => {
    expect(overviewUi).toContain("ConsoleGrid");
    expect(overviewUi).toContain("ConsoleSectionCard");
    expect(overviewUi).toContain("ConsoleStatGrid");
  });

  it("keeps the overview proxy resilient to transient backend socket resets", () => {
    expect(overviewProxy).toContain("isTransientFetchError");
    expect(overviewProxy).toContain("ECONNRESET");
    expect(overviewProxy).toContain("fetchOverviewUpstream");
    expect(overviewProxy).toContain("overview_upstream_unavailable");
    expect(overviewProxy).toContain("const params = context?.params ? await context.params : {}");
  });
});
