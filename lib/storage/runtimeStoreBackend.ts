export type RuntimeStoreBackend = "json" | "sqlite";

export function getRuntimeStoreBackend(): RuntimeStoreBackend {
  const raw = process.env.MEMORY_STORE_BACKEND?.trim().toLowerCase();

  if (raw === "sqlite" || raw === "json") {
    return raw;
  }

  if (process.env.NODE_ENV === "production") {
    return "sqlite";
  }

  return "json";
}

export function isSqliteRuntimeStore(): boolean {
  return getRuntimeStoreBackend() === "sqlite";
}

