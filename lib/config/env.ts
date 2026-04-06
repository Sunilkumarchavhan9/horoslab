import { z } from "zod";
import { getRuntimeStoreBackend, type RuntimeStoreBackend } from "../storage/runtimeStoreBackend";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  MEM0_API_KEY: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(16),
  JWT_ISSUER: z.string().min(1).default("memoryos"),
  JWT_AUDIENCE: z.string().min(1).default("memoryos-api"),
  METRICS_TOKEN: z.string().min(8).optional(),
});

export interface AppEnv {
  nodeEnv: "development" | "test" | "production";
  port: number;
  mem0ApiKey?: string;
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
  if (data.NODE_ENV === "production" && !data.MEM0_API_KEY) {
    throw new Error("MEM0_API_KEY is required in production");
  }

  cachedEnv = {
    nodeEnv: data.NODE_ENV,
    port: data.PORT,
    mem0ApiKey: data.MEM0_API_KEY,
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

