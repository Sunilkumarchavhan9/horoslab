export type RuntimeStoreBackend = "json" | "sqlite" | "postgres";

export function getRuntimeStoreBackend(): RuntimeStoreBackend {
  const raw = process.env.MEMORY_STORE_BACKEND?.trim().toLowerCase();

  if (raw === "sqlite" || raw === "json" || raw === "postgres") {
    return raw;
  }

  if (process.env.NODE_ENV === "production") {
    return "postgres";
  }

  return "json";
}

export function isSqliteRuntimeStore(): boolean {
  return getRuntimeStoreBackend() === "sqlite";
}

export function isPostgresRuntimeStore(): boolean {
  return getRuntimeStoreBackend() === "postgres";
}

export function isRelationalRuntimeStore(): boolean {
  const backend = getRuntimeStoreBackend();
  return backend === "sqlite" || backend === "postgres";
}
