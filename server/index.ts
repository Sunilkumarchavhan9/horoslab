import "dotenv/config";
import { createMemoryOsApp } from "./app";
import { loadBestRetrievalConfig } from "../lib/config/loadBestRetrievalConfig";
import { loadEnvConfig } from "../lib/config/env";

const env = loadEnvConfig();
const port = env.port;
const app = createMemoryOsApp();

const config = loadBestRetrievalConfig();
console.log(
  `Loaded retrieval config ${config.name} (threshold=${config.threshold}, backend=${env.memoryStoreBackend})`,
);

app.listen(port, () => {
  console.log(`MemoryOS Express API running on http://localhost:${port}`);
});
