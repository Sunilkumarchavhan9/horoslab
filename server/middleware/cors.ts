import cors, { type CorsOptions, type CorsOptionsDelegate } from "cors";

export const ALLOWED_CORS_ORIGINS: string[] = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

export const memoryOsCorsOptions: CorsOptions = {
  origin: ALLOWED_CORS_ORIGINS,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-metrics-token"],
};

export const corsMiddleware: ReturnType<typeof cors> = cors(memoryOsCorsOptions);

// Optional classic delegate form for future per-origin logic.
export const corsOptionsDelegate: CorsOptionsDelegate = (_req, callback) => {
  callback(null, memoryOsCorsOptions);
};
