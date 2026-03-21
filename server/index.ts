import "dotenv/config";
import { createMemoryOsApp } from "./app";

const port = Number(process.env.PORT ?? 3001);
const app = createMemoryOsApp();

app.listen(port, () => {
  console.log(`MemoryOS Express API running on http://localhost:${port}`);
});
