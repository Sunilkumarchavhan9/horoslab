import cors, { type CorsOptions, type CorsOptionsDelegate } from "cors";

function splitOrigins(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter((origin) => /^https?:\/\//i.test(origin));
}

export function resolveAllowedCorsOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const configured = splitOrigins(env.MEMORYOS_CORS_ORIGINS);
  if (configured.length > 0) return configured;

  const appOrigins = splitOrigins(
    [
      env.NEXT_PUBLIC_APP_URL,
      env.NEXT_PUBLIC_MEMORYOS_APP_URL,
      env.NEXT_PUBLIC_MEMORYOS_API_ORIGIN,
      env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL
        ? (() => {
            try {
              return new URL(env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL).origin;
            } catch {
              return "";
            }
          })()
        : "",
    ].join(","),
  );
  if (appOrigins.length > 0) return Array.from(new Set(appOrigins));

  return [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ];
}

export const ALLOWED_CORS_ORIGINS: string[] = resolveAllowedCorsOrigins();

export const memoryOsCorsOptions: CorsOptions = {
  origin: ALLOWED_CORS_ORIGINS,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-metrics-token", "x-memoryos-org-id"],
};

export const corsMiddleware: ReturnType<typeof cors> = cors(memoryOsCorsOptions);

// Optional classic delegate form for future per-origin logic.
export const corsOptionsDelegate: CorsOptionsDelegate = (_req, callback) => {
  callback(null, memoryOsCorsOptions);
};
