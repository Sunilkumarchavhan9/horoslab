import "./tracing";
import "dotenv/config";
import { createMemoryOsApp } from "./app";
import { createServer } from "node:http";
import { loadBestRetrievalConfig } from "../lib/config/loadBestRetrievalConfig";
import { loadEnvConfig } from "../lib/config/env";
import { initSentry } from "../lib/observability/sentry";
import { hydrateCompanyBrainPlatformStore } from "../lib/companyBrain/platformStore";
import { hydrateCompanyBrainRuntimeState } from "../lib/companyBrain/platform";
import { resolveRuntimeStoreForStartup } from "../lib/storage/resolveRuntimeStoreForStartup";
import { startLabAutomationTriggerWorker } from "../lib/continuity/labAutomationWorker";
import { startEpochWorker } from "../lib/epoch/epochWorker";
import { attachMemoryOSTMShellSocketServer } from "./services/memoryostmShellSocketServer";
import { attachMemoryOSTMDesktopGatewaySocketServer } from "./services/memoryostmDesktopGateway";

async function startServer(): Promise<void> {
  const memoryStoreBackend = await resolveRuntimeStoreForStartup();
  const env = loadEnvConfig();
  const port = env.port;
  initSentry();
  await hydrateCompanyBrainPlatformStore();
  await hydrateCompanyBrainRuntimeState();
  startLabAutomationTriggerWorker();
  startEpochWorker();
  const app = createMemoryOsApp();
  const server = createServer(app);
  attachMemoryOSTMShellSocketServer(server);
  attachMemoryOSTMDesktopGatewaySocketServer(server);

  const config = loadBestRetrievalConfig();
  console.log(
    `Loaded retrieval config ${config.name} (threshold=${config.threshold}, backend=${memoryStoreBackend})`,
  );

  // Warn early if the OpenRouter key is missing or still a placeholder.
  // Memory storage works without it, but agent chat replies won't generate.
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim() ?? "";
  const isPlaceholder =
    !openRouterKey ||
    openRouterKey === "sk-or-v1_replace_with_openrouter_key" ||
    openRouterKey.startsWith("sk-or-v1_replace");

  if (isPlaceholder) {
    console.warn(
      "\n" +
        "╔══════════════════════════════════════════════════════════════╗\n" +
        "║  MemoryOS  ·  OPENROUTER_API_KEY not configured             ║\n" +
        "╠══════════════════════════════════════════════════════════════╣\n" +
        "║  Memory storage works fine, but agent chat replies need     ║\n" +
        "║  a real OpenRouter key to call the LLM.                     ║\n" +
        "║                                                              ║\n" +
        "║  Continuity Lab: Company Model → Save (recommended)         ║\n" +
        "║  Company Brain / server agents: set OPENROUTER_API_KEY      ║\n" +
        "║  in .env or PLATFORM_OPENROUTER_KEY for hosted demos.       ║\n" +
        "╚══════════════════════════════════════════════════════════════╝\n",
    );
  } else {
    console.log(
      `[MemoryOS] OpenRouter key loaded (${openRouterKey.length} chars). LLM ready.`,
    );
  }

  server.listen(port, () => {
    console.log(`MemoryOS Express API running on http://localhost:${port}`);
  });
}

void startServer().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
