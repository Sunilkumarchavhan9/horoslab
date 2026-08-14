export type RuntimeStoreBackend = "postgres";

export function getRuntimeStoreBackend(): RuntimeStoreBackend {
  return "postgres";
}

export function isSqliteRuntimeStore(): boolean {
  return false;
}

export function isPostgresRuntimeStore(): boolean {
  return getRuntimeStoreBackend() === "postgres";
}

export function isRelationalRuntimeStore(): boolean {
  return isPostgresRuntimeStore();
}
