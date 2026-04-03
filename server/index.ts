import "dotenv/config";
import { createMemoryOsApp } from "./app";
import { loadBestRetrievalConfig } from "../lib/config/loadBestRetrievalConfig";

const port = Number(process.env.PORT ?? 3001);
const app = createMemoryOsApp();

const config = loadBestRetrievalConfig();
console.log(
  `Loaded retrieval config ${config.name} (threshold=${config.threshold})`,
);

app.listen(port, () => {
  console.log(`MemoryOS Express API running on http://localhost:${port}`);
});
