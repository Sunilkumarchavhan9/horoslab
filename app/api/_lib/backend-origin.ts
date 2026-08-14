export function resolveBackendOrigin(): string {
  const configured = process.env.MEMORYOS_API_ORIGIN?.trim();
  const devOverride = process.env.MEMORYOS_API_ORIGIN_DEV?.trim();
  const isDevelopment = process.env.NODE_ENV === "development";

  if (isDevelopment) {
    const preferred = devOverride || configured || "http://127.0.0.1:3001";
    return normalizeLocalBackendOrigin(preferred);
  }

  return normalizeLocalBackendOrigin(configured || "http://127.0.0.1:3001");
}

function normalizeLocalBackendOrigin(origin: string): string {
  const trimmed = origin.replace(/\/+$/, "");
  if (/^http:\/\/localhost(?::|$)/i.test(trimmed)) {
    return trimmed.replace(/^http:\/\/localhost/i, "http://127.0.0.1");
  }
  return trimmed;
}
