import "./tracing";
import "dotenv/config";
import { createMemoryOsApp } from "./app";
import { loadBestRetrievalConfig } from "../lib/config/loadBestRetrievalConfig";
import { loadEnvConfig } from "../lib/config/env";
import { initSentry } from "../lib/observability/sentry";

const env = loadEnvConfig();
const port = env.port;
initSentry();
const app = createMemoryOsApp();

const config = loadBestRetrievalConfig();
console.log(
  `Loaded retrieval config ${config.name} (threshold=${config.threshold}, backend=${env.memoryStoreBackend})`,
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
      "║  1. Get a FREE key → https://openrouter.ai/                 ║\n" +
      "║  2. Open  C:\\projects\\MemoryOS\\.env                       ║\n" +
      "║  3. Set   OPENROUTER_API_KEY=sk-or-v1_your_real_key         ║\n" +
      "║  4. Restart the backend (Ctrl+C → bun run dev:all)          ║\n" +
      "╚══════════════════════════════════════════════════════════════╝\n",
  );
} else {
  console.log(
    `[MemoryOS] OpenRouter key loaded (${openRouterKey.length} chars). LLM ready.`,
  );
}

app.listen(port, () => {
  console.log(`MemoryOS Express API running on http://localhost:${port}`);
});
