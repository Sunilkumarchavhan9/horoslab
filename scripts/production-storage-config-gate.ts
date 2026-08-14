import "dotenv/config";
import { readEpochProductionStorageConfig } from "../lib/epoch/productionConfig";

try {
  const config = readEpochProductionStorageConfig();
  console.log(`Production storage config valid for ${config.bucket} in ${config.region} (encryption=${config.encryptionMode}).`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
