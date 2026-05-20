export function resolveBackendOrigin(): string {
  const configured = process.env.MEMORYOS_API_ORIGIN?.trim();
  const devOverride = process.env.MEMORYOS_API_ORIGIN_DEV?.trim();
  const isDevelopment = process.env.NODE_ENV === "development";

  if (isDevelopment) {
    // In local dev, prefer local backend unless explicitly overridden.
    const preferred = devOverride || "http://localhost:3001";
    return preferred.replace(/\/+$/, "");
  }

  return (configured && configured !== "same-origin" ? configured : "http://localhost:3001").replace(/\/+$/, "");
}
