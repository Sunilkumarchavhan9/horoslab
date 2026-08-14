import { z } from "zod";
import { getRuntimeStoreBackend, type RuntimeStoreBackend } from "../storage/runtimeStoreBackend";

const optionalNonEmptyString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}, z.string().min(1).optional());

const optionalUrlString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}, z.string().url().optional());

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  SUPERMEMORY_API_KEY: optionalNonEmptyString,
  SUPERMEMORY_BASE_URL: optionalUrlString,
  SUPERMEMORY_PROJECT: optionalNonEmptyString,
  JWT_SECRET: z.string().min(16),
  JWT_ISSUER: z.string().min(1).default("memoryos"),
  JWT_AUDIENCE: z.string().min(1).default("memoryos-api"),
  METRICS_TOKEN: z.preprocess((value) => {
    if (typeof value !== "string") {
      return value;
    }
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  }, z.string().min(8).optional()),
});

export interface AppEnv {
  nodeEnv: "development" | "test" | "production";
  port: number;
  supermemoryApiKey?: string;
  supermemoryBaseUrl?: string;
  supermemoryProject?: string;
  jwtSecret: string;
  jwtIssuer: string;
  jwtAudience: string;
  metricsToken?: string;
  memoryStoreBackend: RuntimeStoreBackend;
}

let cachedEnv: AppEnv | null = null;

export function loadEnvConfig(): AppEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid environment configuration: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ")}`,
    );
  }

  const data = parsed.data;
  cachedEnv = {
    nodeEnv: data.NODE_ENV,
    port: data.PORT,
    supermemoryApiKey: data.SUPERMEMORY_API_KEY,
    supermemoryBaseUrl: data.SUPERMEMORY_BASE_URL,
    supermemoryProject: data.SUPERMEMORY_PROJECT,
    jwtSecret: data.JWT_SECRET,
    jwtIssuer: data.JWT_ISSUER,
    jwtAudience: data.JWT_AUDIENCE,
    metricsToken: data.METRICS_TOKEN,
    memoryStoreBackend: getRuntimeStoreBackend(),
  };

  return cachedEnv;
}

export function __resetEnvCacheForTests(): void {
  cachedEnv = null;
}
